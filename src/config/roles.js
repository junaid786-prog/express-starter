const { PLANS } = require("./plans");

const ROLES = {
    FREE: 'free',
    PROFESSIONAL: 'professional',
    BUSINESS: 'business',
    ENTERPRISE: 'enterprise',
    ADMIN: 'admin',
}

const USER_ROLES = {
    [PLANS.FREE]: 'free',
    [PLANS.PROFESSIONAL]: 'professional',
    [PLANS.BUSINESS]: 'business',
    [PLANS.ENTERPRISE]: 'enterprise',
    "admin": 'admin',
}

const USER_ROLES_LIST = [
    USER_ROLES[PLANS.FREE],
    USER_ROLES[PLANS.PROFESSIONAL],
    USER_ROLES[PLANS.BUSINESS],
    USER_ROLES[PLANS.ENTERPRISE],
    USER_ROLES["admin"],
];

// METHODS

const eligibleToInvite = (role) => {
    return role === USER_ROLES[PLANS.BUSINESS] || role === USER_ROLES[PLANS.ENTERPRISE] || role === USER_ROLES["admin"];
}

module.exports = {
    USER_ROLES,
    USER_ROLES_LIST,
    ROLES,
    eligibleToInvite
};