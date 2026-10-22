---
id: P01-everything-is-code
title: Everything Is Code
kind: principle
number: 1
code: P01
status: provisional
maturity: vision
summary: Every concept Telos manages has a programmable representation, from which or beside which human-readable documentation is kept.
related:
  [
    P02-everything-has-meaning,
    P14-incremental-formalization,
    P15-engine-independence,
    locus,
    facet,
  ]
---

# P01 — Everything Is Code

## Definition

Every concept Telos manages has a programmable representation: a typed definition that programs can read, check, transform and execute. This covers application behaviour and also requirements, architecture, policies, risk models, verification procedures, infrastructure, agent capabilities and the evolution process itself. Human-readable documentation is generated from these representations, linked to them, or kept beside them with an explicit link.

## Motivation

What only exists as prose cannot be checked, and what cannot be checked drifts. Requirements in a wiki, architecture on a whiteboard and risk in a spreadsheet each go stale at their own speed. When the same concepts are code, the framework can compute relationships, detect contradictions and enforce constraints.

## Scope

Applies to concepts the framework **manages**. It does not require writing every external dependency in TypeScript. A database, a cloud provider or a test runner stays what it is and is reached through a typed interface ([P15](P15-engine-independence.md)). "Code" means a programmable representation, not necessarily executable behaviour: a Charter is code because it is typed data, even though it does nothing on its own.

## Consequences

- Concepts get schemas and types before they get tooling.
- Documentation of a managed concept points to its representation, or is produced from it.
- A concept that cannot yet be represented is marked as narrative ([P14](P14-incremental-formalization.md)) rather than pretended to be formal.

## Known limitations

- Some knowledge resists formalisation: taste, judgement, tacit domain experience. Forcing it into code produces false precision.
- Code is not automatically clearer than prose. Representations need design to stay readable.
- Representations can drift from what they describe, just as prose can. Code makes drift detectable, not impossible.

## Enforcement

- Potential: the framework refuses to manage an artifact that has no representation; documentation generators fail on concepts without a source definition.
- Today: not enforced. The foundation docs themselves are Markdown with structured front matter, a first step that lets tools read their metadata.

## Relationships

Foundation for [P02](P02-everything-has-meaning.md) (meaning must be representable to be checked). Balanced by [P14](P14-incremental-formalization.md) (representation may start informal). Bounded by [P15](P15-engine-independence.md) (representations describe engines; they do not replace them).

## Commitment vs. current invariant

Commitment: all managed concepts are programmable. Current invariant: none.
