---
id: ADR-0025
title: The documentation runs the real kernel
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: The site playground runs the real kernel on JSON Locus definitions in the browser. The inspector and verification pages read a semantic report produced at build time.
related:
  [
    ADR-0014,
    ADR-0012,
    P04-code-is-the-source-of-truth,
    P13-no-unverified-guarantees,
    future-semantic-evolution,
  ]
---

# ADR-0025 — The documentation runs the real kernel

## Context

[ADR-0014](ADR-0014-controlled-playground.md) let the playground run the real package, but only on structured inputs chosen in advance. Examples that were chosen in advance do not show how the kernel reacts to other input. [P04](../foundation/principles/P04-code-is-the-source-of-truth.md) asks that the documentation describe the code that runs, and [P13](../foundation/principles/P13-no-unverified-guarantees.md) asks that no page show a result that was not produced.

## Decision

1. The playground decodes and verifies JSON Locus definitions with `@telos/kernel` in the browser. The reader supplies the JSON.
2. The inspector and verification pages read the semantic report that `bun run telos report` produces at build time. They do not compute their own results.
3. The controlled scenario playground of ADR-0014 is replaced by this design.

## Alternatives

- **Keep the controlled scenario playground.** Rejected: it shows only the cases chosen in advance.
- **Static, hand-written examples with recorded output.** Rejected: they go stale when the kernel changes, and nothing checks them.
- **A server that runs the CLI for each request.** Rejected: the documentation site must be static, and a server would add an operating cost that Telos does not need yet.

## Consequences

- A change to the kernel changes what the playground shows, with no separate update to the documentation.
- A page that shows a verification result shows only results from the build report, and the report lists the rules that did not run.
- The browser build of the kernel must stay free of Node-only and Bun-only APIs, as [ADR-0024](ADR-0024-digests-and-model-comparison.md) requires for digests.
