---
id: ADR-0019
title: A Locus is composed from semantic extensions
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: A Locus has only an identity as mandatory field. Its meaning comes from semantic extensions composed into a Locus kind.
related:
  [
    ADR-0002,
    ADR-0006,
    locus,
    semantic-extension,
    composition,
    locus-kind,
    purpose,
    P01-one-fundamental-entity,
    P02-composable-extensions,
  ]
---

# ADR-0019 — A Locus is composed from semantic extensions

## Context

[ADR-0002](ADR-0002-locus-is-the-primary-semantic-unit.md) fixed a Charter, a single owner and typed Relations as parts of every [Locus](../foundation/terminology/locus.md). [ADR-0006](ADR-0006-locus-and-fabric-are-distinct.md) kept a separate Fabric for groups of Loci. Every new kind of meaning then needed a change to the core type, and a Locus without a purpose statement could not be described. [P01](../foundation/principles/P01-one-fundamental-entity.md) and [P02](../foundation/principles/P02-composable-extensions.md) ask for one fundamental entity whose meaning is added by composable parts.

## Decision

1. A [Locus](../foundation/terminology/locus.md) has an [identity](../foundation/terminology/identity.md) as its only mandatory field. Every other part (description, contained Loci, relations, capabilities, properties) is optional.
2. Meaning comes from [semantic extensions](../foundation/terminology/semantic-extension.md), created with `Extension.make`. Extensions are composed into a [Locus kind](../foundation/terminology/locus-kind.md) with `Locus.extend(A, B)`, and the kind makes Loci.
3. The properties of one Locus share one flat namespace. A property name defined by two extensions is a [composition](../foundation/terminology/composition.md) conflict, reported as a diagnostic. It is never overwritten (spec D5).
4. The mandatory Charter is replaced by the optional built-in `telos.purpose` extension, described in [purpose](../foundation/terminology/purpose.md). The separate Fabric is removed. Its grouping role is taken by containment, as [ADR-0020](ADR-0020-containment-is-structural-ownership.md) records.
5. The planned modules are `packages/kernel/src/extension.ts` and `packages/kernel/src/locus.ts`.

## Alternatives

- **A namespace per extension** (`properties: { cli: {...} }`). Rejected as the default. Conflicts become impossible, but every access is more verbose, and conflict detection has no purpose (spec D5).
- **One Locus subclass per kind of meaning.** Rejected: each new combination of meanings would need a new type in code, so composing two existing meanings would require new code.
- **Keep the mandatory Charter.** Rejected: a Locus that only names a unit would have to invent purpose text.

## Consequences

- Composing two extensions that define the same property fails with a `composition.*` diagnostic, and neither definition is lost silently.
- The properties accepted by `Locus.make` depend on the composed extensions. Required properties are checked by the type system and again at runtime.
- Code that reads a Locus asks for its extensions and does not assume fixed fields.
