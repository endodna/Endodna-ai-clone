import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { logger } from "../helpers/logger.helper";
import {
  CreatePatientActiveMedicationSchema,
  CreatePatientSchema,
  GetPatientsSchema,
  CreatePatientMedicalRecordSchema,
  CreatePatientConversationSchema,
  SendPatientMessageSchema,
  UpdateConversationTitleSchema,
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
import s3Helper from "../helpers/aws/s3.helper";
import ragHelper from "../helpers/rag.helper";
import { buildOrganizationUserFilter } from "../helpers/organization-user.helper";
import patientChatHelper from "../helpers/patient-chat.helper";
import { ChatType } from "@prisma/client";

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
                updatedAt: true,
              },
            },
            patientGoals: {
              select: {
                id: true,
                description: true,
              },
            },
            patientActivities: {
              select: {
                id: true,
                activity: true,
                status: true,
                createdAt: true,
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
            ...buildOrganizationUserFilter(organizationId!, {
              userType: PrismaUserType.PATIENT,
            }),
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

      const user = await prisma.user.findFirst({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          patientDNAResults: {
            select: {
              id: true,
              status: true,
              updatedAt: true,
            },
          },
          patientGoals: {
            select: {
              id: true,
              description: true,
              createdAt: true,
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
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

      const user = await prisma.user.findFirst({
        select: {
          id: true,
        },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }
      const [result] = await Promise.all([
        prisma.patientActiveMedication.create({
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
          }
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient active medication created: ${drugName}`,
          metadata: {
            patientId,
            medicationId: null,
            action: "create",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

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

      const user = await prisma.user.findFirst({
        select: {
          id: true,
        },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

      const user = await prisma.user.findFirst({
        select: {
          id: true,
          patientActiveMedications: {
            where: {
              deletedAt: null,
            },
          },
        },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient not found",
        });
      }

      if (!user.patientActiveMedications.find((medication: { id: number; deletedAt: Date | null }) => medication.id == medicationId && medication.deletedAt === null)) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient active medication not found",
        });
      }

      const [result] = await Promise.all([
        prisma.patientActiveMedication.update({
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
          }
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient active medication updated: ${drugName}`,
          metadata: {
            patientId,
            medicationId: Number(medicationId),
            action: "update",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

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

      const user = await prisma.user.findFirst({
        select: {
          id: true,
          patientActiveMedications: {
            where: {
              deletedAt: null,
            },
          },
        },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

      await Promise.all([
        prisma.patientActiveMedication.update({
          where: {
            id: Number(medicationId),
          },
          data: {
            deletedAt: new Date(),
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient active medication deleted`,
          metadata: {
            patientId,
            medicationId: Number(medicationId),
            action: "delete",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

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

      const patient = await prisma.user.findFirst({
        select: { id: true },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

      await Promise.all([
        ragHelper.invalidatePatientSummaryCache(
          organizationId!,
          patientId,
          req.traceId,
        ),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Medical records uploaded: ${medicalRecords.length} file(s)`,
          metadata: {
            patientId,
            recordCount: medicalRecords.length,
            action: "upload",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

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

      const patient = await prisma.user.findFirst({
        select: { id: true },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

      const patient = await prisma.user.findFirst({
        select: { id: true },
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

      const patient = await prisma.user.findFirst({
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
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
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

  public static async getPatientConversations(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
      const { organizationId, userId } = req.user!;

      const patient = await prisma.user.findFirst({
        where: {
          id: patientId,
          ...buildOrganizationUserFilter(organizationId!),
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient not found",
        }, req);
      }

      const conversations = await prisma.patientChatConversation.findMany({
        where: {
          patientId,
          doctorId: userId,
          organizationId: organizationId!,
        },
        select: {
          id: true,
          type: true,
          title: true,
          createdAt: true,
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            }
          }
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: conversations,
        message: "Patient conversations retrieved successfully",
      }, req);
    }
    catch (err) {
      logger.error("Get patient conversations failed", {
        traceId: req.traceId,
        method: "getPatientConversations.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get patient conversations",
      }, req);
    }
  }

  public static async createPatientConversation(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
      const { organizationId, userId } = req.user!;
      const { type } = req.body as CreatePatientConversationSchema;

      const patient = await prisma.user.findFirst({
        where: {
          id: patientId,
          ...buildOrganizationUserFilter(organizationId!),
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient not found",
        }, req);
      }

      const chatType = type || ChatType.GENERAL;
      const patientName = `${patient.firstName} ${patient.lastName}`.trim();
      const chatTypeDisplay = chatType.split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const defaultTitle = `${patientName} - ${chatTypeDisplay} - ${date}`;

      const [conversation] = await Promise.all([
        prisma.patientChatConversation.create({
          data: {
            patientId,
            doctorId: userId,
            organizationId: organizationId!,
            type: chatType,
            title: defaultTitle,
          },
          select: {
            id: true,
            type: true,
            title: true,
            createdAt: true,
          }
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient conversation created: ${chatType}`,
          metadata: {
            patientId,
            chatType,
            action: "create",
          },
          priority: Priority.LOW,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.CREATED,
        data: conversation,
        message: "Patient conversation created successfully",
      }, req);
    }
    catch (err) {
      logger.error("Create patient conversation failed", {
        traceId: req.traceId,
        method: "createPatientConversation.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to create patient conversation",
      }, req);
    }
  }

  public static async getPatientConversationMessages(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId, conversationId } = req.params as unknown as { patientId: string; conversationId: string };
      const { organizationId, userId } = req.user!;

      const conversation = await prisma.patientChatConversation.findFirst({
        where: {
          id: conversationId,
          patientId,
          doctorId: userId,
          organizationId: organizationId!,
        },
      });

      if (!conversation) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Conversation not found",
        }, req);
      }

      const messages = await prisma.patientChatMessage.findMany({
        where: {
          conversationId,
        },
        select: {
          id: true,
          role: true,
          version: true,
          content: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: messages.map((message) => ({
          id: message.id,
          role: message.role,
          version: message.version,
          content: message.content,
          createdAt: message.createdAt,
          citations: (message.metadata as { citations?: Array<{ medicalRecordId: number; title: string | null }> } | null)?.citations?.map((citation) => ({
            medicalRecordId: citation.medicalRecordId,
            title: citation.title,
          })),
        })),
        message: "Patient conversation messages retrieved successfully",
      }, req);
    }
    catch (err) {
      logger.error("Get patient conversation messages failed", {
        traceId: req.traceId,
        method: "getPatientConversationMessages.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get patient conversation messages",
      }, req);
    }
  }

  public static async sendPatientConversationMessage(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId, conversationId } = req.params as unknown as { patientId: string; conversationId: string };
      const { organizationId, userId } = req.user!;
      const { message } = req.body as SendPatientMessageSchema;

      const conversation = await prisma.patientChatConversation.findFirst({
        where: {
          id: conversationId,
          patientId,
          doctorId: userId,
          organizationId: organizationId!,
        },
      });

      if (!conversation) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Conversation not found",
        }, req);
      }

      const result = await patientChatHelper.sendMessage({
        conversationId,
        patientId,
        doctorId: userId,
        organizationId: organizationId!,
        message,
        chatType: conversation.type,
        traceId: req.traceId,
      });

      const relevantCitations = result.citations.filter((citation) => {
        if (!citation.title) return false;
        if (citation.similarity === null) return false;
        return citation.similarity >= 0.3;
      });

      const uniqueCitations = Array.from(
        new Map(
          relevantCitations.map((citation) => [
            citation.title,
            { medicalRecordId: citation.medicalRecordId, title: citation.title },
          ])
        ).values()
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          messageId: result.messageId,
          content: result.content,
          citations: uniqueCitations,
        },
        message: "Message sent successfully",
      }, req);
    }
    catch (err) {
      logger.error("Send patient conversation message failed", {
        traceId: req.traceId,
        method: "sendPatientConversationMessage.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to send patient conversation message",
      }, req);
    }
  }

  public static async updatePatientConversationTitle(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId, conversationId } = req.params as unknown as { patientId: string; conversationId: string };
      const { organizationId, userId } = req.user!;
      const { title } = req.body as UpdateConversationTitleSchema;

      const conversation = await prisma.patientChatConversation.findFirst({
        where: {
          id: conversationId,
          patientId,
          doctorId: userId,
          organizationId: organizationId!,
        },
      });

      if (!conversation) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Conversation not found",
        }, req);
      }

      const [updated] = await Promise.all([
        prisma.patientChatConversation.update({
          where: { id: conversationId },
          data: { title },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient conversation title updated`,
          metadata: {
            patientId,
            conversationId,
            newTitle: title,
            action: "update",
          },
          priority: Priority.LOW,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: updated,
        message: "Conversation title updated successfully",
      }, req);
    }
    catch (err) {
      logger.error("Update patient conversation title failed", {
        traceId: req.traceId,
        method: "updatePatientConversationTitle.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to update patient conversation title",
      }, req);
    }
  }
}

export default DoctorController;
