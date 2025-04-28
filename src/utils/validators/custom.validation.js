const mongoose = require('mongoose');

/**
 * Custom validation for MongoDB ObjectId
 * @param {string} value - Value to validate
 * @param {Object} helpers - Joi helpers
 * @returns {string|Object} - Returns value or error
 */
const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('{{#label}} must be a valid MongoDB ObjectId');
    }
    return value;
};

/**
 * Custom validation for a password
 * @param {string} value - Value to validate
 * @param {Object} helpers - Joi helpers
 * @returns {string|Object} - Returns value or error
 */
const password = (value, helpers) => {
    if (value.length < 8) {
        return helpers.message('password must be at least 8 characters');
    }

    // Check if password contains at least one number and one letter
    if (!(/\d/.test(value) && /[a-zA-Z]/.test(value))) {
        return helpers.message('password must contain at least 1 letter and 1 number');
    }

    return value;
};

module.exports = {
    objectId,
    password
};