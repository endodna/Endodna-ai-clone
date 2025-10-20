import { Request, Response } from 'express';
import { sendResponse } from '../helpers/response.helper';
import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { StatusCode } from '../types';

class AuthController {
  public static async login(req: Request, res: Response) {
    try {
      const { email, password, token } = req.body;
      // verify token
      // verify claim
      // get user from supabase
      // save session in redis
      // return token, details and user
      //log activity

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
        error: true,
        message: 'Registration failed'
      });
    }
  }

  public static async signOut(req: Request, res: Response) {
    
  }
}

export default AuthController;
