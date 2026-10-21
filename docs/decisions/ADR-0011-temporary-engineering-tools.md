---
id: ADR-0011
title: Spec Kitty and GRACE remain temporary external tools with exclusive artifact ownership
kind: decision
status: proposed
maturity: implemented
date: 2026-10-21
summary: Spec Kitty owns the change lifecycle and GRACE owns code-architecture knowledge for developing Telos until Telos mechanisms can take over, each artifact having exactly one owning tool; neither is a Telos dependency.
related:
  [foundation, P12-independent-governance, P16-self-application, open-questions]
---

# ADR-0011 — Spec Kitty and GRACE remain temporary external tools with exclusive artifact ownership

## Context

Telos is meant eventually to govern its own evolution ([P16](../foundation/principles/P16-self-application.md)). Today it cannot: nothing of the Evolution or Verification capabilities exists. The repository already uses Spec Kitty (missions: specify, plan, tasks, implement, review, merge) and GRACE (module graph, verification register, file-local semantic markup). `AGENTS.md` assigns each concern to one of them.

## Decision

1. Spec Kitty and GRACE remain the engineering tools for developing Telos in Stage 0 and until a Telos mechanism matches the responsibility on real changes ([OQ-018](../foundation/open-questions.md#oq-018)).
2. Each artifact has exactly one owning tool, as tabled in the [foundation README](../foundation/README.md#who-owns-which-artifact). Spec Kitty: `kitty-specs/`, `.kittify/`. GRACE: `.grace/` and code markup. Telos foundation docs: `docs/foundation/`, `docs/decisions/`, `docs/research/`.
3. Telos packages never import either tool, and the Telos model does not adopt their vocabularies. A Spec Kitty mission corresponds loosely to an Evolution; GRACE modules are not Loci.
4. Handover happens per responsibility, with the external tool kept as fallback until the Telos mechanism has been used on real changes.

## Alternatives

- **Build Telos's own lifecycle first**: no governance for the work that builds it.
- **Adopt the tools' concepts into Telos**: would tie the model to temporary tools ([P15](../foundation/principles/P15-engine-independence.md)).

## Consequences

- Two vocabularies coexist during development; the foundation README maps them.
- Every mission keeps GRACE in sync and must pass `grace lint`, as `AGENTS.md` requires.
