import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';
import { SESSION_BLACKLIST_EXPIRY_TIME, SESSION_BLACKLIST_KEY, SESSION_KEY } from '../utils/constants';
import redis from '../lib/redis';
import { Priority } from '@prisma/client';
import { LoginSchema } from '../schemas';

class AuthController {
  public static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginSchema;
      // verify token
      // verify claim
      // get user from supabase
      // save session in redis
      // return token, details and user
      //log activity
      // return user type too,


      const user = {}

      if (!user) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: 'User not found in database'
        });
      }

      return sendResponse(res, {
        status: StatusCode.OK,
        data: {
          token: "",
          user: {
            // id: user.id,
            // email: user.email,
            // firstName: user.firstName,
            // lastName: user.lastName,
            // userType: user.userType,
            // createdAt: user.createdAt
          }
        },
        message: 'Login successful'
      });
    } catch (err) {
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Login failed'
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
}

export default AuthController;
