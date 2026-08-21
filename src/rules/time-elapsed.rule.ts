import type { Rule, ValueGetter } from './rule';

/**
 * Passes when at least `minimumMs` has passed since the date read from context.
 * Inclusive at the boundary, so exactly the minimum qualifies.
 *
 * Measured against the context's `evaluationTime` rather than the wall clock,
 * which is what makes the check deterministic and testable.
 */
export const timeElapsedRule = (
  getStart: ValueGetter<Date | undefined>,
  minimumMs: number,
): Rule => {
  return async (context) => {
    const start = await getStart(context);

    // No start date means the condition cannot be met, not that a lookup broke.
    // The partner's claim rule is what should have caught this first.
    if (start === undefined) {
      return { status: 'fail', reason: 'no start date to measure elapsed time from' };
    }

    const elapsedMs = context.evaluationTime.getTime() - start.getTime();

    if (elapsedMs >= minimumMs) {
      return { status: 'pass' };
    }

    return {
      status: 'fail',
      reason: `only ${elapsedMs}ms elapsed, short of the required ${minimumMs}ms`,
    };
  };
};
