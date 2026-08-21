import type { AdvanceHistory, PartnerClaims, User, UserContext } from '../src/user-context';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fixed so every date a test reasons about is relative to a known instant. */
const DEFAULT_EVALUATION_TIME = new Date('2026-08-21T00:00:00.000Z');

const daysBefore = (days: number, from: Date = DEFAULT_EVALUATION_TIME): Date =>
  new Date(from.getTime() - days * DAY_MS);

type UserContextOverrides = {
  user?: Partial<User>;
  claims?: PartnerClaims;
  advanceHistory?: readonly AdvanceHistory[];
  evaluationTime?: Date;
  /**
   * Read only by buildNorthwindMember, which converts it to the start date the
   * claim carries. Tests vary tenure in days, so that is what they pass.
   */
  tenureDays?: number;
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
    state: overrides.user?.state ?? 'TX',
  },
  // No claims by default: a Direct member is the case that must never see an
  // exclusive, so tests have to opt in to being a partner member.
  claims: overrides.claims ?? {},
  advanceHistory: overrides.advanceHistory ?? [],
  evaluationTime: overrides.evaluationTime ?? DEFAULT_EVALUATION_TIME,
});

/**
 * A member arriving with a trusted Meridian claim, otherwise identical to the
 * defaults above. Every other Meridian requirement is met by default, so a test
 * overrides only the one it is exercising.
 *
 * Claims are merged rather than replaced, so a test can build a user holding
 * both partners' claims. That only works in one direction today: passing a
 * Meridian claim to buildNorthwindMember is easy because the claim is a bare
 * object, while the reverse means hand-building a tenureStart date, which is
 * the exact chore these helpers exist to remove.
 *
 * Next step: replace both builders with claim-adding functions that take a
 * context and return one, so partners compose in any order and any combination.
 *
 *   withMeridianClaim(buildUserContext())
 *   withNorthwindClaim(buildUserContext(), 89)
 *   withNorthwindClaim(withMeridianClaim(buildUserContext()))
 *
 * That scales as one function per partner rather than one per combination, and
 * takes tenureDays back off UserContextOverrides, where it is meaningless to
 * every builder except this one.
 */
export const buildMeridianMember = (overrides: UserContextOverrides = {}): UserContext =>
  buildUserContext({
    ...overrides,
    claims: { ...overrides.claims, meridian: { partnerId: 'meridian' } },
  });

/** Comfortably past the 90 day tenure requirement. */
const DEFAULT_TENURE_DAYS = 200;

/**
 * A member arriving with a trusted Northwind claim. Tenure is given in days
 * because that is what the tests vary, and converted here to the start date the
 * claim actually carries.
 */
export const buildNorthwindMember = (overrides: UserContextOverrides = {}): UserContext =>
  buildUserContext({
    ...overrides,
    claims: {
      ...overrides.claims,
      northwind: {
        partnerId: 'northwind',
        tenureStart: daysBefore(
          overrides.tenureDays ?? DEFAULT_TENURE_DAYS,
          overrides.evaluationTime,
        ),
      },
    },
  });

/** An advance taken the given number of days before the evaluation time. */
export const advanceTakenDaysAgo = (days: number, evaluationTime?: Date): AdvanceHistory => ({
  takenAt: daysBefore(days, evaluationTime),
});
