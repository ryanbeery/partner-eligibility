import { describe, it } from 'vitest';

// Per-product resolution: highest-priority eligible offer wins,
// ties broken by stable catalog order.
describe('resolvePrecedence', () => {
  it.todo('the higher-priority eligible offer wins for a given product');
  it.todo('ties in priority are broken by stable catalog order');
  it.todo('offers for different products do not affect each other');
});
