const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const APIError = require('../../utils/APIError');
const catchAsync = require('../../utils/catchAsync');
const authService = require('../services/authService');
const CONFIG = require('../../config/config');
const { TIERS_LEVELS } = require('../../config/plans');

const tierLevels = TIERS_LEVELS;
/**
 * Authenticate user based on JWT token
 */
exports.authenticate = catchAsync(async (req, res, next) => {
    // 1) Get token from request
    let token;
    
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer') &&
        req.headers.authorization.split(' ')?.length > 1
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
        token = req.cookies.jwt;
    } else if (req.headers.cookie && req.headers.cookie.startsWith('jwt')) {
        token = req.headers.cookie.split('=')[1];
    }

    if (!token) {
        throw new APIError('Authentication required', 401);
    }

    try {
        // 2) Verify token
        const decoded = await authService.verifyJwtToken(token);

        // 3) Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new APIError('User not found or inactive', 401);
        }

        // 4) Check if user changed password after the token was issued
        if (user.passwordChangedAt && decoded.iat) {
            const changedTimestamp = parseInt(
                user.passwordChangedAt.getTime() / 1000,
                10
            );

            if (decoded.iat < changedTimestamp) {
                throw new APIError('Password was changed. Please log in again', 401);
            }
        }

        // 5) Check if user is active
        if (!user.isActive) {
            throw new APIError('User account is inactive', 401);
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = user;
        res.locals.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new APIError('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new APIError('Token expired', 401));
        }
        next(error);
    }
});

/**
 * Authorize access based on user role
 * @param  {...string} roles - Authorized roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new APIError('Authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new APIError('Not authorized to access this resource', 403));
        }
        next();
    };
};

/**
 * Check if user is authenticated, but don't throw error if not
 * Used for pages that work for both logged in and non-logged in users
 */
exports.isLoggedIn = catchAsync(async (req, res, next) => {
    if (req.cookies?.jwt) {
        try {
            // 1) Verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                CONFIG.JWT_SECRET
            );

            // 2) Check if user still exists
            const user = await User.findById(decoded.id);
            if (!user) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (user.passwordChangedAt && decoded.iat) {
                const changedTimestamp = parseInt(
                    user.passwordChangedAt.getTime() / 1000,
                    10
                );

                if (decoded.iat < changedTimestamp) {
                    return next();
                }
            }

            // 4) Check if user is active
            if (!user.isActive) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = user;
            req.user = user;
        } catch (err) {
            // Invalid token, but continue
        }
    }
    next();
});

/**
 * Check if email is verified
 */
exports.isEmailVerified = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id);

    if (!user.isEmailVerified) {
        throw new APIError('Email verification required for this action', 403);
    }

    next();
});

/**
 * Rate limiter middleware for sensitive routes
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 */
exports.rateLimit = (maxAttempts, windowMs) => {
    const attempts = new Map();

    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();

        // Clean up old attempts
        for (const [key, value] of attempts.entries()) {
            if (now - value.timestamp > windowMs) {
                attempts.delete(key);
            }
        }

        // Check current IP
        const ipAttempts = attempts.get(ip) || { count: 0, timestamp: now };

        // If too many attempts
        if (ipAttempts.count >= maxAttempts) {
            return next(
                new APIError('Too many attempts. Please try again later', 429)
            );
        }

        // Update attempts
        attempts.set(ip, {
            count: ipAttempts.count + 1,
            timestamp: now
        });

        next();
    };
};

/**
 * Verify reCAPTCHA token
 * Used for registration and password reset
 */
exports.verifyCaptcha = catchAsync(async (req, res, next) => {
    const { captchaToken } = req.body;

    if (!captchaToken && CONFIG.NODE_ENV === 'production') {
        throw new APIError('CAPTCHA verification required', 400);
    }

    if (CONFIG.NODE_ENV === 'production') {
        try {
            // Verify with Google reCAPTCHA API
            const response = await fetch(
                `https://www.google.com/recaptcha/api/siteverify?secret=${CONFIG.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
                { method: 'POST' }
            );

            const data = await response.json();

            if (!data.success) {
                throw new APIError('CAPTCHA verification failed', 400);
            }
        } catch (error) {
            throw new APIError('Error verifying CAPTCHA', 500);
        }
    }

    next();
});

/**
 * Check subscription status and tier access
 * @param {string} requiredTier - Minimum tier required for access 
 */
exports.checkSubscription = (requiredTier) => {
    return catchAsync(async (req, res, next) => {
        // Admin always has access
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user's tier level is sufficient
        const userTierLevel = tierLevels[req.user.role];
        const requiredTierLevel = tierLevels[requiredTier];

        if (userTierLevel < requiredTierLevel) {
            throw new APIError(`This feature requires ${requiredTier} subscription or higher`, 403);
        }

        next();
    });
};