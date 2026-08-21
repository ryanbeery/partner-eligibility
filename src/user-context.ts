/**
 * The input to an evaluation. Everything a rule may read lives here, so a rule
 * never reaches for ambient state.
 *
 * Grouped by provenance rather than by subject: `user` holds first-party
 * profile attributes, and partner-asserted data will sit alongside it rather
 * than inside it.
 */

/** First-party profile attributes. */
export type User = {
  age: number;
  country: string;
};

export type UserContext = {
  user: User;
  /**
   * Injected rather than read from the clock, so tenure and window checks are
   * deterministic. Every time-based rule and the engine's deadline resolve
   * against this single value.
   */
  evaluationTime: Date;
};
