import { describe, it } from 'vitest';

// Generic shape: (current evaluation time - start date) >= minimum.
// Serves Northwind's >= 90 day tenure check.
describe('timeElapsedRule', () => {
  it.todo('passes when elapsed time equals the minimum (boundary)');
  it.todo('fails when elapsed time is one unit below the minimum (boundary)');
  it.todo('computes elapsed time against the context\'s current evaluation time, not wall-clock time');
});
