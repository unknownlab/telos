---
id: ADR-0013
title: Stage 0 specifications are data run by Bun and the browser through adapters
kind: decision
status: proposed
maturity: implemented
date: 2026-10-21
summary: Executable specifications for the Locus package are plain data with stable ids linked to invariants, run by one small runner with a bun test adapter and a browser adapter; the core package does not depend on them.
related:
  [
    future-semantic-evolution,
    P13-no-unverified-guarantees,
    P14-no-ai-in-the-kernel,
    ADR-0010,
    ADR-0014,
  ]
---

# ADR-0013 — Stage 0 specifications are data run by Bun and the browser through adapters

## Context

The Stage 0 package needs executable specifications that also run in the documentation playground, so readers see the real checks pass or fail. `bun test` cannot run in a browser. Writing the same cases twice, once as tests and once for the playground, would let them diverge. The eventual Verification capability ([CAP-05](../foundation/architecture/capabilities.md#cap-05-verification-and-assurance)) will define its own specification model, which should be able to absorb these.

## Decision

1. Each specification is a data record: a stable id (`LOC-001`, …), a title, the invariant ids it checks (`INV-…`), a polarity (positive or negative), an input built from public package API, and an expected outcome stated as structured data, never as message text. For a validation this is the validity flag and the ordered diagnostics, each given by code, scope, subject, path and any detail or members. For the other checks it is the structured result the check observes, such as the decode issue paths, the comparison flags, the append outcomes and entries, or the change list.
2. One small runner evaluates a specification against the package and returns a structured result. It has no dependency on any test framework.
3. Two adapters run the same specifications:
   - a `bun test` file that registers one test per specification, so they run in the repository's normal checks and the review gate;
   - the documentation playground, which runs them in the browser on demand and labels the result as a live browser run.
4. The core package does not import the specifications, the runner or any adapter (INV-014). The direction of dependency is specs → core.
5. The specifications are temporary scaffolding for Stage 0, to be migrated into the Verification capability's model when it exists.

## Alternatives

- **Plain `bun test` files only**: the playground could not run them.
- **A separate browser test framework**: two sets of cases.
- **Property-based testing now**: valuable for canonicalisation later; Stage 0 starts with example-based cases.

## Consequences

- The test suite is partly declarative; ordinary `bun test` unit tests may still exist for internals.
- Expected outcomes are structured, and diagnostics are compared by code, scope, subject, path, detail and members, so specifications do not depend on message wording.

## Note (2026-10-22): one package for the MVP

By owner decision, the specifications are not a separate package. They live inside `@telos/locus`, under the sub-path `@telos/locus/specs` (source in `packages/locus/specs`, tests in `packages/locus/test/specs`). The workspace package that held them before this decision, `@telos/locus-specs`, was folded into `@telos/locus`.

Decisions 1 to 3 stand as written: the specifications are data, one runner evaluates them without a test framework, and two adapters run them, `bun test` and the documentation playground.

Decision 4 still holds, but a package boundary no longer enforces it. A test enforces it instead: the core (`packages/locus/src`) must not import the specifications, the runner, an adapter or a test runner (INV-014, `packages/locus/test/specs/core-independence.test.ts`). A second test bundles the core for the browser and checks that the bundle carries no specification (`packages/locus/test/specs/portability.test.ts`).
