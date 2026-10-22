---
id: ADR-0014
title: The playground runs the real package on structured inputs only
kind: decision
status: proposed
maturity: proposed
date: 2026-10-21
summary: The documentation playground imports the real Locus package, decodes user input with Effect Schema from structured forms or JSON, never evaluates code, and labels every result with where and when it was produced.
related:
  [
    ADR-0010,
    ADR-0013,
    P05-capabilities-instead-of-arbitrary-tools,
    open-questions,
  ]
---

# ADR-0014 — The playground runs the real package on structured inputs only

## Context

An interactive playground teaches the model best when readers can define their own Loci. Letting them type TypeScript and running it would need an in-browser compiler and arbitrary code execution, which is a security boundary Telos has not designed ([OQ-020](../foundation/open-questions.md#oq-020)). A playground that fakes results would contradict [ADR-0010](ADR-0010-evidence-separate-from-acceptance.md).

## Decision

1. The playground imports the same `@telos/locus` build that the tests exercise; it contains no reimplementation of validation, hashing or diffing.
2. Input is structured: form fields, or JSON text decoded with the package's Effect Schema. No `eval`, `new Function`, dynamic `import()` of user content or HTML injection of user strings.
3. Every result shows its provenance: "run in this browser" with time and package version; "run by Bun at build time" with the git revision; "CI" (shown as unavailable in Stage 0); or "historical".
4. Scenarios: define a valid Locus; submit an invalid definition and see every diagnostic; add Relations and see reference and cycle errors; create Revisions, append them to a history and see diffs and stale-baseline rejection; run the specifications.

## Alternatives

- **Live TypeScript editing in a sandbox**: deferred until a threat model exists.
- **Pre-recorded results**: cheap, and the kind of fake evidence ADR-0010 forbids.

## Consequences

- Readers cannot express everything TypeScript allows; the JSON shape is the documented wire form.
- Because the package is portable ([technical direction](../foundation/architecture/technical-direction.md#runtime-and-toolchain-bun)), the browser and Bun produce the same Revision ids, which the site can show side by side.
