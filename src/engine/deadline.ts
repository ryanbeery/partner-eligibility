/**
 * One deadline is computed per evaluation and every rule is raced against it.
 * Because rules run in parallel, this single deadline bounds the whole request
 * rather than any individual rule, so no rule can spend the budget on its own.
 */

/**
 * The latency budget for a whole evaluation, from the brief's stated ~300ms
 * allowance on the credit score lookup. It bounds every rule collectively, not
 * each one, so a slow dependency cannot extend the request past this.
 */
export const DEFAULT_BUDGET_MS = 300;

/** Sentinel resolved by a deadline, distinguishable from any RuleResult. */
export const TIMED_OUT = Symbol('deadline reached');

export type Deadline = Promise<typeof TIMED_OUT>;

export const createDeadline = (budgetMs: number): Deadline =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(TIMED_OUT), budgetMs);
    // Do not hold the process open purely to enforce a budget that has not
    // been reached; the evaluation resolves on its own once rules settle.
    timer.unref?.();
  });

/** A deadline already in the past, for exercising the timeout path. */
export const expiredDeadline = (): Deadline => Promise.resolve(TIMED_OUT);
