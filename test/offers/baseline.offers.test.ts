import { describe, expect, it } from 'vitest';
import { baselineOffers } from '../../src/offers/baseline.offers';
import type { Offer } from '../../src/offer';
import type { UserContext } from '../../src/user-context';
import { buildUserContext } from '../build-user-context';

// Composition layer. The rule shapes themselves are proved in test/rules; what
// these tests pin is the wiring, which is where the concrete domain numbers
// enter. A shape can be correct while an offer binds it to the wrong number,
// and only a test at this layer catches that.

const resultsFor = (offer: Offer, context: UserContext) =>
  Promise.all(offer.rules.map((rule) => rule(context)));

const someRuleFailed = (results: Awaited<ReturnType<typeof resultsFor>>) =>
  results.some((result) => result.status === 'fail');

describe('baseline offers', () => {
  it('covers the savings account and credit card products', () => {
    expect(baselineOffers.map((offer) => offer.product)).toEqual([
      'savings-account',
      'credit-card',
    ]);
  });

  it('are all typed baseline rather than exclusive', () => {
    expect(baselineOffers.every((offer) => offer.type === 'baseline')).toBe(true);
  });

  it('give every offer a distinct id', () => {
    const ids = baselineOffers.map((offer) => offer.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(baselineOffers)('$id passes for an adult US resident', async (offer) => {
    const results = await resultsFor(offer, buildUserContext({ user: { age: 18, country: 'US' } }));

    expect(results.every((result) => result.status === 'pass')).toBe(true);
  });

  it.each(baselineOffers)('$id fails for someone under 18', async (offer) => {
    const results = await resultsFor(offer, buildUserContext({ user: { age: 17, country: 'US' } }));

    expect(someRuleFailed(results)).toBe(true);
  });

  it.each(baselineOffers)('$id fails for a non-US resident', async (offer) => {
    const results = await resultsFor(offer, buildUserContext({ user: { age: 30, country: 'CA' } }));

    expect(someRuleFailed(results)).toBe(true);
  });
});
