import { catalog as defaultCatalog, type Catalog } from './catalog';
import { createDeadline, DEFAULT_BUDGET_MS } from './engine/deadline';
import { evaluateOffer } from './engine/evaluate-offer';
import { resolvePrecedence } from './engine/resolve-precedence';
import type { Offer } from './offer';
import type { UserContext } from './user-context';

/** An offer that could not be evaluated, kept apart from one that was simply not earned. */
export type WithheldOffer = {
  offer: Offer;
  reasons: readonly string[];
};

export type EvaluationResult = {
  /** What the user sees, at most one per product. */
  offers: readonly Offer[];
  /**
   * Offers withheld because a rule could not be checked. Reported rather than
   * dropped so a caller can tell "not eligible" from "could not verify", which
   * are very different things when the offer is partner-exclusive.
   */
  withheld: readonly WithheldOffer[];
};

/**
 * Decides which offers a user is eligible to see.
 *
 * Offers are evaluated concurrently against one shared deadline, so the request
 * costs about as long as its slowest rule rather than the sum of all of them,
 * and a slow dependency cannot push the whole evaluation past the budget.
 *
 * A dependency failure marks only the rules that needed it, so it withholds the
 * offers depending on that dependency and never fails the request.
 */
export const evaluateOffers = async (
  context: UserContext,
  catalog: Catalog = defaultCatalog,
  budgetMs: number = DEFAULT_BUDGET_MS,
): Promise<EvaluationResult> => {
  const deadline = createDeadline(budgetMs);

  const evaluations = await Promise.all(
    catalog.map((offer) => evaluateOffer(offer, context, deadline)),
  );

  const eligible: readonly Offer[] = evaluations.flatMap((evaluation) =>
    evaluation.status === 'eligible' ? [evaluation.offer] : [],
  );
  const withheld: readonly WithheldOffer[] = evaluations.flatMap((evaluation) =>
    evaluation.status === 'unavailable'
      ? [{ offer: evaluation.offer, reasons: evaluation.reasons }]
      : [],
  );

  // Precedence runs over what the user actually earned. An offer that could not
  // be verified never reaches this step, so it can never win a product slot.
  return { offers: resolvePrecedence(eligible), withheld };
};
