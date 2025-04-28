const mongoose = require('mongoose');
const logger = require('./logger');
const CONFIG = require('./config');

/**
 * Database connection configuration
 */
const dbConfig = {
    // Connection options
    options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: CONFIG.NODE_ENV !== 'production', // Build indexes in development but not in production
    },

    /**
     * Connect to MongoDB
     * @returns {Promise<mongoose.Connection>}
     */
    connect: async () => {
        try {
            const uri = CONFIG.MONGODB_URI;

            // Set up MongoDB connection events
            mongoose.connection.on('connected', () => {
                logger.info('MongoDB connected successfully');
            });

            mongoose.connection.on('error', (err) => {
                logger.error(`MongoDB connection error: ${err}`);
            });

            mongoose.connection.on('disconnected', () => {
                logger.info('MongoDB disconnected');
            });

            // Handle Node.js process termination
            process.on('SIGINT', async () => {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed due to app termination');
                process.exit(0);
            });

            // Connect to MongoDB
            await mongoose.connect(uri, dbConfig.options);
            return mongoose.connection;
        } catch (error) {
            logger.error(`Error connecting to MongoDB: ${error.message}`);
            throw error;
        }
    }
};

module.exports = dbConfig;