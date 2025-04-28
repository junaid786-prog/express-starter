const authService = require('../services/authService');
const APIResponse = require('../../utils/APIResponse');

/**
 * User login
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const userData = await authService.login(username, password);

        res.json(APIResponse.success(userData, 'Login successful'));
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new user
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const createUser = async (req, res, next) => {
    try {
        const user = await authService.createUser(req.body);
        res.status(201).json(APIResponse.success(user, 'User created successfully', 201));
    } catch (error) {
        next(error);
    }
};

/**
 * Change user password
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        await authService.changePassword(req.user.id, currentPassword, newPassword);
        res.json(APIResponse.success(null, 'Password changed successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getUserProfile = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);
        res.json(APIResponse.success(user));
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const updateUserProfile = async (req, res, next) => {
    try {
        const user = await authService.updateUser(req.user.id, req.body);
        res.json(APIResponse.success(user, 'Profile updated successfully'));
    } catch (error) {
        next(error);
    }
};

/**
 * Get user by ID (admin only)
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const getUser = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.params.id);
        res.json(APIResponse.success(user));
    } catch (error) {
        next(error);
    }
};

/**
 * Update user (admin only)
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
const updateUser = async (req, res, next) => {
    try {
        const user = await authService.updateUser(req.params.id, req.body);
        res.json(APIResponse.success(user, 'User updated successfully'));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    createUser,
    changePassword,
    getUserProfile,
    updateUserProfile,
    getUser,
    updateUser
};