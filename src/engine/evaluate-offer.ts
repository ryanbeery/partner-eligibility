import type { Offer } from '../offer';
import type { Rule, RuleResult } from '../rules/rule';
import type { UserContext } from '../user-context';
import { TIMED_OUT, type Deadline } from './deadline';

export type OfferEvaluation =
  | { status: 'eligible'; offer: Offer }
  | { status: 'ineligible'; offer: Offer; reasons: readonly string[] }
  | { status: 'unavailable'; offer: Offer; reasons: readonly string[] };

/**
 * Runs one offer's rules and classifies the outcome.
 *
 * Rules run concurrently and are not short-circuited on first failure. Ordering
 * them by cost would save the occasional external call, but it trades away the
 * full set of failure reasons that the isolation and degraded-path assertions
 * read against.
 *
 * TODO: two performance fixes left for later.
 *   1. Skip expensive rules once a cheap one has already failed. Today a user
 *      under 18 still triggers the credit score lookup, since every rule runs.
 *      The catch is that skipping rules means losing their failure reasons.
 *   2. Cancel dependency calls that miss the deadline. Losing the race stops us
 *      waiting on the call, but the call itself keeps running. Passing an
 *      AbortSignal down to it would actually stop the work.
 */
export const evaluateOffer = async (
  offer: Offer,
  context: UserContext,
  deadline: Deadline,
): Promise<OfferEvaluation> => {
  const ruleResults = await Promise.all(
    offer.rules.map((rule) => evaluateRuleWithinDeadline(rule, context, deadline)),
  );

  const failedReasons = ruleResults.flatMap((result) =>
    result.status === 'fail' ? [result.reason] : [],
  );
  const unavailableReasons = ruleResults.flatMap((result) =>
    result.status === 'unavailable' ? [result.reason] : [],
  );

  // A definitive failure settles the question: the user would not have qualified
  // even if the unverifiable rule had come back clean. Reporting 'unavailable'
  // here would imply a retry might help and would put the offer in the withheld
  // record as though it were nearly earned.
  if (failedReasons.length > 0) {
    return { status: 'ineligible', offer, reasons: failedReasons };
  }

  if (unavailableReasons.length > 0) {
    return { status: 'unavailable', offer, reasons: unavailableReasons };
  }

  return { status: 'eligible', offer };
};

/**
 * Races one rule against the shared deadline and absorbs anything it throws.
 * Both a timeout and a thrown error become `unavailable`, which is what keeps
 * fail-closed structural: an offer whose rules could not be checked is withheld
 * rather than surfaced, and one failing dependency never fails the request.
 */
const evaluateRuleWithinDeadline = async (
  rule: Rule,
  context: UserContext,
  deadline: Deadline,
): Promise<RuleResult> => {
  try {
    // Two promises, first one to finish wins. Either the rule produces a
    // RuleResult, or the shared deadline fires and resolves to TIMED_OUT.
    const resultOrTimeout = await Promise.race([rule(context), deadline]);

    if (resultOrTimeout === TIMED_OUT) {
      return { status: 'unavailable', reason: 'deadline reached before the rule completed' };
    }

    return resultOrTimeout;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { status: 'unavailable', reason: `rule threw: ${detail}` };
  }
};
