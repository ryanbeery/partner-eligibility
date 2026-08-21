import type { Offer, Product } from '../offer';

/**
 * Picks the winning offer for each product from the offers a user is eligible
 * for. Highest priority wins; a tie goes to whichever came first in the catalog.
 *
 * "An exclusive supersedes the baseline for the same product" is not encoded
 * here. It falls out of exclusives carrying a higher priority, which means a new
 * partner changes only its own offer definitions and never this function.
 *
 * Offers for different products never compete, so a product with a single offer
 * passes straight through. That is how Northwind's advance gets added alongside
 * the baseline offers rather than displacing one.
 */
export const resolvePrecedence = (eligibleOffers: readonly Offer[]): readonly Offer[] => {
  const winnerByProduct = new Map<Product, Offer>();

  for (const offer of eligibleOffers) {
    const currentWinner = winnerByProduct.get(offer.product);

    // Strictly greater, so an equal priority leaves the incumbent in place.
    // That is the catalog-order tiebreak: the first one listed keeps the slot.
    if (currentWinner === undefined || offer.priority > currentWinner.priority) {
      winnerByProduct.set(offer.product, offer);
    }
  }

  // A Map keeps insertion order, so products come back in the order they were
  // first seen in the catalog rather than in an order that depends on priority.
  return [...winnerByProduct.values()];
};
