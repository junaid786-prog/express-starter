const express = require('express');
const { validate } = require('../middlewares/validator');
const { authenticate, authorize } = require('../middlewares/auth');
const authController = require('../controllers/authController');
const authValidator = require('../../utils/validators/authValidator');

const router = express.Router();

// Public routes
router.post('/login', validate(authValidator.login), authController.login);

// Protected routes
router.use(authenticate);

// User profile routes
router.get('/profile', authController.getUserProfile);
router.patch('/profile', validate(authValidator.updateProfile), authController.updateUserProfile);
router.post('/change-password', validate(authValidator.changePassword), authController.changePassword);

// Admin routes
router.post('/users', authenticate, authorize('admin'), validate(authValidator.createUser), authController.createUser);
router.get('/users/:id', authenticate, authorize('admin'), validate(authValidator.getUser), authController.getUser);
router.patch('/users/:id', authenticate, authorize('admin'), validate(authValidator.updateUser), authController.updateUser);

module.exports = router;