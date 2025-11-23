import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommandInput,
    CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../logger.helper";
import aws from "../../lib/aws";
import { Readable } from "stream";

export interface S3UploadOptions {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array | Readable | string;
    contentType?: string;
    contentEncoding?: string;
    metadata?: Record<string, string>;
    acl?: "private" | "public-read" | "authenticated-read";
    cacheControl?: string;
    traceId?: string;
}

export interface S3UploadResult {
    key: string;
    bucket: string;
    location: string;
    etag?: string;
}

export interface S3PresignedUrlOptions {
    bucket: string;
    key: string;
    expiresIn?: number;
    operation?: "getObject" | "putObject";
    contentType?: string;
    traceId?: string;
}

class S3Helper {
    async uploadFile(options: S3UploadOptions): Promise<S3UploadResult> {
        const s3Client: S3Client = aws.getS3Client();
        const { bucket, key, body, contentType, contentEncoding, metadata, acl, cacheControl, traceId } = options;

        try {
            const putObjectParams: PutObjectCommandInput = {
                Bucket: bucket,
                Key: key,
                Body: body,
            };

            if (contentType) {
                putObjectParams.ContentType = contentType;
            }

            if (contentEncoding) {
                putObjectParams.ContentEncoding = contentEncoding;
            }

            if (metadata) {
                putObjectParams.Metadata = metadata;
            }

            if (acl) {
                putObjectParams.ACL = acl;
            }

            if (cacheControl) {
                putObjectParams.CacheControl = cacheControl;
            }

            const command = new PutObjectCommand(putObjectParams);
            const response = await s3Client.send(command);

            const location = `https://${bucket}.s3.${aws.getRegion()}.amazonaws.com/${key}`;

            logger.info("File uploaded to S3 successfully", {
                traceId,
                bucket,
                key,
                location,
                etag: response.ETag,
                method: "S3Helper.uploadFile",
            });

            return {
                key,
                bucket,
                location,
                etag: response.ETag,
            };
        } catch (error) {
            logger.error("Error uploading file to S3", {
                traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    async uploadFiles(
        files: Array<Omit<S3UploadOptions, "bucket">>,
        bucket: string,
        traceId?: string,
    ): Promise<S3UploadResult[]> {
        const uploadPromises = files.map((file) =>
            this.uploadFile({
                ...file,
                bucket,
                traceId,
            }),
        );

        try {
            const results = await Promise.all(uploadPromises);
            logger.info(`Uploaded ${results.length} file(s) to S3`, {
                traceId,
                bucket,
                count: results.length,
                method: "S3Helper.uploadFiles",
            });
            return results;
        } catch (error) {
            logger.error("Error uploading files to S3", {
                traceId,
                bucket,
                fileCount: files.length,
                error: error,
            });
            throw error;
        }
    }

    async deleteFile(bucket: string, key: string, traceId?: string): Promise<void> {
        const s3Client: S3Client = aws.getS3Client();

        try {
            const command = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            await s3Client.send(command);

            logger.info("File deleted from S3 successfully", {
                traceId,
                bucket,
                key,
                method: "S3Helper.deleteFile",
            });
        } catch (error) {
            logger.error("Error deleting file from S3", {
                traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    async deleteFiles(bucket: string, keys: string[], traceId?: string): Promise<void> {
        const deletePromises = keys.map((key) => this.deleteFile(bucket, key, traceId));

        try {
            await Promise.all(deletePromises);
            logger.info(`Deleted ${keys.length} file(s) from S3`, {
                traceId,
                bucket,
                count: keys.length,
                method: "S3Helper.deleteFiles",
            });
        } catch (error) {
            logger.error("Error deleting files from S3", {
                traceId,
                bucket,
                fileCount: keys.length,
                error: error,
            });
            throw error;
        }
    }

    async getPresignedUploadUrl(
        options: S3PresignedUrlOptions,
    ): Promise<string> {
        const s3Client: S3Client = aws.getS3Client();
        const { bucket, key, expiresIn = 3600, contentType } = options;

        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                ContentType: contentType,
            });

            const url = await getSignedUrl(s3Client, command, {
                expiresIn,
            });

            logger.debug("Generated presigned upload URL", {
                traceId: options.traceId,
                bucket,
                key,
                expiresIn,
            });

            return url;
        } catch (error) {
            logger.error("Error generating presigned upload URL", {
                traceId: options.traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    async getPresignedDownloadUrl(
        options: S3PresignedUrlOptions,
    ): Promise<string> {
        const s3Client: S3Client = aws.getS3Client();
        const { bucket, key, expiresIn = 3600 } = options;

        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            const url = await getSignedUrl(s3Client, command, {
                expiresIn,
            });

            logger.debug("Generated presigned download URL", {
                traceId: options.traceId,
                bucket,
                key,
                expiresIn,
            });

            return url;
        } catch (error) {
            logger.error("Error generating presigned download URL", {
                traceId: options.traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    async fileExists(bucket: string, key: string, traceId?: string): Promise<boolean> {
        const s3Client: S3Client = aws.getS3Client();

        try {
            const command = new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            await s3Client.send(command);
            return true;
        } catch (error: any) {
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            logger.error("Error checking if file exists in S3", {
                traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    async getFileMetadata(bucket: string, key: string, traceId?: string) {
        const s3Client: S3Client = aws.getS3Client();

        try {
            const command = new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            const response = await s3Client.send(command);

            return {
                contentType: response.ContentType,
                contentLength: response.ContentLength,
                lastModified: response.LastModified,
                etag: response.ETag,
                metadata: response.Metadata,
            };
        } catch (error) {
            logger.error("Error getting file metadata from S3", {
                traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    async listFiles(
        bucket: string,
        prefix?: string,
        maxKeys?: number,
        traceId?: string,
    ): Promise<string[]> {
        const s3Client: S3Client = aws.getS3Client();

        try {
            const command = new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
                MaxKeys: maxKeys,
            });

            const response = await s3Client.send(command);

            const keys = (response.Contents || []).map((object) => object.Key || "").filter(Boolean);

            logger.debug("Listed files from S3", {
                traceId,
                bucket,
                prefix,
                count: keys.length,
            });

            return keys;
        } catch (error) {
            logger.error("Error listing files from S3", {
                traceId,
                bucket,
                prefix,
                error: error,
            });
            throw error;
        }
    }

    generateKey(
        prefix: string,
        fileType: string,
        includeTimestamp: boolean = true,
    ): string {
        const timestamp = includeTimestamp ? `${Date.now()}-` : "";
        const random = Math.random().toString(36).substring(2, 15);
        const uuid = Math.random().toString(36).substring(2, 15);
        const extension = this.getFileExtension(fileType);
        return `${prefix}/${timestamp}${random}-${uuid}.${extension}`;
    }

    async downloadFile(bucket: string, key: string, traceId?: string): Promise<Buffer> {
        const s3Client: S3Client = aws.getS3Client();

        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });

            const response = await s3Client.send(command);

            if (!response.Body) {
                throw new Error("File body is empty");
            }

            const chunks: Uint8Array[] = [];
            const stream = response.Body as Readable;

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            const buffer = Buffer.concat(chunks);

            logger.debug("File downloaded from S3", {
                traceId,
                bucket,
                key,
                size: buffer.length,
            });

            return buffer;
        } catch (error) {
            logger.error("Error downloading file from S3", {
                traceId,
                bucket,
                key,
                error: error,
            });
            throw error;
        }
    }

    private getFileExtension(fileType: string): string {
        const mimeToExt: Record<string, string> = {
            "application/pdf": "pdf",
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/svg+xml": "svg",
            "image/webp": "webp",
            "application/msword": "doc",
            "text/plain": "txt",
        };
        return mimeToExt[fileType] || "pdf";
    }

    async moveFile(
        bucket: string,
        sourceKey: string,
        destinationKey: string,
        traceId?: string,
    ): Promise<void> {
        const s3Client: S3Client = aws.getS3Client();

        try {
            const copyCommand = new CopyObjectCommand({
                Bucket: bucket,
                CopySource: `${bucket}/${sourceKey}`,
                Key: destinationKey,
            });

            await s3Client.send(copyCommand);

            logger.info("File copied in S3", {
                traceId,
                bucket,
                sourceKey,
                destinationKey,
                method: "S3Helper.moveFile",
            });

            await this.deleteFile(bucket, sourceKey, traceId);

            logger.info("File moved in S3 successfully", {
                traceId,
                bucket,
                sourceKey,
                destinationKey,
                method: "S3Helper.moveFile",
            });
        } catch (error) {
            logger.error("Error moving file in S3", {
                traceId,
                bucket,
                sourceKey,
                destinationKey,
                error: error,
            });
            throw error;
        }
    }
}

export const s3Helper = new S3Helper();
export default s3Helper;

