import type { Rule } from './rules/rule';

export type Product = 'savings-account' | 'credit-card' | 'earned-wage-advance';

/**
 * `baseline` offers are open to anyone who qualifies. `exclusive` offers are
 * reserved for members arriving with a trusted partner claim, and must never
 * reach a user who is not entitled to one.
 */
export type OfferType = 'baseline' | 'exclusive';

export type Offer = {
  id: string;
  product: Product;
  type: OfferType;
  /**
   * Breaks precedence between eligible offers on the same product: highest
   * wins, ties broken by catalog order. Exclusives outrank baselines, which is
   * how "exclusive supersedes baseline" falls out without a special case.
   */
  priority: number;
  rules: readonly Rule[];
};
