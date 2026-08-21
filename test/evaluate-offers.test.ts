import { describe, it } from 'vitest';

// Top-level entry point. These three groups are the required,
// must-fail-loudly tests called out in the case study brief.
describe('evaluateOffers', () => {
  describe('isolation', () => {
    it.todo('never returns the Meridian exclusive for a user with no Meridian claim');
    it.todo('never returns the Meridian exclusive for a user with a claim for a different partner');
    it.todo('never returns the Meridian exclusive for a user with a valid claim who fails a Meridian rule (e.g. credit score below 640)');
    it.todo('never returns the Northwind exclusive for a user with no Northwind claim');
  });

  describe('precedence', () => {
    it.todo('a qualifying Meridian member sees the Meridian savings rate instead of the baseline savings offer');
    it.todo('the baseline credit card offer is untouched when the Meridian exclusive supersedes the baseline savings offer');
    it.todo('the Northwind advance offer is added alongside baseline offers since it has no baseline equivalent');
  });

  describe('degraded path', () => {
    it.todo('when CreditScoreService fails, baseline offers are still returned');
    it.todo('when CreditScoreService fails, an earned Northwind advance offer is still returned');
    it.todo('when CreditScoreService fails, the Meridian exclusive is withheld rather than returned unverified');
    it.todo('when CreditScoreService fails, the withheld Meridian offer is reported in the unavailable record, not silently dropped');
  });
});
