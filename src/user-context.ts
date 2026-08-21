/**
 * The input to an evaluation. Everything a rule may read lives here, so a rule
 * never reaches for ambient state.
 */
export type UserContext = {
  /**
   * Injected rather than read from the clock, so tenure and window checks are
   * deterministic. Every time-based rule and the engine's deadline resolve
   * against this single value.
   */
  evaluationTime: Date;
};
