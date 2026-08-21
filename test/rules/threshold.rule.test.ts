import { assert, describe, expect, it, vi } from 'vitest';
import { thresholdRule } from '../../src/rules/threshold.rule';
import { buildUserContext } from '../build-user-context';

// Generic shape: value >= minimum, inclusive at the boundary.
// Serves baseline (age >= 18) and Meridian (credit score >= 640). Tested
// without reference to either, since which value is read and which minimum is
// enforced is wiring that belongs to the offer layer.
describe('thresholdRule', () => {
  it('passes when the value is at the minimum', async () => {
    const rule = thresholdRule(() => 640, 640);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('pass');
  });

  it('passes when the value is above the minimum', async () => {
    const rule = thresholdRule(() => 641, 640);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('pass');
  });

  it('fails when the value is one below the minimum', async () => {
    const rule = thresholdRule(() => 639, 640);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('fail');
  });

  it('explains itself when it fails', async () => {
    const rule = thresholdRule(() => 639, 640);

    const result = await rule(buildUserContext());

    assert(result.status === 'fail');
    expect(result.reason).not.toHaveLength(0);
  });

  it('awaits an asynchronous value getter', async () => {
    const rule = thresholdRule(async () => 640, 640);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('pass');
  });

  // Classifying a failed dependency is the engine's job. If the rule swallowed
  // this and reported 'fail', an exclusive that could not be verified would be
  // indistinguishable from one that was checked and genuinely did not qualify.
  it('lets a rejected value getter escape so the engine can mark it unavailable', async () => {
    const rule = thresholdRule(() => Promise.reject(new Error('dependency down')), 640);

    await expect(rule(buildUserContext())).rejects.toThrow('dependency down');
  });

  it('passes the evaluation context through to the value getter exactly once', async () => {
    const getValue = vi.fn(() => 640);
    const rule = thresholdRule(getValue, 640);
    const context = buildUserContext();

    await rule(context);

    expect(getValue).toHaveBeenCalledExactlyOnceWith(context);
  });
});
