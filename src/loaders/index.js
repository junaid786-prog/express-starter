const startDatabase = require('./mongoose');
const startExpress = require('./express');
const logger = require('../config/logger');

const startApp = async () => {
    try {
        // Initialize database connection
        logger.info('Initializing database connection...');
        await startDatabase();

        // Start Express server
        const port = process.env.PORT || 8000;
        logger.info('Starting Express server...');
        const server = await startExpress(port);

        logger.info('Application successfully started');
        return server;
    } catch (error) {
        logger.error('Application failed to start:', error);
        process.exit(1);
    }
};

module.exports = startApp;