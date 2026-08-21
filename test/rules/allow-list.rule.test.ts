import { assert, describe, expect, it, vi } from 'vitest';
import { allowListRule } from '../../src/rules/allow-list.rule';
import { buildUserContext } from '../build-user-context';

// Generic shape: value is a member of an allowed set. Distinct from
// thresholdRule because membership carries no ordering.
// Serves baseline (country in {US}) and Meridian (state in eligible states).
describe('allowListRule', () => {
  it('passes when the value is in the allowed set', async () => {
    const rule = allowListRule(() => 'US', ['US']);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('pass');
  });

  it('passes when the allowed set has several members', async () => {
    const rule = allowListRule(() => 'OH', ['CA', 'OH', 'TX']);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('pass');
  });

  it('fails when the value is not in the allowed set', async () => {
    const rule = allowListRule(() => 'CA', ['US']);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('fail');
  });

  // A misconfigured empty set must deny rather than admit everyone.
  it('fails when the allowed set is empty', async () => {
    const rule = allowListRule(() => 'US', []);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('fail');
  });

  it('matches exactly, without case coercion', async () => {
    const rule = allowListRule(() => 'us', ['US']);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('fail');
  });

  it('explains itself when it fails', async () => {
    const rule = allowListRule(() => 'CA', ['US']);

    const result = await rule(buildUserContext());

    assert(result.status === 'fail');
    expect(result.reason).not.toHaveLength(0);
  });

  it('awaits an asynchronous value getter', async () => {
    const rule = allowListRule(async () => 'US', ['US']);

    const result = await rule(buildUserContext());

    expect(result.status).toBe('pass');
  });

  it('lets a rejected value getter escape so the engine can mark it unavailable', async () => {
    const rule = allowListRule(() => Promise.reject(new Error('dependency down')), ['US']);

    await expect(rule(buildUserContext())).rejects.toThrow('dependency down');
  });

  it('passes the evaluation context through to the value getter exactly once', async () => {
    const getValue = vi.fn(() => 'US');
    const rule = allowListRule(getValue, ['US']);
    const context = buildUserContext();

    await rule(context);

    expect(getValue).toHaveBeenCalledExactlyOnceWith(context);
  });
});
