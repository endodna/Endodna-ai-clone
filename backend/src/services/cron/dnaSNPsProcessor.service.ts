import { prisma } from "../../lib/prisma";
import { logger } from "../../helpers/logger.helper";
import tempusService from "../tempus.service";
import s3Helper from "../../helpers/aws/s3.helper";

interface ReconciliationResult {
    dnaResultKitId: number;
    barcode: string;
    success: boolean;
    oldBreakdownCount: number;
    newBreakdownCount: number;
    matchedMasterSNPs: number;
    error?: string;
}

class DNASNPsProcessorService {
    private readonly BATCH_SIZE = 10;

    async reconcileAllProcessedDNAFiles(traceId?: string): Promise<void> {
        try {
            logger.info("Starting reconciliation of all processed DNA files with masterSNPs", {
                traceId,
                method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
            });

            const processedKits = await prisma.patientDNAResultKit.findMany({
                where: {
                    isProcessed: true,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    barcode: true,
                    fileMetadata: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            });

            if (processedKits.length === 0) {
                logger.info("No processed DNA files found to reconcile", {
                    traceId,
                    method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
                });
                return;
            }

            logger.info(`Found ${processedKits.length} processed DNA file(s) to reconcile`, {
                traceId,
                totalKits: processedKits.length,
                method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
            });

            const results: ReconciliationResult[] = [];

            for (let i = 0; i < processedKits.length; i += this.BATCH_SIZE) {
                const batch = processedKits.slice(i, i + this.BATCH_SIZE);

                logger.info(`Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1} of ${Math.ceil(processedKits.length / this.BATCH_SIZE)}`, {
                    traceId,
                    batchStart: i + 1,
                    batchEnd: Math.min(i + this.BATCH_SIZE, processedKits.length),
                    totalKits: processedKits.length,
                    method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
                });

                const batchResults = await Promise.allSettled(
                    batch.map((kit) => this.reconcileDNAFile(kit.id, kit.barcode, kit.fileMetadata, traceId))
                );

                for (const result of batchResults) {
                    if (result.status === "fulfilled") {
                        results.push(result.value);
                    } else {
                        logger.error("Error in batch reconciliation", {
                            traceId,
                            error: result.reason,
                            method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
                        });
                        results.push({
                            dnaResultKitId: 0,
                            barcode: "unknown",
                            success: false,
                            oldBreakdownCount: 0,
                            newBreakdownCount: 0,
                            matchedMasterSNPs: 0,
                            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
                        });
                    }
                }

                if (i + this.BATCH_SIZE < processedKits.length) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }

            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;
            const totalOldBreakdowns = results.reduce((sum, r) => sum + r.oldBreakdownCount, 0);
            const totalNewBreakdowns = results.reduce((sum, r) => sum + r.newBreakdownCount, 0);
            const totalMatched = results.reduce((sum, r) => sum + r.matchedMasterSNPs, 0);

            logger.info("DNA files reconciliation completed", {
                traceId,
                totalKits: processedKits.length,
                successful,
                failed,
                totalOldBreakdowns,
                totalNewBreakdowns,
                totalMatchedMasterSNPs: totalMatched,
                method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
            });

            results.forEach((result) => {
                if (result.success) {
                    logger.info("DNA file reconciled successfully", {
                        traceId,
                        dnaResultKitId: result.dnaResultKitId,
                        barcode: result.barcode,
                        oldBreakdownCount: result.oldBreakdownCount,
                        newBreakdownCount: result.newBreakdownCount,
                        matchedMasterSNPs: result.matchedMasterSNPs,
                        method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
                    });
                } else {
                    logger.error("DNA file reconciliation failed", {
                        traceId,
                        dnaResultKitId: result.dnaResultKitId,
                        barcode: result.barcode,
                        error: result.error,
                        method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
                    });
                }
            });
        } catch (error) {
            logger.error("Error reconciling processed DNA files", {
                traceId,
                error: error,
                method: "DNASNPsProcessorService.reconcileAllProcessedDNAFiles",
            });
            throw error;
        }
    }

    private async reconcileDNAFile(
        dnaResultKitId: number,
        barcode: string,
        fileMetadata: any,
        traceId?: string,
    ): Promise<ReconciliationResult> {
        try {
            logger.info("Reconciling DNA file", {
                traceId,
                dnaResultKitId,
                barcode,
                method: "DNASNPsProcessorService.reconcileDNAFile",
            });

            const existingBreakdowns = await prisma.patientDNAResultBreakdown.findMany({
                where: {
                    patientDNAResultId: dnaResultKitId,
                },
            });

            const oldBreakdownCount = existingBreakdowns.length;

            const metadata = fileMetadata as { bucket?: string; key?: string } | null;
            if (!metadata?.bucket || !metadata?.key) {
                logger.warn("DNA file metadata missing bucket or key, skipping reconciliation", {
                    traceId,
                    dnaResultKitId,
                    barcode,
                    fileMetadata,
                    method: "DNASNPsProcessorService.reconcileDNAFile",
                });

                return {
                    dnaResultKitId,
                    barcode,
                    success: false,
                    oldBreakdownCount,
                    newBreakdownCount: 0,
                    matchedMasterSNPs: 0,
                    error: "DNA file metadata missing bucket or key",
                };
            }

            let fileKey = metadata.key;
            const fileExists = await s3Helper.fileExists(metadata.bucket, fileKey, traceId);

            if (!fileExists && fileKey.startsWith("pending/")) {
                const filename = fileKey.replace("pending/", "");
                const completedKey = `completed/${filename}`;
                const completedFileExists = await s3Helper.fileExists(metadata.bucket, completedKey, traceId);

                if (completedFileExists) {
                    logger.info("File not found at pending/ key, using completed/ key instead", {
                        traceId,
                        dnaResultKitId,
                        barcode,
                        originalKey: fileKey,
                        newKey: completedKey,
                        method: "DNASNPsProcessorService.reconcileDNAFile",
                    });
                    fileKey = completedKey;
                } else {
                    logger.warn("File not found at either pending/ or completed/ key", {
                        traceId,
                        dnaResultKitId,
                        barcode,
                        pendingKey: fileKey,
                        completedKey,
                        method: "DNASNPsProcessorService.reconcileDNAFile",
                    });
                }
            }

            await tempusService.processDNAFile(
                {
                    bucket: metadata.bucket,
                    key: fileKey,
                    traceId,
                },
                true
            );

            const newBreakdowns = await prisma.patientDNAResultBreakdown.findMany({
                where: {
                    patientDNAResultId: dnaResultKitId,
                },
            });

            const newBreakdownCount = newBreakdowns.length;
            const matchedMasterSNPs = newBreakdowns.filter((b) => b.masterSNPId !== null).length;

            logger.info("DNA file reconciled successfully", {
                traceId,
                dnaResultKitId,
                barcode,
                oldBreakdownCount,
                newBreakdownCount,
                matchedMasterSNPs,
                method: "DNASNPsProcessorService.reconcileDNAFile",
            });

            return {
                dnaResultKitId,
                barcode,
                success: true,
                oldBreakdownCount,
                newBreakdownCount,
                matchedMasterSNPs,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error("Error reconciling DNA file", {
                traceId,
                dnaResultKitId,
                barcode,
                error: error,
                method: "DNASNPsProcessorService.reconcileDNAFile",
            });

            return {
                dnaResultKitId,
                barcode,
                success: false,
                oldBreakdownCount: 0,
                newBreakdownCount: 0,
                matchedMasterSNPs: 0,
                error: errorMessage,
            };
        }
    }
}

export const dnaSNPsProcessorService = new DNASNPsProcessorService();
export default dnaSNPsProcessorService;

