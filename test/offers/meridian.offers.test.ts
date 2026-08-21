import { describe, expect, it } from 'vitest';
import type { Offer } from '../../src/offer';
import { baselineOffers } from '../../src/offers/baseline.offers';
import { createMeridianOffers } from '../../src/offers/meridian.offers';
import type { UserContext } from '../../src/user-context';
import { buildMeridianMember, buildUserContext } from '../build-user-context';
import { scoringService } from '../credit-score.service.mock';

// Composition layer. The rule shapes are proved in test/rules; these tests pin
// the wiring, which is where Meridian's actual numbers enter. A shape can be
// correct while the offer binds it to the wrong threshold.

// Helper functions to allow for easy, reusable data creation and validation between tests
const meridianSavings = (score: number): Offer => {
  const [offer] = createMeridianOffers(scoringService(score));
  if (offer === undefined) throw new Error('expected a Meridian offer');
  return offer;
};

const allRulesPass = async (offer: Offer, context: UserContext) => {
  const results = await Promise.all(offer.rules.map((rule) => rule(context)));
  return results.every((result) => result.status === 'pass');
};

describe('meridian offers', () => {
  it('offers an exclusive savings rate on the same product as the baseline savings offer', () => {
    const offer = meridianSavings(700);

    expect(offer.product).toBe('savings-account');
    expect(offer.type).toBe('exclusive');
  });

  it('outranks the baseline savings offer', () => {
    const baselineSavings = baselineOffers.find((offer) => offer.product === 'savings-account');

    expect(meridianSavings(700).priority).toBeGreaterThan(baselineSavings?.priority ?? 0);
  });

  it('qualifies a member who meets every requirement', async () => {
    expect(await allRulesPass(meridianSavings(700), buildMeridianMember())).toBe(true);
  });

  it('requires a meridian claim', async () => {
    expect(await allRulesPass(meridianSavings(700), buildUserContext())).toBe(false);
  });

  it('accepts a credit score exactly at the minimum', async () => {
    expect(await allRulesPass(meridianSavings(640), buildMeridianMember())).toBe(true);
  });

  it('rejects a credit score one below the minimum', async () => {
    expect(await allRulesPass(meridianSavings(639), buildMeridianMember())).toBe(false);
  });

  it('requires residence in a meridian-eligible state', async () => {
    const context = buildMeridianMember({ user: { state: 'CA' } });

    expect(await allRulesPass(meridianSavings(700), context)).toBe(false);
  });
});
