import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';
import { SESSION_BLACKLIST_EXPIRY_TIME, SESSION_BLACKLIST_KEY, SESSION_KEY } from '../utils/constants';
import redis from '../lib/redis';
import { Priority } from '@prisma/client';
import { LoginSchema } from '../schemas';
import { logger } from '../helpers/logger.helper';
import { buildRedisSession } from '../helpers/misc.helper';

class AuthController {
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
      const user = await prisma.user.findUnique({
        where: {
          id: supabaseUser.data.user?.id,
        },
        select: {
          id: true,
          email: true,
          status: true,
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
                  uuid: true
                }
              }
            }
          }
        }
      });
      if (!user) {
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
        userType: user.userType as UserType,
        userId: user.id,
        sessionId,
        organizationId: user.organizationUsers[0].organization.uuid!
      })

      user.organizationUsers = []

      await Promise.all([
        redis.set(SESSION_KEY(sessionId), session, ttl),
        prisma.userSession.create({
          data: {
            userId: user.id,
            sessionId
          }
        }),
        prisma.userLogin.create({
          data: {
            userId: user.id,
            ip: req.ip,
            appVersion: req.headers['user-agent'],
          }
        }),
        prisma.userAuditLog.create({
          data: {
            userId: user.id,
            description: 'User logged in',
            priority: Priority.HIGH
          }
        })
      ])

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          token: supabaseUser.data.session?.access_token,
          user: user
        },
        message: 'Login successful'
      });

    } catch (err) {
      console.log(err)
      logger.error('Login failed', {
        traceId: req.traceId,
        error: String(err)
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'Failed to login'
      }, req);
    }
  }

  public static async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
    } catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'Registration failed'
      });
    }
  }

  public static async signOut(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const { userType, userId, sessionId } = user!;

      const auth = req.headers.authorization;
      const token = auth && auth.split(' ').length === 2 ? auth.split(' ')[1] : null;

      const logout = await supabase.auth.admin.signOut(token!);
      if (logout.error) {
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: logout.error,
          message: 'Sign out failed'
        });
      }

      if (userType === UserType.SUPER_ADMIN) {
        await Promise.all([
          prisma.adminSession.update({
            where: {
              sessionId
            },
            data: {
              isValid: false,
              logoutAt: new Date()
            }
          }),
          prisma.adminAuditLog.create({
            data: {
              adminId: userId,
              description: 'Admin logged out',
              priority: Priority.HIGH
            }
          })
        ]);
      } else {
        await Promise.all([
          prisma.userSession.update({
            where: {
              sessionId
            },
            data: {
              isValid: false,
              logoutAt: new Date()
            }
          }),
          prisma.userAuditLog.create({
            data: {
              userId: userId,
              description: 'User logged out',
              priority: Priority.HIGH
            }
          })
        ])

      }

      await Promise.all([
        redis.del(SESSION_KEY(sessionId)),
        redis.set(SESSION_BLACKLIST_KEY(sessionId), sessionId, SESSION_BLACKLIST_EXPIRY_TIME),
      ])
      return sendResponse(res, {
        data: true,
        status: StatusCode.OK,
        message: 'Sign out successful'
      });
    } catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'Sign out failed'
      });
    }
  }

  public static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.user!;
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        },
        select: {
          id: true,
          email: true,
          isPasswordSet: true,
          firstName: true,
          lastName: true,
          middleName: true,
          photo: true,
        }
      });
      if (!user) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'User not found'
        });
      }
      return sendResponse(res, {
        status: StatusCode.OK,
        data: user,
        message: 'Profile fetched successfully'
      }); 
      } catch (err) {
      logger.error('Get profile failed', {
        traceId: req.traceId,
        error: String(err)
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'Failed to get profile'
      });
    }
  }

  public static async setPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.user!;

    } catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'Failed to set password'
      });
    }
  }
}

export default AuthController;
