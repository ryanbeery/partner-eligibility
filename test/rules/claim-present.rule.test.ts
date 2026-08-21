import { assert, describe, expect, it } from 'vitest';
import { claimPresentRule } from '../../src/rules/claim-present.rule';
import { buildUserContext } from '../build-user-context';

// Generic shape: a trusted claim for the given partner is on the context.
// Serves both partners' "valid claim" requirement without either being named
// anywhere in the rule.
describe('claimPresentRule', () => {
  it('passes when a claim for the partner is present', async () => {
    const rule = claimPresentRule('meridian');

    const result = await rule(buildUserContext({ claims: { meridian: { partnerId: 'meridian' } } }));

    expect(result.status).toBe('pass');
  });

  it('fails when the user arrives with no claims at all', async () => {
    const rule = claimPresentRule('meridian');

    const result = await rule(buildUserContext());

    expect(result.status).toBe('fail');
  });

  // The isolation guarantee in miniature: one partner's claim must never
  // satisfy another partner's rule.
  it('fails when only a different partner has a claim', async () => {
    const rule = claimPresentRule('meridian');

    const result = await rule(
      buildUserContext({
        claims: { northwind: { partnerId: 'northwind', tenureStart: new Date('2020-01-01') } },
      }),
    );

    expect(result.status).toBe('fail');
  });

  it('explains itself when it fails', async () => {
    const rule = claimPresentRule('meridian');

    const result = await rule(buildUserContext());

    assert(result.status === 'fail');
    expect(result.reason).not.toHaveLength(0);
  });
});
