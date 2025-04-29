const PLANS = {
    FREE: 'free',
    PROFESSIONAL: 'professional',
    BUSINESS: 'business',
    ENTERPRISE: 'enterprise',
}

const PLAN_NAMES = {
    [PLANS.FREE]: 'free',
    [PLANS.PROFESSIONAL]: 'professional',
    [PLANS.BUSINESS]: 'business',
    [PLANS.ENTERPRISE]: 'enterprise',
}

const PLANS_DATA = {
    [PLANS.FREE]: {
        name: PLAN_NAMES[PLANS.FREE],
        price: 0,
        allowed_reports: 5,
        allowed_users: 1,
        features: [
            'Basic features',
            'Limited support',
            'Community access',
        ],
    },
    [PLANS.PROFESSIONAL]: {
        name: PLAN_NAMES[PLANS.PROFESSIONAL],
        price: 19,
        allowed_reports: 20,
        allowed_users: 5,
        features: [
            'All Free features',
            'Priority support',
            'Advanced analytics',
        ],
    },
    [PLANS.BUSINESS]: {
        name: PLAN_NAMES[PLANS.BUSINESS],
        price: 49,
        allowed_reports: 50,
        allowed_users: 10,
        features: [
            'All Professional features',
            'Team collaboration tools',
            'Custom integrations',
        ],
    },
    [PLANS.ENTERPRISE]: {
        name: PLAN_NAMES[PLANS.ENTERPRISE],
        price: 99,
        allowed_reports: 100,
        allowed_users: 20,
        features: [
            'All Business features',
            'Dedicated account manager',
            'Custom SLAs and uptime guarantees',
        ],
    },
}

const TIERS_LEVELS = {
    [PLANS.FREE]: 0,
    [PLANS.PROFESSIONAL]: 1,
    [PLANS.BUSINESS]: 2,
    [PLANS.ENTERPRISE]: 3,
    "admin": 4,
};

const PLAN_NAMES_LIST = [
    PLAN_NAMES[PLANS.FREE],
    PLAN_NAMES[PLANS.PROFESSIONAL],
    PLAN_NAMES[PLANS.BUSINESS],
    PLAN_NAMES[PLANS.ENTERPRISE],
];

module.exports = {
    PLANS,
    PLAN_NAMES,
    PLANS_DATA,
    TIERS_LEVELS,
    PLAN_NAMES_LIST,
}