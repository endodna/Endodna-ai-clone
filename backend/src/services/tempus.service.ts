import { DNAResultStatus, Priority, Status } from "@prisma/client";
import { logger } from "../helpers/logger.helper";
import s3Helper from "../helpers/aws/s3.helper";
import { prisma } from "../lib/prisma";
import { TempusActions } from "../types";
import ragHelper from "../helpers/llm/rag.helper";
import emailHelper from "../helpers/email.helper";

interface DNAFileHeader {
    gsgtVersion?: string;
    processingDate?: string;
    content?: string;
    numSNPs?: string;
    totalSNPs?: string;
    numSamples?: string;
    totalSamples?: string;
    file?: string;
    cluster?: string;
    gender?: string;
}

interface DNAFileData {
    sampleId: string;
    snpName: string;
    chromosome: string;
    position: string;
    allele1: string;
    allele2: string;
}

interface ParsedDNAFile {
    header: DNAFileHeader;
    sampleId: string;
    data: DNAFileData[];
    totalRows: number;
}

interface ProcessDNAFileParams {
    bucket: string;
    key: string;
    traceId?: string;
}

class TempusService {
    private allowedSNPS: Map<string, { id: number; rsId: string; }> = new Map();

    private isSNPAllowed(snpName: string): boolean {
        return this.allowedSNPS.has(snpName);
    }

    async processDNAFile(params: ProcessDNAFileParams, allowIsProcessed: boolean = false): Promise<void> {
        const { bucket, key, traceId } = params;
        let parsedFile: ParsedDNAFile | null = null;

        try {
            logger.info("Processing DNA file", {
                traceId,
                bucket,
                key,
                method: "TempusService.processDNAFile",
            });

            const fileBuffer = await s3Helper.downloadFile(bucket, key, traceId);
            const fileContent = fileBuffer.toString("utf-8");

            await this.getAllowedSNPS();
            parsedFile = this.parseDNAFile(fileContent);

            if (!parsedFile.sampleId || parsedFile.sampleId.trim() === "") {
                logger.warn("No sample ID found in DNA file, skipping processing", {
                    traceId,
                    bucket,
                    key,
                    method: "TempusService.processDNAFile",
                });
                return;
            }

            logger.info("DNA file parsed successfully", {
                traceId,
                bucket,
                key,
                sampleId: parsedFile.sampleId,
                totalRows: parsedFile.totalRows,
                method: "TempusService.processDNAFile",
            });

            let dnaResultKit = await prisma.patientDNAResultKit.findFirst({
                where: {
                    barcode: parsedFile.sampleId,
                    deletedAt: null,
                },
            });

            if (!dnaResultKit) {
                logger.info("DNA result kit not found for sample ID, creating new record", {
                    traceId,
                    sampleId: parsedFile.sampleId,
                    bucket,
                    key,
                    method: "TempusService.processDNAFile",
                });

                dnaResultKit = await prisma.patientDNAResultKit.create({
                    data: {
                        barcode: parsedFile.sampleId,
                        organizationId: null,
                        patientId: null,
                        status: DNAResultStatus.KIT_RECEIVED,
                        isProcessed: false,
                        isFailedProcessing: false,
                        fileMetadata: {},
                    },
                });

                logger.info("Created new DNA result kit", {
                    traceId,
                    dnaResultKitId: dnaResultKit.id,
                    sampleId: parsedFile.sampleId,
                    method: "TempusService.processDNAFile",
                });
            }

            if (dnaResultKit.isProcessed && !allowIsProcessed) {
                logger.info("DNA result kit already processed", {
                    traceId,
                    dnaResultKitId: dnaResultKit.id,
                    sampleId: parsedFile.sampleId,
                    method: "TempusService.processDNAFile",
                });
                return;
            }

            logger.info("DNA result kit found", {
                traceId,
                dnaResultKitId: dnaResultKit.id,
                sampleId: parsedFile.sampleId,
                organizationId: dnaResultKit.organizationId,
                patientId: dnaResultKit.patientId,
                method: "TempusService.processDNAFile",
            });

            await this.deleteExistingBreakdown(dnaResultKit.id, traceId);

            const recordsCreated = await this.createDNABreakdownRecords(
                dnaResultKit.id,
                parsedFile.data,
                traceId,
            );

            let finalKey = key;
            if (key.startsWith("pending/")) {
                const filename = key.replace("pending/", "");
                finalKey = `completed/${filename}`;

                try {
                    await s3Helper.moveFile(bucket, key, finalKey, traceId);
                    logger.info("File moved to completed folder", {
                        traceId,
                        bucket,
                        sourceKey: key,
                        destinationKey: finalKey,
                        method: "TempusService.processDNAFile",
                    });
                } catch (moveError) {
                    logger.error("Error moving file to completed folder", {
                        traceId,
                        bucket,
                        sourceKey: key,
                        destinationKey: finalKey,
                        error: moveError,
                    });
                    finalKey = key;
                }
            }

            const existingFileMetadata = (dnaResultKit.fileMetadata as Record<string, any>) || {};

            const updatePromises: Promise<any>[] = [
                prisma.patientDNAResultKit.update({
                    where: { id: dnaResultKit.id },
                    data: {
                        isProcessed: true,
                        isFailedProcessing: false,
                        failedProcessingReason: null,
                        status: DNAResultStatus.DATA_DELIVERED,
                        fileMetadata: {
                            ...existingFileMetadata,
                            bucket: bucket,
                            key: finalKey,
                            totalSNPs: parsedFile.totalRows,
                            processingDate: parsedFile.header.processingDate,
                            gsgtVersion: parsedFile.header.gsgtVersion,
                        },
                    },
                }),
                prisma.patientDNAResultActivity.create({
                    data: {
                        patientDNAResultId: dnaResultKit.id,
                        activity: "DNA file processed successfully",
                        status: DNAResultStatus.DATA_DELIVERED,
                        metadata: {
                            recordsCreated,
                            totalSNPs: parsedFile.totalRows,
                            sampleId: parsedFile.sampleId,
                            bucket,
                            key: finalKey,
                            processingDate: parsedFile.header.processingDate,
                            gsgtVersion: parsedFile.header.gsgtVersion,
                        },
                    },
                }),
            ];

            if (dnaResultKit.organizationId !== null && dnaResultKit.patientId !== null) {
                updatePromises.push(
                    prisma.patientActivity.create({
                        data: {
                            organizationId: dnaResultKit.organizationId,
                            userId: dnaResultKit.patientId,
                            activity: "DNA result processed and analyzed",
                            dateRequested: dnaResultKit.createdAt,
                            dateCompleted: new Date(),
                            status: Status.ACHIEVED,
                            metadata: {
                                dnaResultKitId: dnaResultKit.id,
                                barcode: dnaResultKit.barcode,
                                recordsCreated,
                                totalSNPs: parsedFile.totalRows,
                                sampleId: parsedFile.sampleId,
                            },
                        },
                    }),
                );
                updatePromises.push(
                    ragHelper.invalidatePatientSummaryCache(dnaResultKit.organizationId, dnaResultKit.patientId, traceId)
                );
            }

            await Promise.all(updatePromises);

            if (dnaResultKit.organizationId !== null && dnaResultKit.patientId !== null && parsedFile) {
                try {
                    const patient = await prisma.user.findUnique({
                        where: { id: dnaResultKit.patientId },
                        select: {
                            firstName: true,
                            lastName: true,
                            middleName: true,
                        },
                    });

                    const patientName = patient
                        ? `${patient.firstName}${patient.middleName ? ` ${patient.middleName}` : ""} ${patient.lastName}`.trim()
                        : "Unknown Patient";

                    const emailMessage = `DNA Kit Data Delivered\n\nPatient: ${patientName}\nSample ID: ${parsedFile.sampleId}\nBarcode: ${dnaResultKit.barcode || "N/A"}\nOrganization ID: ${dnaResultKit.organizationId}\nTotal SNPs Processed: ${parsedFile.totalRows}\nProcessing Date: ${parsedFile.header.processingDate || "N/A"}\nGSGT Version: ${parsedFile.header.gsgtVersion || "N/A"}\nDelivery Timestamp: ${new Date().toISOString()}\n\nThe DNA test results have been successfully processed and delivered.`;

                    emailHelper.sendNotificationEmail(
                        emailHelper.adminEmails,
                        "DNA Kit Data Delivered",
                        emailMessage,
                        undefined,
                        undefined,
                        traceId,
                    ).catch((error) => {
                        logger.error("Failed to send DATA_DELIVERED notification email to admins", {
                            traceId,
                            sampleId: parsedFile ? parsedFile.sampleId : "unknown",
                            dnaResultKitId: dnaResultKit.id,
                            error: error,
                            method: "TempusService.processDNAFile",
                        });
                    });
                } catch (error) {
                    logger.error("Error preparing DATA_DELIVERED email notification", {
                        traceId,
                        sampleId: parsedFile ? parsedFile.sampleId : "unknown",
                        dnaResultKitId: dnaResultKit.id,
                        error: error,
                        method: "TempusService.processDNAFile",
                    });
                }
            }

            logger.info("DNA file processing completed successfully", {
                traceId,
                dnaResultKitId: dnaResultKit.id,
                sampleId: parsedFile.sampleId,
                recordsCreated,
                totalSNPs: parsedFile.totalRows,
                method: "TempusService.processDNAFile",
            });

        } catch (error) {
            logger.error("Error processing DNA file", {
                traceId,
                bucket,
                key,
                error: error,
            });

            try {
                if (!parsedFile?.sampleId) {
                    return;
                }

                const dnaResultKit = await prisma.patientDNAResultKit.findFirst({
                    where: {
                        barcode: parsedFile.sampleId,
                        deletedAt: null,
                    },
                });

                if (dnaResultKit) {
                    await prisma.patientDNAResultKit.update({
                        where: { id: dnaResultKit.id },
                        data: {
                            isFailedProcessing: true,
                            failedProcessingReason: error instanceof Error ? error.message : String(error),
                        },
                    });

                    logger.info("Updated DNA result kit with failure status", {
                        traceId,
                        dnaResultKitId: dnaResultKit.id,
                        error: error instanceof Error ? error.message : String(error),
                        method: "TempusService.processDNAFile",
                    });
                }
            } catch (updateError) {
                logger.error("Error updating DNA result kit failure status", {
                    traceId,
                    error: updateError,
                });
            }

            throw error;
        }
    }

    async getAllowedSNPS() {
        const snps = await prisma.masterSNP.findMany({
            select: {
                id: true,
                rsId: true,
            },
        });
        for (const snp of snps) {
            this.allowedSNPS.set(snp.rsId, { id: snp.id, rsId: snp.rsId });
        }

    }

    parseDNAFile(content: string): ParsedDNAFile {
        const lines = content.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

        const header: DNAFileHeader = {};
        const data: DNAFileData[] = [];
        let sampleId = "";
        let inHeader = false;
        let inData = false;
        let dataStartIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line === "[Header]") {
                inHeader = true;
                inData = false;
                continue;
            }

            if (line === "[Data]") {
                inHeader = false;
                inData = true;
                dataStartIndex = i + 1;
                continue;
            }

            if (inHeader) {
                const [key, ...valueParts] = line.split("\t");
                if (key && valueParts.length > 0) {
                    const value = valueParts.join("\t");
                    header[key as keyof DNAFileHeader] = value;
                }
            }

            if (inData && dataStartIndex > 0 && i >= dataStartIndex) {
                if (i === dataStartIndex) {
                    continue;
                }

                const columns = line.split("\t");
                if (columns.length >= 6) {
                    const row: DNAFileData = {
                        sampleId: columns[0] || "",
                        snpName: columns[1] || "",
                        chromosome: columns[2] || "",
                        position: columns[3] || "",
                        allele1: columns[4] || "",
                        allele2: columns[5] || "",
                    };

                    if (!sampleId && row.sampleId) {
                        sampleId = row.sampleId;
                    }

                    if (this.isSNPAllowed(row.snpName) && row.position && row.allele1 && row.allele2) {
                        data.push(row);
                    }
                }
            }
        }

        if (!sampleId && data.length > 0) {
            sampleId = data[0].sampleId;
        }

        return {
            header,
            sampleId,
            data,
            totalRows: data.length,
        };
    }

    private async deleteExistingBreakdown(
        dnaResultKitId: number,
        traceId?: string,
    ): Promise<void> {
        try {
            const deleteResult = await prisma.patientDNAResultBreakdown.deleteMany({
                where: {
                    patientDNAResultId: dnaResultKitId,
                },
            });

            logger.debug("Deleted existing DNA breakdown records", {
                traceId,
                dnaResultKitId,
                deletedCount: deleteResult.count,
            });
        } catch (error) {
            logger.error("Error deleting existing DNA breakdown records", {
                traceId,
                dnaResultKitId,
                error: error,
            });
            throw error;
        }
    }

    private async createDNABreakdownRecords(
        dnaResultKitId: number,
        data: DNAFileData[],
        traceId?: string,
    ): Promise<number> {
        const BATCH_SIZE = 1000;
        let totalCreated = 0;

        logger.info("Creating DNA breakdown records", {
            traceId,
            dnaResultKitId,
            totalRecords: data.length,
            batchSize: BATCH_SIZE,
            allowedSNPsCount: this.allowedSNPS.size,
            method: "TempusService.createDNABreakdownRecords",
        });

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);

            const recordsToCreate = batch
                .map((row) => {
                    const position = parseInt(row.position, 10);

                    const referenceAllele = row.allele1?.trim() || "";
                    const alternateAllele = row.allele2?.trim() || "";

                    if (!referenceAllele || !alternateAllele) {
                        logger.warn("Missing reference or alternate allele, skipping record", {
                            traceId,
                            snpName: row.snpName,
                            referenceAllele,
                            alternateAllele,
                        });
                        return null;
                    }

                    return {
                        masterSNPId: this.allowedSNPS.get(row.snpName)?.id || null,
                        patientDNAResultId: dnaResultKitId,
                        snpName: row.snpName,
                        chromosome: row.chromosome,
                        position: position,
                        referenceAllele: referenceAllele,
                        alternateAllele: alternateAllele,
                        genotype: `${referenceAllele}${alternateAllele}`,
                    };
                })
                .filter((record): record is NonNullable<typeof record> => record !== null);

            if (recordsToCreate.length === 0) {
                continue;
            }

            try {
                const result = await prisma.patientDNAResultBreakdown.createMany({
                    data: recordsToCreate,
                    skipDuplicates: true,
                });

                totalCreated += result.count;

                logger.debug("Created DNA breakdown records batch", {
                    traceId,
                    dnaResultKitId,
                    batchIndex: Math.floor(i / BATCH_SIZE) + 1,
                    totalBatches: Math.ceil(data.length / BATCH_SIZE),
                    recordsCreated: result.count,
                    totalCreated,
                });

                if (global.gc) {
                    global.gc();
                }

                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error) {
                logger.error("Error creating DNA breakdown records batch", {
                    traceId,
                    dnaResultKitId,
                    batchIndex: Math.floor(i / BATCH_SIZE) + 1,
                    batchSize: recordsToCreate.length,
                    error: error,
                });
                throw error;
            }
        }

        logger.info("DNA breakdown records creation completed", {
            traceId,
            dnaResultKitId,
            totalCreated,
            totalRecords: data.length,
            method: "TempusService.createDNABreakdownRecords",
        });

        return totalCreated;
    }

    async updateKitStatus(params: {
        sampleId: string;
        status: string;
        timestamp: string;
        comment?: string;
        traceId?: string;
    }): Promise<void> {
        const { sampleId, status, timestamp, comment, traceId } = params;

        if (!sampleId || sampleId.trim() === "") {
            logger.warn("No sample ID provided, skipping status update", {
                traceId,
                status,
                method: "TempusService.updateKitStatus",
            });
            return;
        }
        let holdStatus = false;

        try {
            logger.info("Updating DNA kit status from Tempus", {
                traceId,
                sampleId,
                status,
                timestamp,
                comment,
                method: "TempusService.updateKitStatus",
            });

            let dnaResultKit = await prisma.patientDNAResultKit.findFirst({
                where: {
                    barcode: sampleId,
                    deletedAt: null,
                },
            });

            const mappedStatus = this.mapTempusStatusToDNAResultStatus(status);

            if (!dnaResultKit) {
                logger.info("DNA result kit not found for sample ID, creating new record", {
                    traceId,
                    sampleId,
                    status,
                    mappedStatus,
                    method: "TempusService.updateKitStatus",
                });

                dnaResultKit = await prisma.patientDNAResultKit.create({
                    data: {
                        barcode: sampleId,
                        organizationId: null,
                        patientId: null,
                        status: mappedStatus || DNAResultStatus.KIT_RECEIVED,
                        isProcessed: false,
                        isFailedProcessing: mappedStatus ? this.isFailedStatus(mappedStatus) : false,
                        failedProcessingReason: mappedStatus && this.isFailedStatus(mappedStatus) && comment
                            ? comment
                            : null,
                        fileMetadata: {},
                    },
                });

                logger.info("Created new DNA result kit", {
                    traceId,
                    dnaResultKitId: dnaResultKit.id,
                    sampleId,
                    status: mappedStatus || DNAResultStatus.KIT_RECEIVED,
                    method: "TempusService.updateKitStatus",
                });

                await this.setKitStatus({
                    action: TempusActions.HOLD,
                    sampleId,
                    organizationId: 2,
                    traceId,
                });
                holdStatus = true;
            }

            if (!mappedStatus) {
                logger.warn("Unknown Tempus status received", {
                    traceId,
                    sampleId,
                    status,
                });
                return;
            }

            const isAlreadyGenotypingAccepted = dnaResultKit.status === DNAResultStatus.GENOTYPING_ACCEPTED || dnaResultKit.status === DNAResultStatus.DATA_DELIVERED;

            if (isAlreadyGenotypingAccepted) {
                logger.info("DNA result kit already has GENOTYPING_ACCEPTED status, logging activity but skipping status update", {
                    traceId,
                    dnaResultKitId: dnaResultKit.id,
                    sampleId,
                    currentStatus: dnaResultKit.status,
                    requestedStatus: status,
                    method: "TempusService.updateKitStatus",
                });
            }

            const activityMessage = this.mapStatusToActivityMessage(status);

            const updatePromises: Promise<any>[] = [
                prisma.patientDNAResultActivity.create({
                    data: {
                        patientDNAResultId: dnaResultKit.id,
                        activity: activityMessage,
                        status: mappedStatus,
                        metadata: {
                            tempusStatus: status,
                            timestamp,
                            comment: comment || null,
                            sampleId,
                            statusUpdateSkipped: isAlreadyGenotypingAccepted,
                        },
                    },
                }),
            ];


            if (!isAlreadyGenotypingAccepted) {
                updatePromises.push(
                    prisma.patientDNAResultKit.update({
                        where: { id: dnaResultKit.id },
                        data: {
                            status: mappedStatus,
                            isFailedProcessing: this.isFailedStatus(mappedStatus),
                            failedProcessingReason: this.isFailedStatus(mappedStatus) && comment
                                ? comment
                                : null,
                        },
                    })
                );
            }

            await Promise.all(updatePromises);

            if (holdStatus) {
                await prisma.patientDNAResultActivity.create({
                    data: {
                        patientDNAResultId: dnaResultKit.id,
                        activity: "Kit set to HOLD status",
                        status: DNAResultStatus.HOLD,
                        metadata: {
                            tempusStatus: status,
                            timestamp,
                            comment: comment || null,
                            sampleId
                        },
                    },
                });

                const emailMessage = `A DNA kit has been set to HOLD status.\n\nSample ID: ${sampleId}${dnaResultKit.barcode ? `\nBarcode: ${dnaResultKit.barcode}` : ""}${dnaResultKit.organizationId ? `\nOrganization ID: ${dnaResultKit.organizationId}` : ""}\n\nPlease review and take appropriate action.`;
                emailHelper.sendNotificationEmail(
                    emailHelper.adminEmails,
                    "DNA Kit Set to HOLD Status",
                    emailMessage,
                    undefined,
                    undefined,
                    traceId,
                ).catch((error) => {
                    logger.error("Failed to send HOLD notification email to admins", {
                        traceId,
                        sampleId,
                        error: error,
                        method: "TempusService.updateKitStatus",
                    });
                });
            }

            logger.info("DNA kit status updated successfully", {
                traceId,
                dnaResultKitId: dnaResultKit.id,
                sampleId,
                oldStatus: dnaResultKit.status,
                newStatus: mappedStatus,
                tempusStatus: status,
                method: "TempusService.updateKitStatus",
            });
        } catch (error) {
            logger.error("Error updating DNA kit status", {
                traceId,
                sampleId,
                status,
                error: error,
            });
            throw error;
        }
    }

    private mapTempusStatusToDNAResultStatus(tempusStatus: string): DNAResultStatus | null {
        const statusMap: Record<string, DNAResultStatus> = {
            KIT_RECEIVED: DNAResultStatus.KIT_RECEIVED,
            QC_PASSED: DNAResultStatus.QC_PASSED,
            QC_FAILED: DNAResultStatus.QC_FAILED,
            DNA_EXTRACTION_ACCEPTED: DNAResultStatus.DNA_EXTRACTION_ACCEPTED,
            DNA_EXTRACTION_FAILED: DNAResultStatus.DNA_EXTRACTION_FAILED,
            DNA_EXTRACTION_2ND_ACCEPTED: DNAResultStatus.DNA_EXTRACTION_2ND_ACCEPTED,
            DNA_EXTRACTION_2ND_FAILED: DNAResultStatus.DNA_EXTRACTION_2ND_FAILED,
            GENOTYPING_ACCEPTED: DNAResultStatus.GENOTYPING_ACCEPTED,
            GENOTYPING_FAILED: DNAResultStatus.GENOTYPING_FAILED,
            GENOTYPING_2ND_ACCEPTED: DNAResultStatus.GENOTYPING_2ND_ACCEPTED,
            GENOTYPING_2ND_FAILED: DNAResultStatus.GENOTYPING_2ND_FAILED,
            DATA_DELIVERED: DNAResultStatus.DATA_DELIVERED,
            CANCEL: DNAResultStatus.CANCEL,
            HOLD: DNAResultStatus.HOLD,
            PROCESS: DNAResultStatus.PROCESS,
            DISCARD: DNAResultStatus.DISCARD,
        };

        return statusMap[tempusStatus] || null;
    }

    private mapStatusToActivityMessage(status: string): string {
        const statusMessages: Record<string, string> = {
            KIT_RECEIVED: "Kit received by laboratory",
            QC_PASSED: "Quality control passed - sample approved for processing",
            QC_FAILED: "Quality control failed - sample cannot be processed",
            DNA_EXTRACTION_ACCEPTED: "DNA extraction completed successfully",
            DNA_EXTRACTION_FAILED: "DNA extraction failed",
            DNA_EXTRACTION_2ND_ACCEPTED: "DNA extraction completed successfully on second attempt",
            DNA_EXTRACTION_2ND_FAILED: "DNA extraction failed on second attempt",
            GENOTYPING_ACCEPTED: "Genotyping completed successfully - data will be delivered shortly",
            GENOTYPING_FAILED: "Genotyping failed",
            GENOTYPING_2ND_ACCEPTED: "Genotyping completed successfully on second attempt - data will be delivered shortly",
            GENOTYPING_2ND_FAILED: "Genotyping failed on second attempt",
            DATA_DELIVERED: "Data delivery completed",
            CANCEL: "Sample processing canceled",
            HOLD: "Sample processing on hold",
            PROCESS: "Sample processing in progress",
            DISCARD: "Sample discarded",
        };

        return statusMessages[status] || `Status update: ${status}`;
    }

    private isFailedStatus(status: DNAResultStatus): boolean {
        const failedStatuses: DNAResultStatus[] = [
            DNAResultStatus.QC_FAILED,
            DNAResultStatus.DNA_EXTRACTION_FAILED,
            DNAResultStatus.DNA_EXTRACTION_2ND_FAILED,
            DNAResultStatus.GENOTYPING_FAILED,
            DNAResultStatus.GENOTYPING_2ND_FAILED,
            DNAResultStatus.CANCEL,
            DNAResultStatus.DISCARD,
        ];
        return failedStatuses.includes(status);
    }

    private async getTempusAccessToken(): Promise<string> {
        const authUrl = process.env.TEMPUS_AUTH_URL;
        const username = process.env.TEMPUS_USERNAME;
        const password = process.env.TEMPUS_PASSWORD;
        const clientId = process.env.TEMPUS_CLIENT_ID;

        if (!authUrl || !username || !password || !clientId) {
            throw new Error("Tempus API credentials are not configured");
        }

        const params = new URLSearchParams();
        params.append("username", username);
        params.append("password", password);
        params.append("grant_type", "password");
        params.append("client_id", clientId);

        const response = await fetch(authUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to get Tempus access token: ${response.status} ${errorText}`,
            );
        }

        const data = (await response.json()) as {
            access_token?: string;
            token_type?: string;
            expires_in?: number;
        };
        if (!data.access_token) {
            throw new Error("Access token not found in Tempus response");
        }

        return data.access_token;
    }

    async setKitStatus(params: {
        action: TempusActions;
        sampleId: string;
        adminId?: string;
        organizationId: number;
        traceId?: string;
    }): Promise<{ success: boolean; message?: string; error?: string; errorData?: any }> {
        const { action, sampleId, adminId, organizationId, traceId } = params;

        const apiUrl = process.env.TEMPUS_API_URL;
        const company = process.env.TEMPUS_COMPANY;

        const payload = {
            sample_id: sampleId,
            action: action,
            company: company || "",
        };

        try {
            if (!apiUrl || !company) {
                throw new Error("Tempus API URL or company is not configured");
            }

            logger.info("Setting kit status in Tempus", {
                traceId,
                action,
                sampleId,
                method: "TempusService.setKitStatus",
            });

            const accessToken = await this.getTempusAccessToken();

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error("Failed to set kit status in Tempus", {
                    traceId,
                    action,
                    sampleId,
                    status: response.status,
                    error: errorText,
                    method: "TempusService.setKitStatus",
                });

                const auditLogPromises = [];

                auditLogPromises.push(
                    prisma.systemAuditLog.create({
                        data: {
                            userId: adminId || null,
                            organizationId: organizationId,
                            action: `TEMPUS_SET_KIT_STATUS_${action}`,
                            description: `Failed to set kit status in Tempus: ${action} for sample ${sampleId}`,
                            metadata: {
                                payload,
                                action,
                                sampleId,
                                error: errorText,
                                status: response.status,
                                traceId,
                            },
                            priority: Priority.HIGH,
                        },
                    }).catch((error) => {
                        logger.error("Failed to create system audit log", {
                            traceId,
                            error: error,
                            method: "TempusService.setKitStatus",
                        });
                    }),
                );

                if (adminId) {
                    auditLogPromises.push(
                        prisma.userAuditLog.create({
                            data: {
                                userId: adminId,
                                description: `Failed to set kit status in Tempus: ${action} for sample ${sampleId}`,
                                metadata: {
                                    action,
                                    sampleId,
                                    error: errorText,
                                    status: response.status,
                                    traceId,
                                },
                                priority: Priority.HIGH,
                            },
                        }).catch((error) => {
                            logger.error("Failed to create admin audit log", {
                                traceId,
                                error: error,
                                method: "TempusService.setKitStatus",
                            });
                        }),
                    );
                }

                await Promise.all(auditLogPromises);

                return {
                    success: false,
                    error: `Tempus API error: ${response.status} ${errorText}`,
                    errorData: JSON.parse(errorText),
                };
            }

            const responseData = (await response.json().catch(() => ({}))) as Record<string, any>;

            logger.info("Successfully set kit status in Tempus", {
                traceId,
                action,
                sampleId,
                response: responseData,
                method: "TempusService.setKitStatus",
            });

            const auditLogPromises = [];

            auditLogPromises.push(
                prisma.systemAuditLog.create({
                    data: {
                        userId: adminId || null,
                        organizationId: organizationId,
                        action: `TEMPUS_SET_KIT_STATUS_${action}`,
                        description: `Set kit status in Tempus: ${action} for sample ${sampleId}`,
                        metadata: {
                            payload,
                            action,
                            sampleId,
                            response: responseData || null,
                            traceId: traceId || null,
                        },
                        priority: Priority.MEDIUM,
                    },
                }).catch((error) => {
                    logger.error("Failed to create system audit log", {
                        traceId,
                        error: error,
                        method: "TempusService.setKitStatus",
                    });
                }),
            );

            if (adminId) {
                auditLogPromises.push(
                    prisma.userAuditLog.create({
                        data: {
                            userId: adminId,
                            description: `Set kit status in Tempus: ${action} for sample ${sampleId}`,
                            metadata: {
                                action,
                                sampleId,
                                response: responseData || null,
                                traceId: traceId || null,
                            },
                            priority: Priority.MEDIUM,
                        },
                    }).catch((error) => {
                        logger.error("Failed to create admin audit log", {
                            traceId,
                            error: error,
                            method: "TempusService.setKitStatus",
                        });
                    }),
                );
            }

            await Promise.all(auditLogPromises);

            return {
                success: true,
                message: `Successfully set kit status to ${action} for sample ${sampleId}`,
            };
        } catch (error) {
            logger.error("Error setting kit status in Tempus", {
                traceId,
                action,
                sampleId,
                error: error,
                method: "TempusService.setKitStatus",
            });

            const auditLogPromises = [];

            auditLogPromises.push(
                prisma.systemAuditLog.create({
                    data: {
                        userId: adminId || null,
                        organizationId: organizationId,
                        action: `TEMPUS_SET_KIT_STATUS_${action}`,
                        description: `Error setting kit status in Tempus: ${action} for sample ${sampleId}`,
                        metadata: {
                            payload,
                            action,
                            sampleId,
                            error: String(error),
                            traceId,
                        },
                        priority: Priority.HIGH,
                    },
                }).catch((auditError) => {
                    logger.error("Failed to create system audit log", {
                        traceId,
                        error: auditError,
                        method: "TempusService.setKitStatus",
                    });
                }),
            );

            if (adminId) {
                auditLogPromises.push(
                    prisma.userAuditLog.create({
                        data: {
                            userId: adminId,
                            description: `Error setting kit status in Tempus: ${action} for sample ${sampleId}`,
                            metadata: {
                                action,
                                sampleId,
                                error: String(error),
                                traceId,
                            },
                            priority: Priority.HIGH,
                        },
                    }).catch((auditError) => {
                        logger.error("Failed to create admin audit log", {
                            traceId,
                            error: auditError,
                            method: "TempusService.setKitStatus",
                        });
                    }),
                );
            }

            await Promise.all(auditLogPromises);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}

export const tempusService = new TempusService();
export default tempusService;

