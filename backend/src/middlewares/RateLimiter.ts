import rateLimit from 'express-rate-limit';

export const rateLimiter = {
  regular: rateLimit({
    windowMs: 1000, // 1 second
    max: 100, // limit
  }),
  authentication_rate_limiter: rateLimit({
    windowMs: 1000, // 1 second
    max: 7, // limit
  }),
  strict_rate_limiter: rateLimit({
    windowMs: 1000, // 1 second
    max: 1, // limit
  }),
};
