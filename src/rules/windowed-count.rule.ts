import type { Rule, ValueGetter } from './rule';

export type Window = {
  /** How far back from the evaluation time the window reaches. */
  windowMs: number;
  /** The most events allowed inside it. */
  maximum: number;
};

/**
 * Passes when no more than `maximum` of the given timestamps fall inside the
 * trailing window.
 *
 * The window is half-open: [evaluationTime - windowMs, evaluationTime). The
 * older edge counts, the newer edge does not.
 *
 * Comparison is on millisecond timestamps, and `windowMs` is a fixed duration
 * rather than calendar arithmetic, so a "30 day" window is always exactly
 * 30 x 24h whatever the month length or a daylight saving shift would say.
 *
 * Evaluating at Jan 31 00:00 with a 30 day window, the window opens at
 * Jan 1 00:00:
 *   Dec 31 23:59:59.999  not counted, one millisecond too old
 *   Jan  1 00:00         counted, exactly 30 x 24h old still falls inside
 *   Jan 30 00:00         counted
 *   Jan 31 00:00         not counted, an event stamped at the evaluation
 *                        instant has not happened yet as far as this
 *                        evaluation is concerned
 *
 * Which side each edge lands on is what decides eligibility for someone sitting
 * exactly at their limit, so both are pinned by tests rather than left to the
 * comparison operators that happened to get typed.
 *
 * Takes bare timestamps rather than domain records, so it never learns what
 * kind of event it is counting.
 */
export const windowedCountRule = (
  getTimestamps: ValueGetter<readonly Date[]>,
  { windowMs, maximum }: Window,
): Rule => {
  return async (context) => {
    const timestamps = await getTimestamps(context);

    const evaluatedAtMs = context.evaluationTime.getTime();
    const windowStartMs = evaluatedAtMs - windowMs;

    const countInWindow = timestamps.filter((timestamp) => {
      const timestampMs = timestamp.getTime();
      return timestampMs >= windowStartMs && timestampMs < evaluatedAtMs;
    }).length;

    if (countInWindow <= maximum) {
      return { status: 'pass' };
    }

    return {
      status: 'fail',
      reason: `${countInWindow} events in the window exceeds the limit of ${maximum}`,
    };
  };
};
