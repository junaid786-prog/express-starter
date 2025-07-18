const Joi = require('joi');
const APIError = require('../../utils/APIError');

const validate = schema => (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate(object);

    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        return next(new APIError(errorMessage, 400));
    }

    // Replace request properties with validated values
    Object.assign(req, value);

    return next();
};

// Helper function to pick only specified properties from an object
const pick = (obj, keys) => {
    return keys.reduce((finalObj, key) => {
        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
            finalObj[key] = obj[key];
        }
        return finalObj;
    }, {});
};

module.exports = {
    validate,
    pick
};
