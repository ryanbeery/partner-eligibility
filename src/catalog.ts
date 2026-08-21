import { creditScoreService } from './credit-score.service';
import type { Offer } from './offer';
import { baselineOffers } from './offers/baseline.offers';
import { createMeridianOffers } from './offers/meridian.offers';

/**
 * Every offer considered for a request, in the order partners were registered.
 * That order is what breaks priority ties during precedence resolution.
 */
export type Catalog = readonly Offer[];

/**
 * The registration point. Each partner contributes its offers from its own
 * module, so adding a partner is one import and one entry here, with no change
 * to the rule engine or the precedence resolver.
 */
export const catalog: Catalog = [
  ...baselineOffers,
  ...createMeridianOffers(creditScoreService),
];
