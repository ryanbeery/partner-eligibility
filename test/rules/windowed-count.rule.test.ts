import { describe, it } from 'vitest';

// Generic shape: count of dated events within a trailing window <= maximum.
// Serves Northwind's <= 2 advances in the trailing 30 days check.
// Window is half-open: [now - window, now).
describe('windowedCountRule', () => {
  it.todo('passes when the count within the window is at the maximum (boundary)');
  it.todo('fails when the count within the window is one over the maximum (boundary)');
  it.todo('excludes an event exactly at the window start boundary (half-open start)');
  it.todo('includes an event just inside the window boundary');
});
