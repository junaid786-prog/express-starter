const crypto = require('crypto');
const Invite = require('../models/Invite');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const APIError = require('../../utils/APIError');
const emailService = require('../../utils/emailService');
const { PLANS } = require('../../config/plans');
const { USER_ROLES, ROLES } = require('../../config/roles');


class InviteService {
    /**
     * Create a new invitation
     * @param {Object} inviteData - Invitation details
     * @param {String} inviteData.email - Email of invitee
     * @param {String} inviteData.invitedBy - User ID of the inviter
     * @param {String} inviteData.teamId - Team/organization ID
     * @param {String} inviteData.role - Role to assign (optional)
     * @param {String} inviteData.message - Custom message (optional)
     * @returns {Object} New invitation
     */
    async createInvite(inviteData) {
        const { email, invitedBy, teamId, role = ROLES.BUSINESS, message } = inviteData;

        // Check if the inviter exists and has permission
        const inviter = await User.findById(invitedBy);
        if (!inviter) {
            throw new APIError('Inviter not found', 404);
        }

        // Validate team ID (should be the parent account)
        if (inviter._id.toString() !== teamId.toString()) {
            // If inviter is not the team owner, check if they have the right
            if (!inviter.parentAccount || inviter.parentAccount.toString() !== teamId.toString()) {
                throw new APIError('You do not have permission to invite users to this team', 403);
            }
        }

        // Check if team owner's subscription allows adding more users
        const subscription = await Subscription.findOne({ userId: teamId });
        if (!subscription) {
            throw new APIError('Team owner does not have an active subscription', 400);
        }

        // Check if the plan allows more members
        if (subscription.plan !== PLANS.BUSINESS && subscription.plan !== PLANS.PROFESSIONAL) {
            throw new APIError('Your current plan does not support team members', 400);
        }

        // For business tier, check seat limits
        if (subscription.plan === PLANS.BUSINESS) {
            // Count existing team members
            const teamMemberCount = await User.countDocuments({
                parentAccount: teamId,
                isActive: true
            });

            // Count pending invitations
            const pendingInviteCount = await Invite.countDocuments({
                teamId,
                status: 'pending'
            });

            const totalSeats = teamMemberCount + pendingInviteCount;
            if (totalSeats >= subscription.seats.total) {
                throw new APIError('You have reached the maximum number of team members for your plan', 400);
            }
        }

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // If user already belongs to this team
            if (
                (existingUser.parentAccount && existingUser.parentAccount.toString() === teamId.toString()) ||
                existingUser._id.toString() === teamId.toString()
            ) {
                throw new APIError('This user is already a member of your team', 400);
            }
        }

        // Check for existing pending invitation
        const existingInvite = await Invite.findOne({
            email,
            teamId,
            status: 'pending'
        });

        if (existingInvite) {
            throw new APIError('An invitation has already been sent to this email', 400);
        }

        // Generate unique token
        const token = crypto.randomBytes(32).toString('hex');

        // Create invitation
        const invite = await Invite.create({
            email,
            invitedBy,
            teamId,
            role,
            message,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Send invitation email
        await this.sendInviteEmail(invite, inviter);

        return invite;
    }

    /**
     * Send or resend invitation email
     * @param {Object} invite - Invitation object
     * @param {Object} inviter - User who sent the invite
     * @returns {Boolean} Success status
     */
    async sendInviteEmail(invite, inviter) {
        // Fetch team/organization details
        const team = await User.findById(invite.teamId);
        if (!team) {
            throw new APIError('Team not found', 404);
        }

        // Build the invitation URL
        const inviteUrl = `${process.env.FRONTEND_URL}/invite/accept/${invite.token}`;

        // Send email
        await emailService.sendEmail({
            to: invite.email,
            subject: `${inviter.name} has invited you to join ${team.company || 'their team'} on ${process.env.APP_NAME}`,
            templateKey: 'team-invitation',
            data: {
                inviteeName: '', // We don't know their name yet
                inviterName: inviter.name,
                teamName: team.company || 'their team',
                message: invite.message || '',
                inviteUrl: inviteUrl,
                expiryDate: new Date(invite.expiresAt).toLocaleDateString(),
                logoUrl: process.env.LOGO_URL || 'https://yourdomain.com/logo.png',
                companyName: process.env.COMPANY_NAME || 'Your Company',
                companyAddress: process.env.COMPANY_ADDRESS || 'Company Address',
                currentYear: new Date().getFullYear(),
                supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdomain.com'
            }
        });

        // Update last resent timestamp if this is a resend
        if (invite.resendCount > 0) {
            await Invite.findByIdAndUpdate(invite._id, {
                lastResent: new Date(),
                resendCount: invite.resendCount + 1
            });
        }

        return true;
    }

    /**
     * Resend invitation
     * @param {String} inviteId - Invitation ID
     * @param {String} userId - ID of user resending the invite
     * @returns {Object} Updated invitation
     */
    async resendInvite(inviteId, userId) {
        // Find the invitation
        const invite = await Invite.findById(inviteId);
        if (!invite) {
            throw new APIError('Invitation not found', 404);
        }

        // Check permissions
        if (invite.invitedBy.toString() !== userId.toString() && invite.teamId.toString() !== userId.toString()) {
            throw new APIError('You do not have permission to resend this invitation', 403);
        }

        // Check if invitation is still pending
        if (invite.status !== 'pending') {
            throw new APIError('This invitation has already been processed', 400);
        }

        // Check if invitation has expired, extend if needed
        if (invite.expiresAt < new Date()) {
            invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend for 7 more days
            await invite.save();
        }

        // Get inviter details
        const inviter = await User.findById(userId);
        if (!inviter) {
            throw new APIError('User not found', 404);
        }

        // Send the invitation email
        await this.sendInviteEmail(invite, inviter);

        // Update resend count
        invite.resendCount += 1;
        invite.lastResent = new Date();
        await invite.save();

        return invite;
    }

    /**
     * Cancel invitation
     * @param {String} inviteId - Invitation ID
     * @param {String} userId - ID of user cancelling the invite
     * @returns {Object} Cancelled invitation
     */
    async cancelInvite(inviteId, userId) {
        // Find the invitation
        const invite = await Invite.findById(inviteId);
        if (!invite) {
            throw new APIError('Invitation not found', 404);
        }

        // Check permissions
        if (invite.invitedBy.toString() !== userId.toString() && invite.teamId.toString() !== userId.toString()) {
            throw new APIError('You do not have permission to cancel this invitation', 403);
        }

        // Check if invitation is still pending
        if (invite.status !== 'pending') {
            throw new APIError('This invitation has already been processed', 400);
        }

        // Update status to expired
        invite.status = 'expired';
        invite.updatedAt = new Date();
        await invite.save();

        return invite;
    }

    /**
     * Get invitation by token
     * @param {String} token - Invitation token
     * @returns {Object} Invitation
     */
    async getInviteByToken(token) {
        const invite = await Invite.findOne({ token })
            .populate('invitedBy', 'name email')
            .populate('teamId', 'name company');

        if (!invite) {
            throw new APIError('Invalid or expired invitation', 404);
        }

        // Check if invitation has expired
        if (invite.expiresAt < new Date()) {
            invite.status = 'expired';
            await invite.save();
            throw new APIError('This invitation has expired', 400);
        }

        // Check if invitation has already been processed
        if (invite.status !== 'pending') {
            throw new APIError(`This invitation has already been ${invite.status}`, 400);
        }

        return invite;
    }

    /**
     * Accept invitation
     * @param {String} token - Invitation token
     * @param {Object} userData - User data for registration
     * @returns {Object} User and team info
     */
    async acceptInvite(token, userData) {
        // Get the invitation
        const invite = await this.getInviteByToken(token);

        // Check if user already exists
        let user = await User.findOne({ email: invite.email });
        const isNewUser = !user;

        if (isNewUser) {
            // Create new user account
            user = await User.create({
                name: userData.name,
                email: invite.email,
                password: userData.password,
                role: invite.role,
                parentAccount: invite.teamId,
                isEmailVerified: true, // Auto-verify since they came through invitation
                isActive: true
            });
        } else {
            // Update existing user to join the team
            if (user.parentAccount) {
                throw new APIError('You already belong to a team. Please contact support to change teams.', 400);
            }

            user.parentAccount = invite.teamId;
            user.role = invite.role;
            await user.save();
        }

        // Update team owner's child accounts array
        await User.findByIdAndUpdate(invite.teamId, {
            $addToSet: { childAccounts: user._id }
        });

        // Update invitation status
        invite.status = 'accepted';
        invite.updatedAt = new Date();
        await invite.save();

        // Get team info
        const team = await User.findById(invite.teamId, 'name company');

        // Send welcome email
        await this.sendWelcomeEmail(user, team, isNewUser);

        // Send notification to team owner
        await this.sendTeamJoinNotification(user, team);

        return { user, team };
    }

    /**
     * Decline invitation
     * @param {String} token - Invitation token
     * @returns {Object} Updated invitation
     */
    async declineInvite(token) {
        // Get the invitation
        const invite = await this.getInviteByToken(token);

        // Update invitation status
        invite.status = 'declined';
        invite.updatedAt = new Date();
        await invite.save();

        // Notify team owner
        const invitee = { email: invite.email };
        const team = await User.findById(invite.teamId, 'name email company');
        await this.sendInviteDeclinedNotification(invitee, team);

        return invite;
    }

    /**
     * Get all invitations for a team
     * @param {String} teamId - Team ID
     * @param {Object} options - Query options (status, limit, skip)
     * @returns {Array} List of invitations
     */
    async getTeamInvites(teamId, options = {}) {
        const { status, limit = 20, skip = 0 } = options;

        // Build query
        const query = { teamId };
        if (status) {
            query.status = status;
        }

        // Get invitations
        const invites = await Invite.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('invitedBy', 'name email');

        // Get total count
        const total = await Invite.countDocuments(query);

        return { invites, total };
    }

    /**
     * Send welcome email to new team member
     * @param {Object} user - New user
     * @param {Object} team - Team info
     * @param {Boolean} isNewUser - Whether user is new or existing
     */
    async sendWelcomeEmail(user, team, isNewUser) {
        // Different templates for new vs existing users
        const templateKey = isNewUser ? 'team-welcome-new' : 'team-welcome-existing';

        await emailService.sendEmail({
            to: user.email,
            subject: `Welcome to ${team.company || 'the team'} on ${process.env.APP_NAME}`,
            templateKey,
            data: {
                name: user.name,
                teamName: team.company || 'the team',
                role: user.role,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
                logoUrl: process.env.LOGO_URL || 'https://yourdomain.com/logo.png',
                companyName: process.env.COMPANY_NAME || 'Your Company',
                companyAddress: process.env.COMPANY_ADDRESS || 'Company Address',
                currentYear: new Date().getFullYear(),
                supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdomain.com'
            }
        });
    }

    /**
     * Notify team owner when someone joins
     * @param {Object} user - New team member
     * @param {Object} team - Team info
     */
    async sendTeamJoinNotification(user, team) {
        await emailService.sendEmail({
            to: team.email,
            subject: `${user.name} has joined your team on ${process.env.APP_NAME}`,
            templateKey: 'team-member-joined',
            data: {
                ownerName: team.name,
                memberName: user.name,
                memberEmail: user.email,
                teamName: team.company || 'your team',
                teamUrl: `${process.env.FRONTEND_URL}/team`,
                logoUrl: process.env.LOGO_URL || 'https://yourdomain.com/logo.png',
                companyName: process.env.COMPANY_NAME || 'Your Company',
                companyAddress: process.env.COMPANY_ADDRESS || 'Company Address',
                currentYear: new Date().getFullYear()
            }
        });
    }

    /**
     * Notify team owner when invitation is declined
     * @param {Object} invitee - Invited user
     * @param {Object} team - Team info
     */
    async sendInviteDeclinedNotification(invitee, team) {
        await emailService.sendEmail({
            to: team.email,
            subject: `Invitation to join ${team.company || 'your team'} was declined`,
            templateKey: 'team-invite-declined',
            data: {
                ownerName: team.name,
                inviteeEmail: invitee.email,
                teamName: team.company || 'your team',
                teamUrl: `${process.env.FRONTEND_URL}/team`,
                logoUrl: process.env.LOGO_URL || 'https://yourdomain.com/logo.png',
                companyName: process.env.COMPANY_NAME || 'Your Company',
                companyAddress: process.env.COMPANY_ADDRESS || 'Company Address',
                currentYear: new Date().getFullYear()
            }
        });
    }

    /**
     * Clean up expired invitations 
     * @returns {Number} Number of invitations cleaned up
     */
    async cleanupExpiredInvites() {
        const result = await Invite.updateMany(
            {
                status: 'pending',
                expiresAt: { $lt: new Date() }
            },
            {
                status: 'expired',
                updatedAt: new Date()
            }
        );

        return result.nModified || 0;
    }
}

module.exports = new InviteService();