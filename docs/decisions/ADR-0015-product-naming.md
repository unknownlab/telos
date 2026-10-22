---
id: ADR-0015
title: Telos by UnknownLab; @telos/ package scope
kind: decision
status: accepted
maturity: implemented
date: 2026-10-21
summary: The framework is named Telos; UnknownLab is the lab that makes it; packages use the @telos/ scope.
related: [foundation, technical-direction]
---

# ADR-0015 — Telos by UnknownLab; `@telos/` package scope

## Context

The Stage 0 directive called the work "the UnknownLab framework". The repository is named `telos`, and the owner clarified: "Its not just unknownlab, its "Telos by UnknownLab"".

## Decision

- The framework is **Telos**. In prose: "Telos", or "Telos by UnknownLab" where the maker matters (site header, about text).
- **UnknownLab** is the lab, not part of the product name.
- Workspace packages use the `@telos/` scope (`@telos/locus`, `@telos/docs`). The root package stays `telos`.
- "Telos" is Greek for purpose or end, matching the role of the Charter. This is a note, not a constraint.

## Alternatives

- `@unknownlab/` scope: names the maker rather than the product.

## Consequences

- The Spec Kitty glossary's description of Telos ("everything as code full-stack framework") needs aligning with the doctrine; that is a separate owner decision ([discovery report](../research/stage-0-discovery.md)).
- Publishing under `@telos` on a public registry would need the scope to be available; nothing is published in Stage 0.
