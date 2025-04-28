require('dotenv').config();
const startApp = require('./loaders');
const logger = require('./config/logger');
const CONFIG = require('./config/config');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION:', reason);
});

// Start the application
startApp()
    .then(() => {
        logger.info(`Environment: ${CONFIG.NODE_ENV}`);
    })
    .catch((error) => {
        logger.error('Failed to start application:', error);
        process.exit(1);
    });