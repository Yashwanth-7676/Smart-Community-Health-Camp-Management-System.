import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Helper to check if request is coming from local loopback
const isLoopback = (req: any): boolean => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost';
};

/**
 * General API rate limiter
 * In development, loopback requests are allowed without restriction.
 * In production, configured by RATE_LIMIT_MAX or defaults to 1000 per 15m.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  skip: (req) => isDev && isLoopback(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Auth rate limiter
 * In development, generous limit to prevent blocking during testing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30,
  skip: (req) => isDev && isLoopback(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

/**
 * AI Assistant rate limiter
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isDev ? 500 : 50,
  skip: (req) => isDev && isLoopback(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI assistant query limit reached. Please wait a few minutes before asking more questions.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
});


