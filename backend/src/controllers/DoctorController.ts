
import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { logger } from "../helpers/logger.helper";
import {
  CreatePatientActiveMedicationSchema,
  CreatePatientSchema,
  GetPatientsSchema,
  CreatePatientMedicalRecordSchema,
  SendPatientMessageSchema,
  UpdateConversationTitleSchema,
  RegisterPatientDNAKitSchema,
  CreatePatientChartNoteSchema,
  UpdatePatientChartNoteSchema,
  ChartNoteIdParamsSchema,
  MedicationIdParamsSchema,
  CreatePatientAllergySchema,
  UpdatePatientAllergySchema,
  CreatePatientAlertSchema,
  UpdatePatientAlertSchema,
  CreateAlertOrAllergyParamsSchema,
  UpdateAlertOrAllergyParamsSchema,
  DeleteAlertOrAllergyParamsSchema,
  CreateGeneralConversationSchema,
  SendGeneralMessageSchema,
  GeneralConversationIdParamsSchema,
  CreatePatientAddressSchema,
  UpdatePatientAddressSchema,
  AddressIdParamsSchema,
  PatientIdParamsSchema,
  DnaKitResultIdParamsSchema,
  UpdatePatientGeneticsStatusSchema,
  GetReportsSchema,
  CreateReportSchema,
  UpdateReportSchema,
  ReportIdParamsSchema,
  UpdatePatientInfoSchema,
} from "../schemas";
import { UserService } from "../services/user.service";
import {
  DNAResultStatus,
  Priority,
  Status,
  UserType as PrismaUserType,
  User,
  Prisma,
  MedicalRecordType,
  OrderType,
  PatientAddress,
  PaymentStatus,
  Gender,
} from "@prisma/client";
import PaginationHelper from "../helpers/pagination.helper";
import { prisma } from "../lib/prisma";
import s3Helper from "../helpers/aws/s3.helper";
import ragHelper from "../helpers/llm/rag.helper";
import { buildOrganizationUserFilter } from "../helpers/organization-user.helper";
import { generateOrderId } from "../helpers/misc.helper";
import patientChatHelper from "../helpers/llm/patient-chat.helper";
import generalChatHelper from "../helpers/llm/general-chat.helper";
import { ChatType } from "@prisma/client";
import tempusService from "../services/tempus.service";
import emailHelper from "../helpers/email.helper";
import { TempusActions } from "../types";
import { markPatientInfoOutdated } from "../helpers/patient-info.helper";

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
        workPhone,
        homePhone,
        bloodType,
      } = req.body as CreatePatientSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        gender,
        bloodType,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        phoneNumber,
        workPhoneNumber: workPhone,
        homePhoneNumber: homePhone,
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
          id: result.userId,
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
      const { page, limit } = PaginationHelper.parseQueryParams(
        req.query,
      );
      const { organizationId } = req.user!;
      const { search, doctorId, status } = req.query as GetPatientsSchema;

      const whereConditions: Prisma.UserWhereInput[] = [
        buildOrganizationUserFilter(organizationId!, {
          userType: PrismaUserType.PATIENT,
        }),
      ];

      if (search) {
        whereConditions.push({
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
        });
      }

      if (doctorId) {
        whereConditions.push({
          managingDoctorId: doctorId,
        });
      }

      if (status) {
        const statusValues = Object.values(Status);
        const dnaResultStatusValues = Object.values(DNAResultStatus);
        const isStatusEnum = statusValues.includes(status as Status);
        const isDNAResultStatusEnum = dnaResultStatusValues.includes(
          status as DNAResultStatus,
        );

        const statusOrConditions: Prisma.UserWhereInput[] = [];

        if (isStatusEnum) {
          statusOrConditions.push({
            status: status as Status,
          });
        }

        if (isDNAResultStatusEnum) {
          statusOrConditions.push({
            patientDNAResults: {
              some: {
                status: status as DNAResultStatus,
                organizationId: organizationId!,
                deletedAt: null,
              },
            },
          });
        }

        if (statusOrConditions.length > 0) {
          whereConditions.push({
            AND: statusOrConditions,
          });
        }
      }

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
            dateOfBirth: true,
            gender: true,
            email: true,
            phoneNumber: true,
            workPhoneNumber: true,
            homePhoneNumber: true,
            patientInfo: {
              select: {
                id: true,
                weight: true,
                height: true,
                bloodType: true,
                bmi: true,
                age: true,
                prefilledData: true,
              },
            },
            patientDNAResults: {
              where: {
                deletedAt: null,
              },
              select: {
                uuid: true,
                status: true,
                updatedAt: true,
              },
            },
            patientGoals: {
              where: {
                deletedAt: null,
              },
              select: {
                uuid: true,
                description: true,
              },
            },
            patientActivities: {
              where: {
                deletedAt: null,
              },
              select: {
                uuid: true,
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
            AND: whereConditions,
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
          items: result.data.map((patient: any) => ({
            ...patient,
            patientDNAResults: patient.patientDNAResults?.map((result: any) => ({
              ...result,
              id: result.uuid,
            })) || [],
            patientGoals: patient.patientGoals?.map((goal: any) => ({
              ...goal,
              id: goal.uuid,
            })) || [],
            patientActivities: patient.patientActivities?.map((activity: any) => ({
              ...activity,
              id: activity.uuid,
            })) || [],
          })),
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
          dateOfBirth: true,
          gender: true,
          bloodType: true,
          patientInfo: {
            select: {
              id: true,
              weight: true,
              height: true,
              bloodType: true,
              bmi: true,
              prefilledData: true,
            },
          },
          patientDNAResults: {
            where: {
              deletedAt: null,
            },
            select: {
              uuid: true,
              status: true,
              updatedAt: true,
            },
          },
          patientGoals: {
            where: {
              deletedAt: null,
            },
            select: {
              uuid: true,
              description: true,
              createdAt: true,
            },
          },
          patientAllergies: {
            where: {
              deletedAt: null,
            },
            select: {
              uuid: true,
              allergen: true,
              reactionType: true,
              notes: true,
            },
          },
          patientAlerts: {
            where: {
              deletedAt: null,
            },
            select: {
              uuid: true,
              description: true,
              severity: true,
              notes: true,
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
        data: {
          ...user,
          patientDNAResults: user.patientDNAResults.map((result) => ({
            ...result,
            id: result.uuid,
          })),
          patientGoals: user.patientGoals.map((goal) => ({
            ...goal,
            id: goal.uuid,
          })),
          patientAllergies: user.patientAllergies.map((allergy) => ({
            ...allergy,
            id: allergy.uuid,
          })),
          patientAlerts: user.patientAlerts.map((alert) => ({
            ...alert,
            id: alert.uuid,
          })),
        },
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

  public static async updatePatientInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params as unknown as PatientIdParamsSchema;
      const { userId, organizationId } = req.user!;
      const { dateOfBirth, gender, bloodType, weight, height, bmi } = req.body as UpdatePatientInfoSchema;

      const user = await prisma.user.findFirst({
        where: buildOrganizationUserFilter(organizationId!, {
          id: patientId,
          userType: PrismaUserType.PATIENT,
        }),
        select: {
          id: true,
        },
      });

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient not found",
        });
      }
      const userUpdateData: Prisma.UserUpdateInput = {};
      if (dateOfBirth !== undefined) userUpdateData.dateOfBirth = new Date(dateOfBirth);
      if (gender !== undefined) userUpdateData.gender = gender;
      if (bloodType !== undefined) userUpdateData.bloodType = bloodType;

      const patientInfoUpdateData: Prisma.PatientInfoUpdateInput = {};
      if (weight !== undefined) patientInfoUpdateData.weight = weight;
      if (height !== undefined) patientInfoUpdateData.height = height;
      if (bmi !== undefined) patientInfoUpdateData.bmi = bmi;
      if (bloodType !== undefined) patientInfoUpdateData.bloodType = bloodType;

      const updatePromises: Promise<any>[] = [];

      if (Object.keys(userUpdateData).length > 0) {
        updatePromises.push(
          prisma.user.update({
            where: {
              id: patientId,
            },
            data: userUpdateData,
          })
        );
      }

      if (Object.keys(patientInfoUpdateData).length > 0) {
        updatePromises.push(
          prisma.patientInfo.upsert({
            where: {
              patientId: patientId,
            },
            create: {
              patientId: patientId,
              organizationId: organizationId!,
              weight: weight ?? null,
              height: height ?? null,
              bmi: bmi ?? null,
              bloodType: bloodType ?? null,
            },
            update: patientInfoUpdateData,
          })
        );
      }

      await Promise.all([
        ...updatePromises,
        UserService.createUserAuditLog({
          userId: userId!,
          description: "Patient info updated",
          metadata: {
            patientId,
            updates: {
              ...(dateOfBirth && { dateOfBirth }),
              ...(gender && { gender }),
              ...(bloodType && { bloodType }),
              ...(weight && { weight }),
              ...(height && { height }),
              ...(bmi && { bmi }),
            },
            action: "update_patient_info",
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
        data: {
          updated: true,
        },
        message: "Patient info updated successfully",
      });
    } catch (err) {
      logger.error("Update patient info failed", {
        traceId: req.traceId,
        method: "updatePatientInfo.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update patient info",
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
            uuid: true,
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
        data: {
          ...result,
          id: result.uuid,
        },
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
          uuid: true,
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
        data: medications.map((med) => ({
          ...med,
          id: med.uuid,
        })),
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
      const { patientId, medicationId } = req.params as unknown as MedicationIdParamsSchema;
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
            select: {
              uuid: true,
              deletedAt: true,
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

      if (!user.patientActiveMedications.find((medication: { uuid: string; deletedAt: Date | null }) => medication.uuid === medicationId && medication.deletedAt === null)) {
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
            uuid: medicationId,
            patientId
          },
          select: {
            uuid: true,
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
            medicationId: medicationId,
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
        data: {
          ...result,
          id: result.uuid,
        },
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
      const { patientId, medicationId } = req.params as unknown as MedicationIdParamsSchema;
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
          uuid: medicationId,
          patientId,
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
            uuid: medicationId,
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
            medicationId: medicationId,
            action: "delete",
          },
          priority: Priority.HIGH,
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
        markPatientInfoOutdated({
          patientId,
          organizationId: organizationId!,
          traceId: req.traceId,
        }),
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
            id: record.uuid,
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
          uuid: true,
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
                recordId: record.uuid,
                key: fileMetadata.key,
                error: error,
              });
            }
          }

          return {
            id: record.uuid,
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

      const { userId } = req.user!;
      const result = await ragHelper.generatePatientSummary({
        patientId,
        organizationId,
        doctorId: userId,
        traceId: req.traceId,
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          summary: result.summary,
          followUpPrompts: result.followUpPrompts,
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

      const patient = await prisma.user.findFirst({
        select: {
          id: true,
          patientDNAResults: {
            where: {
              deletedAt: null,
              isProcessed: true,
            },
            select: {
              uuid: true,
              status: true,
              barcode: true,
              isProcessed: true,
              isFailedProcessing: true,
              failedProcessingReason: true,
              createdAt: true,
              updatedAt: true,
              patientDNAResultBreakdown: {
                select: {
                  snpName: true,
                  chromosome: true,
                  position: true,
                  genotype: true,
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
          userType: PrismaUserType.PATIENT
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
        data: patient.patientDNAResults.map((result) => ({
          ...result,
          id: result.uuid,
        })),
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

  public static async updatePatientGeneticsStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, dnaKitResultId } = req.params as unknown as DnaKitResultIdParamsSchema;
      const { action } = req.body as UpdatePatientGeneticsStatusSchema;
      const { userId, organizationId } = req.user!;

      const patient = await prisma.user.findFirst({
        select: {
          id: true,
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

      const dnaKit = await prisma.patientDNAResultKit.findFirst({
        where: {
          uuid: dnaKitResultId,
          patientId,
          organizationId,
          deletedAt: null,
        },
        select: {
          id: true,
          uuid: true,
          barcode: true,
          status: true,
        },
      });

      if (!dnaKit) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "DNA kit not found",
        });
      }

      if (dnaKit.status === DNAResultStatus.DATA_DELIVERED ||
        dnaKit.status === DNAResultStatus.GENOTYPING_ACCEPTED) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Cannot update status for DNA kit that has completed processing",
        });
      }

      if (!dnaKit.barcode) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "DNA kit barcode is missing",
        });
      }

      const tempusAction = action as TempusActions;
      const currentStatus = dnaKit.status;

      if (tempusAction === TempusActions.PROCESS) {
        if (currentStatus === DNAResultStatus.PROCESS) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Kit is already in PROCESS status",
          });
        }
        if (currentStatus === DNAResultStatus.CANCEL) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Cannot process a cancelled kit",
          });
        }

        if (currentStatus !== DNAResultStatus.HOLD) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Can only resume processing from HOLD status",
          });
        }
      } else if (tempusAction === TempusActions.HOLD) {
        if (currentStatus === DNAResultStatus.HOLD) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Kit is already on HOLD",
          });
        }
      } else if (tempusAction === TempusActions.CANCEL) {
        if (currentStatus === DNAResultStatus.CANCEL) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Kit is already cancelled",
          });
        }
      }

      const tempusResult = await tempusService.setKitStatus({
        action: tempusAction,
        sampleId: dnaKit.barcode,
        adminId: userId,
        organizationId: organizationId!,
        traceId: req.traceId,
      });

      if (!tempusResult.success) {
        const errorMessage = tempusResult.errorData?.message || tempusResult.error || "Failed to update kit status in Lab";
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          message: errorMessage,
        });
      }

      let mappedStatus: DNAResultStatus;
      let activityMessage: string;

      switch (tempusAction) {
        case TempusActions.HOLD:
          mappedStatus = DNAResultStatus.HOLD;
          activityMessage = "Kit status set to HOLD";
          break;
        case TempusActions.PROCESS:
          mappedStatus = DNAResultStatus.PROCESS;
          activityMessage = "Kit status set to PROCESS";
          break;
        case TempusActions.CANCEL:
          mappedStatus = DNAResultStatus.CANCEL;
          activityMessage = "Kit status set to CANCEL";
          break;
        default:
          mappedStatus = DNAResultStatus.PENDING;
          activityMessage = `Kit status updated: ${action}`;
      }

      await Promise.all([
        prisma.patientDNAResultKit.update({
          where: {
            id: dnaKit.id,
          },
          data: {
            status: mappedStatus,
            isFailedProcessing: mappedStatus === DNAResultStatus.CANCEL,
            failedProcessingReason: mappedStatus === DNAResultStatus.CANCEL
              ? "Kit processing cancelled"
              : null,
          },
        }),
        prisma.patientDNAResultActivity.create({
          data: {
            patientDNAResultId: dnaKit.id,
            activity: activityMessage,
            status: mappedStatus,
            metadata: {
              action: tempusAction,
              barcode: dnaKit.barcode,
              previousStatus: dnaKit.status,
              newStatus: mappedStatus,
              updatedBy: userId,
            },
          },
        })
      ]);

      logger.info("Patient DNA kit status updated successfully", {
        traceId: req.traceId,
        patientId,
        dnaKitResultId: dnaKit.uuid,
        barcode: dnaKit.barcode,
        action: tempusAction,
        previousStatus: dnaKit.status,
        newStatus: mappedStatus,
        method: "updatePatientGeneticsStatus.Doctor",
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: tempusResult.message || `DNA kit status updated to ${action}`,
      });
    } catch (err) {
      logger.error("Update patient genetics status failed", {
        traceId: req.traceId,
        method: "updatePatientGeneticsStatus.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update patient genetics status",
        },
        req,
      );
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
          },
          patient: {
            select: {
              id: true,
              photo: true,
              firstName: true,
              lastName: true,
            },
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

  public static async getAllPatientConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId, userId } = req.user!;

      const conversations = await prisma.patientChatConversation.findMany({
        where: {
          doctorId: userId,
          organizationId: organizationId!,
        },
        select: {
          id: true,
          type: true,
          title: true,
          createdAt: true,
          updatedAt: true,
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
            },
          },
          patient: {
            select: {
              id: true,
              photo: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: conversations,
        message: "All patient conversations retrieved successfully",
      }, req);
    } catch (err) {
      logger.error("Get all patient conversations failed", {
        traceId: req.traceId,
        method: "getAllPatientConversations.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get all patient conversations",
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

      const patient = await prisma.user.findFirst({
        where: {
          id: patientId,
          ...buildOrganizationUserFilter(organizationId!),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient not found",
        }, req);
      }

      const chatType = ChatType.GENERAL;
      const patientName = `${patient.firstName} ${patient.lastName}`.trim();
      const chatTypeDisplay = chatType.split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      let defaultTitle = `${patientName} - ${chatTypeDisplay} - ${date}`;
      if (patient.dateOfBirth) {
        const dob = new Date(patient.dateOfBirth).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        defaultTitle = `${patientName} (DOB: ${dob}) - ${chatTypeDisplay} - ${date}`;
      }

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
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
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
          citations: (message.metadata as { citations?: Array<{ medicalRecordId: string; title: string | null }> } | null)?.citations?.map((citation) => ({
            id: citation.medicalRecordId,
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
            { id: citation.medicalRecordId, title: citation.title },
          ])
        ).values()
      );

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          messageId: result.messageId,
          content: result.content,
          followUpPrompts: result.followUpPrompts,
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

  public static async getDoctors(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId } = req.user!;

      const doctors = await prisma.user.findMany({
        where: buildOrganizationUserFilter(organizationId!, {
          OR: [
            {
              userType: PrismaUserType.DOCTOR,
            },
            {
              userType: PrismaUserType.ADMIN,
            },
          ],
        }),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
        },
        orderBy: {
          lastName: "asc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: doctors,
        message: "Doctors fetched successfully",
      });
    } catch (err) {
      logger.error("Get doctors failed", {
        traceId: req.traceId,
        method: "getDoctors.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get doctors",
        },
        req,
      );
    }
  }

  public static async registerPatientDNAKit(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { patientId } = req.params;
      const { organizationId, userId } = req.user!;
      const { barcode, orderType, addressId, reportId } = req.body as RegisterPatientDNAKitSchema;

      const patient = await prisma.user.findFirst({
        where: {
          id: patientId,
          organizationUsers: {
            some: {
              organizationId: organizationId!,
              userType: PrismaUserType.PATIENT,
            },
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!patient) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient not found",
        });
      }

      let address: PatientAddress | null = null;

      const report = await prisma.report.findFirst({
        where: {
          id: reportId,
          organizationId: organizationId!,
          deletedAt: null,
        },
      });

      if (!report) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Report not found",
        });
      }

      if (orderType === OrderType.PATIENT_SELF_PURCHASE || orderType === OrderType.SHIP_DIRECTLY_TO_PATIENT) {
        address = await prisma.patientAddress.findFirst({
          where: {
            id: addressId,
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
        });

        if (!address) {
          return sendResponse(res, {
            status: StatusCode.NOT_FOUND,
            error: true,
            message: "Address not found",
          });
        }
      }

      const result = await UserService.registerPatientDNAKit({
        barcode,
        patientId,
        organizationId: organizationId!,
        traceId: req.traceId,
        adminId: userId,
      });


      if (!result.success) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: result.error || "Failed to register DNA kit",
        });
      }

      const order = await prisma.patientOrder.create({
        data: {
          patientId,
          organizationId: organizationId!,
          dnaKitResultId: result.dnaResultKitPrimaryId,
          orderId: generateOrderId(),
          orderType,
          addressId: address?.id,
          totalPrice: report.price,
          status: orderType === OrderType.PATIENT_SELF_PURCHASE ? Status.PENDING : Status.ACTIVE,
          paymentStatus: orderType === OrderType.PATIENT_SELF_PURCHASE ? PaymentStatus.PENDING : PaymentStatus.PAID,
        },
      })
      const patientReport = await prisma.patientReport.create({
        data: {
          patientId,
          doctorId: userId,
          organizationId: organizationId!,
          reportId: report.id,
          orderId: order.id,
          price: report.price,
          isPrimary: true,
          status: orderType === OrderType.PATIENT_SELF_PURCHASE ? Status.PENDING : Status.ACTIVE,
        },
      })

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Patient DNA kit registration",
        metadata: {
          patientId,
          barcode,
          order,
          patientReport,
          dnaResultKitId: result.dnaResultKitId,
        },
        priority: Priority.MEDIUM,
      });

      if (orderType === OrderType.PATIENT_SELF_PURCHASE) {
        try {
          await emailHelper.sendNotificationEmail(
            patient.email!,
            "DNA Kit Registration - Check Your Portal",
            `Hello ${patient.firstName || "Patient"},

Your DNA kit has been successfully registered. Please check your patient portal to view the details and complete any necessary steps.

Kit Barcode: ${barcode}
Order ID: ${order.orderId}

If you have any questions, please contact our support team.

Best regards,
The BiosAI Team`,
            undefined,
            undefined,
            req.traceId,
          );

          logger.info("Email notification sent for patient self purchase", {
            traceId: req.traceId,
            patientId,
            email: patient.email,
            orderId: order.orderId,
            method: "registerPatientDNAKit.Doctor",
          });
        } catch (emailError) {
          logger.error("Failed to send email notification for patient self purchase", {
            traceId: req.traceId,
            patientId,
            email: patient.email,
            error: emailError,
            method: "registerPatientDNAKit.Doctor",
          });
        }
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          dnaResultKitId: result.dnaResultKitId,
          orderId: order.orderId,
          patientReportId: patientReport.id,
        },
        message: result.message || "DNA kit registered successfully",
      });
    } catch (err) {
      logger.error("Register patient DNA kit failed", {
        traceId: req.traceId,
        method: "registerPatientDNAKit.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to register DNA kit",
        },
        req,
      );
    }
  }

  public static async createPatientChartNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
      const { title, content } = req.body as CreatePatientChartNoteSchema;
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
        prisma.patientChartNote.create({
          data: {
            title: title || null,
            content,
            patientId,
            doctorId: userId!,
            organizationId: organizationId!,
          },
          select: {
            uuid: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient chart note created${title ? `: ${title}` : ""}`,
          metadata: {
            patientId,
            action: "create",
            title: title || null,
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
        data: {
          ...result,
          id: result.uuid,
        },
        message: "Patient chart note created successfully",
      });
    } catch (err) {
      logger.error("Create patient chart note failed", {
        traceId: req.traceId,
        method: "createPatientChartNote.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create patient chart note",
        },
        req,
      );
    }
  }

  public static async updatePatientChartNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, chartNoteId } = req.params as unknown as ChartNoteIdParamsSchema;
      const { title, content } = req.body as UpdatePatientChartNoteSchema;
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

      const chartNote = await prisma.patientChartNote.findFirst({
        where: {
          uuid: chartNoteId,
          patientId,
          organizationId: organizationId!,
          deletedAt: null,
        },
      });

      if (!chartNote) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient chart note not found",
        });
      }

      const [result] = await Promise.all([
        prisma.patientChartNote.update({
          where: {
            uuid: chartNoteId,
          },
          data: {
            title: title !== undefined ? (title || null) : undefined,
            content,
          },
          select: {
            uuid: true,
            title: true,
            content: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient chart note updated${title ? `: ${title}` : ""}`,
          metadata: {
            patientId,
            chartNoteId: chartNoteId,
            action: "update",
            title: title || null,
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
        data: {
          ...result,
          id: result.uuid,
        },
        message: "Patient chart note updated successfully",
      });
    } catch (err) {
      logger.error("Update patient chart note failed", {
        traceId: req.traceId,
        method: "updatePatientChartNote.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update patient chart note",
        },
        req,
      );
    }
  }

  public static async deletePatientChartNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, chartNoteId } = req.params as unknown as ChartNoteIdParamsSchema;
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

      const chartNote = await prisma.patientChartNote.findFirst({
        where: {
          uuid: chartNoteId,
          patientId,
          organizationId: organizationId!,
          deletedAt: null,
        },
      });

      if (!chartNote) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Patient chart note not found",
        });
      }

      await Promise.all([
        prisma.patientChartNote.update({
          where: {
            uuid: chartNoteId,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient chart note deleted${chartNote.title ? `: ${chartNote.title}` : ""}`,
          metadata: {
            patientId,
            chartNoteId: chartNoteId,
            action: "delete",
            title: chartNote.title || null,
          },
          priority: Priority.HIGH,
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
        message: "Patient chart note deleted successfully",
      });
    } catch (err) {
      logger.error("Delete patient chart note failed", {
        traceId: req.traceId,
        method: "deletePatientChartNote.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to delete patient chart note",
        },
        req,
      );
    }
  }

  public static async getPatientChartNotes(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
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

      const chartNotes = await prisma.patientChartNote.findMany({
        where: {
          patientId,
          organizationId: organizationId!,
          deletedAt: null,
        },
        select: {
          uuid: true,
          title: true,
          content: true,
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: chartNotes.map((note) => ({
          ...note,
          id: note.uuid,
        })),
        message: "Patient chart notes fetched successfully",
      });
    } catch (err) {
      logger.error("Get patient chart notes failed", {
        traceId: req.traceId,
        method: "getPatientChartNotes.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch patient chart notes",
        },
        req,
      );
    }
  }


  public static async createPatientAlertAndAllergy(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, type } = req.params as unknown as CreateAlertOrAllergyParamsSchema;
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

      if (type === "allergy") {
        const { allergen, reactionType, severity, notes } = req.body as CreatePatientAllergySchema;

        const [result] = await Promise.all([
          prisma.patientAllergy.create({
            data: {
              allergen,
              reactionType: reactionType || null,
              severity: severity || null,
              notes: notes || null,
              patientId,
              organizationId: organizationId!,
            },
            select: {
              uuid: true,
              allergen: true,
              reactionType: true,
              severity: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient allergy created: ${allergen}`,
            metadata: {
              patientId,
              action: "create",
              allergen,
            },
            priority: Priority.MEDIUM,
          }),
        ]);

        await ragHelper.invalidatePatientSummaryCache(
          organizationId!,
          patientId,
          req.traceId,
        );

        return sendResponse(res, {
          status: StatusCode.OK,
          data: {
            ...result,
            id: result.uuid,
          },
          message: "Patient allergy created successfully",
        });
      } else {
        const { description, severity, notes } = req.body as CreatePatientAlertSchema;

        const [result] = await Promise.all([
          prisma.patientAlert.create({
            data: {
              description,
              severity: severity || null,
              notes: notes || null,
              patientId,
              organizationId: organizationId!,
            },
            select: {
              uuid: true,
              description: true,
              severity: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient alert created: ${description}`,
            metadata: {
              patientId,
              action: "create",
              description,
            },
            priority: Priority.MEDIUM,
          }),
        ]);

        await ragHelper.invalidatePatientSummaryCache(
          organizationId!,
          patientId,
          req.traceId,
        );

        return sendResponse(res, {
          status: StatusCode.OK,
          data: {
            ...result,
            id: result.uuid,
          },
          message: "Patient alert created successfully",
        });
      }
    } catch (err) {
      logger.error("Create patient alert/allergy failed", {
        traceId: req.traceId,
        method: "createPatientAlertAndAllergy.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create patient alert/allergy",
        },
        req,
      );
    }
  }

  public static async getPatientAlertsAndAllergies(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params as unknown as { patientId: string };
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

      const [allergies, alerts] = await Promise.all([
        prisma.patientAllergy.findMany({
          where: {
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
          select: {
            uuid: true,
            allergen: true,
            reactionType: true,
            severity: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.patientAlert.findMany({
          where: {
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
          select: {
            uuid: true,
            description: true,
            severity: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          allergies: allergies.map((allergy) => ({
            ...allergy,
            id: allergy.uuid,
          })),
          alerts: alerts.map((alert) => ({
            ...alert,
            id: alert.uuid,
          })),
        },
        message: "Patient alerts and allergies fetched successfully",
      });
    } catch (err) {
      logger.error("Get patient alerts and allergies failed", {
        traceId: req.traceId,
        method: "getPatientAlertsAndAllergies.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch patient alerts and allergies",
        },
        req,
      );
    }
  }

  public static async updatePatientAlertAndAllergy(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, alertId, type } = req.params as unknown as UpdateAlertOrAllergyParamsSchema;
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

      if (type === "allergy") {
        const allergy = await prisma.patientAllergy.findFirst({
          where: {
            uuid: alertId,
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
        });

        if (!allergy) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Patient allergy not found",
          });
        }

        const { allergen, reactionType, severity, notes } = req.body as UpdatePatientAllergySchema;

        const updateData: Prisma.PatientAllergyUpdateInput = {};
        if (allergen !== undefined) updateData.allergen = allergen;
        if (reactionType !== undefined) updateData.reactionType = reactionType || null;
        if (severity !== undefined) updateData.severity = severity || null;
        if (notes !== undefined) updateData.notes = notes || null;

        const [result] = await Promise.all([
          prisma.patientAllergy.update({
            where: {
              uuid: alertId,
              patientId,
              organizationId: organizationId!,
            },
            data: updateData,
            select: {
              uuid: true,
              allergen: true,
              reactionType: true,
              severity: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient allergy updated: ${allergen || "N/A"}`,
            metadata: {
              patientId,
              allergyId: alertId,
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

        return sendResponse(res, {
          status: StatusCode.OK,
          data: {
            ...result,
            id: result.uuid,
          },
          message: "Patient allergy updated successfully",
        });
      } else {
        const alert = await prisma.patientAlert.findFirst({
          where: {
            uuid: alertId,
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
        });

        if (!alert) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Patient alert not found",
          });
        }

        const { description, severity, notes } = req.body as UpdatePatientAlertSchema;

        const updateData: Prisma.PatientAlertUpdateInput = {};
        if (description !== undefined) updateData.description = description;
        if (severity !== undefined) updateData.severity = severity || null;
        if (notes !== undefined) updateData.notes = notes || null;

        const [result] = await Promise.all([
          prisma.patientAlert.update({
            where: {
              uuid: alertId,
              patientId,
              organizationId: organizationId!,
            },
            data: updateData,
            select: {
              uuid: true,
              description: true,
              severity: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient alert updated: ${description || "N/A"}`,
            metadata: {
              patientId,
              alertId: alertId,
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

        return sendResponse(res, {
          status: StatusCode.OK,
          data: {
            ...result,
            id: result.uuid,
          },
          message: "Patient alert updated successfully",
        });
      }
    } catch (err) {
      logger.error("Update patient alert/allergy failed", {
        traceId: req.traceId,
        method: "updatePatientAlertAndAllergy.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update patient alert/allergy",
        },
        req,
      );
    }
  }

  public static async deletePatientAlertAndAllergy(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, alertId, type } = req.params as unknown as DeleteAlertOrAllergyParamsSchema;
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

      if (type === "allergy") {
        const allergy = await prisma.patientAllergy.findFirst({
          where: {
            uuid: alertId,
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
        });

        if (!allergy) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Patient allergy not found",
          });
        }

        await Promise.all([
          prisma.patientAllergy.update({
            where: {
              uuid: alertId,
            },
            data: {
              deletedAt: new Date(),
            },
          }),
          UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient allergy deleted`,
            metadata: {
              patientId,
              allergyId: alertId,
              action: "delete",
            },
            priority: Priority.HIGH,
          }),
        ]);

        await ragHelper.invalidatePatientSummaryCache(
          organizationId!,
          patientId,
          req.traceId,
        );

        return sendResponse(res, {
          status: StatusCode.OK,
          data: {
            deletedAt: new Date(),
          },
          message: "Patient allergy deleted successfully",
        });
      } else {
        const alert = await prisma.patientAlert.findFirst({
          where: {
            uuid: alertId,
            patientId,
            organizationId: organizationId!,
            deletedAt: null,
          },
        });

        if (!alert) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Patient alert not found",
          });
        }

        await Promise.all([
          prisma.patientAlert.update({
            where: {
              uuid: alertId,
            },
            data: {
              deletedAt: new Date(),
            },
          }),
          UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient alert deleted`,
            metadata: {
              patientId,
              alertId: alertId,
              action: "delete",
            },
            priority: Priority.HIGH,
          }),
        ]);

        await ragHelper.invalidatePatientSummaryCache(
          organizationId!,
          patientId,
          req.traceId,
        );

        return sendResponse(res, {
          status: StatusCode.OK,
          data: {
            deletedAt: new Date(),
          },
          message: "Patient alert deleted successfully",
        });
      }
    } catch (err) {
      logger.error("Delete patient alert/allergy failed", {
        traceId: req.traceId,
        method: "deletePatientAlertAndAllergy.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to delete patient alert/allergy",
        },
        req,
      );
    }
  }

  public static async getGeneralConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId, userId } = req.user!;

      const conversations = await prisma.generalChatConversation.findMany({
        where: {
          doctorId: userId,
          organizationId: organizationId!,
        },
        select: {
          id: true,
          type: true,
          title: true,
          createdAt: true,
          updatedAt: true,
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
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: conversations,
        message: "General conversations retrieved successfully",
      }, req);
    } catch (err) {
      logger.error("Get general conversations failed", {
        traceId: req.traceId,
        method: "getGeneralConversations.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get general conversations",
      }, req);
    }
  }

  public static async createGeneralConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId, userId } = req.user!;
      const { title } = req.body as CreateGeneralConversationSchema;

      const chatType = ChatType.GENERAL;
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const defaultTitle = title || `General Chat - ${date}`;

      const [conversation] = await Promise.all([
        prisma.generalChatConversation.create({
          data: {
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
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `General conversation created: ${chatType}`,
          metadata: {
            chatType,
            action: "create",
          },
          priority: Priority.LOW,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.CREATED,
        data: conversation,
        message: "General conversation created successfully",
      }, req);
    } catch (err) {
      logger.error("Create general conversation failed", {
        traceId: req.traceId,
        method: "createGeneralConversation.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to create general conversation",
      }, req);
    }
  }

  public static async getGeneralConversationMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params as unknown as GeneralConversationIdParamsSchema;
      const { organizationId, userId } = req.user!;

      const conversation = await prisma.generalChatConversation.findFirst({
        where: {
          id: conversationId,
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

      const messages = await prisma.generalChatMessage.findMany({
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
        })),
        message: "General conversation messages retrieved successfully",
      }, req);
    } catch (err) {
      logger.error("Get general conversation messages failed", {
        traceId: req.traceId,
        method: "getGeneralConversationMessages.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get general conversation messages",
      }, req);
    }
  }

  public static async sendGeneralConversationMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params as unknown as GeneralConversationIdParamsSchema;
      const { organizationId, userId } = req.user!;
      const { message } = req.body as SendGeneralMessageSchema;

      const conversation = await prisma.generalChatConversation.findFirst({
        where: {
          id: conversationId,
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

      const result = await generalChatHelper.sendMessage({
        conversationId,
        doctorId: userId,
        organizationId: organizationId!,
        message,
        traceId: req.traceId,
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          messageId: result.messageId,
          content: result.content,
          followUpPrompts: result.followUpPrompts,
        },
        message: "Message sent successfully",
      }, req);
    } catch (err) {
      logger.error("Send general conversation message failed", {
        traceId: req.traceId,
        method: "sendGeneralConversationMessage.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to send message",
      }, req);
    }
  }

  public static async updateGeneralConversationTitle(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params as unknown as GeneralConversationIdParamsSchema;
      const { organizationId, userId } = req.user!;
      const { title } = req.body as UpdateConversationTitleSchema;

      const conversation = await prisma.generalChatConversation.findFirst({
        where: {
          id: conversationId,
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

      const [updatedConversation] = await Promise.all([
        prisma.generalChatConversation.update({
          where: {
            id: conversationId,
          },
          data: {
            title,
          },
          select: {
            id: true,
            type: true,
            title: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `General conversation title updated`,
          metadata: {
            conversationId,
            title,
            action: "update",
          },
          priority: Priority.LOW,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: updatedConversation,
        message: "Conversation title updated successfully",
      }, req);
    } catch (err) {
      logger.error("Update general conversation title failed", {
        traceId: req.traceId,
        method: "updateGeneralConversationTitle.Doctor",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to update conversation title",
      }, req);
    }
  }

  public static async getPatientAddresses(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params as unknown as PatientIdParamsSchema;
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

      const addresses = await prisma.patientAddress.findMany({
        where: {
          patientId,
          organizationId: organizationId!,
          deletedAt: null,
        },
        select: {
          id: true,
          address: true,
          isPrimary: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { isPrimary: "desc" },
          { createdAt: "desc" },
        ],
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: addresses,
        message: "Patient addresses retrieved successfully",
      });
    } catch (err) {
      logger.error("Get patient addresses failed", {
        traceId: req.traceId,
        method: "getPatientAddresses.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch patient addresses",
        },
        req,
      );
    }
  }

  public static async createPatientAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId } = req.params as unknown as PatientIdParamsSchema;
      const { userId, organizationId } = req.user!;
      const { address, isPrimary } = req.body as CreatePatientAddressSchema;

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

      if (isPrimary) {
        await prisma.patientAddress.updateMany({
          where: {
            patientId,
            organizationId: organizationId!,
            isPrimary: true,
            deletedAt: null,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const [result] = await Promise.all([
        prisma.patientAddress.create({
          data: {
            patientId,
            organizationId: organizationId!,
            address: address as any,
            isPrimary: isPrimary || false,
          },
          select: {
            id: true,
            address: true,
            isPrimary: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient address created`,
          metadata: {
            patientId,
            action: "create",
            isPrimary: isPrimary || false,
          },
          priority: Priority.MEDIUM,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.CREATED,
        data: result,
        message: "Patient address created successfully",
      });
    } catch (err) {
      logger.error("Create patient address failed", {
        traceId: req.traceId,
        method: "createPatientAddress.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create patient address",
        },
        req,
      );
    }
  }

  public static async updatePatientAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, addressId } = req.params as unknown as AddressIdParamsSchema;
      const { userId, organizationId } = req.user!;
      const { address, isPrimary } = req.body as UpdatePatientAddressSchema;

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

      const existingAddress = await prisma.patientAddress.findFirst({
        where: {
          id: addressId,
          patientId,
          organizationId: organizationId!,
          deletedAt: null,
        },
      });

      if (!existingAddress) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient address not found",
        });
      }

      if (isPrimary === true) {
        await prisma.patientAddress.updateMany({
          where: {
            patientId,
            organizationId: organizationId!,
            isPrimary: true,
            id: { not: addressId },
            deletedAt: null,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const updateData: Prisma.PatientAddressUpdateInput = {};
      if (address !== undefined) {
        updateData.address = address as any;
      }
      if (isPrimary !== undefined) {
        updateData.isPrimary = isPrimary;
      }

      const [result] = await Promise.all([
        prisma.patientAddress.update({
          where: {
            id: addressId,
          },
          data: updateData,
          select: {
            id: true,
            address: true,
            isPrimary: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient address updated`,
          metadata: {
            patientId,
            addressId,
            action: "update",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: result,
        message: "Patient address updated successfully",
      });
    } catch (err) {
      logger.error("Update patient address failed", {
        traceId: req.traceId,
        method: "updatePatientAddress.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update patient address",
        },
        req,
      );
    }
  }

  public static async deletePatientAddress(req: AuthenticatedRequest, res: Response) {
    try {
      const { patientId, addressId } = req.params as unknown as AddressIdParamsSchema;
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

      const existingAddress = await prisma.patientAddress.findFirst({
        where: {
          id: addressId,
          patientId,
          organizationId: organizationId!,
          deletedAt: null,
        },
      });

      if (!existingAddress) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Patient address not found",
        });
      }

      await Promise.all([
        prisma.patientAddress.update({
          where: {
            id: addressId,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Patient address deleted`,
          metadata: {
            patientId,
            addressId,
            action: "delete",
          },
          priority: Priority.HIGH,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: "Patient address deleted successfully",
      });
    } catch (err) {
      logger.error("Delete patient address failed", {
        traceId: req.traceId,
        method: "deletePatientAddress.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to delete patient address",
        },
        req,
      );
    }
  }

  public static async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const { gender } = req.query as unknown as GetReportsSchema;
      const { organizationId } = req.user!;

      const where: Prisma.ReportWhereInput = {
        organizationId,
        deletedAt: null,
      };

      if (gender && gender !== Gender.ALL) {
        where.genders = {
          has: gender,
        };
      }

      const reports = await prisma.report.findMany({
        where,
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          genders: true,
          price: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: reports.map((report) => ({
          ...report,
          price: report.price.toString(),
        })),
        message: "Reports retrieved successfully",
      });
    } catch (err) {
      logger.error("Get reports failed", {
        traceId: req.traceId,
        method: "getReports.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch reports",
        },
        req,
      );
    }
  }

  public static async createReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { code, title, description, genders, price } = req.body as CreateReportSchema;
      const { userId, organizationId } = req.user!;

      const [result] = await Promise.all([
        prisma.report.create({
          data: {
            organizationId: organizationId!,
            code,
            title,
            description: description || null,
            genders,
            price: new Prisma.Decimal(price),
          },
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            genders: true,
            price: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Report created: ${title}`,
          metadata: {
            action: "create",
            code,
            title,
            genders,
            price: price.toString(),
          },
          priority: Priority.MEDIUM,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.CREATED,
        data: {
          ...result,
          price: result.price.toString(),
        },
        message: "Report created successfully",
      });
    } catch (err) {
      logger.error("Create report failed", {
        traceId: req.traceId,
        method: "createReport.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create report",
        },
        req,
      );
    }
  }

  public static async updateReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportId } = req.params as unknown as ReportIdParamsSchema;
      const { code, title, description, genders, price } = req.body as UpdateReportSchema;
      const { userId, organizationId } = req.user!;

      const existingReport = await prisma.report.findFirst({
        where: {
          id: reportId,
          organizationId: organizationId!,
          deletedAt: null,
        },
      });

      if (!existingReport) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Report not found",
        });
      }

      const updateData: Prisma.ReportUpdateInput = {};
      if (code !== undefined) updateData.code = code;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description || null;
      if (genders !== undefined) updateData.genders = genders;
      if (price !== undefined) updateData.price = new Prisma.Decimal(price);

      const [result] = await Promise.all([
        prisma.report.update({
          where: {
            id: reportId,
          },
          data: updateData,
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
            genders: true,
            price: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Report updated: ${title || existingReport.title}`,
          metadata: {
            reportId,
            action: "update",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...result,
          price: result.price.toString(),
        },
        message: "Report updated successfully",
      });
    } catch (err) {
      logger.error("Update report failed", {
        traceId: req.traceId,
        method: "updateReport.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update report",
        },
        req,
      );
    }
  }

  public static async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportId } = req.params as unknown as ReportIdParamsSchema;
      const { userId, organizationId } = req.user!;

      const existingReport = await prisma.report.findFirst({
        where: {
          id: reportId,
          organizationId: organizationId!,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!existingReport) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Report not found",
        });
      }

      await Promise.all([
        prisma.report.update({
          where: {
            id: reportId,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Report deleted: ${existingReport.title}`,
          metadata: {
            reportId,
            action: "delete",
            title: existingReport.title,
          },
          priority: Priority.HIGH,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: "Report deleted successfully",
      });
    } catch (err) {
      logger.error("Delete report failed", {
        traceId: req.traceId,
        method: "deleteReport.Doctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to delete report",
        },
        req,
      );
    }
  }
}
export default DoctorController;
