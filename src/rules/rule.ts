import type { UserContext } from '../user-context';

/**
 * The outcome of one eligibility check.
 *
 * `unavailable` is deliberately distinct from `fail`: it means the check could
 * not be completed (a dependency timed out or errored), not that it ran and the
 * condition was not met. Keeping them apart is what lets the evaluator withhold
 * an exclusive it could not verify while still reporting why.
 */
export type RuleResult =
  | { status: 'pass' }
  | { status: 'fail'; reason: string }
  | { status: 'unavailable'; reason: string };

/**
 * Every rule exposes this one contract, whatever it checks internally.
 *
 * Async uniformly, so a rule backed by an external call needs no separate
 * shape from one that resolves locally. A rule does not catch its own
 * dependency failures: it lets them escape so the engine can classify them as
 * `unavailable` against the shared per-evaluation deadline.
 */
export type Rule = (context: UserContext) => Promise<RuleResult>;

/**
 * Reads the value a rule checks, given the context. Any dependency it needs is
 * captured in its closure when the rule is constructed, not passed at
 * evaluation time, which keeps each rule testable in isolation.
 */
export type ValueGetter<T> = (context: UserContext) => T | Promise<T>;
