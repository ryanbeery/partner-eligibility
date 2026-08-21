import type { UserContext } from './user-context';

/**
 * The one external dependency in this module. It can be slow, time out, or be
 * down, and what happens then is the point of the degraded path: a score that
 * cannot be fetched withholds the offer depending on it and nothing else.
 *
 * A rule is handed this service when it is built, and holds onto it. Evaluating
 * the rule never looks a service up. The alternative, a rule that reaches for
 * the service while it runs, could only be tested by intercepting an import or
 * swapping a global; this one is tested by passing a different argument.
 */
export type CreditScoreService = {
  fetchScore: (context: UserContext) => Promise<number>;
};

/**
 * Stand-in for a real integration, per the brief's instruction to mock
 * dependencies. Returns a fixed score with no latency.
 *
 * A real implementation would key off an identifier from the partner claim
 * rather than the whole context, and would accept the AbortSignal named in the
 * deferred work on `evaluateOffer` so a call past the deadline is cancelled.
 */
export const creditScoreService: CreditScoreService = {
  fetchScore: async () => 700,
};
