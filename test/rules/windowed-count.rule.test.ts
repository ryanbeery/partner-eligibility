import { assert, describe, expect, it } from 'vitest';
import { windowedCountRule } from '../../src/rules/windowed-count.rule';
import { buildUserContext } from '../build-user-context';

const DAY_MS = 24 * 60 * 60 * 1000;
const EVALUATED_AT = new Date('2026-08-21T00:00:00.000Z');
const WINDOW = { windowMs: 30 * DAY_MS, maximum: 2 };

const daysBefore = (days: number) => new Date(EVALUATED_AT.getTime() - days * DAY_MS);
const msBefore = (ms: number) => new Date(EVALUATED_AT.getTime() - ms);
const contextAt = () => buildUserContext({ evaluationTime: EVALUATED_AT });

// Generic shape: no more than `maximum` events fall inside the trailing window.
// The window is half-open, [evaluationTime - windowMs, evaluationTime), so an
// event exactly at the far edge still counts and one exactly at the near edge
// has not happened yet.
// Serves Northwind's "no more than 2 advances in the trailing 30 days".
describe('windowedCountRule', () => {
  it('passes when there are no events at all', async () => {
    const rule = windowedCountRule(() => [], WINDOW);

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  it('passes when the count inside the window equals the maximum', async () => {
    const rule = windowedCountRule(() => [daysBefore(1), daysBefore(2)], WINDOW);

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  it('fails when the count inside the window is one over the maximum', async () => {
    const rule = windowedCountRule(() => [daysBefore(1), daysBefore(2), daysBefore(3)], WINDOW);

    const result = await rule(contextAt());

    expect(result.status).toBe('fail');
  });

  it('ignores events that fall outside the window', async () => {
    const rule = windowedCountRule(
      () => [daysBefore(1), daysBefore(2), daysBefore(31), daysBefore(60)],
      WINDOW,
    );

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  // Closed at the far edge: an event exactly 30 days old still counts.
  it('includes an event exactly at the start of the window', async () => {
    const rule = windowedCountRule(
      () => [daysBefore(30), daysBefore(1), daysBefore(2)],
      WINDOW,
    );

    const result = await rule(contextAt());

    expect(result.status).toBe('fail');
  });

  it('excludes an event one millisecond before the start of the window', async () => {
    const rule = windowedCountRule(
      () => [msBefore(30 * DAY_MS + 1), daysBefore(1), daysBefore(2)],
      WINDOW,
    );

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  // Half-open at the near edge: an event stamped at the evaluation time itself
  // has not happened yet as far as this evaluation is concerned.
  it('excludes an event exactly at the evaluation time', async () => {
    const rule = windowedCountRule(
      () => [EVALUATED_AT, daysBefore(1), daysBefore(2)],
      WINDOW,
    );

    const result = await rule(contextAt());

    expect(result.status).toBe('pass');
  });

  it('explains itself when it fails', async () => {
    const rule = windowedCountRule(
      () => [daysBefore(1), daysBefore(2), daysBefore(3)],
      WINDOW,
    );

    const result = await rule(contextAt());

    assert(result.status === 'fail');
    expect(result.reason).not.toHaveLength(0);
  });
});
