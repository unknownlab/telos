---
id: roadmap
title: Roadmap
kind: roadmap
status: provisional
maturity: vision
summary: The proposed order in which Telos grows from the Stage 0 Locus foundation toward the Software Factory, with the next necessary milestone.
related: [capabilities, open-questions, P16-self-application]
---

# Roadmap

**North star ([ADR-0017](../../decisions/ADR-0017-north-star-telos-built-with-telos.md)): Telos is developed with Telos.** It is a direction, not a plan; the owner decides what comes next.

A proposed order of stages. Each stage is one or more Spec Kitty missions, specified and approved on its own. Stages after Stage 0 are direction, not commitment: the evidence gathered in each stage may reorder the next.

## Stage 0 — Foundation (current)

Doctrine, principles, terminology, conceptual model, decisions. The first executable slice of the Semantic Foundation ([CAP-01](../architecture/capabilities.md#cap-01-semantic-foundation)): Locus definitions, Identity, Charter, ownership, typed Relations, immutable Revisions, validation, change detection, executable specifications. A documentation site with an interactive playground that runs the real package.

Exit criterion: a new contributor or agent can understand the model, define and validate a Locus, run its specifications and see their real results, from the repository alone.

## Stage 1 — Telos describes itself

The next logically necessary milestone. Stage 0 proves the model on examples; Stage 1 proves it on Telos.

- Describe Telos's own packages and apps as Loci, in the repository, with the Stage 0 API ([P16](../principles/P16-self-application.md)).
- Persist Revisions and histories (a file-based store) so baselines survive between runs.
- Graph queries and impact analysis over Relations: "what depends on this Locus?"
- A first drift check between declared Relations and actual package imports ([OQ-012](../open-questions.md#oq-012)), and a mapping between GRACE modules and Loci.
- A Facet extension point, designed against one real Facet (probably requirements).

## Stage 2 — Evidence and decisions

- Witness and Verdict as real records ([CAP-05](../architecture/capabilities.md#cap-05-verification-and-assurance)); the Stage 0 specification adapters produce Witnesses.
- Acceptance policies as code.
- First Laws and a first Archetype check ([CAP-02](../architecture/capabilities.md#cap-02-architecture)).
- Contextual check selection from Relation impact ([P11](../principles/P11-verification-is-contextual.md)).

## Stage 3 — Capabilities and authority

- Acts with contracts, Mandates, Lenses ([CAP-06](../architecture/capabilities.md#cap-06-agents)).
- One governed agent working through Acts only, with a threat model for the isolation it actually has ([OQ-016](../open-questions.md#oq-016)).

## Stage 4 — Governed evolution

- Variants and an Evolution engine ([CAP-07](../architecture/capabilities.md#cap-07-evolution)).
- First handover of a responsibility from Spec Kitty or GRACE to Telos, with the external tool kept as fallback ([OQ-018](../open-questions.md#oq-018)).

## Later

Processes, applications, infrastructure, observability and knowledge capabilities, in an order driven by the cases Telos is used for, and eventually the Software Factory ([CAP-14](../architecture/capabilities.md#cap-14-software-factory)).

## Explicitly not planned

A replacement for Pulumi, Playwright or an AI orchestration platform; a custom TypeScript compiler; a proprietary universal database. Telos integrates such engines ([P15](../principles/P15-engine-independence.md)).
