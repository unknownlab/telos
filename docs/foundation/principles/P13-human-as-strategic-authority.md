---
id: P13-human-as-strategic-authority
title: Human as Strategic Authority
kind: principle
number: 13
code: P13
status: provisional
maturity: vision
summary: Humans set objectives, delegated authority, acceptable risk and governance boundaries; routine steps need no human, and reserved decisions stay with humans.
related:
  [P06-authority-is-explicit, P12-independent-governance, mandate, verdict]
---

# P13 — Human as Strategic Authority

## Definition

Humans define objectives, delegate authority, set acceptable risk and draw the fundamental governance boundaries. Inside those boundaries, routine implementation steps proceed without a human in the loop. Decisions that require reserved authority stay outside any agent's autonomous scope.

## Motivation

Requiring a human for every step wastes human attention and trains people to approve without reading. Requiring no human hands purpose and risk appetite to systems that cannot own them. The workable middle is delegation: humans decide what and how much risk, and grant bounded authority for the rest.

## Scope

Applies to the root of every authority chain. Every [Mandate](../terminology/mandate.md) traces back to a human grant. Which decisions are reserved is itself a human decision, recorded and reviewable.

## Consequences

- Reserved decisions are listed explicitly. This repository's list is in `AGENTS.md` ("Owner decisions").
- Agents escalate only reserved or genuinely unresolvable decisions, with a recommendation.
- Delegated authority has limits and an end.

## Known limitations

- Humans are not always right or available. The model needs fallbacks for absence, such as suspending an Evolution rather than deciding on someone's behalf.
- The boundary between routine and strategic shifts with context and trust.

## Enforcement

- Potential: Mandates with a human root; reserved-decision checks in the Evolution engine.
- Today: partly, outside Telos. `AGENTS.md` lists the owner's reserved decisions (advisory); Spec Kitty gates block merges without approval.

## Relationships

Root of [P06](P06-authority-is-explicit.md) and [P12](P12-independent-governance.md).

## Commitment vs. current invariant

Commitment: humans hold strategic and reserved authority. Current invariant: none in Telos; advisory rules on this repository.
