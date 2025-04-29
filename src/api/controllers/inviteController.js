const { ROLES, eligibleToInvite } = require('../../config/roles');
const APIError = require('../../utils/APIError');
const APIResponse = require('../../utils/APIResponse');
const catchAsync = require('../../utils/catchAsync');
const inviteService = require('../services/inviteService');

/**
 * Create a new team invitation
 * @route POST /api/invites
 */
exports.createInvite = catchAsync(async (req, res, next) => {
    const { email, role, message } = req.body;

    // For team invites, the teamId is the parent account (which could be the current user)
    const inviteData = {
        email,
        invitedBy: req.user._id,
        teamId: req.user.parentAccount || req.user._id,
        role: role || ROLES.BUSINESS,
        message
    };

    // Create invitation
    const invite = await inviteService.createInvite(inviteData);

    const response = APIResponse.success(
        { invite },
        'Invitation sent successfully',
        201
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Resend an invitation
 * @route POST /api/invites/:id/resend
 */
exports.resendInvite = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Resend invitation
    const invite = await inviteService.resendInvite(id, req.user._id);

    const response = APIResponse.success(
        { invite },
        'Invitation resent successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Cancel an invitation
 * @route DELETE /api/invites/:id
 */
exports.cancelInvite = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // Cancel invitation
    const invite = await inviteService.cancelInvite(id, req.user._id);

    const response = APIResponse.success(
        { invite },
        'Invitation cancelled successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Get invitation details by token (for public access)
 * @route GET /api/invites/token/:token
 */
exports.getInviteByToken = catchAsync(async (req, res, next) => {
    const { token } = req.params;

    // Get invitation details
    const invite = await inviteService.getInviteByToken(token);

    const response = APIResponse.success(
        { invite },
        'Invitation retrieved successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Accept an invitation
 * @route POST /api/invites/accept/:token
 */
exports.acceptInvite = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const userData = {
        name: req.body.name,
        password: req.body.password
    };

    // Accept invitation
    const { user, team } = await inviteService.acceptInvite(token, userData);

    const response = APIResponse.success(
        { user, team },
        'Invitation accepted successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Decline an invitation
 * @route POST /api/invites/decline/:token
 */
exports.declineInvite = catchAsync(async (req, res, next) => {
    const { token } = req.params;

    // Decline invitation
    const invite = await inviteService.declineInvite(token);

    const response = APIResponse.success(
        { invite },
        'Invitation declined successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Get all invitations for a team
 * @route GET /api/invites/team
 */
exports.getTeamInvites = catchAsync(async (req, res, next) => {
    // Determine team ID (current user or parent account)
    const teamId = req.user.parentAccount || req.user._id;

    // Parse query parameters
    const options = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 20,
        skip: parseInt(req.query.skip) || 0
    };

    // Get invitations
    const { invites, total } = await inviteService.getTeamInvites(teamId, options);

    const response = APIResponse.success(
        { invites, total, limit: options.limit, skip: options.skip },
        'Invitations retrieved successfully',
        200
    );

    return res.status(response.statusCode).json(response);
});

/**
 * Check if a user can send invites
 * @route GET /api/invites/can-invite
 */
exports.canInvite = catchAsync(async (req, res, next) => {
    const canInvite = eligibleToInvite(req.user.role);

    const response = APIResponse.success(
        { canInvite },
        canInvite ? 'User can send invitations' : 'User cannot send invitations',
        200
    );

    return res.status(response.statusCode).json(response);
});