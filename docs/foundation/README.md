---
id: foundation
title: Telos foundation
kind: index
status: provisional
maturity: proposed
summary: Entry point to the doctrine, principles, terminology, conceptual model and architecture of Telos by UnknownLab.
related: [evolution-of-determinism, principles, terminology, conceptual-model]
---

# Telos foundation

**Telos** is a framework by **UnknownLab** for creating, running, verifying, operating and evolving software systems. Its long-term aim is a programmable, graph-native software engineering environment in which applications, infrastructure, AI agents, requirements, risks, policies, processes and verification share one semantic model, authored in TypeScript with Effect.

The name comes from the Greek _telos_, "purpose" or "end". Every unit Telos manages exists for a declared purpose, its [Charter](terminology/charter.md).

This directory is the authoritative source for what Telos means. The documentation site and the agent documentation are built from it. If another document disagrees with these files, these files win and the other document is wrong.

## Reading order

1. [Evolution of Determinism](philosophy/evolution-of-determinism.md): the philosophy.
2. [Principles](principles/README.md): the sixteen foundational principles.
3. [Terminology](terminology/README.md): the vocabulary.
4. [Conceptual model](conceptual-model/README.md): how the concepts relate, the invariants and the minimal model.
5. [Capability map](architecture/capabilities.md) and [technical direction](architecture/technical-direction.md).
6. [Roadmap](roadmap/README.md).
7. [Open questions](open-questions.md).
8. [Architecture decisions](../decisions/README.md) and [research](../research/README.md).

## Maturity vocabulary

Every foundation document and every concept carries a `maturity` in its front matter. The values form a ladder and nothing may claim a rung it has not reached.

| Maturity      | Meaning                                                                                           | Who may set it                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `vision`      | Intended long-term direction. No design commitment.                                               | Foundation authors.                                                      |
| `proposed`    | A concrete design is written down. No code exists.                                                | Foundation authors.                                                      |
| `implemented` | Code that realises the concept exists on the branch the document is on.                           | The work that merges the code.                                           |
| `verified`    | Implemented, and passing executable specifications exist for a recorded revision and environment. | Never written by hand. Shown only next to the evidence that supports it. |

`verified` is deliberately absent from front matter. A document cannot verify itself (see [P09](principles/P09-evidence-before-acceptance.md) and [P10](principles/P10-uncertainty-must-be-explicit.md)). Tools that display verification status must derive it from actual specification results and show where those results came from.

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

A Spec Kitty mission is today's stand-in for a Telos [Evolution](terminology/evolution.md). A git commit is not a Telos [Revision](terminology/revision.md). A JUnit report is not a [Witness](terminology/witness.md), though it carries some of the same information. These mappings are approximations and are named as such wherever they appear.

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
