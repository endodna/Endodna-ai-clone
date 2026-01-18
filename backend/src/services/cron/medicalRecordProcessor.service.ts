import { prisma } from "../../lib/prisma";
import { logger } from "../../helpers/logger.helper";
import s3Helper from "../../helpers/aws/s3.helper";
import bedrockHelper from "../../helpers/aws/bedrock.helper";
import emailHelper from "../../helpers/email.helper";
import { PatientMedicalRecord, MedicalRecordType } from "@prisma/client";
import { TaskType } from "@prisma/client";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import llmProviderHelper from "../../helpers/llm/llm-provider.helper";
import patientDataToolsHelper from "../../helpers/llm/tools/patient-data-tools.helper";
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
                    isFailedProcessing: false,
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

            await this.extractLabResultsAndPrefilledData(
                record.id,
                record.patientId,
                record.organizationId,
                textContent,
                record.type,
                traceId,
            );

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

            const emailMessage = [
                "A medical record failed to process.",
                "",
                `Record ID: ${record.id} (UUID: ${record.uuid})`,
                `Patient ID: ${record.patientId}`,
                `Organization ID: ${record.organizationId}`,
                `File Name: ${(record.fileMetadata as { originalName?: string } | null)?.originalName ?? "Unknown"}`,
                "",
                `Error: ${errorMessage}`,
                "",
                "This record has been marked as failed processing.",
            ].join("\n");

            emailHelper
                .sendNotificationEmail(
                    emailHelper.adminEmails,
                    "Medical Record Processing Failed",
                    emailMessage,
                    undefined,
                    undefined,
                    traceId,
                )
                .catch((emailError) => {
                    logger.error("Failed to send medical record failure notification", {
                        traceId,
                        recordId: record.id,
                        error: emailError,
                        method: "MedicalRecordProcessorService.processRecord",
                    });
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
                        "uuid",
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
                        $4,
                        $5::vector,
                        $6::jsonb,
                        NOW(),
                        NOW()
                    )`,
                    randomUUID(),
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

    private async extractLabResultsAndPrefilledData(
        recordId: number,
        patientId: string,
        organizationId: number,
        textContent: string,
        recordType: MedicalRecordType | null,
        traceId?: string,
    ): Promise<void> {
        try {
            const isLabResultRecord = recordType === MedicalRecordType.LAB_RESULT;

            logger.info("Extracting lab results and prefilledData from medical record", {
                traceId,
                recordId,
                patientId,
                organizationId,
                recordType,
                isLabResultRecord,
                textLength: textContent.length,
            });

            const labResultsExtractionSection = isLabResultRecord ? `
**LAB RESULTS EXTRACTION:**
- This is a LAB_RESULT type medical record - extract ALL lab results from the text
- Identify ALL lab results (biomarker names, values, units, reference ranges, dates)
- For each lab result found, use the match_biomarker_to_loinc tool to get the standardized LOINC code
- Extract: biomarker name, value, unit, reference range, collection date, status (if available)
- IMPORTANT: You MUST call match_biomarker_to_loinc for each lab result to get the LOINC code` : `
**LAB RESULTS EXTRACTION:**
- This is NOT a LAB_RESULT type medical record (type: ${recordType || 'null'})
- DO NOT extract lab results from this record - only extract prefilledData
- Lab results should only be extracted from records with type LAB_RESULT`;

            const systemPrompt = `You are a medical data extraction assistant. Extract lab results and clinical data from medical records.

${labResultsExtractionSection}

**PREFILLED DATA EXTRACTION:**
- Extract clinical data fields that match the prefilledDataFields structure
- Include: weight, height, age, blood type, BMI, and other clinical measurements
- Extract prefilledData from ALL medical record types

**CRITICAL OUTPUT REQUIREMENT:**
You MUST return ONLY a valid JSON object in a code block. ${isLabResultRecord ? 'For LAB_RESULT records, include lab results in the "labResults" array. ' : 'For non-LAB_RESULT records, "labResults" must be an empty array []. '}Always include "prefilledData" with extracted clinical measurements.

Use this EXACT format:

\`\`\`json
{
  "labResults": ${isLabResultRecord ? `[
    {
      "bioMarkerName": "Glucose",
      "value": "95",
      "unit": "mg/dL",
      "referenceRange": "70-100",
      "collectionDate": "2024-01-15",
      "loincCode": "2339-0",
      "loincLongName": "Glucose [Mass/volume] in Blood"
    }
  ]` : '[]'},
  "prefilledData": {
    "weight": 180,
    "height": 175,
    "bmi": 25.5
  }
}
\`\`\`

Do NOT include any text before or after the JSON code block. Return ONLY the JSON code block.`;

            const tools = patientDataToolsHelper.getPatientDataTools();
            const messages: Array<{ role: string; content: string | any[] }> = [
                {
                    role: "user",
                    content: `Extract lab results and prefilledData from this medical record:\n\n${textContent.substring(0, 10000)}${textContent.length > 10000 ? "\n\n[... truncated for processing ...]" : ""}`,
                },
            ];

            const MAX_TOOL_ITERATIONS = 5;
            let extractionResult: any = null;

            for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
                const result = await llmProviderHelper.generateChatCompletion({
                    systemPrompt,
                    messages,
                    tools,
                    organizationId,
                    patientId,
                    taskType: TaskType.DOCUMENT_EMBEDDING,
                    maxTokens: 8000,
                    temperature: 0.1,
                    traceId,
                });

                const assistantContent: any[] = [];
                if (result.text && result.text.trim().length > 0) {
                    assistantContent.push({ type: "text", text: result.text });
                }
                if (result.toolCalls && result.toolCalls.length > 0) {
                    result.toolCalls.forEach((toolCall) => {
                        assistantContent.push({
                            type: "tool_use",
                            id: toolCall.id,
                            name: toolCall.name,
                            input: toolCall.input,
                        });
                    });
                }

                if (assistantContent.length > 0) {
                    messages.push({
                        role: "assistant",
                        content: assistantContent,
                    });
                }

                if (!result.toolCalls || result.toolCalls.length === 0) {
                    const jsonBlockMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/);
                    if (jsonBlockMatch) {
                        try {
                            const jsonText = jsonBlockMatch[1].trim();
                            extractionResult = JSON.parse(jsonText);
                            logger.info("Extracted JSON from code block", {
                                traceId,
                                recordId,
                                hasLabResults: !!extractionResult?.labResults,
                                labResultsCount: extractionResult?.labResults?.length || 0,
                                hasPrefilledData: !!extractionResult?.prefilledData,
                            });
                            break;
                        } catch (e) {
                            logger.warn("Failed to parse JSON from code block", {
                                traceId,
                                recordId,
                                error: e,
                                jsonBlock: jsonBlockMatch[1].substring(0, 200),
                            });
                        }
                    }

                    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch && !extractionResult) {
                        try {
                            extractionResult = JSON.parse(jsonMatch[0]);
                            logger.info("Extracted JSON from text", {
                                traceId,
                                recordId,
                                hasLabResults: !!extractionResult?.labResults,
                                labResultsCount: extractionResult?.labResults?.length || 0,
                                hasPrefilledData: !!extractionResult?.prefilledData,
                            });
                            break;
                        } catch (e) {
                            logger.warn("Failed to parse extraction JSON", {
                                traceId,
                                recordId,
                                error: e,
                                jsonSnippet: jsonMatch[0].substring(0, 200),
                            });
                        }
                    }

                    if (!extractionResult) {
                        logger.warn("No JSON found in LLM response", {
                            traceId,
                            recordId,
                            responseLength: result.text.length,
                            responsePreview: result.text.substring(0, 500),
                        });
                    }
                    break;
                }

                const toolResults = await Promise.all(
                    result.toolCalls.map(async (toolCall) => {
                        const toolResult = await patientDataToolsHelper.executeTool(
                            toolCall,
                            patientId,
                            organizationId,
                            traceId,
                        );
                        return {
                            type: "tool_result",
                            tool_use_id: toolResult.toolUseId,
                            content: toolResult.content,
                            is_error: toolResult.isError || false,
                        };
                    }),
                );

                messages.push({
                    role: "user",
                    content: toolResults,
                });
            }

            if (isLabResultRecord && extractionResult?.labResults && Array.isArray(extractionResult.labResults)) {
                logger.info("Processing lab results for storage", {
                    traceId,
                    recordId,
                    patientId,
                    labResultsCount: extractionResult.labResults.length,
                });

                let storedCount = 0;
                let errorCount = 0;

                for (const labResult of extractionResult.labResults) {
                    try {
                        if (!labResult.bioMarkerName || !labResult.value) {
                            logger.warn("Skipping lab result with missing required fields", {
                                traceId,
                                recordId,
                                labResult,
                            });
                            errorCount++;
                            continue;
                        }

                        await prisma.patientLabResult.create({
                            data: {
                                uuid: randomUUID(),
                                organizationId,
                                patientId,
                                medicalRecordId: recordId,
                                bioMarkerName: labResult.bioMarkerName,
                                loincCode: labResult.loincCode || null,
                                loincLongName: labResult.loincLongName || null,
                                value: String(labResult.value),
                                unit: labResult.unit || null,
                                referenceRange: labResult.referenceRange || null,
                                collectionDate: labResult.collectionDate
                                    ? new Date(labResult.collectionDate)
                                    : null,
                                status: labResult.status || null,
                                reportData: {
                                    medicalRecordId: recordId,
                                    extractedAt: new Date().toISOString(),
                                },
                            },
                        });
                        storedCount++;
                    } catch (error) {
                        errorCount++;
                        logger.error("Error storing lab result", {
                            traceId,
                            recordId,
                            labResult,
                            error: error instanceof Error ? error.message : String(error),
                            errorStack: error instanceof Error ? error.stack : undefined,
                        });
                    }
                }

                logger.info("Lab results extraction completed", {
                    traceId,
                    recordId,
                    patientId,
                    total: extractionResult.labResults.length,
                    stored: storedCount,
                    errors: errorCount,
                });
            } else if (isLabResultRecord) {
                logger.warn("No lab results found in extraction result for LAB_RESULT record", {
                    traceId,
                    recordId,
                    patientId,
                    extractionResult: extractionResult ? Object.keys(extractionResult) : null,
                    hasLabResults: !!extractionResult?.labResults,
                    isArray: Array.isArray(extractionResult?.labResults),
                });
            } else {
                logger.debug("Skipping lab results extraction for non-LAB_RESULT record type", {
                    traceId,
                    recordId,
                    patientId,
                    recordType,
                });
            }

            if (extractionResult?.prefilledData && typeof extractionResult.prefilledData === "object") {
                const prefilledData = extractionResult.prefilledData;
                const filteredPrefilledData = Object.fromEntries(
                    Object.entries(prefilledData).filter(
                        ([_, value]) => value !== null && value !== undefined && value !== "",
                    ),
                );

                if (Object.keys(filteredPrefilledData).length > 0) {
                    let patientInfo = await prisma.patientInfo.findUnique({
                        where: { patientId },
                    });

                    if (!patientInfo) {
                        patientInfo = await prisma.patientInfo.create({
                            data: {
                                patientId,
                                organizationId,
                                prefilledData: {},
                            },
                        });
                    }

                    const timestamp = Date.now();
                    const existingPrefilledData = (patientInfo.prefilledData as Record<string, any>) || {};
                    const versionedPrefilledData = {
                        ...existingPrefilledData,
                        [timestamp]: filteredPrefilledData,
                    };

                    await prisma.patientInfo.update({
                        where: { patientId },
                        data: {
                            prefilledData: versionedPrefilledData,
                            isOutdated: false,
                        },
                    });

                    logger.info("PrefilledData extracted and stored", {
                        traceId,
                        recordId,
                        patientId,
                        timestamp,
                        fields: Object.keys(filteredPrefilledData),
                    });
                }
            }
        } catch (error) {
            logger.error("Error extracting lab results and prefilledData", {
                traceId,
                recordId,
                patientId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
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

