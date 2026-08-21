import type { PartnerClaims, User, UserContext } from '../src/user-context';

type UserContextOverrides = {
  user?: Partial<User>;
  claims?: PartnerClaims;
  evaluationTime?: Date;
};

/**
 * The one place tests encode UserContext's shape, so rule-shape tests stay
 * agnostic to it and a change to the type touches a single file.
 *
 * Defaults describe a user who satisfies every baseline rule, so a test only
 * has to state the attribute it is actually exercising.
 */
export const buildUserContext = (overrides: UserContextOverrides = {}): UserContext => ({
  user: {
    age: overrides.user?.age ?? 30,
    country: overrides.user?.country ?? 'US',
  },
  // No claims by default: a Direct member is the case that must never see an
  // exclusive, so tests have to opt in to being a partner member.
  claims: overrides.claims ?? {},
  evaluationTime: overrides.evaluationTime ?? new Date('2026-08-21T00:00:00.000Z'),
});
