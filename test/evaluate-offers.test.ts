import { describe, expect, it } from 'vitest';
import { evaluateOffers } from '../src/evaluate-offers';
import type { Offer } from '../src/offer';
import { baselineOffers } from '../src/offers/baseline.offers';
import { buildUserContext } from './build-user-context';

const idsOf = (offers: readonly Offer[]) => offers.map((offer) => offer.id);

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

  // The general shape of the degraded path, exercised here with a stand-in
  // offer. The Meridian-specific cases below cover it once that module exists.
  describe('an offer whose rules cannot be checked', () => {
    const catalog: readonly Offer[] = [
      ...baselineOffers,
      {
        id: 'unverifiable-exclusive',
        product: 'savings-account',
        type: 'exclusive',
        priority: 100,
        rules: [
          async () => {
            throw new Error('score service down');
          },
        ],
      },
    ];

    it('is withheld rather than returned unverified', async () => {
      const result = await evaluateOffers(buildUserContext(), catalog);

      expect(idsOf(result.offers)).not.toContain('unverifiable-exclusive');
    });

    it('is reported in the withheld record with a reason, not silently dropped', async () => {
      const result = await evaluateOffers(buildUserContext(), catalog);

      expect(idsOf(result.withheld.map((entry) => entry.offer))).toEqual([
        'unverifiable-exclusive',
      ]);
      expect(result.withheld[0]?.reasons.join()).toContain('score service down');
    });

    it('does not withhold the offers that could be checked', async () => {
      const result = await evaluateOffers(buildUserContext(), catalog);

      expect(idsOf(result.offers)).toEqual(['baseline-savings', 'baseline-credit-card']);
    });
  });

  describe('isolation', () => {
    it.todo('never returns the Meridian exclusive for a user with no Meridian claim');
    it.todo('never returns the Meridian exclusive for a user with a claim for a different partner');
    it.todo('never returns the Meridian exclusive for a user with a valid claim who fails a Meridian rule (e.g. credit score below 640)');
    it.todo('never returns the Northwind exclusive for a user with no Northwind claim');
  });

  describe('precedence', () => {
    it.todo('a qualifying Meridian member sees the Meridian savings rate instead of the baseline savings offer');
    it.todo('the baseline credit card offer is untouched when the Meridian exclusive supersedes the baseline savings offer');
    it.todo('the Northwind advance offer is added alongside baseline offers since it has no baseline equivalent');
  });

  describe('degraded path', () => {
    it.todo('when CreditScoreService fails, baseline offers are still returned');
    it.todo('when CreditScoreService fails, an earned Northwind advance offer is still returned');
    it.todo('when CreditScoreService fails, the Meridian exclusive is withheld rather than returned unverified');
    it.todo('when CreditScoreService fails, the withheld Meridian offer is reported in the unavailable record, not silently dropped');
  });
});
