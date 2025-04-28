const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post(
    '/register',
    authMiddleware.verifyCaptcha,
    authMiddleware.rateLimit(5, 60 * 60 * 1000),
    authController.register
);

router.post(
    '/login',
    authMiddleware.rateLimit(10, 15 * 60 * 1000),
    authController.login
);

router.post('/google', authController.googleAuth);

router.post('/logout', authController.logout);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);
router.post(
    '/resend-verification',
    authMiddleware.rateLimit(3, 60 * 60 * 1000),
    authController.resendVerification
);

// Password reset
router.post(
    '/forgot-password',
    authMiddleware.rateLimit(3, 60 * 60 * 1000),
    authMiddleware.verifyCaptcha,
    authController.forgotPassword
);

router.post(
    '/reset-password/:token',
    authMiddleware.rateLimit(5, 60 * 60 * 1000),
    authController.resetPassword
);

// Check if email exists (for registration form validation)
router.post('/check-email', authController.checkEmail);

// Token refresh
router.post('/refresh-token', authController.refreshToken);

// Protected routes - require authentication
router.use(authMiddleware.authenticate);

// Get current user profile
router.get('/me', authController.getCurrentUser);

// Change password (requires authentication)
router.patch(
    '/change-password',
    authMiddleware.rateLimit(5, 60 * 60 * 1000),
    authMiddleware.isEmailVerified,
    authController.changePassword
);

module.exports = router;