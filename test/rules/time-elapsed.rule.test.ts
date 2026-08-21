import { assert, describe, expect, it } from 'vitest';
import { timeElapsedRule } from '../../src/rules/time-elapsed.rule';
import { buildUserContext } from '../build-user-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const EVALUATED_AT = new Date('2026-08-21T00:00:00.000Z');

const daysBefore = (days: number) => new Date(EVALUATED_AT.getTime() - days * DAY_MS);
const contextAt = () => buildUserContext({ evaluationTime: EVALUATED_AT });

// Generic shape: enough time has passed since some start date.
// Serves Northwind's >= 90 day tenure without naming it.
describe('timeElapsedRule', () => {
  it('passes when exactly the minimum has elapsed', async () => {
    const rule = timeElapsedRule(() => daysBefore(90), 90 * DAY_MS);

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  it('passes when more than the minimum has elapsed', async () => {
    const rule = timeElapsedRule(() => daysBefore(91), 90 * DAY_MS);

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  it('fails when one day short of the minimum', async () => {
    const rule = timeElapsedRule(() => daysBefore(89), 90 * DAY_MS);

    const result = await rule(contextAt());

    expect(result.status).toBe('fail');
  });

  // Reading the wall clock instead would make this pass, since the start date
  // is years in the past relative to a real "now".
  it('measures against the context evaluation time, not the wall clock', async () => {
    const rule = timeElapsedRule(() => new Date('2019-12-31T00:00:00.000Z'), 90 * DAY_MS);

    const result = await rule(buildUserContext({ evaluationTime: new Date('2020-01-01T00:00:00.000Z') }));

    expect(result.status).toBe('fail');
  });

  // A missing start date is a definitive "not qualified", not a failed lookup.
  // The partner's claim rule is what should have caught this first.
  it('fails when there is no start date to measure from', async () => {
    const rule = timeElapsedRule(() => undefined, 90 * DAY_MS);

    const result = await rule(contextAt());

    expect(result.status).toBe('fail');
  });

  it('explains itself when it fails', async () => {
    const rule = timeElapsedRule(() => daysBefore(1), 90 * DAY_MS);

    const result = await rule(contextAt());

    assert(result.status === 'fail');
    expect(result.reason).not.toHaveLength(0);
  });
});
