const express = require('express');
const authRoutes = require('./authRoutes');
const router = express.Router();

// Define API routes
router.use('/auth', authRoutes);

module.exports = router;