import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts from this IP address. Please try again after 15 minutes.'
    }
});

export const createMemberLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many member registration requests. Please wait a moment.'
    }
});

export const globalApiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests sent to the server. Please slow down.'
    }
});