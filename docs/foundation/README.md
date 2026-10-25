---
id: foundation
title: Telos foundation
kind: index
status: provisional
maturity: proposed
summary: Entry point to the doctrine of Telos as semantic-first, agent-native programming, with its principles, terminology, conceptual model, what is implemented and what is future direction.
related:
  [
    evolution-of-determinism,
    ADR-0018,
    principles,
    terminology,
    conceptual-model,
    future-semantic-evolution,
    open-questions,
  ]
---

# Telos foundation

**Telos** is a framework by **UnknownLab** for semantic-first, agent-native programming. A system is described as **Loci**: identifiable contexts, each with an identity and optional containment, relations, capabilities and properties. Loci are composed from **semantic extensions**, checked by **Archetypes** and distributed as **Packs**. Agents read the same model through typed introspection and act through granted capabilities. The code is the source of semantic truth, and documentation is derived from it.

The name comes from the Greek _telos_, "purpose" or "end". Every Locus that Telos describes exists for a stated purpose, given by the built-in [purpose](terminology/purpose.md) extension.

This directory is the authoritative source for what Telos means. The documentation site and the agent documentation are built from it. If another document disagrees with these files, these files win and the other document is wrong.

## Reading order

1. [Evolution of Determinism](philosophy/evolution-of-determinism.md): the philosophy.
2. [Principles](principles/README.md): the sixteen principles of the semantic model.
3. [Terminology](terminology/README.md): the vocabulary.
4. [Conceptual model](conceptual-model/README.md): how the concepts relate, with diagrams and invariants.
5. [Capability map](architecture/capabilities.md) and [technical direction](architecture/technical-direction.md).
6. [Roadmap](roadmap/README.md) and [future semantic evolution](future-semantic-evolution.md).
7. [Open questions](open-questions.md).
8. Architecture decisions and research: the decision record for this rebuild is [ADR-0018](../decisions/ADR-0018-semantic-foundation-rebuild.md). See [decisions](../decisions/README.md) and [research](../research/README.md).

## The model in one page

- **Locus** is the only fundamental entity. It has an [identity](terminology/identity.md) and may have [containment](terminology/containment.md), [relations](terminology/relation.md), [capabilities](terminology/capability.md) and properties.
- **Extensions** add meaning. A [semantic extension](terminology/semantic-extension.md) declares typed properties, [relation types](terminology/relation-type.md) and [Archetypes](terminology/archetype.md). [Composition](terminology/composition.md) combines them into a [Locus kind](terminology/locus-kind.md), and conflicts are reported.
- **Introspection** answers questions over the [semantic model](terminology/semantic-model.md) with typed queries, including [impact](terminology/impact.md). See [executable introspection](terminology/executable-introspection.md).
- **Packs** distribute extensions, Archetypes and adapters as ordinary TypeScript packages. [Interface Loci](terminology/interface-locus.md) expose capabilities through a command line, the Web and agent tools.
- **Semantic Closure** requires every managed code file to belong to a discoverable Locus owner. See [semantic closure](terminology/semantic-closure.md).
- **Verification** runs Archetype [rules](terminology/rule.md) and records [findings](terminology/finding.md) with a [knowledge status](terminology/knowledge-status.md).

## The calculator proof

The calculator in `apps/calculator` is the proof of the model. It is a small arithmetic system declared as Loci, with capabilities, an Archetype for its rules and an interface Locus for the command line and the Web. It shows that the kernel can describe, check and invoke a real system, and it is the example the guides use.

## What is implemented and what is future

The kernel, the Packs and the calculator are described in the [capability map](architecture/capabilities.md), which names the module for each capability. Anything listed there as "Not built in this mission" is direction only. Concepts such as Variant, Witness, Verdict, Mandate, Evolution and Revision are not implemented and are described in [future semantic evolution](future-semantic-evolution.md).

## Maturity vocabulary

Every foundation document and every concept carries a `maturity` in its front matter. The values form a ladder and nothing may claim a rung it has not reached.

| Maturity      | Meaning                                                                                           | Who may set it                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `vision`      | Intended long-term direction. No design commitment.                                               | Foundation authors.                                                      |
| `proposed`    | A concrete design is written down. No code exists.                                                | Foundation authors.                                                      |
| `implemented` | Code that realises the concept exists on the branch the document is on.                           | The work that merges the code.                                           |
| `verified`    | Implemented, and passing executable specifications exist for a recorded revision and environment. | Never written by hand. Shown only next to the evidence that supports it. |

`verified` is deliberately absent from front matter. A document cannot verify itself (see [P13](principles/P13-no-unverified-guarantees.md)). Tools that display verification status must derive it from actual specification results and show where those results came from.

`status` is separate from maturity. It says how settled the text is: `stable` (changes need a decision record), `provisional` (expected to change as the model is tested), `proposed` and `accepted` for decisions, `open` for unresolved questions.

## Who owns which artifact

Telos will eventually manage its own development. Until it can, external tools hold some responsibilities. Each class of artifact has exactly one owner, so there is one source of truth per concern ([ADR-0011](../decisions/ADR-0011-temporary-engineering-tools.md)).

| Artifact                                                           | Owner                                      | Location                          |
| ------------------------------------------------------------------ | ------------------------------------------ | --------------------------------- |
| Philosophy, principles, terminology, conceptual model, roadmap     | Telos foundation docs                      | `docs/foundation/`                |
| Architecture decisions about Telos                                 | Telos decision records                     | `docs/decisions/`                 |
| Research notes and discovery reports                               | Telos research records                     | `docs/research/`                  |
| Change lifecycle: specs, plans, work packages, reviews, acceptance | Spec Kitty (temporary)                     | `kitty-specs/`, `.kittify/`       |
| Project governance (project charter, doctrine selection)           | Spec Kitty charter, owner-controlled       | `.kittify/charter/`               |
| Tooling and process vocabulary                                     | Spec Kitty glossary                        | `.kittify/glossaries/`            |
| Code module graph, module contracts, verification map, code markup | GRACE (temporary)                          | `.grace/`, markup in source files |
| Agent operating rules                                              | `AGENTS.md`, owner-controlled              | `AGENTS.md`                       |
| Implemented behaviour                                              | The code and its executable specifications | `packages/`, `apps/`              |

A Spec Kitty mission is today's stand-in for a future change record. A git commit is not a Telos revision, and a JUnit report is not evidence in the sense of [future semantic evolution](future-semantic-evolution.md), though it carries some of the same information. These mappings are approximations and are named as such wherever they appear.

## Front matter schema

Every Markdown file under `docs/foundation/`, `docs/decisions/` and `docs/research/` starts with YAML front matter:

| Field      | Required | Meaning                                                                                                                           |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`       | yes      | Stable identifier, unique across the three directories. Used for links and URLs. Never reused.                                    |
| `title`    | yes      | Display title.                                                                                                                    |
| `kind`     | yes      | `index`, `doctrine`, `principle`, `term`, `model`, `capability-map`, `direction`, `roadmap`, `questions`, `decision`, `research`. |
| `status`   | yes      | See above.                                                                                                                        |
| `maturity` | yes      | `vision`, `proposed` or `implemented`.                                                                                            |
| `summary`  | yes      | One sentence.                                                                                                                     |
| `related`  | no       | List of `id`s of related documents. Every entry must resolve.                                                                     |

Principles and terms add fields, documented in their index files.
