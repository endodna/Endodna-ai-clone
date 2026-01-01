import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { Priority, UserType as PrismaUserType, Status } from "@prisma/client";
import { CreateAdminSchema, CreateDoctorSchema, UpdateOrganizationCustomizationSchema, UpdateOrganizationNameSchema } from "../schemas";
import { UserService } from "../services/user.service";
import { logger } from "../helpers/logger.helper";
import { prisma } from "../lib/prisma";
import s3Helper from "../helpers/aws/s3.helper";
import OrganizationCustomizationHelper, { OrganizationCustomizationData } from "../helpers/organization-customization.helper";
import { supabase } from "../lib/supabase";
import { buildOrganizationUserFilter } from "../helpers/organization-user.helper";
import ragHelper from "../helpers/llm/rag.helper";

class AdminController {
  public static async createAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { email, password, firstName, lastName, middleName } =
        req.body as CreateAdminSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType: PrismaUserType.ADMIN,
        organizationId: organizationId!,
        userId: userId,
        status: Status.PENDING,
        traceId: req.traceId,
      });

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Organization admin create attempt",
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
        message: "Organization admin created successfully",
      });
    } catch (err) {
      logger.error("Create admin failed", {
        traceId: req.traceId,
        method: "createAdmin",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create organization admin",
        },
        req,
      );
    }
  }

  public static async createDoctor(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { email, password, firstName, lastName, middleName } =
        req.body as CreateDoctorSchema;

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType: PrismaUserType.DOCTOR,
        organizationId: organizationId!,
        userId: userId,
        status: Status.PENDING,
        traceId: req.traceId,
      });

      await UserService.createUserAuditLog({
        userId: userId,
        description: "Organization doctor create attempt",
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
        message: "Organization doctor created successfully",
      });
    } catch (err) {
      logger.error("Create doctor failed", {
        traceId: req.traceId,
        method: "createDoctor",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create organization doctor",
        },
        req,
      );
    }
  }

  public static async updateOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { name } = req.body as UpdateOrganizationNameSchema;

      if (!organizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization ID not found",
        });
      }

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

      if (!organization) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization not found",
        });
      }

      if (organization.parentOrganizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization name is not allowed for licensee organizations",
        });
      }

      const existingOrg = await prisma.organization.findFirst({
        where: {
          name,
          id: {
            not: organization.id,
          },
        },
      });

      if (existingOrg) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization name already exists",
        });
      }

      const [updatedOrganization] = await Promise.all([
        prisma.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            name,
          },
          select: {
            id: true,
            uuid: true,
            name: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: `Organization name updated: ${name}`,
          metadata: {
            organizationId: organization.id,
            organizationUuid: organization.uuid,
            oldName: organization.name,
            newName: name,
            action: "update_organization_name",
          },
          priority: Priority.MEDIUM,
        }),
      ]);

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...updatedOrganization,
          id: updatedOrganization.uuid,
        },
        message: "Organization name updated successfully",
      });
    } catch (err) {
      logger.error("Update organization failed", {
        traceId: req.traceId,
        method: "updateOrganization",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update organization",
        },
        req,
      );
    }
  }

  public static async updateOrganizationCustomization(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { userId, organizationId } = req.user!;
      const customizationData = req.body as UpdateOrganizationCustomizationSchema;
      const file = req.file as Express.Multer.File | undefined;

      const organizationCustomization = await prisma.organizationCustomization.findUnique({
        where: {
          organizationId: organizationId!,
        },
        select: {
          customization: true,
          organization: true,
        },
      });

      if (organizationCustomization?.organization?.parentOrganizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization customization is not allowed for licensee organizations",
        });
      }


      const existingCustomization: OrganizationCustomizationData | null = organizationCustomization?.customization
        ? OrganizationCustomizationHelper.structureCustomization(organizationCustomization.customization)
        : null;

      let logoData: OrganizationCustomizationData["logo"] | undefined;
      if (file) {
        const allowedImageTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/svg+xml",
        ];

        if (!file.mimetype.startsWith("image/") || !allowedImageTypes.includes(file.mimetype)) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Logo must be an image file (JPEG, PNG, JPG, SVG)",
          });
        }

        const maxLogoSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxLogoSize) {
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Logo file size must not exceed 2MB",
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

        if (existingCustomization?.logo?.key) {
          try {
            await s3Helper.deleteFile(
              existingCustomization.logo.bucket,
              existingCustomization.logo.key,
              req.traceId,
            );
          } catch (error) {
            logger.warn("Failed to delete old logo", {
              traceId: req.traceId,
              method: "updateOrganizationCustomization",
              error,
            });
          }
        }

        const s3Key = s3Helper.generateKey(
          `organization-logos/${organizationId}`,
          file.mimetype,
          true,
        );

        const uploadResult = await s3Helper.uploadFile({
          bucket: s3Bucket,
          key: s3Key,
          body: file.buffer,
          contentType: file.mimetype,
          metadata: {
            organizationId: organizationId!.toString(),
            uploadedBy: userId!,
            originalFilename: file.originalname,
          },
          acl: "private",
          cacheControl: "public, max-age=31536000",
          traceId: req.traceId,
        });

        logoData = OrganizationCustomizationHelper.createLogoCustomization(uploadResult);
      }

      const updates: Partial<OrganizationCustomizationData> = {
        ...(logoData && { logo: logoData }),
        ...(customizationData.primaryColor !== undefined && { primaryColor: customizationData.primaryColor }),
        ...(customizationData.secondaryColor !== undefined && { secondaryColor: customizationData.secondaryColor }),
        ...(customizationData.theme !== undefined && { theme: customizationData.theme }),
        ...(customizationData.branding !== undefined && { branding: customizationData.branding }),
        ...(customizationData.email !== undefined && { email: customizationData.email }),
        ...(customizationData.features !== undefined && { features: customizationData.features }),
      };

      const mergedCustomization = OrganizationCustomizationHelper.mergeCustomization(
        existingCustomization,
        updates,
      );

      const validation = OrganizationCustomizationHelper.validateCustomization(mergedCustomization);
      if (!validation.valid) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: validation.errors.join(", "),
        });
      }

      const [result] = await Promise.all([
        prisma.organizationCustomization.upsert({
          where: {
            organizationId: organizationId!,
          },
          create: {
            organizationId: organizationId!,
            customization: mergedCustomization as any,
          },
          update: {
            customization: mergedCustomization as any,
          },
          select: {
            customization: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        UserService.createUserAuditLog({
          userId: userId!,
          description: "Organization customization updated",
          metadata: {
            organizationId: organizationId!,
            action: "update_customization",
            updates: Object.keys(updates),
            hasLogo: !!logoData,
          },
          priority: Priority.MEDIUM,
        }),
      ]);

      const structuredCustomization = OrganizationCustomizationHelper.structureCustomization(result.customization);
      const sanitizedCustomization = OrganizationCustomizationHelper.sanitizeForResponse(structuredCustomization);

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...result,
          customization: sanitizedCustomization,
        },
        message: "Organization customization updated successfully",
      });
    } catch (err) {
      logger.error("Update organization customization failed", {
        traceId: req.traceId,
        method: "updateOrganizationCustomization",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to update organization customization",
        },
        req,
      );
    }
  }

  public static async deleteOrganizationPatients(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, organizationId } = req.user!;
      const { patientIds } = req.body as { patientIds: string[] };

      const patients = await prisma.user.findMany({
        where: buildOrganizationUserFilter(organizationId!, {
          id: {
            in: patientIds,
          },
          userType: PrismaUserType.PATIENT,
        }),
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (patients.length === 0) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "No patients found in this organization",
        });
      }

      const foundPatientIds = new Set(patients.map(p => p.id));
      const notFoundIds = patientIds.filter(id => !foundPatientIds.has(id));

      const results: Array<{
        patientId: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const patient of patients) {
        try {
          const deleteSupabaseUser = await supabase.auth.admin.deleteUser(patient.id);

          if (deleteSupabaseUser.error) {
            logger.error("Failed to delete Supabase user", {
              traceId: req.traceId,
              method: "deleteOrganizationPatients",
              patientId: patient.id,
              error: deleteSupabaseUser.error,
            });

            results.push({
              patientId: patient.id,
              success: false,
              error: "Failed to delete user from authentication system",
            });
            continue;
          }

          await Promise.all([
            prisma.user.delete({
              where: {
                id: patient.id,
              },
            }),
            ragHelper.invalidatePatientSummaryCache(
              organizationId!,
              patient.id,
              req.traceId,
            ),
          ]);

          await UserService.createUserAuditLog({
            userId: userId!,
            description: `Patient deleted: ${patient.firstName} ${patient.lastName} (${patient.email || 'No email'})`,
            metadata: {
              patientId: patient.id,
              patientEmail: patient.email,
              patientName: `${patient.firstName} ${patient.lastName}`,
              action: "delete_patient",
            },
            priority: Priority.HIGH,
          });

          results.push({
            patientId: patient.id,
            success: true,
          });
        } catch (err) {
          logger.error("Failed to delete patient", {
            traceId: req.traceId,
            method: "deleteOrganizationPatients",
            patientId: patient.id,
            error: err,
          });

          results.push({
            patientId: patient.id,
            success: false,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      const responseData: any = {
        deleted: results.filter(r => r.success).map(r => r.patientId),
        failed: results.filter(r => !r.success).map(r => ({
          patientId: r.patientId,
          error: r.error,
        })),
        notFound: notFoundIds,
        summary: {
          total: patientIds.length,
          successful: successCount,
          failed: failureCount,
          notFound: notFoundIds.length,
        },
      };

      if (failureCount > 0 || notFoundIds.length > 0) {
        return sendResponse(res, {
          status: StatusCode.OK,
          data: responseData,
          message: `Deleted ${successCount} patient(s). ${failureCount} failed, ${notFoundIds.length} not found.`,
        });
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: responseData,
        message: `Successfully deleted ${successCount} patient(s)`,
      });
    } catch (err) {
      logger.error("Delete organization patients failed", {
        traceId: req.traceId,
        method: "deleteOrganizationPatients",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to delete patients",
        },
        req,
      );
    }
  }
}

export default AdminController;
