import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import {
  Status,
  UserType as PrismaUserType,
  Priority,
  User,
} from "@prisma/client";
import { UserResponse } from "@supabase/supabase-js";
import { AuthenticatedRequest, StatusCode, UserType } from "../types";
import { buildRedisSession } from "../helpers/misc.helper";
import { SESSION_KEY } from "../utils/constants";
import redis from "../lib/redis";
import { logger } from "../helpers/logger.helper";

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
  dateOfBirth?: Date;
  phoneNumber?: string;
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
        dateOfBirth,
        phoneNumber,
        status,
      } = params;

      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
        },
        select: {
          id: true,
          name: true,
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
        });
      } else {
        newSupabaseUser = await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.FRONTEND_URL}/auth/accept-invitation`,
          data: {
            userType: userType.toString(),
            organizationId,
            firstName,
            lastName,
            middleName,
            status,
            organization: {
              id: organization.id,
              name: organization.name,
              email: organization.createdByAdmin?.email,
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
          dateOfBirth,
          phoneNumber,
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
    req,
  }: {
    accessToken: string;
    req: AuthenticatedRequest;
  }): Promise<{
    status?: StatusCode;
    error?: boolean;
    message?: string;
    user?: Partial<User>;
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

    if (checkSession) {
      user.organizationUsers = [];
      return {
        user,
        status: StatusCode.OK,
        error: false,
        message: "Session already exists",
      };
    }

    const ttl = claims.data?.claims.exp - Math.floor(Date.now() / 1000);
    const sessionId = claims?.data?.claims?.session_id;

    const session = buildRedisSession({
      userType: user.userType as UserType,
      userId: user.id,
      sessionId,
      isPasswordSet: user.isPasswordSet,
      organizationId: user.organizationUsers[0].organization.id!,
    });

    await redis.set(SESSION_KEY(sessionId), session, ttl);

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
      status: StatusCode.OK,
      error: false,
      message: "Login successful",
    };
  }
}
