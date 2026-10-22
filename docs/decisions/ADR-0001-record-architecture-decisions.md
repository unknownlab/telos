---
id: ADR-0001
title: Record architecture decisions in docs/decisions
kind: decision
status: accepted
maturity: implemented
date: 2026-10-21
summary: Telos architecture decisions are kept as numbered Markdown records with front matter in docs/decisions/, separate from Spec Kitty's per-mission decision logs.
related: [decisions, ADR-0012]
---

# ADR-0001 — Record architecture decisions in docs/decisions

## Context

Telos's foundations will be revisited for years. Agents and new contributors must be able to find why something is the way it is without access to past conversations. Spec Kitty already records decisions, but per mission and about the mission's work, so they are scattered and tied to the temporary tool.

## Decision

Architecture decisions about Telos are recorded as Markdown files `docs/decisions/ADR-NNNN-<slug>.md` with YAML front matter (`id`, `title`, `kind: decision`, `status`, `maturity`, `date`, `summary`, `related`). Each has Context, Decision, Alternatives, Consequences and, where useful, the evidence that would reopen it. Records are never deleted; they are superseded.

## Alternatives

- Only Spec Kitty decision logs: scattered across missions, tied to a temporary tool.
- A single decisions file: hard to link and to review.
- GRACE context files: GRACE models code modules, not product doctrine.

## Consequences

- One place to look for Telos architecture decisions.
- The documentation site can list and render them from front matter ([ADR-0012](ADR-0012-foundation-content-is-canonical.md)).
- Missions reference records instead of repeating their reasoning.
