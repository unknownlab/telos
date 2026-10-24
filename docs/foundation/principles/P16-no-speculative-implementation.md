---
id: P16-no-speculative-implementation
title: No Speculative Implementation
kind: principle
number: 16
code: P16
status: provisional
maturity: proposed
summary: Telos implements a concept only when a current use needs it, and future concepts are described as direction, not built as code.
related:
  [
    P10-no-unnecessary-layers,
    P11-no-compatibility-for-mistakes,
    future-semantic-evolution,
    knowledge-status,
  ]
---

# P16 — No Speculative Implementation

## Definition

A concept enters the code when a current use needs it, and it is then implemented to the extent that use requires. Concepts that are planned but not needed yet are written in the documentation as future direction, with their status stated, and they are not implemented as code, empty modules or placeholder types. The [future semantic evolution](../future-semantic-evolution.md) document describes the concepts that are deferred.

## Motivation

Code written for an imagined future is usually wrong about that future, and it is costly to remove. A small implementation that matches the real use is easier to change when the real use arrives.

## In practice

- The kernel implements the Locus, identity, relation, capability, Archetype and finding because the calculator proof and the introspection tools use them.
- Evolution concepts such as Variant, Witness and Verdict are not in `packages/kernel/src`. They are described in [future semantic evolution](../future-semantic-evolution.md).
- The roadmap in `docs/foundation/roadmap/README.md` lists the next candidates as direction only, under [ADR-0016](../../decisions/ADR-0016-mvp-style-development.md), which keeps every decision except the language and runtime provisional.

## Limits

- Deciding whether a need is current is a judgement. The decision is recorded in the mission that adds the code.
- Some work, such as stable interfaces for Pack authors, must be designed before its first user. Such work is named in a decision record, not added silently.
