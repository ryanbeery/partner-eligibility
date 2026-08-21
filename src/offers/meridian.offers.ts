import type { CreditScoreService } from '../credit-score.service';
import type { Offer } from '../offer';
import { allowListRule } from '../rules/allow-list.rule';
import { claimPresentRule } from '../rules/claim-present.rule';
import { thresholdRule } from '../rules/threshold.rule';

/**
 * Meridian's exclusive savings rate. Everything partner-specific lives here:
 * the thresholds, the eligible states, and the priority that lets this
 * supersede the baseline savings offer. The rule shapes and the engine know
 * none of it.
 */

const MINIMUM_CREDIT_SCORE = 640;
const ELIGIBLE_STATES: readonly string[] = ['OH', 'MI', 'IN', 'TX'];

/** Above baseline, so a qualifying member sees this instead of the baseline. */
const MERIDIAN_PRIORITY = 100;

/**
 * Takes the credit score service as an argument instead of importing it.
 *
 * The degraded path is the behavior that matters most in this module, and the
 * only way to test it is to control what the dependency does: fail, hang, or
 * return a specific score. Importing the real service here would mean reaching
 * for module mocking to do that, which ties tests to import paths and breaks
 * quietly when files move.
 *
 * It also keeps the rule contract honest. A rule captures what it needs when it
 * is built, so nothing goes looking for a service mid-evaluation.
 */
export const createMeridianOffers = (creditScore: CreditScoreService): readonly Offer[] => [
  {
    id: 'meridian-savings',
    product: 'savings-account',
    type: 'exclusive',
    priority: MERIDIAN_PRIORITY,
    rules: [
      claimPresentRule('meridian'),
      // Note this runs even for a user with no Meridian claim, since rules are
      // not short-circuited. That is the cost-aware staging tradeoff recorded
      // on evaluateOffer.
      thresholdRule((context) => creditScore.fetchScore(context), MINIMUM_CREDIT_SCORE),
      allowListRule((context) => context.user.state, ELIGIBLE_STATES),
    ],
  },
];
