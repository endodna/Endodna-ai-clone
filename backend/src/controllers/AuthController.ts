import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';
import { SESSION_BLACKLIST_EXPIRY_TIME, SESSION_BLACKLIST_KEY, SESSION_KEY } from '../utils/constants';
import redis from '../lib/redis';
import { Priority } from '@prisma/client';
import { LoginSchema, SetPasswordSchema, ValidateLoginSchema } from '../schemas';
import { logger } from '../helpers/logger.helper';
import { UserService } from '../services/user.service';
import { verifySupabaseToken } from '../helpers/encryption.helper';
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

      const accessToken = supabaseUser.data.session?.access_token;

      const { user, error, status, message } = await UserService.completeUserLogin({
        accessToken,
        req
      });

      if (error && status) {
        return sendResponse(res, {
          status: status,
          error: true,
          message: message
        });
      }

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          token: accessToken,
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

  public static async validateLogin(req: Request, res: Response) {
    try {
      const { token } = req.body as ValidateLoginSchema;

      const verifyToken = await verifySupabaseToken(token);

      if (!verifyToken) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: 'Invalid token'
        });
      }

      const { user, error, status, message } = await UserService.completeUserLogin({
        accessToken: token,
        req
      });
      if (error && status) {
        return sendResponse(res, {
          status: status,
          error: true,
          message: message
        });
      }
      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          user: user,
          token: token
        },
        message: 'Login validated successfully'
      });
    } catch (err) {
      console.log(err)
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: 'LoginFailed'
      });
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

      if (userType === UserType.SUPER_ADMIN) {
        const logout = await supabase.auth.admin.signOut(token!);
        if (logout.error) {
          return sendResponse(res, {
            status: StatusCode.INTERNAL_SERVER_ERROR,
            error: logout.error,
            message: 'Sign out failed'
          });
        }
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
          userType: true,
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
      const { userId, sessionId } = req.user!;
      const { password } = req.body as SetPasswordSchema;

      const supasbasPasswordUpdate = await supabase.auth.admin.updateUserById(userId, {
        password: password
      });
      if (supasbasPasswordUpdate.error) {
        return sendResponse(res, {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: supasbasPasswordUpdate.error,
          message: 'FailedToUpdatePassword'
        });
      }

      const ttl = await redis.ttl(SESSION_KEY(sessionId));
      const session = buildRedisSession({
        ...req.user!,
        isPasswordSet: true
      })

      await redis.set(SESSION_KEY(sessionId), session, ttl);

      await Promise.all([
        prisma.user.update({
          where: {
            id: userId
          },
          data: {
            isPasswordSet: true
          }
        }),
        prisma.userAuditLog.create({
          data: {
            userId: userId,
            description: 'Password set',
            priority: Priority.HIGH
          }
        })
      ]);

      return sendResponse(res, {
        status: StatusCode.OK,
        data: true,
        message: 'Password set successfully'
      });

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
