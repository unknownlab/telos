---
id: P15-engine-independence
title: Engine Independence
kind: principle
number: 15
code: P15
status: provisional
maturity: vision
summary: The semantic model does not depend on any one test tool, AI provider, database, infrastructure provider, runtime or compiler; engines implement the model, they do not define it.
related:
  [
    P01-everything-is-code,
    P04-explicit-composition,
    ADR-0004,
    ADR-0013,
    technical-direction,
  ]
---

# P15 — Engine Independence

## Definition

The common semantic model does not depend unnecessarily on any one testing tool, AI provider, database, infrastructure provider, runtime or native compiler. Engines implement or interpret capabilities of the model through defined interfaces. They do not redefine its identity or meaning.

## Motivation

Frameworks that fuse their model with one engine die with that engine, or trap their users in it. Keeping the model independent lets Telos adopt better engines over time and lets one model drive several engines at once, for example the same Locus verified by a unit test runner and a model checker.

## Scope

Applies to the semantic foundation. Specific integrations naturally depend on their engine. "Unnecessarily" matters: Telos is committed to TypeScript and Effect as its authoring model ([ADR-0004](../../decisions/ADR-0004-typescript-and-effect.md)); that is a deliberate dependency, not an accident.

## Consequences

- Foundational packages avoid runtime-specific APIs where portable ones exist (for example Web Crypto instead of a Bun-only hash API).
- Temporary tools, such as `bun test` running Stage 0 specifications, sit behind adapters so they can be replaced ([ADR-0013](../../decisions/ADR-0013-temporary-executable-specifications.md)).
- An engine's data never becomes the identity of a model element.

## Known limitations

- Abstraction layers cost effort and can hide useful engine features.
- Independence from TypeScript and Effect is explicitly not a goal; the semantic intermediate representation ([OQ-014](../open-questions.md#oq-014)) may later loosen even that.

## Enforcement

- Potential: dependency rules that forbid engine imports in foundational packages; conformance suites per engine interface.
- Today: not enforced. The Stage 0 plan proposes a check that the Locus core does not import its own test adapters.

## Relationships

Bounds [P01](P01-everything-is-code.md). Relies on [P04](P04-explicit-composition.md) (interfaces are declared composition).

## Commitment vs. current invariant

Commitment: the model is engine-independent. Current invariant: none.
