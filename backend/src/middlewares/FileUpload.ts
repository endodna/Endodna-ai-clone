import multer from "multer";
import { Response, NextFunction } from "express";
import { logger } from "../helpers/logger.helper";
import { RequestWithTrace } from "./Logger";

const storage = multer.memoryStorage();

const fileFilter = (
    req: RequestWithTrace,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    const allowedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/svg+xml",
        "image/webp",
        "application/msword",
        "text/plain",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(
            `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
        );
        logger.error("File upload validation failed", {
            traceId: req.traceId,
            method: "FileUpload.fileFilter",
            filename: file.originalname,
            mimetype: file.mimetype,
            allowedMimeTypes,
            error: error.message,
        });
        cb(error);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
});

const handleMulterError = (
    err: any,
    req: RequestWithTrace,
    res: Response,
    next: NextFunction,
) => {
    if (err instanceof multer.MulterError) {
        logger.error("Multer error occurred", {
            traceId: req.traceId,
            method: "FileUpload.handleMulterError",
            code: err.code,
            field: err.field,
            message: err.message,
        });

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                status: 400,
                error: true,
                message: "File size exceeds the maximum limit of 5MB",
            });
        }

        if (err.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                status: 400,
                error: true,
                message: "Too many files. Maximum 5 files allowed",
            });
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                status: 400,
                error: true,
                message: `Unexpected field: ${err.field}. Expected field name: ${err.field === "file" ? "files" : "file"}`,
            });
        }

        return res.status(400).json({
            status: 400,
            error: true,
            message: err.message || "File upload error",
        });
    }

    if (err) {
        logger.error("File upload error", {
            traceId: req.traceId,
            method: "FileUpload.handleMulterError",
            error: err.message,
            stack: err.stack,
        });

        if (err.message.includes("Invalid file type")) {
            return res.status(400).json({
                status: 400,
                error: true,
                message: err.message,
            });
        }

        return res.status(500).json({
            status: 500,
            error: true,
            message: "File upload failed",
        });
    }

    next();
};

export const uploadSingle = (req: RequestWithTrace, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            return handleMulterError(err, req, res, next);
        }
        next();
    });
};

export const uploadMultiple = (req: RequestWithTrace, res: Response, next: NextFunction) => {
    upload.array("files", 5)(req, res, (err) => {
        if (err) {
            return handleMulterError(err, req, res, next);
        }
        next();
    });
};

