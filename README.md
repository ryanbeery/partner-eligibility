# Partner Eligibility Module

Decides which financial offers a user is eligible to see, per product. Baseline offers go
to anyone who qualifies, and partner-exclusive offers go to members arriving with a trusted
partner claim, with the guarantee that an exclusive offer can never reach a user who is not
entitled to it.

## Getting started

```bash
npm install
npm test            # typecheck, then run the full test suite
npm run test:watch  # re-runs affected tests on save
```

## Scope

- Eligibility module that returns the offers a user sees (Direct, Meridian, Northwind)
- Extensible rule model: independent, individually testable rules, with baseline rules
  separable from partner-specific ones
- Per-product precedence: a qualifying exclusive supersedes the baseline for that product,
  and offers for other products are left untouched
- Unit tests for each rule, plus three that earn their keep:
  - **Isolation**: fails if a partner-exclusive offer appears for an unentitled user
  - **Precedence**: proves the exclusive supersedes the baseline for the same product and
    nothing else is dropped
  - **Degraded path**: when CreditScoreService times out, everything not dependent on the
    score is still returned, and the exclusive that could not be verified is withheld
