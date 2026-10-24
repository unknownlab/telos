---
id: P07-no-universal-correctness
title: No Universal Correctness Algorithm
kind: principle
number: 7
code: P07
status: provisional
maturity: proposed
summary: Telos does not offer one correctness test for every system; correctness is defined per Archetype, and the kernel does not claim that a model is correct in general.
related:
  [
    P06-archetypes-specialize-verification,
    P13-no-unverified-guarantees,
    archetype,
    finding,
    knowledge-status,
  ]
---

# P07 — No Universal Correctness Algorithm

## Definition

The kernel does not contain a general algorithm that decides whether a system is correct. Correctness is stated by an [Archetype](../terminology/archetype.md) and its [rules](../terminology/rule.md), and only for the Loci those rules apply to. The kernel reports structural [diagnostics](../terminology/diagnostic.md) and rule [findings](../terminology/finding.md). It does not turn them into a single verdict on the whole system.

## Motivation

Correctness depends on what the system is for. A payment flow, a command-line tool and a documentation site need different checks. A universal check either accepts too much or rejects valid designs. Stating the check per kind keeps each claim narrow and true.

## In practice

- The kernel's structural checks in `packages/kernel/src/diagnostic.ts` are about the shape of the model, such as identity, ownership and composition. They make no claim about behaviour.
- `bun run telos check` prints diagnostics and findings separately, and never a single pass or fail for the whole repository.
- Archetype rules in `packages/kernel/src/verify.ts` carry the correctness claims for their Loci.

## Limits

- Without a universal check, a team can have no single number that says the system is fine. This is intended.
- Each Archetype needs its own rules written. Missing rules mean missing checks, which are reported as gaps rather than hidden.
