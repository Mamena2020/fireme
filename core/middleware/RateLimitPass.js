import { rateLimit } from 'express-rate-limit';

/**
 * Rate limiter for auth routes (login, register)
 * Default: max 10 requests per 15 minutes per IP
 */
const authRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'too many requests, please try again later' },
});

export default authRateLimit;
