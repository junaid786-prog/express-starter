const mongoose = require('mongoose');
const { PLANS, PLAN_NAMES_LIST } = require('../../config/plans');

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Organization/team the user is being invited to
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    role: {
        type: String,
        enum: PLAN_NAMES_LIST,
        default: PLANS.BUSINESS
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'expired'],
        default: 'pending'
    },

    token: {
        type: String,
        required: true,
        unique: true
    },

    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    },

    message: {
        type: String,
        trim: true,
        maxlength: 500
    },

    resendCount: {
        type: Number,
        default: 0
    },

    // Last time the invitation was resent
    lastResent: {
        type: Date
    }
}, {
    timestamps: true
});

// Create indexes for efficient queries
// inviteSchema.index({ email: 1, teamId: 1 }, { unique: true }); 
// inviteSchema.index({ token: 1 }, { unique: true });
// inviteSchema.index({ expiresAt: 1 }); 
// inviteSchema.index({ status: 1 }); 

const Invite = mongoose.model('Invite', inviteSchema);

module.exports = Invite;