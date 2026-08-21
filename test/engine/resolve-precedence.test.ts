import { describe, expect, it } from 'vitest';
import { resolvePrecedence } from '../../src/engine/resolve-precedence';
import type { Offer, Product } from '../../src/offer';

const offer = (id: string, product: Product, priority: number): Offer => ({
  id,
  product,
  type: priority > 0 ? 'exclusive' : 'baseline',
  priority,
  rules: [],
});

const idsOf = (offers: readonly Offer[]) => offers.map((resolved) => resolved.id);

// Per-product resolution: the highest-priority eligible offer wins, ties broken
// by catalog order. Exclusive-supersedes-baseline is a consequence of exclusives
// carrying higher priority, not a rule this function knows about.
describe('resolvePrecedence', () => {
  it('returns nothing when no offer is eligible', () => {
    expect(resolvePrecedence([])).toEqual([]);
  });

  it('returns the only eligible offer for a product', () => {
    const offers = [offer('baseline-savings', 'savings-account', 0)];

    expect(idsOf(resolvePrecedence(offers))).toEqual(['baseline-savings']);
  });

  it('keeps the higher-priority offer when two compete for one product', () => {
    const offers = [
      offer('baseline-savings', 'savings-account', 0),
      offer('meridian-savings', 'savings-account', 100),
    ];

    expect(idsOf(resolvePrecedence(offers))).toEqual(['meridian-savings']);
  });

  it('keeps the higher-priority offer regardless of catalog position', () => {
    const offers = [
      offer('meridian-savings', 'savings-account', 100),
      offer('baseline-savings', 'savings-account', 0),
    ];

    expect(idsOf(resolvePrecedence(offers))).toEqual(['meridian-savings']);
  });

  it('breaks a priority tie by catalog order', () => {
    const offers = [
      offer('first-listed', 'savings-account', 50),
      offer('second-listed', 'savings-account', 50),
    ];

    expect(idsOf(resolvePrecedence(offers))).toEqual(['first-listed']);
  });

  it('resolves each product independently', () => {
    const offers = [
      offer('baseline-savings', 'savings-account', 0),
      offer('baseline-credit-card', 'credit-card', 0),
      offer('meridian-savings', 'savings-account', 100),
    ];

    expect(idsOf(resolvePrecedence(offers))).toEqual(['meridian-savings', 'baseline-credit-card']);
  });

  // Northwind's advance has no baseline equivalent, so it is added rather than
  // superseding anything.
  it('passes through a product that has only one offer', () => {
    const offers = [
      offer('baseline-savings', 'savings-account', 0),
      offer('northwind-advance', 'earned-wage-advance', 100),
    ];

    expect(idsOf(resolvePrecedence(offers))).toEqual(['baseline-savings', 'northwind-advance']);
  });
});
