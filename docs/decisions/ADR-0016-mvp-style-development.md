---
id: ADR-0016
title: Telos is developed MVP-style; TypeScript and Effect are fixed, Bun is the first target
kind: decision
status: accepted
maturity: implemented
date: 2026-10-22
summary: Telos is a framework built in small working slices. Only TypeScript with Effect is fixed and Bun is the first target; every other decision is provisional and may change.
related: [ADR-0004, foundation, technical-direction, open-questions]
---

# ADR-0016 — Telos is developed MVP-style; TypeScript and Effect are fixed, Bun is the first target

## Context

Telos is a framework, not a business product. It is early, and most of its design has not yet met real use. The owner's guidance (2026-10-22): TypeScript and Effect are the main tools of Telos, Bun is the first target, and everything else is MVP, so everything else can change.

## Decision

1. Telos is built MVP-style: the smallest slice that works end to end, then the next one. A slice may change the design that came before it.
2. **Fixed:** TypeScript (strict) and Effect are the authoring model ([ADR-0004](ADR-0004-typescript-and-effect.md)).
3. **First target:** Bun is the first runtime and toolchain. Other runtimes and targets are open. The packages already use only web-standard APIs, so they run in browsers too.
4. **Provisional:** every other decision, including every record that is still `proposed`, can be changed or replaced when the MVP shows a better design. A decision is replaced by a new record that supersedes it (see [Statuses](README.md#statuses)), not by editing history.
5. A `proposed` record is not a commitment. It becomes `accepted` only when the owner decides it.

## Alternatives

- **Settle the whole design first.** Rejected: too much is unknown until something runs.
- **Accept every record now.** Rejected: it would present guesses as commitments.

## Consequences

- Contributors and agents build for what the current slice needs, not for imagined future needs.
- Early APIs, formats, packages and documents may change. Documents state their maturity honestly, so a reader can tell what exists and what is only an idea.
- "Bun is the first target" does not decide deployment, hosting or publishing. Nothing is deployed or published yet.
