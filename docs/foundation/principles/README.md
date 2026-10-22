---
id: principles
title: Principles
kind: index
status: provisional
maturity: proposed
summary: The sixteen foundational principles of Telos, each with its scope, consequences, limits and enforcement.
related: [evolution-of-determinism, terminology, conceptual-model]
---

# Principles

Version 0.1 of the Telos principles. The principles turn [Evolution of Determinism](../philosophy/evolution-of-determinism.md) into commitments that design decisions can be checked against.

Each principle separates two things:

- the **commitment**: what Telos intends, which may be far from enforceable today;
- the **current invariant**: what is actually enforced on this branch, often nothing yet.

A principle that is only a commitment is not false. It is unfinished, and it says so.

| #                                                     | Principle                               | Enforced today                                   |
| ----------------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| [P01](P01-everything-is-code.md)                      | Everything Is Code                      | No                                               |
| [P02](P02-everything-has-meaning.md)                  | Everything Has Meaning                  | No                                               |
| [P03](P03-semantic-ownership.md)                      | Semantic Ownership                      | No                                               |
| [P04](P04-explicit-composition.md)                    | Explicit Composition                    | No                                               |
| [P05](P05-capabilities-instead-of-arbitrary-tools.md) | Capabilities Instead of Arbitrary Tools | No                                               |
| [P06](P06-authority-is-explicit.md)                   | Authority Is Explicit                   | No                                               |
| [P07](P07-evolution-is-fundamental.md)                | Evolution Is Fundamental                | No                                               |
| [P08](P08-preserve-the-baseline.md)                   | Preserve the Baseline                   | No                                               |
| [P09](P09-evidence-before-acceptance.md)              | Evidence Before Acceptance              | Partly, by external tooling (Spec Kitty gates)   |
| [P10](P10-uncertainty-must-be-explicit.md)            | Uncertainty Must Be Explicit            | No                                               |
| [P11](P11-verification-is-contextual.md)              | Verification Is Contextual              | No                                               |
| [P12](P12-independent-governance.md)                  | Independent Governance                  | Partly, by external tooling (hooks, review gate) |
| [P13](P13-human-as-strategic-authority.md)            | Human as Strategic Authority            | Partly, by `AGENTS.md` (advisory)                |
| [P14](P14-incremental-formalization.md)               | Incremental Formalization               | No                                               |
| [P15](P15-engine-independence.md)                     | Engine Independence                     | No                                               |
| [P16](P16-self-application.md)                        | Self-Application                        | No                                               |

"Enforced today" is updated by the change that adds enforcement, never in advance. The Stage 0 mission is expected to make parts of P02, P03, P04, P08 and P10 enforceable for Locus definitions; until it merges, the column says No.

## Front matter

Principle files add `number` (1–16) and `code` (`P01`–`P16`) to the [common fields](../README.md#front-matter-schema).

## Versioning

The principle set is versioned as a whole. Changing a definition, adding or removing a principle needs an architecture decision record. Clarifying wording without changing meaning does not.
