import type { Rule, ValueGetter } from './rule';

/**
 * Passes when the read value is a member of `allowed`. Distinct from
 * thresholdRule because membership carries no ordering.
 *
 * Matching is exact. An empty allow list denies everything, which is the
 * fail-closed reading of a misconfigured set.
 */
export const allowListRule = <T>(getValue: ValueGetter<T>, allowed: readonly T[]): Rule => {
  return async (context) => {
    const value = await getValue(context);

    if (allowed.includes(value)) {
      return { status: 'pass' };
    }

    return {
      status: 'fail',
      reason: `${String(value)} is not one of the ${allowed.length} allowed values`,
    };
  };
};
