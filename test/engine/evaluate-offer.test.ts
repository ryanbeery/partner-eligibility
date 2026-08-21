import { assert, describe, expect, it } from 'vitest';
import { createDeadline, expiredDeadline } from '../../src/engine/deadline';
import { evaluateOffer } from '../../src/engine/evaluate-offer';
import type { Offer } from '../../src/offer';
import type { Rule, RuleResult } from '../../src/rules/rule';
import { buildUserContext } from '../build-user-context';

const offerWith = (...rules: Rule[]): Offer => ({
  id: 'test-offer',
  product: 'savings-account',
  type: 'baseline',
  priority: 0,
  rules,
});

const resolving = (result: RuleResult): Rule => async () => result;
const passes = resolving({ status: 'pass' });
const fails = (reason: string): Rule => resolving({ status: 'fail', reason });
const throws = (message: string): Rule => async () => {
  throw new Error(message);
};
const never: Rule = () => new Promise<RuleResult>(() => {});

describe('evaluateOffer', () => {
  it('is eligible when every rule passes', async () => {
    const result = await evaluateOffer(offerWith(passes, passes), buildUserContext(), createDeadline(50));

    expect(result.status).toBe('eligible');
  });

  it('is ineligible when any rule fails', async () => {
    const result = await evaluateOffer(
      offerWith(passes, fails('too young')),
      buildUserContext(),
      createDeadline(50),
    );

    expect(result.status).toBe('ineligible');
  });

  // Rules are not short-circuited on first failure, so the caller gets the full
  // picture rather than whichever rule happened to settle first.
  it('collects a reason from every failing rule', async () => {
    const result = await evaluateOffer(
      offerWith(fails('too young'), fails('wrong country')),
      buildUserContext(),
      createDeadline(50),
    );

    assert(result.status === 'ineligible');
    expect(result.reasons).toEqual(['too young', 'wrong country']);
  });

  it('is unavailable when a rule throws', async () => {
    const result = await evaluateOffer(
      offerWith(passes, throws('score service down')),
      buildUserContext(),
      createDeadline(50),
    );

    assert(result.status === 'unavailable');
    expect(result.reasons.join()).toContain('score service down');
  });

  it('is unavailable when a rule does not settle before the deadline', async () => {
    const result = await evaluateOffer(offerWith(passes, never), buildUserContext(), expiredDeadline());

    expect(result.status).toBe('unavailable');
  });

  it('prefers ineligible over unavailable when both occur', async () => {
    const result = await evaluateOffer(
      offerWith(fails('wrong country'), throws('score service down')),
      buildUserContext(),
      createDeadline(50),
    );

    expect(result.status).toBe('ineligible');
  });

  // If the rules ran in sequence this deadlocks and the test times out, because
  // neither rule can settle until both have started.
  it('evaluates an offer\'s rules concurrently rather than in sequence', async () => {
    let entered = 0;
    let bothEntered = () => {};
    const gate = new Promise<void>((resolve) => {
      bothEntered = resolve;
    });
    const gated: Rule = async () => {
      entered += 1;
      if (entered === 2) bothEntered();
      await gate;
      return { status: 'pass' };
    };

    const result = await evaluateOffer(offerWith(gated, gated), buildUserContext(), createDeadline(500));

    expect(result.status).toBe('eligible');
  });
});
