import { describe, it } from 'vitest';

// Runs a single offer's rules against a context and classifies the outcome.
describe('evaluateOffer', () => {
  it.todo('is eligible when every rule passes');
  it.todo('is ineligible when any rule fails');
  it.todo('is withheld as unavailable when any rule is unavailable, distinct from ineligible');
  it.todo('a rule that throws is coerced to unavailable rather than failing the whole evaluation');
});
