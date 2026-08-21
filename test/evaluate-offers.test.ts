import { describe, expect, it } from 'vitest';
import type { CreditScoreService } from '../src/credit-score.service';
import { evaluateOffers } from '../src/evaluate-offers';
import type { Offer } from '../src/offer';
import { baselineOffers } from '../src/offers/baseline.offers';
import { createMeridianOffers } from '../src/offers/meridian.offers';
import { buildMeridianMember, buildUserContext } from './build-user-context';
import { failingScoreService, hangingScoreService, scoringService } from './credit-score.service.mock';

const idsOf = (offers: readonly Offer[]) => offers.map((offer) => offer.id);

const catalogWith = (creditScore: CreditScoreService): readonly Offer[] => [
  ...baselineOffers,
  ...createMeridianOffers(creditScore),
];

describe('evaluateOffers', () => {
  describe('wiring', () => {
    it('returns every baseline offer for an adult US resident', async () => {
      const result = await evaluateOffers(buildUserContext(), baselineOffers);

      expect(idsOf(result.offers)).toEqual(['baseline-savings', 'baseline-credit-card']);
    });

    it('returns nothing for a user under 18', async () => {
      const result = await evaluateOffers(buildUserContext({ user: { age: 17 } }), baselineOffers);

      expect(result.offers).toEqual([]);
    });

    it('returns nothing for a non-US resident', async () => {
      const result = await evaluateOffers(
        buildUserContext({ user: { country: 'CA' } }),
        baselineOffers,
      );

      expect(result.offers).toEqual([]);
    });

    it('withholds nothing when every rule could be checked', async () => {
      const result = await evaluateOffers(buildUserContext(), baselineOffers);

      expect(result.withheld).toEqual([]);
    });
  });

  // The guarantee that matters most: an exclusive offer must never reach a user
  // who is not entitled to it, for any reason.
  describe('isolation', () => {
    it('never returns the Meridian exclusive for a user with no partner claim', async () => {
      const result = await evaluateOffers(buildUserContext(), catalogWith(scoringService(800)));

      expect(idsOf(result.offers)).not.toContain('meridian-savings');
    });

    it('never returns the Meridian exclusive for a user holding another partner\'s claim', async () => {
      const context = buildUserContext({
        claims: { northwind: { partnerId: 'northwind', tenureStart: new Date('2020-01-01') } },
      });

      const result = await evaluateOffers(context, catalogWith(scoringService(800)));

      expect(idsOf(result.offers)).not.toContain('meridian-savings');
    });

    it('never returns the Meridian exclusive when the credit score falls short', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(scoringService(639)));

      expect(idsOf(result.offers)).not.toContain('meridian-savings');
    });

    it('never returns the Meridian exclusive when the member is in an ineligible state', async () => {
      const context = buildMeridianMember({ user: { state: 'CA' } });

      const result = await evaluateOffers(context, catalogWith(scoringService(800)));

      expect(idsOf(result.offers)).not.toContain('meridian-savings');
    });

    it.todo('never returns the Northwind exclusive for a user with no Northwind claim');
  });

  describe('precedence', () => {
    it('gives a qualifying Meridian member the exclusive rate instead of the baseline savings offer', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(scoringService(700)));

      expect(idsOf(result.offers)).toContain('meridian-savings');
      expect(idsOf(result.offers)).not.toContain('baseline-savings');
    });

    it('leaves offers for other products untouched when an exclusive supersedes a baseline', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(scoringService(700)));

      expect(idsOf(result.offers)).toEqual(['meridian-savings', 'baseline-credit-card']);
    });

    it.todo('the Northwind advance offer is added alongside baseline offers since it has no baseline equivalent');
  });

  // One dependency being down must degrade the response, not fail it.
  describe('degraded path', () => {
    it('still returns the baseline offers when the credit score service fails', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(failingScoreService));

      expect(idsOf(result.offers)).toEqual(['baseline-savings', 'baseline-credit-card']);
    });

    it('withholds the Meridian exclusive rather than returning it unverified', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(failingScoreService));

      expect(idsOf(result.offers)).not.toContain('meridian-savings');
    });

    // Asserting only on absence would also pass if a bug dropped every offer,
    // so the withheld record is what proves it was withheld deliberately.
    it('reports the withheld Meridian offer with a reason rather than dropping it silently', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(failingScoreService));

      expect(idsOf(result.withheld.map((entry) => entry.offer))).toEqual(['meridian-savings']);
      expect(result.withheld[0]?.reasons.join()).toContain('credit score service unavailable');
    });

    // A dependency that hangs must be bounded by the deadline rather than
    // holding the request open, and lands in the same withheld state.
    it('withholds the Meridian exclusive when the credit score service never answers', async () => {
      const result = await evaluateOffers(buildMeridianMember(), catalogWith(hangingScoreService), 20);

      expect(idsOf(result.offers)).toEqual(['baseline-savings', 'baseline-credit-card']);
      expect(idsOf(result.withheld.map((entry) => entry.offer))).toEqual(['meridian-savings']);
    });

    it.todo('when CreditScoreService fails, an earned Northwind advance offer is still returned');
  });
});
