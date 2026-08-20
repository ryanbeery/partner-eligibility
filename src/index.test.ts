import { describe, expect, it } from 'vitest';
import { MODULE_NAME } from './index';

// Scaffolding smoke test: proves TypeScript + vitest are wired up.
// Replaced by real coverage as the module lands.
describe('module scaffolding', () => {
  it('exposes an entry point', () => {
    expect(MODULE_NAME).toBe('partner-eligibility');
  });
});
