const express = require('express');
const inviteController = require('../controllers/inviteController');
const authMiddleware = require('../middlewares/auth');
const { PLANS } = require('../../config/plans');

const router = express.Router();

router.get('/token/:token', inviteController.getInviteByToken);
router.post('/accept/:token', inviteController.acceptInvite);
router.post('/decline/:token', inviteController.declineInvite);

router.use(authMiddleware.authenticate);

// Check if user can send invitations
router.get('/can-invite', inviteController.canInvite);

// Routes for team invitations
router.post('/',
    authMiddleware.checkSubscription(PLANS.BUSINESS),
    inviteController.createInvite
);

router.post('/:id/resend', inviteController.resendInvite);
router.delete('/:id', inviteController.cancelInvite);
router.get('/team', inviteController.getTeamInvites);

module.exports = router;