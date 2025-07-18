require('dotenv').config();

const CONFIG = {
    PORT: process.env.PORT || 8000,
    MONGODB_URI: process.env.MONGODB_URI,

    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN || 7,

    NODE_ENV: process.env.NODE_ENV || 'development',

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_HOST: process.env.EMAIL_HOST,

    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

    COMPANY_NAME: process.env.COMPANY_NAME || 'Changetools',
    COMPANY_ADDRESS: process.env.COMPANY_ADDRESS || '123 Main St, City, Country',
    COMPANY_PHONE: process.env.COMPANY_PHONE || '+1234567890',

    LOGO_URL: process.env.LOGO_URL || 'https://example.com/logo.png'
};

module.exports = CONFIG;
