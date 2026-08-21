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

- Eligibility module that returns the offers a user sees (Direct, Meridian, Northwind),
  alongside a record of any offer withheld because a rule could not be checked
- Extensible rule model: independent, individually testable rules, with baseline rules
  separable from partner-specific ones
- Per-product precedence: a qualifying exclusive supersedes the baseline for that product,
  and offers for other products are left untouched
- Unit tests for each rule, plus three that earn their keep:
  - **Isolation**: fails if a partner-exclusive offer appears for an unentitled user
  - **Precedence**: proves the exclusive supersedes the baseline for the same product and
    nothing else is dropped
  - **Degraded path**: when CreditScoreService times out or fails, everything not dependent
    on the score is still returned, and the exclusive that could not be verified is withheld

## How it works

```text
  UserContext                 user attributes, partner claims, advance history,
       |                      and the evaluation time every date is measured against
       v
  Catalog                     baseline plus partner offers, in registration order
       |
       v
  [ Rule Engine ]             every offer's rules run concurrently against one
       |                      shared deadline, each returning
       |                      pass / fail / unavailable
       v
  Eligible offers             offers whose rules all passed
       |
       v
  [ Precedence Resolution ]   highest priority per product,
       |                      ties broken by catalog order
       v
  { offers, withheld }        what the user sees, plus what could not be verified
```

Each offer carries the rules required for its eligibility, and the engine evaluates them
through one contract without knowing whether a rule is a threshold, a claim check, an
external lookup, or a time-window calculation. Rules capture their dependencies when they
are built, so nothing looks up a service mid-evaluation.

Precedence runs only over offers the user actually earned, so an offer that could not be
verified can never win a product slot. That ordering is what makes the isolation guarantee
structural rather than a check that could be forgotten.

## Layout

```text
src/
  evaluate-offers.ts        entry point
  catalog.ts                where partners register their offers
  offer.ts                  Offer, Product, OfferType
  user-context.ts           UserContext, partner claims, advance history
  credit-score.service.ts   the one external dependency, mocked
  rules/                    the five generic rule shapes and the Rule contract
  offers/                   baseline, Meridian, and Northwind compositions
  engine/                   per-offer evaluation, precedence, deadline
test/                       mirrors src, plus shared context fixtures
```

Adding a partner is a new module in `src/offers/` and one entry in `catalog.ts`, with no
change to the rule engine or the precedence resolver.
