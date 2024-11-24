const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute window
    max: 10, // Limit each IP to 10 requests
    message: {
        error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many login attempts, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { limiter, loginLimiter };