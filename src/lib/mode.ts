/**
 * Tra runs as a personal tool by default: one account, no public sign-up, landing page, trial or billing.
 * TRA_COMMERCIAL=1 on the server switches the commercial parts back on (they are kept, only hidden).
 */
export const commercialMode = () => process.env.TRA_COMMERCIAL === "1";

/** Pages that exist only for selling Tra to others. */
export const COMMERCIAL_ONLY = [/^\/welcome(\/|$)/, /^\/register(\/|$)/, /^\/terms(\/|$)/, /^\/settings\/billing(\/|$)/, /^\/billing(\/|$)/, /^\/api\/omise\//];
