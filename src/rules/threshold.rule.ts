import type { Rule, ValueGetter } from './rule';

/**
 * Passes when the read value is at or above `minimum`. Inclusive at the
 * boundary, which is what both current uses want (age >= 18, score >= 640).
 *
 * Knows nothing about which value it reads or why that minimum applies. Both
 * are bound at the offer layer.
 */
export const thresholdRule = (getValue: ValueGetter<number>, minimum: number): Rule => {
  return async (context) => {
    const value = await getValue(context);

    // TODO: support an upper bound as well. The domain has one already, in
    // Northwind's "no more than 2 advances", but it sits inside
    // windowedCountRule bundled with the window. A directional bound here would
    // let that rule compose from a count getter plus this, rather than both.
    if (value >= minimum) {
      return { status: 'pass' };
    }

    return { status: 'fail', reason: `${value} is below the required minimum of ${minimum}` };
  };
};
