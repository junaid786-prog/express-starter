const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const emailService = require('../../utils/emailService');
const CONFIG = require('../../config/config');
const APIError = require('../../utils/APIError');

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Object} New user object
     */
    async registerUser(userData) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new APIError('User with this email already exists', 400);
        }

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create new user
        const newUser = await User.create({
            ...userData,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationTokenExpires,
            isEmailVerified: false,
        });

        // Remove password from response
        newUser.password = undefined;

        // Send verification email
        const verificationURL = `${CONFIG.FRONTEND_URL}/verify-email/${verificationToken}`;
        await this.sendVerificationEmail(newUser.email, newUser.name, verificationURL);

        return newUser;
    }

    /**
     * Login a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} User data and JWT token
     */
    async loginUser(email, password) {
        // Find user by email with password included
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new APIError('Invalid email or password', 401);
        }

        // Check if password is correct
        const isPasswordValid = await user.isValidPassword(password);
        if (!isPasswordValid) {
            throw new APIError('Invalid email or password', 401);
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            throw new APIError('Please verify your email before logging in', 403);
        }

        // Update last login timestamp
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        // Generate JWT token
        const token = this.generateJwtToken(user._id);

        // Remove password from response
        user.password = undefined;

        return { user, token };
    }

    /**
     * Login or register with Google
     * @param {string} googleId - Google ID
     * @param {string} email - User email
     * @param {string} name - User name
     * @param {string} profilePicture - Profile picture URL
     * @returns {Object} User data and JWT token
     */
    async googleAuth(googleId, email, name, profilePicture) {
        // Check if user exists with this Google ID
        let user = await User.findOne({ googleId });

        // If not found by Google ID, try with email
        if (!user) {
            user = await User.findOne({ email });

            // If found by email, update with Google ID
            if (user) {
                user.googleId = googleId;
                user.profilePicture = profilePicture || user.profilePicture;
                user.isEmailVerified = true; // Google auth implies verified email
                await user.save({ validateBeforeSave: false });
            } else {
                // Create new user if not found
                user = await User.create({
                    email,
                    name,
                    googleId,
                    profilePicture,
                    password: crypto.randomBytes(16).toString('hex'), // Random password
                    isEmailVerified: true, // Google auth implies verified email
                });
            }
        }

        // Update last login timestamp
        user.lastLogin = Date.now();
        await user.save({ validateBeforeSave: false });

        // Generate JWT token
        const token = this.generateJwtToken(user._id);

        // Remove password from response
        user.password = undefined;

        return { user, token };
    }

    /**
     * Verify email address
     * @param {string} token - Verification token
     * @returns {Object} Updated user object
     */
    async verifyEmail(token) {
        // Find user with matching token that hasn't expired
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            throw new APIError('Invalid or expired verification token', 400);
        }

        // Update user verification status
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save({ validateBeforeSave: false });

        // Generate JWT token
        const jwtToken = this.generateJwtToken(user._id);

        // Remove password from response
        user.password = undefined;

        return { user, token: jwtToken };
    }

    /**
     * Request password reset
     * @param {string} email - User email
     */
    async forgotPassword(email) {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            throw new APIError('No user found with this email', 404);
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

        // Save hashed token to user record
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        user.passwordResetExpires = resetTokenExpires;
        await user.save({ validateBeforeSave: false });

        // Send password reset email
        const resetURL = `${CONFIG.FRONTEND_URL}/reset-password/${resetToken}`;
        await this.sendPasswordResetEmail(user.email, user.name, resetURL);

        return true;
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Object} Updated user object
     */
    async resetPassword(token, newPassword) {
        // Hash token to match hashed token in database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with matching token that hasn't expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            throw new APIError('Invalid or expired reset token', 400);
        }

        // Update password and clear reset tokens
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate JWT token
        const jwtToken = this.generateJwtToken(user._id);

        // Remove password from response
        user.password = undefined;

        return { user, token: jwtToken };
    }

    /**
     * Change password for logged-in user
     * @param {string} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Object} Updated user object
     */
    async changePassword(userId, currentPassword, newPassword) {
        // Find user by ID with password included
        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw new APIError('User not found', 404);
        }

        // Check if current password is correct
        const isPasswordValid = await user.isValidPassword(currentPassword);
        if (!isPasswordValid) {
            throw new APIError('Current password is incorrect', 401);
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Generate new JWT token
        const token = this.generateJwtToken(user._id);

        // Remove password from response
        user.password = undefined;

        return { user, token };
    }

    /**
     * Log out user (server-side actions)
     * @param {string} userId - User ID
     */
    async logoutUser(userId) {
        // Optional: Track logout in user analytics or activity log
        await User.findByIdAndUpdate(userId, {
            $push: { activityLog: { action: 'logout', timestamp: Date.now() } }
        });

        return true;
    }

    /**
     * Generate JWT token
     * @param {string} userId - User ID
     * @returns {string} JWT token
     */
    generateJwtToken(userId) {
        return jwt.sign(
            { id: userId },
            CONFIG.JWT_SECRET,
            { expiresIn: CONFIG.JWT_EXPIRES_IN }
        );
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    async verifyJwtToken(token) {
        const decoded = await promisify(jwt.verify)(token, CONFIG.JWT_SECRET);
        return decoded;
    }

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object} User object
     */
    async getUserById(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new APIError('User not found', 404);
        }
        return user;
    }

    /**
     * Send email verification link
     * @param {string} email - User email
     * @param {string} name - User name
     * @param {string} verificationURL - Verification URL
     */
    async sendVerificationEmail(email, name, verificationURL) {
        await emailService.sendEmail({
            to: email,
            subject: 'Verify Your Email Address',
            templateKey: 'email-verification',
            data: {
                name: name,
                verificationUrl: verificationURL,
                logoUrl: CONFIG.LOGO_URL || 'https://yourdomain.com/logo.png',
                companyName: CONFIG.COMPANY_NAME || 'Your Company',
                companyAddress: CONFIG.COMPANY_ADDRESS || 'Company Address',
            }
        });
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @param {string} name - User name
     * @param {string} resetURL - Reset URL
     */
    async sendPasswordResetEmail(email, name, resetURL) {

        await emailService.sendEmail({
            to: email,
            subject: 'Password Reset Instructions',
            templateKey: 'password-reset',
            data: {
                name: name,
                resetUrl: resetURL,
                logoUrl: CONFIG.LOGO_URL || 'https://yourdomain.com/logo.png',
                companyName: CONFIG.COMPANY_NAME || 'Your Company',
                companyAddress: CONFIG.COMPANY_ADDRESS || 'Company Address',
                currentYear: new Date().getFullYear()
            }
        });
    }

    /**
     * Resend verification email
     * @param {string} email - User email
     */
    async resendVerificationEmail(email) {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            throw new APIError('No user found with this email', 404);
        }

        // If already verified
        if (user.isEmailVerified) {
            throw new APIError('Email already verified', 400);
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Update user record
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationTokenExpires;
        await user.save({ validateBeforeSave: false });

        // Send verification email
        const verificationURL = `${CONFIG.FRONTEND_URL}/verify-email/${verificationToken}`;
        await this.sendVerificationEmail(user.email, user.name, verificationURL);

        return true;
    }
}

module.exports = new AuthService();