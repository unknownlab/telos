---
id: ADR-0003
title: Semantic identity is independent of file paths and owners
kind: decision
status: proposed
maturity: implemented
date: 2026-10-21
summary: A Locus identity is a declared namespace-qualified name, not derived from where its definition is stored or which Locus owns it, and source location is excluded from digests.
related:
  [
    identity,
    locus,
    future-semantic-evolution,
    P03-no-code-outside-semantics,
    open-questions,
  ]
---

# ADR-0003 — Semantic identity is independent of file paths and owners

## Context

Most tools identify units by path: module specifiers, package names, file names. Paths change for reasons unrelated to meaning, such as refactoring, splitting files or moving to another package. If identity followed paths, every such change would look like deleting one unit and creating another, breaking every reference, every piece of evidence and every history.

## Decision

1. A Locus [Identity](../foundation/terminology/identity.md) is declared explicitly as `<namespace>:<name>`. Each part starts with a lowercase letter and continues with lowercase letters, digits and single hyphens, with no trailing hyphen. The whole identity is at most 128 characters.
2. It is not derived from the file, directory or package containing the definition.
3. It is not derived from the owner. Nesting is expressed by the `owner` property ([ADR-0007](ADR-0007-ownership-is-structural.md)); re-parenting does not rename.
4. A definition may carry its source location as metadata. Metadata is excluded from validation of identity and from the digest ([INV-003](../foundation/conceptual-model/README.md#5-invariants)).

## Alternatives

- **Path-derived identity** (as in module systems): free, but unstable.
- **Hierarchical identity derived from ownership** (`shop/storefront/checkout-page`): readable, but re-parenting renames. Kept open as [OQ-003](../foundation/open-questions.md#oq-003).
- **Opaque generated ids (UUID or ULID)**: stable, but unreadable for humans and agents and easy to duplicate by copy-paste without noticing.

## Consequences

- Authors must choose names. Names can collide; uniqueness is checked per semantic model (INV-002).
- Tools that map files to Loci need explicit metadata or markup.
- The same definition stored in two places has the same identity and the same digest, which the Stage 0 specifications checked.
