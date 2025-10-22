import { Response, NextFunction } from 'express';
import { getSupabaseClaims, verifySupabaseToken } from '../helpers/encryption.helper';
import { sendResponse } from '../helpers/response.helper';
import { logger } from '../helpers/logger.helper';
import { AuthenticatedRequest, StatusCode, UserType } from '../types';
import redis from '../lib/redis';
import { SESSION_KEY, SESSION_BLACKLIST_KEY } from '../utils/constants';

export const Authentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = req.headers.authorization;
    const token = auth && auth.split(' ').length === 2 ? auth.split(' ')[1] : null;
    if (token) {
      const claims = await getSupabaseClaims(token);
      const user = await verifySupabaseToken(token);

      if (!user || !user.id || !claims?.claims.session_id) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: 'InvalidToken'
        });
      }
      const sessionId = claims?.claims.session_id;
      const session = await redis.get(SESSION_KEY(sessionId));
      const isBlacklisted = await redis.get(SESSION_BLACKLIST_KEY(sessionId));

      if (!session) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: 'InvalidSession'
        });
      }
      if (isBlacklisted) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: 'SessionLogout'
        });
      }

      const sessionData = JSON.parse(session);
      const ttl = claims?.claims.exp - Math.floor(Date.now() / 1000);
      await redis.set(SESSION_KEY(sessionId), session, ttl);
      req.user = sessionData;

      next();
    } else {
      sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: 'Invalid token'
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
