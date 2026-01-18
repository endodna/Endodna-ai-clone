import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import {
  Status,
  UserType as PrismaUserType,
  Priority,
  User,
  DNAResultStatus,
} from "@prisma/client";
import { UserResponse } from "@supabase/supabase-js";
import { AuthenticatedRequest, StatusCode, TempusActions, UserType } from "../types";
import { buildRedisSession } from "../helpers/misc.helper";
import { REFRESH_TOKEN_KEY, SESSION_KEY, DEFAULT_ORG_SLUG } from "../utils/constants";
import redis from "../lib/redis";
import { logger } from "../helpers/logger.helper";
import tempusService from "./tempus.service";
import { encryptRefreshToken, encryptSessionData } from "../helpers/encryption.helper";

export interface CreateUserParams {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  userType: PrismaUserType;
  organizationId: number;
  userId: string;
  status: Status;
  managingDoctorId?: string;
  gender?: string;
  bloodType?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  workPhoneNumber?: string;
  homePhoneNumber?: string;
  traceId?: string;
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
  message?: string;
}

export interface CreateUserAuditLogParams {
  userId: string;
  description: string;
  metadata: Record<string, any>;
  priority: Priority;
}

export class UserService {
  public static async createUser(
    params: CreateUserParams,
  ): Promise<CreateUserResult> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        middleName,
        userType,
        organizationId,
        userId,
        managingDoctorId,
        gender,
        bloodType,
        dateOfBirth,
        phoneNumber,
        workPhoneNumber,
        homePhoneNumber,
        status,
      } = params;

      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          slug: true,
          createdBy: true,
          createdByAdmin: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!organization) {
        return {
          success: false,
          error: "InvalidOrganization",
          message: "Organization not found",
        };
      }

      const existingUser = await prisma.user.findFirst({
        where: { email },
      });

      if (existingUser) {
        return {
          success: false,
          error: "UserEmailAlreadyExists",
          message: "User with this email already exists",
        };
      }

      const existingAdmin = await prisma.admin.findFirst({
        where: { email },
      });

      if (existingAdmin) {
        return {
          success: false,
          error: "AdminEmailAlreadyExists",
          message: "Admin with this email already exists",
        };
      }

      const invitedBy = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      let newSupabaseUser: UserResponse | null = null;
      if (password) {
        newSupabaseUser = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            userType: userType.toString(),
            organizationId,
            firstName,
            lastName,
            middleName,
            status,
            organization: {
              id: organization.uuid,
              name: organization.name,
              email: organization.createdByAdmin?.email,
            },
            invitedBy: {
              ...invitedBy,
            },
          }
        });
      } else {
        const idDomainUrl = process.env.ID_DOMAIN_URL || "https://id.bios.med";
        const orgSlug = organization.slug || "";
        const inviteUrl = orgSlug
          ? `${idDomainUrl}/auth/accept-invitation?org=${orgSlug}&token={token}`
          : `${idDomainUrl}/auth/accept-invitation?token={token}`;

        newSupabaseUser = await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: inviteUrl,
          data: {
            userType: userType.toString(),
            organizationId,
            firstName,
            lastName,
            middleName,
            status,
            organization: {
              id: organization.uuid,
              name: organization.name,
              email: organization.createdByAdmin?.email,
              slug: organization.slug,
            },
            invitedBy: {
              ...invitedBy,
            },
          },
        });
      }

      if (!newSupabaseUser.data.user?.id) {
        return {
          success: false,
          error: newSupabaseUser.error?.code || "FailedToCreateUser",
          message: "Failed to create user in Supabase",
        };
      }

      const newUserId = newSupabaseUser.data.user.id;

      await prisma.user.create({
        data: {
          id: newUserId,
          firstName,
          lastName,
          middleName,
          email,
          userType,
          managingDoctorId,
          gender,
          bloodType,
          dateOfBirth,
          phoneNumber,
          workPhoneNumber,
          homePhoneNumber,
        },
      });

      if (organization) {
        await prisma.organizationUser.create({
          data: {
            organizationId: organization.id,
            userId: newUserId,
            userType,
            status: Status.ACTIVE,
          },
        });
      }

      if (userType === PrismaUserType.PATIENT && managingDoctorId) {
        await prisma.patientDoctor.create({
          data: {
            patientId: newUserId,
            doctorId: managingDoctorId!,
            status: Status.ACTIVE,
          },
        });
      }

      return {
        success: true,
        userId: newUserId,
        message: "User created successfully",
      };
    } catch (error) {
      logger.error("Error creating user", {
        traceId: params.traceId,
        error: error,
        method: "UserService.createUser",
      });
      return {
        success: false,
        error: "InternalServerError",
        message: "Failed to create user",
      };
    }
  }

  public static async createOrganizationAdmin(
    params: Omit<CreateUserParams, "userType">,
  ): Promise<CreateUserResult> {
    return this.createUser({
      ...params,
      userType: PrismaUserType.ADMIN,
    });
  }

  public static async createDoctor(
    params: Omit<CreateUserParams, "userType">,
  ): Promise<CreateUserResult> {
    return this.createUser({
      ...params,
      userType: PrismaUserType.DOCTOR,
    });
  }

  public static async createPatient(
    params: Omit<CreateUserParams, "userType">,
  ): Promise<CreateUserResult> {
    return this.createUser({
      ...params,
      userType: PrismaUserType.PATIENT,
    });
  }

  public static async createUserAuditLog(
    params: CreateUserAuditLogParams,
  ): Promise<void> {
    await prisma.userAuditLog.create({
      data: {
        ...params,
      },
    });
  }

  public static async completeUserLogin({
    accessToken,
    refreshToken,
    req,
  }: {
    accessToken: string;
    refreshToken?: string;
    req: AuthenticatedRequest;
  }): Promise<{
    status?: StatusCode;
    error?: boolean;
    message?: string;
    user?: Partial<User> & {
      organizationUsers?: Array<{
        organizationId: number;
        organization: {
          id: number;
          uuid: string;
          slug: string | null;
        };
      }>;
    };
    organizationSlug?: string | null;
    organizationId?: number;
    accessToken?: string;
  }> {
    const claims = await supabase.auth.getClaims(accessToken);
    if (claims.error || !claims?.data?.claims?.session_id) {
      return {
        status: StatusCode.BAD_REQUEST,
        error: true,
        message: "Invalid credentials",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: claims.data?.claims?.sub,
      },
      select: {
        id: true,
        email: true,
        status: true,
        isPasswordSet: true,
        firstName: true,
        lastName: true,
        middleName: true,
        photo: true,
        userType: true,
        organizationUsers: {
          select: {
            organizationId: true,
            organization: {
              select: {
                id: true,
                uuid: true,
                slug: true,
                isLicensee: true,
                parentOrganizationId: true,
              },
            },
          },
        },
      },
    });
    if (!user) {
      return {
        status: StatusCode.BAD_REQUEST,
        error: true,
        message: "Invalid credentials",
      };
    }

    const checkSession = await prisma.userSession.findUnique({
      where: {
        sessionId: claims.data?.claims?.session_id,
      },
    });

    const organizationId = user.organizationUsers[0]?.organization.id;
    const userOrganizationId = user.organizationUsers[0]?.organizationId;
    const parentOrganizationId = user.organizationUsers[0]?.organization?.parentOrganizationId;

    let organizationSlug = user.organizationUsers[0]?.organization?.slug || DEFAULT_ORG_SLUG;
    if (parentOrganizationId) {
      const parentOrganization = await prisma.organization.findUnique({
        where: { id: parentOrganizationId },
        select: { slug: true },
      });
      if (parentOrganization?.slug) {
        organizationSlug = parentOrganization.slug;
      }
    }

    if (checkSession) {
      user.organizationUsers = [];
      return {
        user,
        organizationSlug,
        organizationId: userOrganizationId,
        status: StatusCode.OK,
        error: false,
        message: "Session already exists",
      };
    }

    const ttl = claims.data?.claims.exp - Math.floor(Date.now() / 1000);
    const sessionId = claims?.data?.claims?.session_id;

    if (!organizationId) {
      return {
        status: StatusCode.BAD_REQUEST,
        error: true,
        message: "User is not associated with an organization",
      };
    }

    const session = buildRedisSession({
      userType: user.userType as UserType,
      userId: user.id,
      sessionId,
      isPasswordSet: user.isPasswordSet,
      organizationId: organizationId,
      transferCompleted: false,
      parentOrganizationId: user.organizationUsers[0]?.organization?.parentOrganizationId,
      isLicenseeOrganization: user.organizationUsers[0]?.organization?.isLicensee,
    });

    const encryptedSession = encryptSessionData(session);
    if (refreshToken) {
      const encryptedRefreshToken = encryptRefreshToken(refreshToken);
      await redis.set(REFRESH_TOKEN_KEY(sessionId), encryptedRefreshToken, ttl);
    }
    await redis.set(SESSION_KEY(sessionId), encryptedSession, ttl);

    user.organizationUsers = [];
    try {
      await Promise.all([
        prisma.userSession.create({
          data: {
            userId: user.id,
            sessionId,
          },
        }),
        prisma.userLogin.create({
          data: {
            userId: user.id,
            ip: req.ip,
            appVersion: req.headers["user-agent"],
          },
        }),
        prisma.userAuditLog.create({
          data: {
            userId: user.id,
            description: "User logged in",
            priority: Priority.HIGH,
          },
        }),
      ]);
    } catch (error) {
      logger.error("Error creating user session", {
        traceId: req.traceId,
        error: error,
        method: "UserService.completeUserLogin",
      });
      return {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: "Failed to create user session",
      };
    }

    return {
      user,
      organizationSlug,
      organizationId: userOrganizationId,
      status: StatusCode.OK,
      error: false,
      message: "Login successful",
    };
  }

  public static async registerPatientDNAKit(params: {
    barcode: string;
    patientId: string;
    organizationId: number;
    adminId?: string;
    traceId?: string;
  }): Promise<{
    success: boolean;
    dnaResultKitId?: string;
    dnaResultKitPrimaryId?: number;
    error?: string;
    message?: string;
  }> {
    try {
      const { barcode, patientId, organizationId, traceId, adminId } = params;

      const existingKit = await prisma.patientDNAResultKit.findFirst({
        where: {
          barcode: {
            equals: barcode,
            mode: "insensitive",
          },
          deletedAt: null,
        },
      });

      if (existingKit) {
        if (existingKit.patientId) {
          logger.info("DNA kit already linked to a patient", {
            traceId,
            dnaResultKitId: existingKit.id,
            barcode,
            existingPatientId: existingKit.patientId,
            requestedPatientId: patientId,
            method: "UserService.registerPatientDNAKit",
          });

          return {
            success: false,
            error: "DNA Kit already registered",
            message: "DNA kit is already linked to a patient",
          };
        }

        const updatedKit = await prisma.patientDNAResultKit.update({
          where: {
            id: existingKit.id,
          },
          data: {
            patientId,
            organizationId,
          },
        });

        await prisma.patientDNAResultActivity.create({
          data: {
            patientDNAResultId: updatedKit.id,
            activity: "Kit registered",
            status: DNAResultStatus.KIT_REGISTERED,
            metadata: {
              barcode,
              patientId,
              organizationId,
            },
          },
        });

        await tempusService.setKitStatus({
          action: TempusActions.PROCESS,
          sampleId: barcode,
          organizationId,
          traceId,
          adminId,
        });

        await prisma.patientDNAResultActivity.create({
          data: {
            patientDNAResultId: updatedKit.id,
            activity: "Kit sent to processing",
            status: DNAResultStatus.PROCESS,
            metadata: {
              barcode,
              patientId,
              organizationId,
            },
          },
        });

        logger.info("Updated existing DNA result kit with patient ID", {
          traceId,
          dnaResultKitId: updatedKit.id,
          barcode,
          patientId,
          organizationId,
          method: "UserService.registerPatientDNAKit",
        });

        return {
          success: true,
          dnaResultKitId: updatedKit.uuid,
          message: "DNA kit registered successfully",
        };
      }

      const newKit = await prisma.patientDNAResultKit.create({
        data: {
          barcode,
          patientId,
          organizationId,
          status: DNAResultStatus.KIT_REGISTERED,
          isProcessed: false,
          isFailedProcessing: false,
          fileMetadata: {},
        },
      });

      await prisma.patientDNAResultActivity.create({
        data: {
          patientDNAResultId: newKit.id,
          activity: "Kit registered",
          status: DNAResultStatus.KIT_REGISTERED,
          metadata: {
            barcode,
            patientId,
            organizationId,
          },
        },
      });

      logger.info("Created new DNA result kit", {
        traceId,
        dnaResultKitId: newKit.id,
        barcode,
        patientId,
        organizationId,
        method: "UserService.registerPatientDNAKit",
      });

      return {
        success: true,
        dnaResultKitId: newKit.uuid,
        dnaResultKitPrimaryId: newKit.id,
        message: "DNA kit registered successfully",
      };
    } catch (error) {
      logger.error("Error registering patient DNA kit", {
        traceId: params.traceId,
        error: error,
        method: "UserService.registerPatientDNAKit",
      });
      return {
        success: false,
        error: "InternalServerError",
        message: "Failed to register DNA kit",
      };
    }
  }
}
