// Simple runtime dev detection usable in both Workers and Node contexts.
// Avoids import.meta.env which may differ across adapters.
// Treat both development and test environments as non-production for relaxed safeguards
// (e.g., allowing ephemeral dev signing keys). Production MUST explicitly set NODE_ENV=production.
const NODE_ENV = ((globalThis as any).process?.env?.NODE_ENV || '').toLowerCase();
export const IS_DEV = NODE_ENV === 'development' || NODE_ENV === 'test';
