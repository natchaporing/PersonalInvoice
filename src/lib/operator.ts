import "server-only";

/**
 * Who runs Tra, as published in the terms, privacy notice and data requests. Set on the server:
 * OPERATOR_NAME, OPERATOR_TAX_ID, OPERATOR_ADDRESS and CONTACT_EMAIL. Until all four are set, the terms page
 * shows that it is not in force yet.
 */
export function operator() {
  const name = process.env.OPERATOR_NAME?.trim() || null;
  const taxId = process.env.OPERATOR_TAX_ID?.trim() || null;
  const address = process.env.OPERATOR_ADDRESS?.trim() || null;
  const email = process.env.CONTACT_EMAIL?.trim() || null;
  return { name, taxId, address, email, ready: !!(name && taxId && address && email) };
}
