const jwt = require('jsonwebtoken');
const User = require('../models/User');
const APIError = require('../../utils/APIError');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new APIError('Authentication required', 401);
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new APIError('Invalid token format', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            throw new APIError('User not found or inactive', 401);
        }

        // Attach user to request object
        req.user = user;
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
};

const authorize = (...roles) => {
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

module.exports = {
    authenticate,
    authorize
};