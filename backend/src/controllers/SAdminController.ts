import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { AuthenticatedRequest, StatusCode } from '../types';
import { prisma } from '../lib/prisma';
import { logger } from '../helpers/logger.helper';
import { supabase } from '../lib/supabase';
import { Priority, Status, UserType as PrismaUserType } from '@prisma/client';
import { UserType } from '../types';
import redis from '../lib/redis';
import { SESSION_KEY } from '../utils/constants';
import { buildRedisSession } from '../utils';
import { CreateSuperAdminSchema, LoginSchema, ProvisionOrganizationSchema } from '../schemas';

class SAdminController {
  public static async createSuperAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, firstName, lastName, middleName } = req.body as CreateSuperAdminSchema;
      const supabaseUser = await supabase.auth.admin.createUser({
        email,
        password
      });
      if (!supabaseUser.data.user?.id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'Failed to create super admin'
        });
      }
      const superAdmin = await prisma.admin.create({
        data: {
          id: supabaseUser.data.user?.id,
          firstName,
          lastName,
          middleName,
          email,
          status: Status.ACTIVE
        }
      });

      await Promise.all([
        prisma.adminLogin.create({
          data: {
            adminId: superAdmin.id,
            ip: req.ip,
            appVersion: req.headers['user-agent'],
            metadata: {
              ip: req.ip,
              userAgent: req.headers['user-agent']
            }
          }
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: superAdmin.id,
            description: 'Super admin created',
            priority: Priority.HIGH
          }
        })
      ])
      sendResponse(res, {
        status: StatusCode.OK,
        data: superAdmin,
        message: 'Super admin created successfully'
      });
    } catch (err) {
      logger.error('Create super admin failed', {
        traceId: req.traceId,
        error: String(err)
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err instanceof Error,
        message: 'Failed to create super admin'
      });
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body as LoginSchema;
      const supabaseUser = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (!supabaseUser.data.user?.id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'Invalid credentials'
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
        }
      });
      if (!admin) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'Invalid credentials'
        });
      }

      const claims = await supabase.auth.getClaims(supabaseUser.data.session?.access_token);
      if (claims.error || !claims?.data?.claims?.session_id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'Invalid credentials'
        });
      }

      const ttl = claims.data?.claims.exp - Math.floor(Date.now() / 1000);
      const sessionId = claims?.data?.claims?.session_id;

      const session = buildRedisSession({
        userType: UserType.SUPER_ADMIN,
        userId: admin.id,
        sessionId,
      })

      await Promise.all([
        redis.set(SESSION_KEY(sessionId), session, ttl),
        prisma.adminSession.create({
          data: {
            adminId: admin.id,
            sessionId
          }
        }),
        prisma.adminLogin.create({
          data: {
            adminId: admin.id,
            ip: req.ip,
            appVersion: req.headers['user-agent'],
          }
        }),
        prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            description: 'Admin logged in',
            priority: Priority.HIGH
          }
        })
      ])

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          token: supabaseUser.data.session?.access_token,
          admin: admin
        },
        message: 'Login successful'
      });

    } catch (err) {
      logger.error('Login failed', {
        traceId: req.traceId,
        error: String(err)
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'Failed to login'
      });
    }
  }

  public static async provisionOrganization(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { name, isPrimary, admin } = req.body as ProvisionOrganizationSchema;

      const [checkName, checkIfPrimary, checkAdminEmail, checkSuperAdminEmail] = await Promise.all([
        prisma.organization.findFirst({
          where: {
            name
          }
        }),
        prisma.organization.findFirst({
          where: {
            isPrimary: true
          }
        }),
        prisma.user.findFirst({
          where: {
            email: admin.email
          }
        }),
        prisma.admin.findFirst({
          where: {
            email: admin.email
          }
        })
      ])

      if (checkName) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'OrganizationAlreadyExists'
        });
      }

      if (checkIfPrimary) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'PrimaryOrganizationExists'
        });
      }

      if (checkAdminEmail || checkSuperAdminEmail) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'AdminEmailAlreadyExists'
        });
      }


      // maybe create a new user in supabase with the email and password for testing?
      const newSupabaseUser = await supabase.auth.admin.inviteUserByEmail(admin.email);

      if (!newSupabaseUser.data.user?.id) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: newSupabaseUser.error?.code,
          message: 'FailedToCreateAdmin'
        });
      }

      const newUserId = newSupabaseUser.data.user.id;
      const [organization, newUser] = await Promise.all([
        prisma.organization.create({
          data: {
            name,
            isPrimary,
            createdBy: user?.userId,
          }
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
          }
        })]);


      await Promise.all([
        prisma.adminAuditLog.create({
          data: {
            adminId: user.userId,
            description: 'Organization provisioned',
            metadata: {
              body: req.body
            },
            priority: Priority.HIGH
          }
        }),
        prisma.organizationCustomization.create({
          data: {
            organizationId: organization.id,
          }
        }),
        prisma.organizationUser.create({
          data: {
            organizationId: organization.id,
            userId: newUserId,
          }
        })
      ])
      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          ...req.body,
        },
        message: 'Organization provisioned successfully'
      });
    } catch (err) {
      logger.error("Error");
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: String(err),
        message: 'Failed to provision organization'
      });
    }
  }

  public static async createOrganizationAdmin(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'Organization admin created successfully'
      });
    } catch (err) {
      logger.error("Error");
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err instanceof Error,
        message: 'Failed to create organization admin'
      });
    }
  }
}

export default SAdminController;
