---
id: P09-evidence-before-acceptance
title: Evidence Before Acceptance
kind: principle
number: 9
code: P09
status: provisional
maturity: vision
summary: A change is accepted only on the evidence its acceptance policy requires, and that evidence is tied to the revision, environment, method and assumptions it was produced under.
related:
  [
    P10-uncertainty-must-be-explicit,
    P11-verification-is-contextual,
    P12-independent-governance,
    witness,
    verdict,
    ADR-0010,
  ]
---

# P09 — Evidence Before Acceptance

## Definition

Accepting a change requires the evidence that the applicable acceptance policy specifies. Each piece of evidence ([Witness](../terminology/witness.md)) is bound to the revision it evaluated, the environment it ran in, the method that produced it and the assumptions it relied on. Evidence informs a decision ([Verdict](../terminology/verdict.md)); it is never mistaken for proof of absolute correctness.

## Motivation

"Tests passed" is meaningless without knowing which tests, on which code, in which environment. Evidence detached from its subject is reused where it does not apply, and acceptance becomes ritual. Binding evidence to provenance makes it possible to reuse it honestly, and to invalidate it when its conditions no longer hold.

## Scope

Applies to every governed change. The amount and kind of evidence depends on the policy and on context ([P11](P11-verification-is-contextual.md)). A typo fix and a payment change both need evidence, not the same evidence.

## Consequences

- Results without provenance are not evidence for acceptance.
- Evidence and decision are separate records ([ADR-0010](../../decisions/ADR-0010-evidence-separate-from-acceptance.md)).
- Documentation that shows results shows where they came from.

## Known limitations

- Complete provenance (exact environment, all transitive inputs) is hard; reproducible builds research shows how hard. Stage 0 records a minimum: revision, runtime, origin and time.
- Policies can demand the wrong evidence. The policy itself must be reviewable.

## Enforcement

- Potential: acceptance gates that check evidence against policy and provenance; evidence invalidation when inputs change.
- Today: partly, outside Telos. Spec Kitty's review gate and merge gates block on failing checks and missing reviews for this repository. Telos itself enforces nothing yet.

## Relationships

Requires [P10](P10-uncertainty-must-be-explicit.md) (missing evidence must show as missing). Scaled by [P11](P11-verification-is-contextual.md). Protected by [P12](P12-independent-governance.md).

## Commitment vs. current invariant

Commitment: no acceptance without provenance-bound evidence. Current invariant: none in Telos; external gates on this repository.
