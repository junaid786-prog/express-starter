const dbConfig = require('../config/database');
const logger = require('../config/logger');

const startDatabase = async () => {
    try {
        // Test database connection
        await dbConfig.connect();
    } catch (error) {
        logger.error('Database initialization failed:', error);
        throw error;
    }
};

module.exports = startDatabase;
