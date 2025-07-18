const authService = require('../services/authService');
const APIError = require('../../utils/APIError');
const APIResponse = require('../../utils/APIResponse');
const catchAsync = require('../../utils/catchAsync');
const CONFIG = require('../../config/config');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = catchAsync(async (req, res, next) => {
    const { email, password, name, company, position } = req.body;

    const newUser = await authService.registerUser({
        email,
        password,
        name,
        company,
        position
    });

    const response = APIResponse.success(
        { user: newUser },
        'Registration successful. Please check your email to verify your account.',
        201
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Login a user
 * @route POST /api/auth/login
 */
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const { user, token } = await authService.loginUser(email, password);

    // Set JWT as HTTP-only cookie for enhanced security
    const cookieOptions = {
        expires: new Date(Date.now() + CONFIG.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);

    const response = APIResponse.success({ user, token }, 'Login successful', 200);

    return res.status(response.statusCode).json(response);
});

/**
 * Google One-Tap sign-in
 * @route POST /api/auth/google
 */
exports.googleAuth = catchAsync(async (req, res, next) => {
    const { googleId, email, name, profilePicture } = req.body;

    if (!googleId || !email) {
        throw new APIError('Google ID and email are required', 400);
    }

    const { user, token } = await authService.googleAuth(googleId, email, name, profilePicture);

    // Set JWT as HTTP-only cookie
    const cookieOptions = {
        expires: new Date(Date.now() + CONFIG.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);

    const response = APIResponse.success({ user, token }, 'Google authentication successful', 200);

    return res.status(response.statusCode).json(response);
});

/**
 * Verify email address
 * @route GET /api/auth/verify-email/:token
 */
exports.verifyEmail = catchAsync(async (req, res, next) => {
    const { token } = req.params;

    if (!token) {
        throw new APIError('Verification token is required', 400);
    }

    const { user, token: jwtToken } = await authService.verifyEmail(token);

    // Set JWT as HTTP-only cookie
    const cookieOptions = {
        expires: new Date(Date.now() + CONFIG.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', jwtToken, cookieOptions);

    const response = APIResponse.success(
        { user, token: jwtToken },
        'Email verified successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        throw new APIError('Email is required', 400);
    }

    await authService.forgotPassword(email);

    const response = APIResponse.success(
        null,
        'Password reset instructions sent to your email',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Reset password with token
 * @route POST /api/auth/reset-password/:token
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
        throw new APIError('Token and new password are required', 400);
    }

    const { user, token: jwtToken } = await authService.resetPassword(token, password);

    // Set JWT as HTTP-only cookie
    const cookieOptions = {
        expires: new Date(Date.now() + CONFIG.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', jwtToken, cookieOptions);

    const response = APIResponse.success(
        { user, token: jwtToken },
        'Password reset successful',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Change password for logged-in user
 * @route PATCH /api/auth/change-password
 */
exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new APIError('Current password and new password are required', 400);
    }

    const { user, token } = await authService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
    );

    // Set JWT as HTTP-only cookie
    const cookieOptions = {
        expires: new Date(Date.now() + CONFIG.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);

    const response = APIResponse.success({ user, token }, 'Password changed successfully', 200);

    return res.status(response.statusCode).json(response);
});

/**
 * Log out user
 * @route GET /api/auth/logout
 */
exports.logout = catchAsync(async (req, res, next) => {
    // Clear JWT cookie
    res.cookie('jwt', 'logged-out', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    // Optional: Track logout on server
    if (req.user) {
        await authService.logoutUser(req.user._id);
    }

    const response = APIResponse.success(null, 'Logged out successfully', 200);

    return res.status(response.statusCode).json(response);
});

/**
 * Get current user
 * @route GET /api/auth/me
 */
exports.getCurrentUser = catchAsync(async (req, res, next) => {
    // req.user is already set by the authenticate middleware
    const user = await authService.getUserById(req.user._id);

    const response = APIResponse.success({ user }, 'User profile retrieved successfully', 200);

    return res.status(response.statusCode).json(response);
});

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 */
exports.resendVerification = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        throw new APIError('Email is required', 400);
    }

    await authService.resendVerificationEmail(email);

    const response = APIResponse.success(null, 'Verification email has been resent', 200);

    return res.status(response.statusCode).json(response);
});

/**
 * Check if email exists
 * @route POST /api/auth/check-email
 */
exports.checkEmail = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        throw new APIError('Email is required', 400);
    }

    const exists = await authService.checkEmailExists(email);

    const response = APIResponse.success(
        { exists },
        exists ? 'Email already exists' : 'Email is available',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh-token
 */
exports.refreshToken = catchAsync(async (req, res, next) => {
    // Get refresh token from request
    const refreshToken =
        req.cookies.refreshToken ||
        (req.body && req.body.refreshToken) ||
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.split(' ')[1]
            : null);

    if (!refreshToken) {
        throw new APIError('Refresh token is required', 401);
    }

    const {
        user,
        token,
        refreshToken: newRefreshToken
    } = await authService.refreshToken(refreshToken);

    // Set new JWT as HTTP-only cookie
    const cookieOptions = {
        expires: new Date(Date.now() + CONFIG.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: CONFIG.NODE_ENV === 'production',
        sameSite: 'strict'
    };

    res.cookie('jwt', token, cookieOptions);

    // Set refresh token cookie with longer expiry
    const refreshCookieOptions = {
        ...cookieOptions,
        expires: new Date(Date.now() + CONFIG.REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000)
    };

    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    const response = APIResponse.success(
        { user, token, refreshToken: newRefreshToken },
        'Token refreshed successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});
