import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { prisma } from "../lib/prisma";
import { logger } from "../helpers/logger.helper";
import { supabase } from "../lib/supabase";
import {
  Priority,
  Status,
  UserType as PrismaUserType,
  Organization,
  Prisma,
} from "@prisma/client";
import { UserType } from "../types";
import redis from "../lib/redis";
import { SESSION_KEY } from "../utils/constants";
import {
  CreateOrganizationAdminSchema,
  CreateSuperAdminSchema,
  LoginSchema,
  ProvisionOrganizationSchema,
  TriggerCronActionSchema,
} from "../schemas";
import cronService from "../services/cron/cron.service";
import { UserResponse } from "@supabase/supabase-js";
import { buildRedisSession } from "../helpers/misc.helper";
import { UserService } from "../services/user.service";
import PaginationHelper from "../helpers/pagination.helper";
import ragHelper from "../helpers/llm/rag.helper";

class SAdminController {
  public static async createSuperAdmin(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { email, password, firstName, lastName, middleName } =
        req.body as CreateSuperAdminSchema;
      const supabaseUser = await supabase.auth.admin.createUser({
        email,
        password,
      });
      if (!supabaseUser.data.user?.id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Failed to create super admin",
        });
      }
      const superAdmin = await prisma.admin.create({
        data: {
          id: supabaseUser.data.user?.id,
          firstName,
          lastName,
          middleName,
          email,
          status: Status.ACTIVE,
        },
      });

      await Promise.all([
        prisma.adminLogin.create({
          data: {
            adminId: superAdmin.id,
            ip: req.ip,
            appVersion: req.headers["user-agent"],
            metadata: {
              ip: req.ip,
              userAgent: req.headers["user-agent"],
            },
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: superAdmin.id,
            description: "Super admin created",
            priority: Priority.HIGH,
          },
        }),
      ]);
      sendResponse(res, {
        status: StatusCode.OK,
        data: superAdmin,
        message: "Super admin created successfully",
      });
    } catch (err) {
      logger.error("Create super admin failed", {
        traceId: req.traceId,
        method: "createSuperAdmin",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create super admin",
        },
        req,
      );
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body as LoginSchema;
      const supabaseUser = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!supabaseUser.data.user?.id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid credentials",
        });
      }
      const admin = await prisma.admin.findUnique({
        where: {
          id: supabaseUser.data.user?.id,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
        },
      });
      if (!admin) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid credentials",
        });
      }

      const claims = await supabase.auth.getClaims(
        supabaseUser.data.session?.access_token,
      );
      if (claims.error || !claims?.data?.claims?.session_id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid credentials",
        });
      }

      const ttl = claims.data?.claims.exp - Math.floor(Date.now() / 1000);
      const sessionId = claims?.data?.claims?.session_id;

      const session = buildRedisSession({
        userType: UserType.SUPER_ADMIN,
        userId: admin.id,
        sessionId,
      });

      await Promise.all([
        redis.set(SESSION_KEY(sessionId), session, ttl),
        prisma.adminSession.create({
          data: {
            adminId: admin.id,
            sessionId,
          },
        }),
        prisma.adminLogin.create({
          data: {
            adminId: admin.id,
            ip: req.ip,
            appVersion: req.headers["user-agent"],
          },
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            description: "Admin logged in",
            priority: Priority.HIGH,
          },
        }),
      ]);

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          token: supabaseUser.data.session?.access_token,
          admin: admin,
        },
        message: "Login successful",
      });
    } catch (err) {
      logger.error("Login failed", {
        traceId: req.traceId,
        method: "login",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to login",
        },
        req,
      );
    }
  }

  public static async provisionOrganization(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const user = req.user!;
      const { name, admin } =
        req.body as ProvisionOrganizationSchema;

      const [checkName, checkIfPrimary, checkAdminEmail, checkSuperAdminEmail] =
        await Promise.all([
          prisma.organization.findFirst({
            where: {
              name,
            },
          }),
          prisma.organization.findFirst({
            where: {
              isPrimary: true,
            },
          }),
          prisma.user.findFirst({
            where: {
              email: admin.email,
            },
          }),
          prisma.admin.findFirst({
            where: {
              email: admin.email,
            },
          }),
        ]);

      if (checkName) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "OrganizationAlreadyExists",
        });
      }

      if (checkIfPrimary) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "PrimaryOrganizationExists",
        });
      }

      if (checkAdminEmail || checkSuperAdminEmail) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "AdminEmailAlreadyExists",
        });
      }

      let newSupabaseUser: UserResponse | null = null;
      if (admin.password) {
        newSupabaseUser = await supabase.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
        });
      } else {
        newSupabaseUser = await supabase.auth.admin.inviteUserByEmail(
          admin.email,
          {
            redirectTo: `${process.env.FRONTEND_URL}/auth/accept-invitation`,
            data: {
              userType: PrismaUserType.ADMIN.toString().toLowerCase(),
              firstName: admin.firstName,
              lastName: admin.lastName,
              middleName: admin.middleName,
              email: admin.email,
            },
          },
        );
      }

      if (!newSupabaseUser.data.user?.id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: newSupabaseUser.error?.code,
          message: "FailedToCreateAdmin",
        });
      }

      const newUserId = newSupabaseUser.data.user.id;
      const [organization] = await Promise.all([
        prisma.organization.create({
          data: {
            name,
            createdBy: user?.userId,
          },
        }),
        prisma.user.create({
          data: {
            id: newUserId,
            firstName: admin.firstName,
            lastName: admin.lastName,
            middleName: admin.middleName,
            email: admin.email,
            status: Status.ACTIVE,
            userType: PrismaUserType.ADMIN,
          },
        }),
      ]);

      await Promise.all([
        prisma.adminAuditLog.create({
          data: {
            adminId: user.userId,
            description: "Organization provisioned",
            metadata: {
              body: req.body,
            },
            priority: Priority.HIGH,
          },
        }),
        prisma.organizationCustomization.create({
          data: {
            organizationId: organization.id,
          },
        }),
        prisma.organizationUser.create({
          data: {
            organizationId: organization.id,
            userId: newUserId,
            userType: PrismaUserType.ADMIN,
          },
        }),
      ]);
      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...req.body,
        },
        message: "Organization provisioned successfully",
      });
    } catch (err) {
      logger.error("Provision organization failed", {
        traceId: req.traceId,
        method: "provisionOrganization",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to provision organization",
        },
        req,
      );
    }
  }

  public static async createOrganizationAdmin(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { userId } = req.user!;
      const {
        email,
        password,
        organizationId,
        firstName,
        lastName,
        middleName,
      } = req.body as CreateOrganizationAdminSchema;

      const organization = await prisma.organization.findFirst({
        where: {
          uuid: organizationId,
        },
      });
      if (!organization) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid organization",
        });
      }

      const result = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType: PrismaUserType.ADMIN,
        organizationId: organization.id!,
        userId,
        status: Status.PENDING,
        traceId: req.traceId,
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: userId,
          description: "Organization admin create attempt",
          metadata: {
            body: req.body,
          },
          priority: Priority.HIGH,
        },
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
      logger.error("Create organization admin failed", {
        traceId: req.traceId,
        method: "createOrganizationAdmin",
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

  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { user: _user } = req;
    } catch (err) {
      logger.error("Get profile failed", {
        traceId: req.traceId,
        method: "getProfile",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get profile",
        },
        req,
      );
    }
  }

  public static async getOrganizations(
    req: AuthenticatedRequest,
    res: Response,
  ) {
    try {
      const { page, limit } = PaginationHelper.parseQueryParams(req.query);

      const result = await PaginationHelper.paginate<
        Organization,
        Prisma.OrganizationFindManyArgs
      >(
        prisma.organization,
        {
          select: {
            uuid: true,
            name: true,
            isPrimary: true,
            createdBy: true,
            createdAt: true,
            updatedAt: true,
            createdByAdmin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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
        message: "Organizations fetched successfully",
      });
    } catch (err) {
      logger.error("Get organizations failed", {
        traceId: req.traceId,
        method: "getOrganizations",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get organizations",
        },
        req,
      );
    }
  }

  public static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { user: _user } = req;
    } catch (err) {
      logger.error("Get users failed", {
        traceId: req.traceId,
        method: "getUsers",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get users",
        },
        req,
      );
    }
  }

  public static async triggerCronActions(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { action } = req.body as TriggerCronActionSchema;

      logger.info("Triggering cron action", {
        traceId: req.traceId,
        action,
        adminId: user?.userId,
        method: "triggerCronActions",
      });

      let result: { success: boolean; message: string };

      switch (action) {
        case "medicalRecords":
          cronService.triggerMedicalRecordsProcessing(req.traceId).catch((error) => {
            logger.error("Medical records processing failed", {
              traceId: req.traceId,
              action,
              error: error,
              method: "triggerCronActions",
            });
          });
          result = {
            success: true,
            message: "Medical records processing triggered successfully",
          };
          break;
        case "pendingDNAFiles":
          cronService.triggerPendingDNAFilesProcessing(req.traceId).catch((error) => {
            logger.error("Pending DNA files processing failed", {
              traceId: req.traceId,
              action,
              error: error,
              method: "triggerCronActions",
            });
          });
          result = {
            success: true,
            message: "Pending DNA files processing triggered successfully",
          };
          break;
        case "invalidateAllPatientSummaryCaches":
          ragHelper.invalidateAllPatientSummaryCaches(req.traceId).catch((error) => {
            logger.error("Invalidate all patient summary caches failed", {
              traceId: req.traceId,
              action,
              error: error,
              method: "triggerCronActions",
            });
          });
          result = {
            success: true,
            message: "Invalidate all patient summary caches triggered successfully",
          };
          break;
        default:
          return sendResponse(res, {
            status: StatusCode.BAD_REQUEST,
            error: true,
            message: "Invalid action",
          });
      }

      prisma.adminAuditLog.create({
        data: {
          adminId: user!.userId,
          description: `Cron action triggered: ${action}`,
          metadata: {
            action,
            traceId: req.traceId,
          },
          priority: Priority.MEDIUM,
        },
      }).catch((error) => {
        logger.error("Failed to create audit log", {
          traceId: req.traceId,
          error: error,
          method: "triggerCronActions",
        });
      });

      sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: result.message,
      });
    } catch (err) {
      logger.error("Trigger cron actions failed", {
        traceId: req.traceId,
        method: "triggerCronActions",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to trigger cron actions",
        },
        req,
      );
    }
  }

}

export default SAdminController;
