const Joi = require('joi');

const login = {
    body: Joi.object().keys({
        username: Joi.string().required(),
        password: Joi.string().required()
    })
};

const createUser = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        username: Joi.string().required(),
        email: Joi.string().email().allow(null, ''),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('user', 'admin', 'customer').required(),
        isActive: Joi.boolean().default(true)
    })
};

const changePassword = {
    body: Joi.object().keys({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(6).required()
    })
};

const updateProfile = {
    body: Joi.object()
        .keys({
            name: Joi.string(),
            email: Joi.string().email().allow(null, '')
        })
        .min(1)
};

const getUser = {
    params: Joi.object().keys({
        id: Joi.number().integer().required()
    })
};

const updateUser = {
    params: Joi.object().keys({
        id: Joi.number().integer().required()
    }),
    body: Joi.object()
        .keys({
            name: Joi.string(),
            email: Joi.string().email().allow(null, ''),
            role: Joi.string().valid('admin', 'manager', 'staff'),
            isActive: Joi.boolean()
        })
        .min(1)
};

module.exports = {
    login,
    createUser,
    changePassword,
    updateProfile,
    getUser,
    updateUser
};
