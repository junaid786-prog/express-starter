const express = require('express');
const authRoutes = require('./authRoutes');
const inviteRoutes = require('./inviteRoutes')
const router = express.Router();

// Define API routes
router.use('/auth', authRoutes);
router.use('/invites', inviteRoutes);
module.exports = router;