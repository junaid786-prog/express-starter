const mongoose = require('mongoose');
const { PLAN_NAMES_LIST } = require('../../config/plans');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan: {
        type: String,
        enum: PLAN_NAMES_LIST,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'canceled', 'expired', 'past_due'],
        default: 'active'
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
    paymentMethod: {
        type: { type: String, enum: ['credit_card', 'paypal'] },
        details: { type: mongoose.Schema.Types.Mixed } // Tokenized payment info for future references
    },
    seats: {
        total: { type: Number, default: 1 },
        used: { type: Number, default: 1 }
    },
    customFeatures: [{ type: String }],
    priceId: { type: String },
    subscriptionId: { type: String }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create indexes
// subscriptionSchema.index({ userId: 1, plan: 1 }, { unique: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;