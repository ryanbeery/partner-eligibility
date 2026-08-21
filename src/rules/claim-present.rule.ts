import type { PartnerId } from '../user-context';
import type { Rule } from './rule';

/**
 * Passes when the context carries a trusted claim for the given partner.
 *
 * Claims arrive already verified from the partner SSO layer, so this checks
 * presence rather than authenticity. Because claims are keyed by partner, one
 * partner's claim can never satisfy another partner's rule.
 */
export const claimPresentRule = (partnerId: PartnerId): Rule => {
  return async (context) => {
    if (context.claims[partnerId] !== undefined) {
      return { status: 'pass' };
    }

    return { status: 'fail', reason: `no ${partnerId} claim present` };
  };
};
