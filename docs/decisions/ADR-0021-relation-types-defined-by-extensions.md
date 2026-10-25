---
id: ADR-0021
title: Relation types are defined by extensions
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: A relation is a typed, directed statement whose type is declared by an extension of the source Locus. Relation types are not a closed list in the kernel.
related:
  [ADR-0008, relation, relation-type, capability, P02-composable-extensions]
---

# ADR-0021 — Relation types are defined by extensions

## Context

[ADR-0008](ADR-0008-typed-relations.md) fixed a closed set of relation kinds for Stage 0. Any new meaning between two Loci then needed a kernel change. [P02](../foundation/principles/P02-composable-extensions.md) asks that meaning be added by extensions, and the directive makes relation types a part of that.

## Decision

1. A [relation](../foundation/terminology/relation.md) is one typed, directed statement from a Locus to a Locus or to a [capability](../foundation/terminology/capability.md).
2. The type of a relation is a [relation type](../foundation/terminology/relation-type.md), created with `RelationType.make` and declared by an extension of the source Locus. For example, "CLI command maps to capability" can be declared by a CLI extension.
3. The target of a relation is a Locus or a capability, and the type states which one.
4. A relation type may be `acyclic`, which the model checks.
5. A relation type may grant invocation. The grant rules are in [ADR-0022](ADR-0022-capabilities-and-governed-invocation.md).

## Alternatives

- **The closed Stage 0 set of kinds.** Rejected: each new meaning needs a kernel change.
- **Untyped edges with free-text labels.** Rejected: the model cannot check a label, and no tool can rely on its meaning.
- **Relation types declared in one global registry.** Rejected: the type would be far from the extension that gives it meaning, and a separate registry is the kind of duplicate model P12 forbids.

## Consequences

- A tool can list the relation types of a Locus from its extensions, without reading the kernel.
- Two extensions that declare the same relation type name are a composition conflict, as properties are ([ADR-0019](ADR-0019-locus-with-composable-extensions.md)).
- A relation to a capability is the only way a Locus can act on another, which keeps invocation visible in the model.
