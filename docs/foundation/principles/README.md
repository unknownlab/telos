---
id: principles
title: Principles
kind: index
status: provisional
maturity: proposed
summary: The sixteen principles of Telos as semantic-first, agent-native programming, each with its definition, motivation, practice and limits.
related: [terminology, conceptual-model, foundation]
---

# Principles

Version 0.2 of the Telos principles. They describe semantic-first, agent-native programming: a system is a set of Loci composed from semantic extensions, checked by Archetypes and used by agents through capabilities.

Each principle states four things: its **definition**, the **motivation** for it, how it is **in practice** in the kernel, Packs or the repository gate, and its **limits**. A principle is a commitment that design decisions can be checked against. Where a principle is not yet enforced, its limits say so.

| #                                                | Principle                                       | Summary                                                                               |
| ------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| [P01](P01-one-fundamental-entity.md)             | One Fundamental Entity: Locus                   | A system is described by Loci; every other concept is an extension, relation or view. |
| [P02](P02-composable-extensions.md)              | Extensions Are Composable                       | Meaning is added by explicit composition; conflicts are reported, never overwritten.  |
| [P03](P03-no-code-outside-semantics.md)          | No Code Outside Semantics                       | Every managed code file belongs to a discoverable Locus owner.                        |
| [P04](P04-code-is-the-source-of-truth.md)        | Executable Code Is the Source of Semantic Truth | The model is computed from code; prose is derived from or linked to it.               |
| [P05](P05-agents-use-semantic-apis.md)           | Agents Access Knowledge Through Semantic APIs   | Agents query typed introspection instead of searching raw files.                      |
| [P06](P06-archetypes-specialize-verification.md) | Archetypes Provide Specialized Verification     | Rules are grouped into Archetypes that apply to Loci by their extensions.             |
| [P07](P07-no-universal-correctness.md)           | No Universal Correctness Algorithm              | Correctness is stated per Archetype, never for a whole system at once.                |
| [P08](P08-no-mandatory-architecture.md)          | No Mandatory Application Architecture           | Telos describes the architecture a project chooses and imposes none.                  |
| [P09](P09-no-duplicated-frameworks.md)           | No Duplication of Existing Frameworks           | Telos uses general tools and adds only the semantic layer.                            |
| [P10](P10-no-unnecessary-layers.md)              | No Unnecessary Abstraction Layers               | A layer exists only when a real caller needs it.                                      |
| [P11](P11-no-compatibility-for-mistakes.md)      | No Compatibility for Obsolete Mistakes          | A mistaken concept is replaced and recorded, not kept alive by aliases.               |
| [P12](P12-no-duplicate-semantic-models.md)       | No Manually Synchronized Duplicate Models       | A fact is recorded once; a second description is generated or checked.                |
| [P13](P13-no-unverified-guarantees.md)           | No Unverified Claims as Guarantees              | A statement is a guarantee only when a real rule produced it.                         |
| [P14](P14-no-ai-in-the-kernel.md)                | No AI Dependency in the Semantic Kernel         | The kernel is deterministic and calls no model provider.                              |
| [P15](P15-no-arbitrary-agent-privileges.md)      | No Arbitrary Agent Privileges                   | An agent invokes only the capabilities that a grant from the model allows.            |
| [P16](P16-no-speculative-implementation.md)      | No Speculative Implementation                   | A concept is implemented when a current use needs it, not for an imagined future.     |

## Front matter

Principle files add `number` (1–16) and `code` (`P01`–`P16`) to the [common fields](../README.md#front-matter-schema).

## Versioning

The principle set is versioned as a whole. Changing a definition, adding or removing a principle needs an architecture decision record. Clarifying wording without changing meaning does not.
