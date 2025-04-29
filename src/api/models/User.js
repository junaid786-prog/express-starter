const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES_LIST } = require('../../config/roles');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true },
    profilePicture: { type: String },
    googleId: { type: String },
    role: {
        type: String,
        enum: USER_ROLES_LIST,
        default: 'free'
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    // If business tier with multiple users
    parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // For business tier parent accounts
    childAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' },
    company: { type: String },
    position: { type: String },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    isEmailVerified: { type: Boolean, default: false },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    passwordChangedAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create indexes
// userSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash the password if it's modified or new
    if (!this.isModified('password')) return next();

    // Hash the password with a salt of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Update the updatedAt timestamp
userSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});

// Method to validate password
userSchema.methods.isValidPassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;