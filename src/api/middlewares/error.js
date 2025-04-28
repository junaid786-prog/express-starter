const CONFIG = require('../../config/config');
const APIError = require('../../utils/APIError');
const APIResponse = require('../../utils/APIResponse');

const errorConverter = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof APIError)) {
        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || 'Something went wrong';
        error = new APIError(message, statusCode, error.isOperational, error.stack);
    }

    next(error);
};

const errorHandler = (err, req, res, next) => {
    const { statusCode, message } = err;

    // Log error details for monitoring
    if (CONFIG.NODE_ENV === 'development') {
        console.error(err);
    }

    // Sequelize validation errors handling
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res
            .status(400)
            .json(APIResponse.error(err.errors.map(e => e.message).join(', '), 400));
    }

    // Send standardized error response
    const response = APIResponse.error(
        message,
        statusCode
    );

    res.status(statusCode).json(response);
};

module.exports = {
    errorConverter,
    errorHandler
};