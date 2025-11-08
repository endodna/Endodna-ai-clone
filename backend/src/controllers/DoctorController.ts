import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { logger } from "../helpers/logger.helper";
import {
  CreatePatientActiveMedicationSchema,
  CreatePatientSchema,
  GetPatientsSchema,
  CreatePatientMedicalRecordSchema,
} from "../schemas";
import { UserService } from "../services/user.service";
import {
  Priority,
  Status,
  UserType as PrismaUserType,
  User,
  Prisma,
  MedicalRecordType,
} from "@prisma/client";
import PaginationHelper from "../helpers/pagination.helper";
import { prisma } from "../lib/prisma";
import s3Helper from "../helpers/s3.helper";
import ragHelper from "../helpers/rag.helper";

class DoctorController {
  public static async createPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const {
        email,
        password,
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        phoneNumber,
      } = req.body as CreatePatientSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        phoneNumber,
        userType: PrismaUserType.PATIENT,
        organizationId: organizationId!,
        userId: userId,
        status: Status.PENDING,
        traceId: req.traceId,
      });

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Organization patient create attempt",
        metadata: {
          body: req.body,
        },
        priority: Priority.HIGH,
      });

      if (!result.success) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: result.error,
        });
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...req.body,
          password: undefined,
        },
        message: "Organization patient created successfully",
      });
    } catch (err) {
      logger.error("Create patient failed", {
        traceId: req.traceId,
        method: "createPatient",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create organization patient",
        },
        req,
      );
    }
  }

  public static async getPatients(
    req: AuthenticatedRequest & { query: GetPatientsSchema },
    res: Response,
  ) {
    try {
      const { page, limit, search } = PaginationHelper.parseQueryParams(
        req.query,
      );
      const { organizationId } = req.user!;

      const result = await PaginationHelper.paginate<
        User,
        Prisma.UserFindManyArgs
      >(
        prisma.user,
        {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            patientDNAResults: {
              select: {
                id: true,
                status: true,
              },
            },
            patientGoals: {
              select: {
                id: true,
                description: true,
              },
            },
            managingDoctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          where: {
            AND: [
              {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            ],
            userType: PrismaUserType.PATIENT,
            organizationUsers: {
              every: {
                organizationId,
              },
            },
          },
        },
        {
          page,
          limit,
          traceId: req.traceId,
        },
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          items: result.data,
          pagination: result.meta,
        },
        message: "Patients fetched successfully",
      });
    } catch (err) {
      logger.error("Get patients failed", {
        traceId: req.traceId,
        method: "getPatients.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get patients",
        },
        req,
      );
    }
  }

  public static async getPatient(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params;
      const { organizationId } = req.user!;

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          patientDNAResults: {
            select: {
              id: true,
              status: true,
            },
          },
          patientGoals: {
            select: {
              id: true,
              description: true,
            },
          },
          patientAllergies: {
            select: {
              id: true,
              allergen: true,
              reactionType: true,
            },
          },
          managingDoctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: {
            every: {
              organizationId,
            },
          },
        },
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: "Patient fetched successfully",
      });
    } catch (err) {
      logger.error("Get patientsfailed", {
        traceId: req.traceId,
        method: "getPatient.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get patient",
        },
        req,
      );
    }
  }

  public static async createPatientActiveMedication(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params;
      const { drugName, dosage, frequency, startDate, endDate, reason, notes } =
        req.body as CreatePatientActiveMedicationSchema;
      const { userId, organizationId } = req.user!;

      const user = await prisma.user.findUnique({
        select: {
          id: true,
        },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: {
            every: {
              organizationId,
            },
          },
        },
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }
      const result = await prisma.patientActiveMedication.create({
        data: {
          drugName,
          dosage,
          frequency,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          reason,
          notes,
          patientId,
          doctorId: userId!,
          organizationId: organizationId!,
        },
      });

      await ragHelper.invalidatePatientSummaryCache(
        organizationId!,
        patientId,
        req.traceId,
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: result,
        message: "Patient active medication created successfully",
      });
    }
    catch (err) {
      logger.error("Create patient active medication failed", {
        traceId: req.traceId,
        method: "createPatientActiveMedication.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create patient active medication",
        },
        req,
      );
    }
  }

  public static async getPatientActiveMedication(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params;
      const { organizationId } = req.user!;

      const user = await prisma.user.findUnique({
        select: {
          id: true,
        },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: {
            every: {
              organizationId,
            },
          },
        },
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      const medications = await prisma.patientActiveMedication.findMany({
        where: {
          patientId,
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          drugName: true,
          dosage: true,
          frequency: true,
          startDate: true,
          endDate: true,
          reason: true,
          notes: true,
          createdAt: true,
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: medications,
        message: "Patient active medications fetched successfully",
      });
    } catch (err) {
      logger.error("Get patient active medication failed", {
        traceId: req.traceId,
        method: "getPatientActiveMedication.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get patient active medication",
        },
        req,
      );
    }
  }

  public static async updatePatientActiveMedication(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId, medicationId } = req.params as unknown as { patientId: string, medicationId: number };
      const { drugName, dosage, frequency, startDate, endDate, reason, notes } =
        req.body as CreatePatientActiveMedicationSchema;
      const { userId, organizationId } = req.user!;

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          patientActiveMedications: true,
        },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: {
            every: {
              organizationId,
            },
          },
        },
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      if (!user.patientActiveMedications.find(medication => medication.id == medicationId && medication.deletedAt == null)) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient active medication not found",
        });
      }

      const result = await prisma.patientActiveMedication.update({
        data: {
          drugName,
          dosage,
          frequency,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          reason,
          notes,
          patientId,
          doctorId: userId!,
          organizationId: organizationId!,
        },
        where: {
          id: Number(medicationId),
          patientId,
          doctorId: userId!,
        },
      });

      await ragHelper.invalidatePatientSummaryCache(
        organizationId!,
        patientId,
        req.traceId,
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: result,
        message: "Patient active medication updated successfully",
      });
    } catch (err) {
      logger.error("Update patient active medication failed", {
        traceId: req.traceId,
        method: "updatePatientActiveMedication.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update patient active medication",
        },
        req,
      );
    }
  }

  public static async deletePatientActiveMedication(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId, medicationId } = req.params as unknown as { patientId: string, medicationId: number };
      const { userId, organizationId } = req.user!;

      const user = await prisma.user.findUnique({
        select: {
          id: true,
          patientActiveMedications: true,
        },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: {
            every: {
              organizationId,
            },
          },
        },
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      const medication = await prisma.patientActiveMedication.findFirst({
        where: {
          id: Number(medicationId),
          patientId,
          doctorId: userId!,
          deletedAt: null,
        },
      });

      if (!medication) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient active medication not found",
        });
      }

      await prisma.patientActiveMedication.update({
        where: {
          id: Number(medicationId),
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await ragHelper.invalidatePatientSummaryCache(
        organizationId!,
        patientId,
        req.traceId,
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: "Patient active medication deleted successfully",
      });
    } catch (err) {
      logger.error("Delete patient active medication failed", {
        traceId: req.traceId,
        method: "deletePatientActiveMedication.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to delete patient active medication",
        },
        req,
      );
    }
  }

  public static async uploadMultipleMedicalRecords(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params;
      const { userId, organizationId } = req.user!;
      const { title, type } = req.body as CreatePatientMedicalRecordSchema;

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "At least one file is required",
        });
      }

      const patient = await prisma.user.findUnique({
        select: { id: true },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: { every: { organizationId } },
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      const s3Bucket = process.env.S3_PRIVATE_BUCKET || "";

      if (!s3Bucket) {
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          message: "S3 bucket not configured",
        });
      }

      const uploadPromises = files.map(async (file) => {
        const s3Key = s3Helper.generateKey(
          `medical-records/${organizationId}/${patientId}`,
          file.mimetype,
          true,
        );

        const uploadResult = await s3Helper.uploadFile({
          bucket: s3Bucket,
          key: s3Key,
          body: file.buffer,
          contentType: file.mimetype,
          metadata: {
            patientId,
            doctorId: userId!,
            organizationId: organizationId!.toString(),
            originalFilename: file.originalname,
          },
          acl: "private",
          traceId: req.traceId,
        });

        return {
          file,
          uploadResult,
        };
      });

      const uploadResults = await Promise.all(uploadPromises);

      const medicalRecords = await Promise.all(
        uploadResults.map(({ file, uploadResult }) =>
          prisma.patientMedicalRecord.create({
            data: {
              patientId,
              doctorId: userId!,
              organizationId: organizationId!,
              title: title || file.originalname,
              type: type || MedicalRecordType.CONSULTATION,
              sourceUrl: uploadResult.location,
              content: Prisma.JsonNull,
              fileMetadata: {
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype,
                key: uploadResult.key,
                bucket: uploadResult.bucket,
              },
              isProcessed: false,
            },
          }),
        ),
      );

      await ragHelper.invalidatePatientSummaryCache(
        organizationId!,
        patientId,
        req.traceId,
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          records: medicalRecords.map((record) => ({
            title: record.title,
            type: record.type,
            metadata: {
              originalName: (record.fileMetadata as { originalName?: string })?.originalName,
              size: (record.fileMetadata as { size?: number })?.size,
              mimetype: (record.fileMetadata as { mimetype?: string })?.mimetype,
            },
            id: record.id,
          })),
          count: medicalRecords.length,
        },
        message: `${medicalRecords.length} medical record(s) uploaded successfully`,
      });
    } catch (err) {
      logger.error("Upload multiple medical records failed", {
        traceId: req.traceId,
        method: "uploadMultipleMedicalRecords.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to upload medical records",
        },
        req,
      );
    }
  }

  public static async getMedicalRecords(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params;
      const { organizationId } = req.user!;

      const patient = await prisma.user.findUnique({
        select: { id: true },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: { some: { organizationId } },
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      const medicalRecords = await prisma.patientMedicalRecord.findMany({
        where: {
          patientId,
          organizationId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          type: true,
          sourceUrl: true,
          fileMetadata: true,
          isProcessed: true,
          isFailedProcessing: true,
          failedProcessingReason: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const s3Bucket = process.env.S3_PRIVATE_BUCKET || "";

      if (!s3Bucket) {
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          message: "S3 bucket not configured",
        });
      }

      const recordsWithPresignedUrls = await Promise.all(
        medicalRecords.map(async (record) => {
          const fileMetadata = record.fileMetadata as {
            key?: string;
            bucket?: string;
            originalName?: string;
            size?: number;
            mimetype?: string;
          } | null;

          let presignedUrl: string | null = null;

          if (fileMetadata?.key) {
            try {
              presignedUrl = await s3Helper.getPresignedDownloadUrl({
                bucket: s3Bucket,
                key: fileMetadata.key,
                expiresIn: 3600,
                traceId: req.traceId,
              });
            } catch (error) {
              logger.error("Failed to generate presigned URL", {
                traceId: req.traceId,
                method: "getMedicalRecords.Doctor",
                recordId: record.id,
                key: fileMetadata.key,
                error: error,
              });
            }
          }

          return {
            id: record.id,
            title: record.title,
            type: record.type,
            isProcessed: record.isProcessed,
            isFailedProcessing: record.isFailedProcessing,
            failedProcessingReason: record.failedProcessingReason || null,
            presignedUrl,
            fileMetadata: {
              originalName: fileMetadata?.originalName,
              size: fileMetadata?.size,
              mimetype: fileMetadata?.mimetype,
            },
            createdAt: record.createdAt,
          };
        }),
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          records: recordsWithPresignedUrls,
          count: recordsWithPresignedUrls.length,
        },
        message: "Medical records retrieved successfully",
      });
    } catch (err) {
      logger.error("Get medical records failed", {
        traceId: req.traceId,
        method: "getMedicalRecords.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to retrieve medical records",
        },
        req,
      );
    }
  }

  public static async getPatientAISummary(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
      const { organizationId } = req.user!;

      if (!organizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization ID is required",
        });
      }

      const patient = await prisma.user.findUnique({
        select: { id: true },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: { some: { organizationId } },
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      const result = await ragHelper.generatePatientSummary({
        patientId,
        organizationId,
        traceId: req.traceId,
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          summary: result.summary
        },
        message: "Patient summary fetched successfully",
      });
    } catch (err) {
      logger.error("Get patient AI summary failed", {
        traceId: req.traceId,
        method: "getPatientAISummary.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get patient summary",
      }, req);
    }
  }

  public static async getPatientGenetics(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
      const { organizationId } = req.user!;

      if (!organizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization ID is required",
        });
      }

      const patient = await prisma.user.findUnique({
        select: {
          id: true, patientDNAResults: {
            select: {
              status: true,
              isProcessed: true,
              isFailedProcessing: true,
              failedProcessingReason: true,
              createdAt: true,
              patientDNAResultBreakdown: {
                select: {
                  snpName: true,
                  chromosome: true,
                  position: true,
                  referenceAllele: true,
                  alternateAllele: true,
                },
              },
              patientDNAResultActivity: {
                select: {
                  activity: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          }
        },
        where: {
          id: patientId,
          userType: PrismaUserType.PATIENT,
          organizationUsers: { some: { organizationId } },
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }
      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          dnaResults: patient.patientDNAResults,
        },
        message: "Patient genetics fetched successfully",
      });
    }
    catch (err) {
      logger.error("Get patient DNA analysis failed", {
        traceId: req.traceId,
        method: "getPatientDNAAnalysis.Doctor",
        error: err,
      });
    }
  }
}

export default DoctorController;
