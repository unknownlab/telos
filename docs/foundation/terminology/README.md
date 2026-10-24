---
id: terminology
title: Terminology
kind: index
status: provisional
maturity: proposed
summary: The official Telos vocabulary of semantic-first, agent-native programming, with each term's definition, class and reading order.
related: [conceptual-model, principles, foundation]
---

# Terminology

Version 0.2 of the Telos vocabulary. These names are the preferred vocabulary for the semantic model. Each term has its own file and URL anchor, and each file gives the definition, the words to avoid, where the term is represented in the model and its related terms.

## Terms

| Order | Term                                                        | One-line definition                                                                                  | Class               |
| ----: | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------- |
|     1 | [Locus](locus.md)                                           | The only fundamental semantic entity: an identifiable context responsible for part of a system.      | Semantic primitive  |
|     2 | [Semantic extension](semantic-extension.md)                 | A reusable definition that specializes a Locus with typed properties, relation types and Archetypes. | Extension model     |
|     3 | [Composition](composition.md)                               | Combining extensions into a Locus kind; incompatible definitions are reported, never overwritten.    | Extension model     |
|     4 | [Locus kind](locus-kind.md)                                 | The result of composing zero or more semantic extensions; it makes Loci.                             | Extension model     |
|     5 | [Containment](containment.md)                               | The structural ownership of one Locus by another; each Locus has at most one container.              | Semantic primitive  |
|     6 | [Relation type](relation-type.md)                           | A named meaning of a relation, defined by an extension.                                              | Extension model     |
|     7 | [Capability](capability.md)                                 | A named operation a Locus provides, with contracts and an effect class.                              | Execution model     |
|     8 | [Contract](contract.md)                                     | The input, output and error schemas of a capability, with their digest.                              | Execution model     |
|     9 | [Rule](rule.md)                                             | One check of an Archetype, with a static or execution method.                                        | Verification model  |
|    10 | [Diagnostic](diagnostic.md)                                 | A structural problem in a model, with a stable code.                                                 | Verification model  |
|    11 | [Finding](finding.md)                                       | The outcome of one rule on one Locus: passed, failed or error.                                       | Verification model  |
|    12 | [Knowledge status](knowledge-status.md)                     | Whether a fact is declared, derived, verified, failed, not run, observed, invalidated or unknown.    | Verification model  |
|    13 | [Semantic model](semantic-model.md)                         | All Loci reachable from a root Locus, with the checked structure.                                    | Derived composition |
|    14 | [Semantic Closure](semantic-closure.md)                     | The property that every managed code file belongs to a discoverable Locus owner.                     | Derived composition |
|    15 | [Pack](pack.md)                                             | An ordinary TypeScript package that distributes extensions, Archetypes and adapters.                 | Extension model     |
|    16 | [Interface Locus](interface-locus.md)                       | A Locus that exposes capabilities of another Locus through a medium.                                 | Execution model     |
|    17 | [Impact](impact.md)                                         | The Loci, relations and rules affected by a change, computed from the model.                         | Derived composition |
|    18 | [Grant](grant.md)                                           | Permission to invoke a capability, derived only from an invocation relation.                         | Execution model     |
|    19 | [Purpose](purpose.md)                                       | The declaration of why a Locus exists, given by the built-in `telos.purpose` extension.              | Extension model     |
|    20 | [Semantic-first programming](semantic-first-programming.md) | Declaring and checking the meaning of a system before, or with, the code that implements it.         | Approach            |
|    21 | [Agent-native development](agent-native-development.md)     | Working with a system through its semantic model and granted capabilities.                           | Approach            |
|    22 | [Executable introspection](executable-introspection.md)     | Answering questions about a system by running typed queries over its model.                          | Approach            |
|    23 | [Identity](identity.md)                                     | The declared name of a Locus, written `namespace:name`.                                              | Semantic primitive  |
|    24 | [Relation](relation.md)                                     | One typed, directed statement from a Locus to a Locus or to a capability.                            | Semantic primitive  |
|    25 | [Archetype](archetype.md)                                   | A named set of verification rules that applies to Loci whose composition includes given extensions.  | Verification model  |

## Classes

- **Semantic primitive**: the model needs it to exist at all.
- **Derived composition**: defined in terms of primitives and computed from the model.
- **Extension model**: how meaning is added to Loci.
- **Execution model**: how capabilities are provided, invoked and granted.
- **Verification model**: how structure and behaviour are checked, and how results are recorded.
- **Approach**: a way of working that the model supports.

## Front matter

Term files add these fields to the [common fields](../README.md#front-matter-schema):

| Field            | Values                                                                          |
| ---------------- | ------------------------------------------------------------------------------- |
| `order`          | Reading order, 1–25.                                                            |
| `classification` | A class from the list above, in lower-case with hyphens.                        |
| `fundamental`    | `true` only for Locus, the one primitive the model cannot do without.           |
| `engine`         | `false` for every term in this vocabulary.                                      |
| `stage0`         | `in-scope` for every current term; `deferred` is used for future-only concepts. |

## Future concepts

Concepts that are not built yet, such as Variant, Witness, Verdict, Mandate, Evolution and Revision, are described in [future semantic evolution](../future-semantic-evolution.md). They are not terms of the current model.
