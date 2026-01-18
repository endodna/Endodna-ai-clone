import { Response, NextFunction } from "express";
import {
  getSupabaseClaims,
  verifySupabaseToken,
} from "../helpers/encryption.helper";
import { sendResponse } from "../helpers/response.helper";
import { logger } from "../helpers/logger.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import redis from "../lib/redis";
import { SESSION_KEY, SESSION_BLACKLIST_KEY } from "../utils/constants";
import { encryptSessionData, decryptSessionData } from "../helpers/encryption.helper";

export const Authentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = req.headers.authorization;
    const token =
      auth && auth.split(" ").length === 2 ? auth.split(" ")[1] : null;
    if (token) {
      req.token = token;

      const [claims, user] = await Promise.all([
        getSupabaseClaims(token),
        verifySupabaseToken(token, req.traceId),
      ]);

      // Attach claims to request for reuse (can be null)
      req.claims = claims || undefined;

      if (!user || !user.id || !claims?.claims.session_id) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "InvalidToken",
        });
      }
      const sessionId = claims.claims.session_id;

      const [encryptedSession, isBlacklisted] = await Promise.all([
        redis.get(SESSION_KEY(sessionId)),
        redis.get(SESSION_BLACKLIST_KEY(sessionId)),
      ]);

      if (!encryptedSession) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "InvalidSession1",
        });
      }
      if (isBlacklisted) {
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "SessionLogout",
        });
      }

      let sessionData;
      try {
        const decryptedSession = decryptSessionData(encryptedSession);
        sessionData = JSON.parse(decryptedSession);
      } catch (decryptError) {
        logger.error("Failed to decrypt session data", {
          traceId: req.traceId,
          error: decryptError,
        });
        return sendResponse(res, {
          status: StatusCode.UNAUTHORIZED,
          error: true,
          message: "InvalidSession2",
        });
      }

      // const adminToken = req.get("X-ADMIN-TOKEN");
      // const isAdminOverride = adminToken && process.env.ADMIN_TOKEN && adminToken === process.env.ADMIN_TOKEN;

      // if (!req.path.includes("transfer-code") && !sessionData.transferCompleted && !isAdminOverride) {
      //   logger.warn("Access denied: Transfer not completed", {
      //     traceId: req.traceId,
      //     userId: sessionData.userId,
      //     path: req.path,
      //     sessionData,
      //   });
      //   return sendResponse(res, {
      //     status: StatusCode.FORBIDDEN,
      //     error: true,
      //     message: "AuthenticationNotCompleted401",
      //   });
      // }

      // if (isAdminOverride) {
      //   logger.info("Admin token override: Transfer check bypassed", {
      //     traceId: req.traceId,
      //     userId: sessionData.userId,
      //   });
      // }

      if (claims?.claims?.exp) {
        const ttl = claims.claims.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          try {
            const currentTtl = await redis.ttl(SESSION_KEY(sessionId));

            if (currentTtl < ttl * 0.8 || currentTtl < 300) {
              const sessionString = JSON.stringify(sessionData);
              const reEncryptedSession = encryptSessionData(sessionString);
              await redis.set(SESSION_KEY(sessionId), reEncryptedSession, ttl);
            }
          } catch (ttlError) {
            logger.debug("TTL check failed, updating session anyway", {
              traceId: req.traceId,
              error: ttlError,
            });
            const sessionString = JSON.stringify(sessionData);
            const reEncryptedSession = encryptSessionData(sessionString);
            await redis.set(SESSION_KEY(sessionId), reEncryptedSession, ttl);
          }
        }
      }

      req.user = sessionData;

      next();
    } else {
      sendResponse(res, {
        status: StatusCode.UNAUTHORIZED,
        error: true,
        message: "Invalid token",
      });
    }
  } catch (e) {
    logger.debug("Token verification failed", {
      traceId: req.traceId,
      error: e,
    });
    sendResponse(res, {
      status: StatusCode.UNAUTHORIZED,
      error: true,
      message: (e as Error)?.message,
    });
  }
};
