---
id: ADR-0020
title: Containment is structural ownership
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: A Locus contains other Loci. Each Locus has at most one container, and a semantic model is all Loci reachable from one root.
related:
  [
    ADR-0007,
    containment,
    locus,
    semantic-model,
    identity,
    P12-no-duplicate-semantic-models,
  ]
---

# ADR-0020 — Containment is structural ownership

## Context

[ADR-0007](ADR-0007-ownership-is-structural.md) made ownership a single structural property. The Stage 0 model also had an `owner` field and Fabric membership, which told the same story in two places. [P12](../foundation/principles/P12-no-duplicate-semantic-models.md) forbids two models of one fact. The directive asks for one structural relation between Loci that answers who owns what.

## Decision

1. A [Locus](../foundation/terminology/locus.md) contains other Loci through `contains`. [Containment](../foundation/terminology/containment.md) is structural ownership, and it is not a [relation](../foundation/terminology/relation.md).
2. Each Locus has at most one container. A root Locus has none.
3. A [semantic model](../foundation/terminology/semantic-model.md) is all Loci reachable from one root, computed by `buildModel`.
4. The `owner` field and Fabric membership are removed. Containment replaces both.
5. Containment problems are reported as diagnostics with the stable codes `containment.*`, described in [diagnostic](../foundation/terminology/diagnostic.md).

## Alternatives

- **Keep an `owner` field next to `contains`.** Rejected: two sources of truth for one fact, which P12 forbids.
- **Allow several containers, so Loci form a graph.** Rejected: when a Locus has two containers, the question of who owns it has no answer.
- **Model ownership as a tagged relation type.** Rejected: a relation can be left out or duplicated, while containment is checked by the model structure.

## Consequences

- Moving a Locus means changing its container, and the model reports every root and every cycle that results.
- Identity ([identity](../foundation/terminology/identity.md)) does not depend on the container. A Locus keeps its name when it moves, as [ADR-0003](ADR-0003-identity-independent-of-paths.md) requires.
