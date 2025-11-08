import { DNAResultStatus } from "@prisma/client";
import { logger } from "../helpers/logger.helper";
import s3Helper from "../helpers/s3.helper";
import { prisma } from "../lib/prisma";
import { ALLOWED_SNPS_SET } from "../utils/constants";

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
    private isSNPAllowed(snpName: string): boolean {
        return ALLOWED_SNPS_SET.has(snpName);
    }

    async processDNAFile(params: ProcessDNAFileParams): Promise<void> {
        const { bucket, key, traceId } = params;
        let parsedFile: ParsedDNAFile | null = null;

        try {
            logger.info("Processing DNA file", {
                traceId,
                bucket,
                key,
            });

            const fileBuffer = await s3Helper.downloadFile(bucket, key, traceId);
            const fileContent = fileBuffer.toString("utf-8");

            parsedFile = this.parseDNAFile(fileContent);

            logger.info("DNA file parsed successfully", {
                traceId,
                bucket,
                key,
                sampleId: parsedFile.sampleId,
                totalRows: parsedFile.totalRows,
            });

            const dnaResultKit = await prisma.patientDNAResultKit.findFirst({
                where: {
                    barcode: parsedFile.sampleId,
                    deletedAt: null,
                },
            });

            if (!dnaResultKit) {
                logger.warn("DNA result kit not found for sample ID", {
                    traceId,
                    sampleId: parsedFile.sampleId,
                    bucket,
                    key,
                });
                console.log("DNA Result Kit not found for Sample ID:", parsedFile.sampleId);
                return;
            }

            if (dnaResultKit.isProcessed) {
                logger.info("DNA result kit already processed", {
                    traceId,
                    dnaResultKitId: dnaResultKit.id,
                    sampleId: parsedFile.sampleId,
                });
                return;
            }

            logger.info("DNA result kit found", {
                traceId,
                dnaResultKitId: dnaResultKit.id,
                sampleId: parsedFile.sampleId,
                organizationId: dnaResultKit.organizationId,
                patientId: dnaResultKit.patientId,
            });

            await this.deleteExistingBreakdown(dnaResultKit.id, traceId);

            const recordsCreated = await this.createDNABreakdownRecords(
                dnaResultKit.id,
                parsedFile.data,
                traceId,
            );

            const existingFileMetadata = (dnaResultKit.fileMetadata as Record<string, any>) || {};

            await Promise.all([
                prisma.patientDNAResultKit.update({
                    where: { id: dnaResultKit.id },
                    data: {
                        isProcessed: true,
                        isFailedProcessing: false,
                        failedProcessingReason: null,
                        status: DNAResultStatus.GENOTYPING_ACCEPTED,
                        fileMetadata: {
                            ...existingFileMetadata,
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
                        status: DNAResultStatus.GENOTYPING_ACCEPTED,
                        metadata: {
                            recordsCreated,
                            totalSNPs: parsedFile.totalRows,
                            sampleId: parsedFile.sampleId,
                            bucket,
                            key,
                            processingDate: parsedFile.header.processingDate,
                            gsgtVersion: parsedFile.header.gsgtVersion,
                        },
                    },
                })
            ])


            logger.info("DNA file processing completed successfully", {
                traceId,
                dnaResultKitId: dnaResultKit.id,
                sampleId: parsedFile.sampleId,
                recordsCreated,
                totalSNPs: parsedFile.totalRows,
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

    private parseDNAFile(content: string): ParsedDNAFile {
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
            allowedSNPsCount: ALLOWED_SNPS_SET.size,
        });

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);

            const recordsToCreate = batch
                .map((row) => {
                    if (!this.isSNPAllowed(row.snpName)) {
                        logger.debug("SNP not in allowed list, skipping record", {
                            traceId,
                            snpName: row.snpName,
                        });
                        return null;
                    }

                    const position = parseInt(row.position, 10);
                    if (isNaN(position)) {
                        logger.warn("Invalid position value, skipping record", {
                            traceId,
                            snpName: row.snpName,
                            position: row.position,
                        });
                        return null;
                    }

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
                        patientDNAResultId: dnaResultKitId,
                        snpName: row.snpName,
                        chromosome: row.chromosome,
                        position: position,
                        referenceAllele: referenceAllele,
                        alternateAllele: alternateAllele,
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
        });

        return totalCreated;
    }
}

export const tempusService = new TempusService();
export default tempusService;

