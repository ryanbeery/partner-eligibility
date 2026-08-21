import type { UserContext } from '../src/user-context';

/**
 * The one place tests encode UserContext's shape, so rule-shape tests stay
 * agnostic to it and a change to the type touches a single file.
 */
export const buildUserContext = (overrides: Partial<UserContext> = {}): UserContext => ({
  evaluationTime: new Date('2026-08-21T00:00:00.000Z'),
  ...overrides,
});
