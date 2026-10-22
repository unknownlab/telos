---
id: decisions
title: Architecture decisions
kind: index
status: provisional
maturity: implemented
summary: The register of Telos architecture decision records, their status and how to add one.
related: [open-questions, foundation]
---

# Architecture decisions

Decisions about Telos's architecture and foundations, one file each ([ADR-0001](ADR-0001-record-architecture-decisions.md)). Decisions about the repository's tooling and process stay in Spec Kitty mission records (`kitty-specs/*/decisions/`).

| ID                                                            | Decision                                                                                   | Status   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------- |
| [ADR-0001](ADR-0001-record-architecture-decisions.md)         | Record architecture decisions in `docs/decisions/`                                         | accepted |
| [ADR-0002](ADR-0002-locus-is-the-primary-semantic-unit.md)    | Locus is the primary semantic unit                                                         | proposed |
| [ADR-0003](ADR-0003-identity-independent-of-paths.md)         | Semantic identity is independent of file paths and owners                                  | proposed |
| [ADR-0004](ADR-0004-typescript-and-effect.md)                 | TypeScript and Effect are the authoring model                                              | accepted |
| [ADR-0005](ADR-0005-immutable-content-addressed-revisions.md) | Revisions are immutable and content-addressed; baselines advance by compare-and-set        | proposed |
| [ADR-0006](ADR-0006-locus-and-fabric-are-distinct.md)         | Locus and Fabric are distinct concepts                                                     | proposed |
| [ADR-0007](ADR-0007-ownership-is-structural.md)               | Ownership is a single structural property, not a Relation                                  | proposed |
| [ADR-0008](ADR-0008-typed-relations.md)                       | Relations are typed with a closed Stage 0 set of kinds                                     | proposed |
| [ADR-0009](ADR-0009-capabilities-for-agents.md)               | AI tools are modelled as bounded capabilities                                              | proposed |
| [ADR-0010](ADR-0010-evidence-separate-from-acceptance.md)     | Evidence is separate from acceptance                                                       | proposed |
| [ADR-0011](ADR-0011-temporary-engineering-tools.md)           | Spec Kitty and GRACE remain temporary external tools with exclusive artifact ownership     | proposed |
| [ADR-0012](ADR-0012-foundation-content-is-canonical.md)       | Foundation content is canonical Markdown with front matter, compiled by the site           | proposed |
| [ADR-0013](ADR-0013-temporary-executable-specifications.md)   | Stage 0 specifications are data run by Bun and the browser through adapters                | proposed |
| [ADR-0014](ADR-0014-controlled-playground.md)                 | The playground runs the real package on structured inputs only                             | proposed |
| [ADR-0015](ADR-0015-product-naming.md)                        | Telos by UnknownLab; `@telos/` package scope                                               | accepted |
| [ADR-0016](ADR-0016-mvp-style-development.md)                 | MVP-style development; TypeScript and Effect fixed, Bun first target, the rest provisional | accepted |
| [ADR-0017](ADR-0017-north-star-telos-built-with-telos.md)     | Telos is developed with Telos (north star)                                                 | accepted |

## Statuses

- `proposed`: written, awaiting the owner's decision.
- `accepted`: in force.
- `superseded`: replaced; the replacing record is linked.
- `rejected`: considered and declined; kept for the reasoning.

Only the owner accepts or rejects a record that touches architecture, public contracts, the data model or dependencies (`AGENTS.md`, "Owner decisions").

## Adding a record

Copy the structure of an existing record. Use the next free number; numbers are never reused. Front matter fields are the [common fields](../foundation/README.md#front-matter-schema) plus `date`. A record that resolves an [open question](../foundation/open-questions.md) links it, and the open question links back.
