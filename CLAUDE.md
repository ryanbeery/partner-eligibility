# CLAUDE.md

Guidance for Claude Code working in this repo.

## What this is

A take-home assessment: a TypeScript partner eligibility module exposing `evaluateOffers(context)`,
which decides which financial offers a user is eligible to see, per product. No server, no database.
Dependencies are mocked. Partner SSO claims arrive already verified and are treated as trusted input.

The domain is money-touching. Surfacing a partner-exclusive offer to a user who is not entitled to
it is a contractual breach, not a cosmetic bug, so fail-closed on unverified exclusives is an
invariant rather than a branch.

## Source of truth

`../Data Model and Contracts.md` (one directory up, outside the repo) holds the agreed data model and
contracts. Follow its shapes for `Rule`, `RuleResult`, `Offer`, `PartnerClaim`, and `Catalog` rather
than re-deriving them. If code and that doc disagree, raise it instead of silently picking one.

## Locked decisions

These were settled in design discussion. Do not reopen them mid-implementation without flagging it:

- Rules are generic shapes (`thresholdRule`, `allowListRule`, `timeElapsedRule`,
  `windowedCountRule`, `claimPresentRule`) composed per partner at the Offer/Catalog layer.
  **No partner-named rule files.** The brief's core requirement is that one abstraction holds
  differently-shaped rules with no special-casing. Rule-shape tests stay domain-agnostic; the
  concrete numbers (18, `'US'`, 640, 90, 2) are wiring, proved at the offer layer.
- `allowListRule` (value is a member of an allowed set) was added as a fifth shape because none of
  the original four covered baseline's US-residency check or Meridian's eligible-state check.
- Rule evaluation is uniformly async and returns three states: `pass`, `fail`, `unavailable`.
  `unavailable` means the check could not be completed, which is what makes fail-closed structural.
- Rules capture their dependencies at construction time, not at evaluation time.
- The engine owns the timeout budget and memoizes external calls shared within one evaluation.
- Precedence resolves per product: highest-priority eligible offer wins, ties broken by stable
  catalog order. Exclusive-beats-baseline falls out of this as a special case.
- Adding a partner is a module plus one catalog entry, with no change to the engine or resolver.
- `src/evaluate-offers.ts` is the central entry point. Type and constant definitions live next to
  their concern (`src/user-context.ts`, `src/rules/rule.ts`, `src/offer.ts`,
  `src/engine/deadline.ts`) rather than in the entry point, which would make leaf modules import
  back from the root. There is deliberately no barrel file: one was added and removed once nothing
  imported it, and it cost an edit per new export.
- Tests reach `UserContext` only through `test/build-user-context.ts`, so its shape is encoded in
  one place and rule-shape tests stay agnostic to it. An early attempt at the type was rejected for
  designing it all up front; it was grown field by field as tests demanded. Keep doing that.

## Deferred concurrency work (recorded in code)

Perfecting concurrency is explicitly out of scope. The seams are now marked: see the `TODO` on
`evaluateOffer` in `src/engine/evaluate-offer.ts`, the note at the credit score call site in
`src/offers/meridian.offers.ts`, and the `AbortSignal` mention in `src/credit-score.service.ts`.
The two deferred refinements are:

1. **Cost-aware staging**: a cheap failing rule gates an expensive external call so the call is
   never made.
2. **`AbortSignal` threading**: a dependency call that has already missed the deadline is cancelled
   instead of left in flight.

The concurrency model itself is settled and documented under `#### Concurrency and Timeouts` in the
design doc: parallel fan-out over offers and over the rules within an offer, one shared
per-evaluation deadline every rule is raced against, no short-circuit on first failure.

## Working style

- Work in small, checkpointed slices. Confirm the next slice at phase boundaries rather than
  landing a large diff to review after the fact.
- Development is test-driven. `it.todo` stubs in `test/` are the working spec; fill them in as the
  implementation lands.
- **No em dashes** in any output: code, comments, commit messages, docs, or chat.

## Commands

```bash
npm test            # typecheck, then run the full suite
npm run test:watch  # re-runs affected tests on save
```

## Time box

2.5 to 3 hours total. Depth and safety beat feature coverage. When something is out of scope, note
it as a next step instead of building it.
