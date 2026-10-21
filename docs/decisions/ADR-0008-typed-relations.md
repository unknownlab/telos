---
id: ADR-0008
title: Relations are typed with a closed Stage 0 set of kinds
kind: decision
status: proposed
maturity: proposed
date: 2026-10-21
summary: Stage 0 Relations have one of four kinds (depends-on, refines, satisfies, verifies); targets must exist, self-relations and duplicates are rejected, and only refines must be acyclic.
related: [relation, P04-explicit-composition, open-questions]
---

# ADR-0008 — Relations are typed with a closed Stage 0 set of kinds

## Context

[P04](../foundation/principles/P04-explicit-composition.md) requires connections between Loci to be explicit. Untyped edges say that two things are connected but not how, so no rule can be checked on them. A fully open set of kinds invites synonyms (`uses`, `needs`, `calls`) that mean the same thing.

## Decision

1. A [Relation](../foundation/terminology/relation.md) is declared on its source Locus as `{ kind, target }`.
2. Stage 0 kinds:
   - `depends-on`: the source needs the target to fulfil its Charter.
   - `refines`: the source is a more specific form of the target.
   - `satisfies`: the source fulfils an obligation stated by the target.
   - `verifies`: the source checks the target.
3. Validation rejects a target missing from the Fabric (INV-007), a Relation to the Locus itself, and two Relations with the same kind and target (INV-008).
4. `refines` must be acyclic. Cycles of the other kinds are allowed in Stage 0.
5. The set is closed: unknown kinds are rejected when decoding.

## Alternatives

- **Untyped edges**: nothing to check.
- **Open, author-defined kinds**: flexible but drifts. May come later through Archetypes ([OQ-013](../foundation/open-questions.md#oq-013)).
- **Forbid `depends-on` cycles in the core**: a reasonable architectural rule, but a policy, not a law of the model; left to Archetypes ([OQ-005](../foundation/open-questions.md#oq-005)).

## Consequences

- Traceability (`satisfies`, `verifies`) and structure (`depends-on`, `refines`) are queryable from Stage 0.
- Adding a kind is a decision record, not a code change alone.
