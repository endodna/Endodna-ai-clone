import { prisma } from "../../lib/prisma";
import { logger } from "../../helpers/logger.helper";
import s3Helper from "../../helpers/aws/s3.helper";
import bedrockHelper from "../../helpers/aws/bedrock.helper";
import { PatientMedicalRecord } from "@prisma/client";
import { TaskType } from "@prisma/client";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createCanvas } = require("canvas");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfReader = require("pdfreader");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require("pdfjs-dist");

interface ProcessResult {
    success: boolean;
    error?: string;
}

class MedicalRecordProcessorService {
    private readonly CHUNK_SIZE = 2500
    private readonly CHUNK_OVERLAP = 100
    private readonly MIN_CHUNK_SIZE = 500
    private readonly MAX_CHUNKS_PER_DOCUMENT = 5000
    private readonly BATCH_SIZE = 10
    private readonly MIN_PDF_TEXT_LENGTH = 500
    private readonly TMP_DIR: string

    constructor() {
        const cronDir = path.resolve(__dirname);
        this.TMP_DIR = path.join(cronDir, "tmp");

        if (!fs.existsSync(this.TMP_DIR)) {
            fs.mkdirSync(this.TMP_DIR, { recursive: true });
        }
    }

    async processUnprocessedRecords(traceId?: string): Promise<void> {
        try {
            const unprocessedRecords = await prisma.patientMedicalRecord.findMany({
                where: {
                    isProcessed: false,
                    // isFailedProcessing: false,
                    deletedAt: null,
                },
                take: this.BATCH_SIZE,
                orderBy: {
                    createdAt: "asc",
                },
            });

            if (unprocessedRecords.length === 0) {
                logger.info("No unprocessed medical records found", { traceId });
                return;
            }

            logger.info(`Processing ${unprocessedRecords.length} medical record(s)`, {
                traceId,
                count: unprocessedRecords.length,
            });

            const results: PromiseSettledResult<ProcessResult>[] = [];
            for (const record of unprocessedRecords) {
                const result = await Promise.allSettled([
                    this.processRecord(record, traceId),
                ]);
                results.push(...result);

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            const successful = results.filter(
                (r) => r.status === "fulfilled" && r.value.success,
            ).length;
            const failed = results.length - successful;

            logger.info("Medical records processing completed", {
                traceId,
                total: unprocessedRecords.length,
                successful,
                failed,
            });
        } catch (error) {
            logger.error("Error processing unprocessed medical records", {
                traceId,
                error: error,
                method: "MedicalRecordProcessorService.processUnprocessedRecords",
            });
        }
    }

    private async processRecord(
        record: PatientMedicalRecord,
        traceId?: string,
    ): Promise<ProcessResult> {
        try {
            logger.info("Processing medical record", {
                traceId,
                recordId: record.id,
                patientId: record.patientId,
            });

            const fileMetadata = record.fileMetadata as {
                key?: string;
                bucket?: string;
                mimetype?: string;
                originalName?: string;
            } | null;

            if (!fileMetadata?.key || !fileMetadata?.bucket) {
                throw new Error("File metadata missing key or bucket");
            }

            const fileBuffer = await s3Helper.downloadFile(
                fileMetadata.bucket,
                fileMetadata.key,
                traceId,
            );

            const textContent = await this.extractText(
                fileBuffer,
                fileMetadata.mimetype || "application/pdf",
                traceId,
            );

            if (!textContent || textContent.trim().length === 0) {
                throw new Error("No text content extracted from file");
            }

            await this.deleteExistingChunks(record.id, traceId);

            const chunkCount = await this.createChunksInBatches(
                record.id,
                textContent,
                record.organizationId,
                record.patientId,
                traceId,
            );

            await prisma.patientMedicalRecord.update({
                where: { id: record.id },
                data: {
                    isProcessed: true,
                    isFailedProcessing: false,
                    failedProcessingReason: null,
                    content: {
                        chunkCount: chunkCount,
                        processedAt: new Date().toISOString(),
                    },
                },
            });

            logger.info("Medical record processed successfully", {
                traceId,
                recordId: record.id,
                chunkCount: chunkCount,
            });

            return { success: true };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            logger.error("Error processing medical record", {
                traceId,
                recordId: record.id,
                error: errorMessage,
                method: "MedicalRecordProcessorService.processRecord",
            });

            await prisma.patientMedicalRecord.update({
                where: { id: record.id },
                data: {
                    isFailedProcessing: true,
                    failedProcessingReason: errorMessage,
                },
            });

            return { success: false, error: errorMessage };
        }
    }

    private async extractText(
        buffer: Buffer,
        mimetype: string,
        traceId?: string,
    ): Promise<string> {
        try {
            if (mimetype === "text/plain") {
                return buffer.toString("utf-8");
            }

            if (mimetype === "application/pdf") {
                return await this.extractTextFromPDF(buffer, traceId);
            }

            if (
                mimetype === "application/msword"
            ) {
                return await this.extractTextFromWord(buffer, traceId);
            }

            if (
                mimetype === "image/jpeg" ||
                mimetype === "image/jpg" ||
                mimetype === "image/png"
            ) {
                return await this.extractTextFromImage(buffer, traceId);
            }

            throw new Error(`Unsupported file type: ${mimetype}`);
        } catch (error) {
            logger.error("Error extracting text from file", {
                traceId,
                mimetype,
                error: error,
            });
            throw error;
        }
    }

    private async extractTextFromPDF(
        buffer: Buffer,
        traceId?: string,
    ): Promise<string> {
        try {
            return new Promise((resolve, reject) => {
                const pdfReader = new PdfReader.PdfReader();
                const pageTexts: string[] = [];
                let currentPage = 0;
                let currentPageText: string[] = [];

                pdfReader.parseBuffer(buffer, (err: any, item: any) => {
                    if (err) {
                        logger.warn("PDFReader parsing failed, falling back to OCR", {
                            traceId,
                            error: err.message || String(err),
                        });
                        this.extractTextFromPDFWithOCR(buffer, traceId)
                            .then(resolve)
                            .catch(reject);
                        return;
                    }

                    if (!item) {
                        if (currentPageText.length > 0) {
                            pageTexts.push(currentPageText.join(" "));
                        }
                        const fullText = pageTexts.join("\n\n");
                        if (fullText.trim().length >= this.MIN_PDF_TEXT_LENGTH) {
                            logger.info("PDF text extracted successfully using pdfreader", {
                                traceId,
                                textLength: fullText.length,
                                pages: pageTexts.length,
                            });
                            resolve(fullText.trim());
                        } else {
                            logger.warn("PDFReader returned minimal text, falling back to OCR", {
                                traceId,
                                textLength: fullText.length,
                            });
                            this.extractTextFromPDFWithOCR(buffer, traceId)
                                .then(resolve)
                                .catch(reject);
                        }
                        return;
                    }
                    if (item.page && item.page !== currentPage) {
                        if (currentPageText.length > 0) {
                            pageTexts.push(currentPageText.join(" "));
                        }
                        currentPage = item.page;
                        currentPageText = [];
                    }

                    if (item.text) {
                        currentPageText.push(item.text);
                    }
                });
            });
        } catch (error) {
            logger.warn("PDFReader initialization failed, falling back to OCR", {
                traceId,
                error: error instanceof Error ? error.message : String(error),
            });
            return await this.extractTextFromPDFWithOCR(buffer, traceId);
        }
    }

    private async extractTextFromPDFWithOCR(
        buffer: Buffer,
        traceId?: string,
    ): Promise<string> {
        let worker: any = null;
        const tempDir = path.join(this.TMP_DIR, `pdf-ocr-${Date.now()}`);
        let imageFiles: string[] = [];

        try {
            fs.mkdirSync(tempDir, { recursive: true });

            logger.info("Converting PDF pages to images", {
                traceId,
            });

            const loadingTask = pdfjsLib.getDocument({
                data: buffer,
            });
            const pdfDocument = await loadingTask.promise;
            const numPages = pdfDocument.numPages;

            logger.info("PDF loaded, converting pages to images", {
                traceId,
                numPages,
            });

            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = createCanvas(viewport.width, viewport.height);
                const context = canvas.getContext("2d");

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;

                const imagePath = path.join(tempDir, `page-${pageNum}.png`);
                const imageBuffer = canvas.toBuffer("image/png");
                fs.writeFileSync(imagePath, imageBuffer);
                imageFiles.push(imagePath);

                logger.debug("PDF page converted to image", {
                    traceId,
                    pageNum,
                    imagePath,
                });
            }

            imageFiles = imageFiles.sort();

            logger.info("Extracting text from PDF using OCR", {
                traceId,
                numPages: imageFiles.length,
            });

            worker = await createWorker("eng");
            const pageTexts: string[] = [];

            for (let i = 0; i < imageFiles.length; i++) {
                const imagePath = imageFiles[i];
                const imageBuffer = fs.readFileSync(imagePath);

                try {
                    const { data: ocrData } = await worker.recognize(imageBuffer);
                    pageTexts.push(ocrData.text);

                    logger.debug("OCR completed for PDF page", {
                        traceId,
                        pageNum: i + 1,
                        textLength: ocrData.text.length,
                    });
                } finally {
                    fs.unlinkSync(imagePath);

                    if ((i + 1) % 5 === 0 && global.gc) {
                        global.gc();
                    }

                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            const fullText = pageTexts.join("\n\n");

            logger.info("PDF OCR extraction completed", {
                traceId,
                numPages: imageFiles.length,
                totalTextLength: fullText.length,
            });

            return fullText;
        } catch (error) {
            logger.error("Error extracting text from PDF using OCR", {
                traceId,
                error: error,
            });
            throw error;
        } finally {
            if (worker) {
                try {
                    await worker.terminate();
                    worker = null;
                } catch (error) {
                    logger.warn("Error terminating Tesseract worker", {
                        traceId,
                        error: error,
                    });
                }
            }

            try {
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            } catch (error) {
                logger.warn("Error cleaning up temporary files", {
                    traceId,
                    error: error,
                });
            }

            if (global.gc) {
                global.gc();
            }
        }
    }

    private async extractTextFromWord(
        buffer: Buffer,
        traceId?: string,
    ): Promise<string> {
        try {
            logger.debug("Extracting text from Word document", {
                traceId,
                bufferSize: buffer.length,
            });

            const result = await mammoth.extractRawText({ buffer });

            logger.debug("Word document text extracted successfully", {
                traceId,
                textLength: result.value.length,
            });

            return result.value;
        } catch (error) {
            logger.error("Error extracting text from Word document", {
                traceId,
                error: error,
            });
            throw new Error(
                `Word extraction failed: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    private async extractTextFromImage(
        buffer: Buffer,
        traceId?: string,
    ): Promise<string> {
        let worker: any = null;
        try {
            logger.debug("Starting OCR for image", {
                traceId,
            });

            worker = await createWorker("eng");
            const { data } = await worker.recognize(buffer);

            logger.debug("OCR completed for image", {
                traceId,
                textLength: data.text.length,
            });

            await worker.terminate();
            worker = null;

            return data.text;
        } catch (error) {
            logger.error("Error extracting text from image", {
                traceId,
                error: error,
            });
            throw new Error(
                `OCR extraction failed: ${error instanceof Error ? error.message : String(error)}`,
            );
        } finally {
            if (worker) {
                try {
                    await worker.terminate();
                } catch (error) {
                    logger.warn("Error terminating Tesseract worker for image", {
                        traceId,
                        error: error,
                    });
                }
            }
        }
    }

    private async createChunksInBatches(
        recordId: number,
        text: string,
        organizationId: number,
        patientId: string,
        traceId?: string,
    ): Promise<number> {
        const EMBEDDING_BATCH_SIZE = 10;
        let start = 0;
        let chunkIndex = 0;
        const chunks: Array<{ chunkText: string; chunkIndex: number }> = [];
        const textLength = text.length;
        const estimatedChunks = Math.ceil(
            textLength / (this.CHUNK_SIZE - this.CHUNK_OVERLAP),
        );

        if (estimatedChunks > this.MAX_CHUNKS_PER_DOCUMENT) {
            logger.warn(
                `Document will create ${estimatedChunks} chunks, exceeding limit of ${this.MAX_CHUNKS_PER_DOCUMENT}. Truncating text.`,
                {
                    traceId,
                    recordId,
                    textLength,
                    estimatedChunks,
                    maxChunks: this.MAX_CHUNKS_PER_DOCUMENT,
                },
            );

            const maxTextLength =
                this.MAX_CHUNKS_PER_DOCUMENT *
                (this.CHUNK_SIZE - this.CHUNK_OVERLAP) +
                this.CHUNK_OVERLAP;
            text = text.substring(0, maxTextLength);
        }

        while (start < text.length) {
            if (chunkIndex >= this.MAX_CHUNKS_PER_DOCUMENT) {
                logger.warn(
                    `Reached maximum chunk limit of ${this.MAX_CHUNKS_PER_DOCUMENT} for record ${recordId}`,
                    {
                        traceId,
                        recordId,
                        chunkIndex,
                        textRemaining: text.length - start,
                    },
                );
                break;
            }

            const remainingText = text.length - start;

            if (remainingText <= this.MIN_CHUNK_SIZE) {
                if (remainingText > 0) {
                    const lastChunk = chunks[chunks.length - 1];
                    if (lastChunk && lastChunk.chunkText.length + remainingText <= this.CHUNK_SIZE * 1.5) {
                        lastChunk.chunkText += text.substring(start);
                        logger.debug("Appended remaining text to last chunk", {
                            traceId,
                            recordId,
                            chunkIndex: lastChunk.chunkIndex,
                            addedLength: remainingText,
                            finalChunkLength: lastChunk.chunkText.length,
                        });
                    } else {
                        chunks.push({
                            chunkText: text.substring(start),
                            chunkIndex,
                        });
                        chunkIndex++;
                    }
                }
                break;
            }

            const end = Math.min(start + this.CHUNK_SIZE, text.length);
            let chunkText = text.substring(start, end);

            if (chunkText.trim().length < this.MIN_CHUNK_SIZE) {
                const nextEnd = Math.min(start + this.CHUNK_SIZE * 1.5, text.length);
                chunkText = text.substring(start, nextEnd);

                if (chunkText.trim().length < this.MIN_CHUNK_SIZE) {
                    logger.warn("Chunk too short, skipping", {
                        traceId,
                        recordId,
                        chunkIndex,
                        chunkLength: chunkText.length,
                        minChunkSize: this.MIN_CHUNK_SIZE,
                    });
                    break;
                }
            }

            const trimmedChunk = chunkText.trim();

            if (trimmedChunk.length === 0) {
                logger.warn("Empty chunk detected, skipping", {
                    traceId,
                    recordId,
                    chunkIndex,
                });
                start = end;
                continue;
            }

            const isDuplicate = chunks.some(
                (c) => c.chunkText === trimmedChunk || c.chunkText.includes(trimmedChunk) || trimmedChunk.includes(c.chunkText),
            );

            if (isDuplicate) {
                logger.warn("Duplicate chunk detected, skipping", {
                    traceId,
                    recordId,
                    chunkIndex,
                    chunkLength: trimmedChunk.length,
                });
                start = end;
                continue;
            }

            chunks.push({
                chunkText: trimmedChunk,
                chunkIndex,
            });

            const nextStart = end - this.CHUNK_OVERLAP;

            if (nextStart <= start) {
                start = end;
            } else {
                start = nextStart;
            }

            chunkIndex++;
        }

        const chunkLengths = chunks.map((c) => c.chunkText.length);
        const minChunkLength = Math.min(...chunkLengths);
        const maxChunkLength = Math.max(...chunkLengths);
        const avgChunkLength = Math.round(
            chunkLengths.reduce((a, b) => a + b, 0) / chunkLengths.length,
        );

        logger.info("Chunks created, generating embeddings", {
            traceId,
            recordId,
            totalChunks: chunks.length,
            minChunkLength,
            maxChunkLength,
            avgChunkLength,
            chunkSizes: chunkLengths.slice(0, 10),
        });

        for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
            const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
            const embeddingPromises = batch.map((chunk) =>
                bedrockHelper.generateEmbedding({
                    text: chunk.chunkText,
                    organizationId,
                    patientId,
                    taskId: recordId,
                    taskType: TaskType.DOCUMENT_EMBEDDING,
                    traceId,
                }),
            );

            const embeddingResults = await Promise.all(embeddingPromises);

            for (let j = 0; j < batch.length; j++) {
                const chunk = batch[j];
                const embeddingResult = embeddingResults[j];

                const embeddingArray = embeddingResult.embedding;
                const embeddingString = `[${embeddingArray.join(",")}]`;

                await prisma.$executeRawUnsafe(
                    `INSERT INTO "PatientMedicalRecordChunk" (
                        "patientMedicalRecordId",
                        "chunkText",
                        "chunkIndex",
                        "embedding",
                        "metadata",
                        "createdAt",
                        "updatedAt"
                    ) VALUES (
                        $1,
                        $2,
                        $3,
                        $4::vector,
                        $5::jsonb,
                        NOW(),
                        NOW()
                    )`,
                    recordId,
                    chunk.chunkText,
                    chunk.chunkIndex,
                    embeddingString,
                    JSON.stringify({}),
                );
            }

            if (global.gc) {
                global.gc();
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const averageChunkSize =
            chunkIndex > 0
                ? Math.round(
                    textLength / chunkIndex,
                )
                : 0;

        logger.info("Chunking and embedding completed", {
            traceId,
            recordId,
            totalChunks: chunkIndex,
            textLength,
            averageChunkSize,
            chunkSize: this.CHUNK_SIZE,
            chunkOverlap: this.CHUNK_OVERLAP,
        });

        return chunkIndex;
    }

    private async deleteExistingChunks(
        recordId: number,
        traceId?: string,
    ): Promise<void> {
        try {
            await prisma.patientMedicalRecordChunk.deleteMany({
                where: { patientMedicalRecordId: recordId },
            });
        } catch (error) {
            logger.error("Error deleting existing chunks", {
                traceId,
                recordId,
                error: error,
            });
            throw error;
        }
    }
}

export const medicalRecordProcessorService = new MedicalRecordProcessorService();
export default medicalRecordProcessorService;

