import { Request, Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { prisma } from "../lib/prisma";
import { supabase } from "../lib/supabase";
import { AuthenticatedRequest, StatusCode, UserType } from "../types";
import {
  REFRESH_TOKEN_KEY,
  SESSION_BLACKLIST_EXPIRY_TIME,
  SESSION_BLACKLIST_KEY,
  SESSION_KEY,
  TRANSFER_CODE_KEY,
  TRANSFER_STATE_KEY,
  DEFAULT_ORG_SLUG,
} from "../utils/constants";
import redis from "../lib/redis";
import { Priority, Status } from "@prisma/client";
import {
  ForgotPasswordSchema,
  LoginSchema,
  SetPasswordSchema,
  ValidateLoginSchema,
} from "../schemas";
import { logger } from "../helpers/logger.helper";
import { UserService } from "../services/user.service";
import { verifySupabaseToken, getSupabaseClaims, encryptTokens, generate32bitRandomBytes, decryptTokens, decryptRefreshToken, decryptSessionData, encryptSessionData } from "../helpers/encryption.helper";
import { RequestWithTrace } from "../middlewares/Logger";
import {
  createTransferCodeData,
} from "../helpers/transfer-code.helper";
import OrganizationCustomizationHelper from "../helpers/organization-customization.helper";
import s3Helper from "../helpers/aws/s3.helper";

class AuthController {
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

      const accessToken = supabaseUser.data.session?.access_token;
      const refreshToken = supabaseUser.data.session?.refresh_token;

      const { user, error, status, message, organizationSlug } =
        await UserService.completeUserLogin({
          accessToken,
          req,
        });

      if (error && status) {
        return sendResponse(res, {
          status: status,
          error: true,
          message: message,
        });
      }

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          token: accessToken,
          refresh_token: refreshToken,
          user: user,
          organizationSlug: organizationSlug,
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

  public static async validateLogin(req: RequestWithTrace, res: Response) {
    try {
      const { token, refreshToken } = req.body as ValidateLoginSchema;

      const verifyToken = await verifySupabaseToken(token, req.traceId);

      if (!verifyToken) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid token",
        });
      }

      const { user, error, status, message } =
        await UserService.completeUserLogin({
          accessToken: token,
          refreshToken: refreshToken,
          req,
        });
      if (error && status) {
        return sendResponse(res, {
          status: status,
          error: true,
          message: message,
        });
      }
      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          user: user,
          token: token,
        },
        message: "Login validated successfully",
      });
    } catch (err) {
      logger.error("Validate login failed", {
        traceId: (req as AuthenticatedRequest).traceId,
        method: "validateLogin",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "LoginFailed",
      });
    }
  }

  public static async register(req: Request, res: Response) {
    try {
      const { email: _email, password: _password } = req.body;
    } catch (err) {
      logger.error("Registration failed", {
        traceId: (req as AuthenticatedRequest).traceId,
        method: "register",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Registration failed",
      });
    }
  }

  public static async signOut(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { userType, userId, sessionId } = user!;

      const token = req.token || (req.headers.authorization && req.headers.authorization.split(" ").length === 2 ? req.headers.authorization.split(" ")[1] : null);

      if (userType === UserType.SUPER_ADMIN) {
        const logout = await supabase.auth.admin.signOut(token!);
        if (logout.error) {
          return sendResponse(res, {
            status: StatusCode.INTERNAL_SERVER_ERROR,
            error: logout.error,
            message: "Sign out failed",
          });
        }
        await Promise.all([
          prisma.adminSession.update({
            where: {
              sessionId,
            },
            data: {
              isValid: false,
              logoutAt: new Date(),
            },
          }),
          prisma.adminAuditLog.create({
            data: {
              adminId: userId,
              description: "Admin logged out",
              priority: Priority.HIGH,
            },
          }),
        ]);
      } else {
        await Promise.all([
          prisma.userSession.update({
            where: {
              sessionId,
            },
            data: {
              isValid: false,
              logoutAt: new Date(),
            },
          }),
          prisma.userAuditLog.create({
            data: {
              userId: userId,
              description: "User logged out",
              priority: Priority.HIGH,
            },
          }),
        ]);
      }

      await Promise.all([
        redis.del(SESSION_KEY(sessionId)),
        redis.set(
          SESSION_BLACKLIST_KEY(sessionId),
          sessionId,
          SESSION_BLACKLIST_EXPIRY_TIME,
        ),
      ]);
      return sendResponse(res, {
        data: true,
        status: StatusCode.OK,
        message: "Sign out successful",
      });
    } catch (err) {
      logger.error("Sign out failed", {
        traceId: req.traceId,
        method: "signOut",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Sign out failed",
        },
        req,
      );
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.user!;
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          email: true,
          isPasswordSet: true,
          firstName: true,
          lastName: true,
          middleName: true,
          photo: true,
          userType: true,
        },
      });
      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "User not found",
        });
      }
      return sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: "Profile fetched successfully",
      });
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

  public static async getOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId, userType, parentOrganizationId } = req.user!;

      if (!organizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization ID not found",
        });
      }

      const [childOrganization, parentOrganization] = await Promise.all([
        prisma.organization.findUnique({
          where: {
            id: organizationId,
          },
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            customizations: {
              select: {
                customization: true,
              },
            },
          },
        }),
        parentOrganizationId
          ? prisma.organization.findUnique({
            where: {
              id: parentOrganizationId,
            },
            select: {
              id: true,
              uuid: true,
              name: true,
              slug: true,
              customizations: {
                select: {
                  customization: true,
                },
              },
            },
          })
          : Promise.resolve(null)
      ]);

      if (!childOrganization) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Organization not found",
        });
      }

      const organization = parentOrganization || childOrganization;
      const customization = organization?.customizations[0]?.customization;
      const structuredCustomization = customization
        ? OrganizationCustomizationHelper.structureCustomization(customization)
        : null;

      const isAdmin = userType === UserType.ADMIN || userType === UserType.SUPER_ADMIN;

      if (structuredCustomization?.logo) {
        try {
          const presignedUrl = await s3Helper.getPresignedDownloadUrl({
            bucket: structuredCustomization.logo.bucket,
            key: structuredCustomization.logo.key,
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            traceId: req.traceId,
          });
          structuredCustomization.logo.url = presignedUrl;
        } catch (error) {
          logger.warn("Failed to generate presigned URL for logo", {
            traceId: req.traceId,
            method: "getOrganization",
            error,
          });
        }
      }

      let customizationData;
      if (isAdmin) {
        customizationData = OrganizationCustomizationHelper.sanitizeForResponse(structuredCustomization);
      } else {
        customizationData = OrganizationCustomizationHelper.getPublicCustomization(structuredCustomization);
      }

      const slug = parentOrganization?.slug || childOrganization.slug || DEFAULT_ORG_SLUG;
      const name = parentOrganization?.name || childOrganization.name;

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          id: childOrganization.uuid,
          name,
          slug,
          customization: customizationData,
        },
        message: "Organization info retrieved successfully",
      });
    } catch (err) {
      logger.error("Get organization failed", {
        traceId: req.traceId,
        method: "getOrganization",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get organization info",
        },
        req,
      );
    }
  }

  public static async setPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { password } = req.body as SetPasswordSchema;
      const token = req.token || (req.headers.authorization && req.headers.authorization.split(" ").length === 2 ? req.headers.authorization.split(" ")[1] : null);
      if (!token) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid token",
        });
      }
      const verifyToken = await verifySupabaseToken(token);

      if (!verifyToken) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid token",
        });
      }

      const claims = await supabase.auth.getClaims(token!);
      if (claims.error || !claims?.data?.claims?.session_id) {
        return {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid credentials",
        };
      }

      const userId = verifyToken.id;

      const supabasePasswordUpdate = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: password,
        },
      );
      if (supabasePasswordUpdate.error) {
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: supabasePasswordUpdate.error,
          message: "FailedToUpdatePassword",
        });
      }

      const organizationUser = await prisma.organizationUser.findFirst({
        where: {
          userId: userId,
        },
      });

      try {
        if (organizationUser) {
          await prisma.organizationUser.update({
            where: {
              organizationId_userId: {
                organizationId: organizationUser.organizationId,
                userId: userId,
              },
            },
            data: {
              status: Status.ACTIVE,
            },
          });
        }
      } catch (error) {
        logger.error("Failed to get organization id", {
          traceId: req.traceId,
          method: "setPassword",
          error: error,
        });
      }

      await Promise.all([
        prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            isPasswordSet: true,
            status: Status.ACTIVE,
          },
        }),
        prisma.userAuditLog.create({
          data: {
            userId: userId,
            description: "Password set",
            priority: Priority.HIGH,
          },
        }),

      ]);

      return sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: "Password set successfully",
      });
    } catch (err) {
      logger.error("Set password failed", {
        traceId: req.traceId,
        method: "setPassword",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to set password",
        },
        req,
      );
    }
  }

  public static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as ForgotPasswordSchema;
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });
      if (!user) {
        return sendResponse(res, {
          status: StatusCode.OK,
          data: true,
          message: "Password reset link sent successfully",
        });
      }

      const supabaseUser = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.ID_DOMAIN_URL}/auth/reset-password`,
      });

      if (supabaseUser.error) {
        return sendResponse(res, {
          status: StatusCode.OK,
          data: true,
          message: "Password reset link sent successfully",
        });
      }
      await prisma.userAuditLog.create({
        data: {
          userId: user.id,
          description: "Password reset link sent",
          priority: Priority.HIGH,
        },
      });

      return sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: "Password reset link sent successfully",
      });
    } catch (err) {
      logger.error("Forgot password failed", {
        traceId: (req as AuthenticatedRequest).traceId,
        method: "forgotPassword",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to forgot password",
      });
    }
  }

  public static async createTransferCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, sessionId, organizationId } = req.user!;

      if (!organizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "User does not belong to an organization",
        });
      }

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
        select: {
          slug: true,
          parentOrganization: true,
        },
      });

      if (!organization) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Organization not found",
        });
      }

      const encryptedSession = await redis.get(SESSION_KEY(sessionId));
      if (!encryptedSession) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "Session not found",
        });
      }

      try {
        const decryptedSession = decryptSessionData(encryptedSession);
        JSON.parse(decryptedSession);
      } catch (decryptError) {
        logger.error("Failed to decrypt session data", {
          traceId: req.traceId,
          error: decryptError,
        });
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "Invalid session",
        });
      }

      const accessToken = req.token || (req.headers.authorization && req.headers.authorization.split(" ").length === 2 ? req.headers.authorization.split(" ")[1] : null);

      if (!accessToken) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "Access token required",
        });
      }

      const claims = req.claims || await getSupabaseClaims(accessToken);
      const expiresAt = claims?.claims?.exp ? claims.claims.exp * 1000 : undefined;
      const encryptedRefreshToken = await redis.get(REFRESH_TOKEN_KEY(sessionId));
      const refreshToken = encryptedRefreshToken ? decryptRefreshToken(encryptedRefreshToken) : null;

      const transferData = createTransferCodeData(
        {
          access_token: accessToken,
          refresh_token: refreshToken || "",
          expires_at: expiresAt,
        },
        userId,
        organizationId,
        req.ip || "unknown"
      );

      const encryptedTokens = encryptTokens(transferData);

      const code = generate32bitRandomBytes();
      const state = generate32bitRandomBytes();

      const TTL = 60;
      await Promise.all([
        redis.set(TRANSFER_CODE_KEY(code), encryptedTokens, TTL),
        redis.set(TRANSFER_STATE_KEY(state), code, TTL)
      ]);

      logger.info("Transfer code created", {
        traceId: req.traceId,
        userId,
        organizationId,
        code: code.substring(0, 8) + "...",
      });

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          code,
          state,
          organizationSlug: organization.parentOrganization?.slug || organization.slug || DEFAULT_ORG_SLUG,
          expiresIn: TTL,
        },
        message: "Transfer code created successfully",
      });
    } catch (err: any) {
      logger.error("Create transfer code failed", {
        traceId: req.traceId,
        method: "createTransferCode",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to create transfer code",
        },
        req,
      );
    }
  }

  public static async exchangeTransferCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { code, state } = req.body;

      const stateKey = TRANSFER_STATE_KEY(state);
      const storedCode = await redis.get(stateKey);

      if (!storedCode || storedCode !== code) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Invalid state or code",
        });
      }

      const codeKey = TRANSFER_CODE_KEY(code);
      const encryptedTokens = await redis.get(codeKey);

      if (!encryptedTokens) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Transfer code expired or invalid",
        });
      }

      let tokens;
      try {
        tokens = decryptTokens(encryptedTokens);
      } catch (decryptError) {
        logger.error("Failed to decrypt transfer tokens", {
          traceId: req.traceId,
          error: decryptError,
        });
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: true,
          message: "Failed to decrypt tokens",
        });
      }

      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      if (tokens.ip !== clientIp) {
        logger.warn("IP address mismatch for transfer code", {
          traceId: req.traceId,
          storedIp: tokens.ip,
          clientIp,
          code: code.substring(0, 8) + "...",
        });
        return sendResponse(res, {
          status: StatusCode.FORBIDDEN,
          error: true,
          message: "IP address mismatch",
        });
      }

      const tokenClaims = await getSupabaseClaims(tokens.access_token);
      const sessionId = tokenClaims?.claims?.session_id;

      if (sessionId) {
        const encryptedSession = await redis.get(SESSION_KEY(sessionId));
        if (encryptedSession) {
          try {
            const decryptedSession = decryptSessionData(encryptedSession);
            const sessionData = JSON.parse(decryptedSession);

            sessionData.transferCompleted = true;

            const ttl = tokenClaims?.claims?.exp
              ? tokenClaims.claims.exp - Math.floor(Date.now() / 1000)
              : 3600; // Default 1 hour if exp not found

            const updatedSessionString = JSON.stringify(sessionData);
            const reEncryptedSession = encryptSessionData(updatedSessionString);
            await redis.set(SESSION_KEY(sessionId), reEncryptedSession, ttl);

            logger.info("Session updated: transfer completed", {
              traceId: req.traceId,
              userId: tokens.userId,
              sessionId,
            });
          } catch (error) {
            logger.error("Failed to update session with transferCompleted", {
              traceId: req.traceId,
              error,
            });
          }
        }
      }

      const redisClient = redis.getClient();
      await redis.connect();
      const multi = redisClient.multi();
      multi.del(codeKey);
      multi.del(stateKey);
      await multi.exec();

      logger.info("Transfer code exchanged successfully", {
        traceId: req.traceId,
        userId: tokens.userId,
        organizationId: tokens.organizationId,
        code: code.substring(0, 8) + "...",
      });

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
        },
        message: "Transfer code exchanged successfully",
      });
    } catch (err: any) {
      logger.error("Exchange transfer code failed", {
        traceId: req.traceId,
        method: "exchangeTransferCode",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to exchange transfer code",
        },
        req,
      );
    }
  }
}

export default AuthController;
