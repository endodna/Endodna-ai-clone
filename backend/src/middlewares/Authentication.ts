import { Response, NextFunction } from 'express';
import { getSupabaseClaims, verifySupabaseToken } from '../helpers/encryption.helper';
import { sendResponse } from '../helpers/response.helper';
import { logger } from '../helpers/logger.helper';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';

export const Authentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let auth = req.headers.authorization;
    let token = auth && auth.split(' ').length === 2 ? auth.split(' ')[1] : null;
    if (token) {
      let claims = await getSupabaseClaims(token);
      const sessionId = claims?.claims.session_id;
      let user = await verifySupabaseToken(token);
      // check if session is valid
      // store session in redis with ttl of expiry time of session
      // if session is not valid, return unauthorized
      // if not in redis, return unauthorized, get session from supabase and store in redis
      // auth.api.signOut(JWT: string)
      // logout api should add sessionid to redis as blacklist with ttl of 1 day

      if (user && user.id) {
        req.user = {
          user_type: UserType.PATIENT,
          user_id: user.id
        }
        next();
      } else {
        sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: 'Invalid token'
        });
      }
    } else {
      sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: 'No token provided'
      });
    }
  } catch (e) {
    logger.error('Token verification failed', {
      traceId: req.traceId,
      error: String(e)
    });
    sendResponse(res, {
      status: StatusCode.UNAUTHORIZED,
      error: true,
      message: 'Token verification failed'
    });
  }
};
