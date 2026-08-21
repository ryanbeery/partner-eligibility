/**
 * The input to an evaluation. Everything a rule may read lives here, so a rule
 * never reaches for ambient state.
 *
 * Grouped by provenance rather than by subject: `user` holds first-party
 * profile attributes, while claims arrive from the partner SSO layer as
 * externally-asserted input. Keeping that boundary visible in the type is
 * deliberate in a module whose whole job is deciding who may see what.
 */

export type PartnerId = 'meridian' | 'northwind';

/** First-party profile attributes. */
export type User = {
  age: number;
  country: string;
  state: string;
};

export type MeridianClaim = {
  partnerId: 'meridian';
};

export type NorthwindClaim = {
  partnerId: 'northwind';
  /**
   * Tenure as a start date rather than a precomputed day count, so the check is
   * made against `evaluationTime` and never goes stale sitting in a claim.
   */
  tenureStart: Date;
};

/**
 * Claims keyed by partner rather than held in a list. A user cannot hold two
 * claims for the same partner, so a list would admit a state the domain forbids
 * and resolve it arbitrarily. The key also carries the discriminant, so a
 * lookup is already narrowed to that partner's claim type.
 *
 * Adding a partner is one entry here plus one in `PartnerId`.
 */
export type PartnerClaims = {
  meridian?: MeridianClaim;
  northwind?: NorthwindClaim;
};

export type UserContext = {
  user: User;
  /** Trusted as already verified by the upstream authentication layer. */
  claims: PartnerClaims;
  /**
   * Injected rather than read from the clock, so tenure and window checks are
   * deterministic. Every time-based rule and the engine's deadline resolve
   * against this single value.
   */
  evaluationTime: Date;
};
