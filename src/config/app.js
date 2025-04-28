const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const routes = require('../api/routes');
const { errorConverter, errorHandler } = require('../api/middlewares/error');
const CONFIG = require('./config');

// Initialize Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors());
// app.options('*', cors());

// Request logging
if (CONFIG.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Set up rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API routes
app.use('/api', routes);

// 404 route handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: 'Resource not found'
    });
});

// Convert errors to API Error format
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;