---
id: identity
title: Identity
kind: term
order: 2
classification: semantic-primitive
fundamental: true
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: The stable, location-independent name by which a Locus is known across files, revisions and tools.
related: [locus, revision, fabric, ADR-0003]
---

# Identity

## Definition

The stable, location-independent name by which a Locus is known. Identity is how every other element of the model refers to a Locus, and it stays the same while the Locus's definition evolves.

## Responsibility

Identity makes references possible and stable. A Relation, an owner reference, a Revision and, later, a Witness or a Mandate all point at a Locus by its Identity.

## Boundaries

- Identity is **not** a file path, module path, package name or URL ([ADR-0003](../../decisions/ADR-0003-identity-independent-of-paths.md)). Moving or splitting source files does not change it.
- Identity is **not** derived from the owner. Re-parenting a Locus does not rename it.
- Identity is **not** a content hash. Content hashes identify [Revisions](revision.md); Identity persists across them.

## Stage 0 form

Form: `<namespace>:<name>`, where each part is lowercase kebab case: starts with a letter, then letters, digits and single hyphens, with no hyphen at the end. The whole Identity is at most 128 characters. Examples: `shop:payment-authorization`, `telos:locus-foundation`. The namespace scopes uniqueness and, later, governance of who may introduce names ([OQ-019](../open-questions.md#oq-019)). The exact grammar and length limit are the Stage 0 contract of `@telos/locus`.

## Relationships

Every [Locus](locus.md) has one. [Fabrics](fabric.md) use the same form. [Revisions](revision.md) record the Identity of the Locus they version.

## Invariants

- INV-001: well formed according to the grammar.
- INV-002: unique within a Fabric.
- INV-003: independent of storage location; not part of what a source path can change.

## Lifecycle

Assigned when a Locus is introduced. By design, never reused for a different Locus, even after retirement (retirement is deferred). Renaming is modelled as a new Locus that refines or replaces the old one, not as an in-place change (deferred; [OQ-003](../open-questions.md#oq-003)).

## Examples

`shop:payment-authorization`, `ops:orders-database`, `agents:release-notes-writer`.

## Non-examples

`packages/locus/src/index.ts`, `@telos/locus`, `Payment Authorization` (display name, not identity), `sha256:…` (a Revision id).

## Open questions

- Should names be hierarchical (`shop:payments/authorization`), and if so, does the hierarchy mean anything ([OQ-003](../open-questions.md#oq-003))?
- Who allocates namespaces ([OQ-019](../open-questions.md#oq-019))?

## Classification

Fundamental semantic primitive. Definition provisional. Stage 0: in scope.
