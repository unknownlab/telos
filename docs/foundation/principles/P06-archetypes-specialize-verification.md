---
id: P06-archetypes-specialize-verification
title: Archetypes Provide Specialized Verification
kind: principle
number: 6
code: P06
status: provisional
maturity: proposed
summary: Verification rules are grouped into Archetypes that apply to the Loci whose composition includes given extensions, so each kind of Locus is checked against the rules that fit it.
related:
  [
    P02-composable-extensions,
    P07-no-universal-correctness,
    archetype,
    rule,
    finding,
    knowledge-status,
  ]
---

# P06 — Archetypes Provide Specialized Verification

## Definition

An [Archetype](../terminology/archetype.md) is a named set of [rules](../terminology/rule.md). It applies to every Locus whose composition includes the extensions the Archetype names. Each rule has a method, static or execution, and each rule run on a Locus produces a [finding](../terminology/finding.md) that is passed, failed or error.

## Motivation

A single set of checks applied to every component is either too weak for the components that need strict checks or too strict for the rest. Tying rules to the extensions a Locus has keeps each check where it is meaningful, and it makes the check list reviewable: a reader can see which rules apply to which kind of Locus.

## In practice

- `Archetype.make` in `packages/kernel/src/archetype.ts` builds an Archetype from named rules and the extensions it applies to.
- `verify` in `packages/kernel/src/verify.ts` runs the rules that apply to each Locus and records one finding per rule.
- The calculator proof in `apps/calculator` declares its own Archetype for arithmetic Loci; the rules are listed in its verification file.

## Limits

- An Archetype checks what its rules check. Its findings are only as good as its rules.
- Rules that need execution are run only when the caller asks for execution. A static pass does not claim more than it checked ([P13](P13-no-unverified-guarantees.md)).
