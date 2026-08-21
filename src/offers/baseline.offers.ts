import type { Offer } from '../offer';
import { allowListRule } from '../rules/allow-list.rule';
import { thresholdRule } from '../rules/threshold.rule';

/**
 * Baseline offers, open to anyone who qualifies. This module is where the
 * generic rule shapes get bound to concrete domain values; the shapes
 * themselves know nothing about age or residency.
 */

const MINIMUM_AGE = 18;
const ELIGIBLE_COUNTRIES: readonly string[] = ['US'];

/** Baselines rank below exclusives so a qualifying exclusive supersedes them. */
const BASELINE_PRIORITY = 0;

/**
 * Shared by every baseline offer: both products carry the same entry
 * requirements, so they compose the same rules rather than restating them.
 */
const baselineRules = [
  thresholdRule((context) => context.user.age, MINIMUM_AGE),
  allowListRule((context) => context.user.country, ELIGIBLE_COUNTRIES),
];

export const baselineOffers: readonly Offer[] = [
  {
    id: 'baseline-savings',
    product: 'savings-account',
    type: 'baseline',
    priority: BASELINE_PRIORITY,
    rules: baselineRules,
  },
  {
    id: 'baseline-credit-card',
    product: 'credit-card',
    type: 'baseline',
    priority: BASELINE_PRIORITY,
    rules: baselineRules,
  },
];
