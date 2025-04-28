const jwt = require('jsonwebtoken');
const User = require('../models/User');
const APIError = require('../../utils/APIError');

/**
 * Generate JWT token
 * @param {string} userId
 * @returns {string}
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION || '1d'
    });
};

/**
 * Login with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
const login = async (username, password) => {
    // Include password in the query results for validation
    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.isValidPassword(password))) {
        throw new APIError('Invalid username or password', 401);
    }

    if (!user.isActive) {
        throw new APIError('User account is inactive', 403);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    return {
        user: {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role
        },
        token
    };
};

/**
 * Create a new user
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
const createUser = async (userData) => {
    try {
        const user = await User.create(userData);

        return {
            id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        };
    } catch (error) {
        if (error.code === 11000) {
            // MongoDB duplicate key error
            const field = Object.keys(error.keyPattern)[0];
            throw new APIError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`, 400);
        }
        throw error;
    }
};

/**
 * Change user password
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<boolean>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw new APIError('User not found', 404);
    }

    if (!(await user.isValidPassword(currentPassword))) {
        throw new APIError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    return true;
};

/**
 * Get user by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
const getUserById = async (id) => {
    const user = await User.findById(id);

    if (!user) {
        throw new APIError('User not found', 404);
    }

    return user;
};

/**
 * Update user
 * @param {string} id
 * @param {Object} updateData
 * @returns {Promise<Object>}
 */
const updateUser = async (id, updateData) => {
    // Filter out password from update data
    const { password, ...dataToUpdate } = updateData;

    const user = await User.findByIdAndUpdate(
        id,
        dataToUpdate,
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new APIError('User not found', 404);
    }

    return {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
    };
};

module.exports = {
    login,
    createUser,
    changePassword,
    getUserById,
    updateUser
};