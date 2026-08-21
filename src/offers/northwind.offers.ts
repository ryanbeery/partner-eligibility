import type { Offer } from '../offer';
import { claimPresentRule } from '../rules/claim-present.rule';
import { timeElapsedRule } from '../rules/time-elapsed.rule';
import { windowedCountRule } from '../rules/windowed-count.rule';

/**
 * Northwind's exclusive earned-wage advance.
 *
 * Unlike Meridian, this needs no injected service: every rule reads from the
 * context, so the offers are a plain value rather than a factory.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const MINIMUM_TENURE_MS = 90 * DAY_MS;
const ADVANCE_LIMIT = { windowMs: 30 * DAY_MS, maximum: 2 };

/**
 * Nothing competes with this offer, since no baseline exists for the product,
 * so the number only matters if a second advance offer is ever added. Kept in
 * the exclusive band for consistency with Meridian.
 */
const NORTHWIND_PRIORITY = 100;

export const northwindOffers: readonly Offer[] = [
  {
    id: 'northwind-advance',
    product: 'earned-wage-advance',
    type: 'exclusive',
    priority: NORTHWIND_PRIORITY,
    rules: [
      claimPresentRule('northwind'),
      // Tenure lives on the claim as a start date, so it is measured against
      // the evaluation time rather than trusted as a precomputed day count.
      timeElapsedRule((context) => context.claims.northwind?.tenureStart, MINIMUM_TENURE_MS),
      windowedCountRule(
        (context) => context.advanceHistory.map((advance) => advance.takenAt),
        ADVANCE_LIMIT,
      ),
    ],
  },
];
