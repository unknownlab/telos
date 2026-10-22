---
id: ADR-0017
title: Telos is developed with Telos (north star)
kind: decision
status: accepted
maturity: vision
date: 2026-10-22
summary: The long-term direction is that Telos is developed by Telos itself. No schedule, order or list of next steps is fixed.
related: [P16-self-application, ADR-0016, roadmap, foundation]
---

# ADR-0017 — Telos is developed with Telos (north star)

## Context

The owner's direction (2026-10-22): the current north star is that this framework is developed by this framework. Principle [P16](../foundation/principles/P16-self-application.md) already says Telos applies its own model to itself. What is missing is a statement that this is the direction everything else is measured against.

## Decision

1. The north star is that Telos is developed with Telos: its packages, apps, documents, decisions and checks are described and verified with its own model.
2. This is a direction, not a plan. No next step, order or schedule is fixed by this record. The owner decides what comes next, and may first review the code and write parts by hand.
3. Small applications built with Telos, such as a calculator, are an idea the owner may pursue. They are not a decision.
4. The [roadmap](../foundation/roadmap/README.md) stages stay direction only, as ADR-0016 says: every decision other than TypeScript with Effect and Bun as the first target is provisional.

## Alternatives

- **Leave self-application as one principle among sixteen.** Rejected: the owner wants it to be the measure for the rest.
- **Plan the self-hosting steps now.** Rejected: too early; what the MVP shows will decide them.

## Consequences

- When two choices are otherwise equal, prefer the one that lets Telos describe or verify its own work.
- Nothing here commits a mission or a date.
