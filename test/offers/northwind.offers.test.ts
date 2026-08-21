import { assert, describe, expect, it } from 'vitest';
import type { Offer } from '../../src/offer';
import { northwindOffers } from '../../src/offers/northwind.offers';
import type { UserContext } from '../../src/user-context';
import { advanceTakenDaysAgo, buildNorthwindMember, buildUserContext } from '../build-user-context';

// Composition layer. The rule shapes are proved in test/rules; these tests pin
// the wiring, which is where Northwind's actual numbers enter.

// The guard is for the type checker, not the runtime: noUncheckedIndexedAccess
// types an indexed read as possibly undefined.
const advanceOffer = (): Offer => {
  const [offer] = northwindOffers;
  assert(offer, 'expected a Northwind offer');
  return offer;
};

const allRulesPass = async (context: UserContext) => {
  const results = await Promise.all(advanceOffer().rules.map((rule) => rule(context)));
  return results.every((result) => result.status === 'pass');
};

describe('northwind offers', () => {
  it('offers an exclusive advance on a product with no baseline equivalent', () => {
    expect(advanceOffer().product).toBe('earned-wage-advance');
    expect(advanceOffer().type).toBe('exclusive');
  });

  it('qualifies a member who meets every requirement', async () => {
    expect(await allRulesPass(buildNorthwindMember())).toBe(true);
  });

  it('requires a northwind claim', async () => {
    expect(await allRulesPass(buildUserContext())).toBe(false);
  });

  it('accepts tenure exactly at the 90 day minimum', async () => {
    expect(await allRulesPass(buildNorthwindMember({ tenureDays: 90 }))).toBe(true);
  });

  it('rejects tenure one day short of the minimum', async () => {
    expect(await allRulesPass(buildNorthwindMember({ tenureDays: 89 }))).toBe(false);
  });

  it('accepts a member who has taken two advances in the trailing 30 days', async () => {
    const context = buildNorthwindMember({
      advanceHistory: [advanceTakenDaysAgo(3), advanceTakenDaysAgo(10)],
    });

    expect(await allRulesPass(context)).toBe(true);
  });

  it('rejects a member who has taken three advances in the trailing 30 days', async () => {
    const context = buildNorthwindMember({
      advanceHistory: [advanceTakenDaysAgo(3), advanceTakenDaysAgo(10), advanceTakenDaysAgo(20)],
    });

    expect(await allRulesPass(context)).toBe(false);
  });

  // The limit is per window, not lifetime, so older advances have aged out.
  it('ignores advances taken before the window opens', async () => {
    const context = buildNorthwindMember({
      advanceHistory: [
        advanceTakenDaysAgo(3),
        advanceTakenDaysAgo(10),
        advanceTakenDaysAgo(31),
        advanceTakenDaysAgo(90),
      ],
    });

    expect(await allRulesPass(context)).toBe(true);
  });

  // The far edge is inclusive, so an advance taken exactly 30 days ago is the
  // third inside the window and tips the member over the limit.
  it('counts an advance taken exactly 30 days ago', async () => {
    const context = buildNorthwindMember({
      advanceHistory: [advanceTakenDaysAgo(3), advanceTakenDaysAgo(10), advanceTakenDaysAgo(30)],
    });

    expect(await allRulesPass(context)).toBe(false);
  });
});
