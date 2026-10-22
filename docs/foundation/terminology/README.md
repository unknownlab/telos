---
id: terminology
title: Terminology
kind: index
status: provisional
maturity: proposed
summary: The official Telos vocabulary, with each term's definition, boundaries, relationships, invariants and maturity.
related: [conceptual-model, principles, foundation]
---

# Terminology

Version 0.1 of the Telos vocabulary. These names are the preferred vocabulary. They are kept unless a substantial semantic contradiction is shown, and new abstractions are added only when a real case needs them.

Each term has its own file and URL anchor. Every entry states whether it is fundamental or derived, whether its definition is stable or provisional, and whether Stage 0 implements it.

## Terms

| Term                      | One-line definition                                                                                                 | Class               | Stage 0  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------- | -------- |
| [Locus](locus.md)         | An identifiable, bounded semantic unit with a responsibility, ownership boundaries, relationships and capabilities. | Semantic primitive  | In scope |
| [Identity](identity.md)   | The stable, location-independent name by which a Locus is known.                                                    | Semantic primitive  | In scope |
| [Charter](charter.md)     | The declaration of a Locus's purpose, responsibilities, boundaries and success conditions.                          | Semantic primitive  | In scope |
| [Relation](relation.md)   | A typed semantic relationship between Loci or their elements.                                                       | Semantic primitive  | In scope |
| [Revision](revision.md)   | An immutable, identifiable version of a managed semantic definition.                                                | Semantic primitive  | In scope |
| [Fabric](fabric.md)       | A coherent composition of related Loci, their Relations and shared constraints.                                     | Derived composition | Minimal  |
| [Facet](facet.md)         | A typed aspect of a Locus that adds a specification, interpretation or capability without changing its identity.    | Facet               | Deferred |
| [Archetype](archetype.md) | A reusable, programmable architecture specification.                                                                | Governance model    | Deferred |
| [Law](law.md)             | A formalised normative constraint within a defined scope.                                                           | Governance model    | Deferred |
| [Act](act.md)             | A typed capability or operation a Locus exposes under a contract.                                                   | Execution model     | Deferred |
| [Mandate](mandate.md)     | A bounded, verifiable delegation of authority.                                                                      | Governance model    | Deferred |
| [Lens](lens.md)           | A computed, purpose-specific view of a Locus or Fabric.                                                             | Derived composition | Deferred |
| [Variant](variant.md)     | An isolated candidate future state derived from a baseline.                                                         | Governance model    | Deferred |
| [Witness](witness.md)     | An identifiable piece of evidence with provenance.                                                                  | Governance model    | Deferred |
| [Verdict](verdict.md)     | An explicit decision from evaluating evidence and policy against a claim or transition.                             | Governance model    | Deferred |
| [Evolution](evolution.md) | The governed process of proposing, building, verifying, evaluating and possibly accepting a change.                 | Governance model    | Deferred |

**Identity** is not in the original list of fifteen. It is added because the minimal-model hypothesis (identity, Locus, Charter, Relation, Revision) names it and the model cannot be specified without it.

## Classes

- **Semantic primitive**: cannot be expressed through other terms; the model needs it to exist at all.
- **Derived composition**: defined in terms of primitives (a Fabric is Loci plus Relations plus constraints; a Lens is a computed selection).
- **Execution model**: concerns running behaviour.
- **Governance model**: concerns authority, evidence, decisions and change.
- **Facet**: the mechanism by which further aspects attach to a Locus.

## Front matter

Term files add these fields to the [common fields](../README.md#front-matter-schema):

| Field            | Values                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `order`          | Reading order, 1–16.                                                                              |
| `classification` | `semantic-primitive`, `derived-composition`, `execution-model`, `governance-model`, `facet`.      |
| `fundamental`    | `true` if the term is a primitive the model cannot do without, `false` if derived or specialised. |
| `engine`         | `true` if realising the term needs a dedicated engine (a runtime, a checker, an orchestrator).    |
| `stage0`         | `in-scope`, `minimal` or `deferred`.                                                              |

## Words to avoid

| Avoid                             | Use instead                               | Why                                                                                                           |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| "module", "component" for a Locus | Locus                                     | Both suggest a code or file unit; a Locus is semantic.                                                        |
| "tool" for an agent capability    | Act                                       | "Tool" suggests ambient, untyped power ([P05](../principles/P05-capabilities-instead-of-arbitrary-tools.md)). |
| "permission" for a grant          | Mandate                                   | A Mandate has scope, validity and revocation, not just a yes/no.                                              |
| "test result" as acceptance       | Witness (evidence) and Verdict (decision) | They are different records ([ADR-0010](../../decisions/ADR-0010-evidence-separate-from-acceptance.md)).       |
| "version" for a Revision          | Revision                                  | "Version" also means package versions and git tags.                                                           |
| "charter" alone near Spec Kitty   | "Locus Charter" or "project charter"      | Spec Kitty's project charter is a different thing.                                                            |
