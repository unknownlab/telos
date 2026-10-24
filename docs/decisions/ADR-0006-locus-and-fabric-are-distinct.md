---
id: ADR-0006
title: Locus and Fabric are distinct concepts
kind: decision
status: proposed
maturity: implemented
date: 2026-10-21
summary: A Fabric is a named composition of Loci and the scope in which identity uniqueness, reference resolution and structural rules are checked; it is not itself a Locus in Stage 0.
related: [semantic-model, locus, P02-composable-extensions, open-questions]
---

# ADR-0006 — Locus and Fabric are distinct concepts

## Context

Several Stage 0 rules cannot be checked on one Locus alone: identities must be unique, Relation targets and owners must exist, ownership and `refines` must be acyclic. They need a scope. One option is to make every scope a Locus (a "system" Locus containing others); another is a separate concept.

## Decision

A [Fabric](../foundation/terminology/semantic-model.md) is a separate concept: an identified set of Loci that is validated as a whole. In Stage 0 a Fabric has an Identity and members and nothing else: no Charter, no owner, no history. Validation always runs on a Fabric, and a single Locus is validated by wrapping it in a Fabric; the references it makes must then resolve inside that Fabric.

## Alternatives

- **Fabric as a Locus**: uniform, but gives every grouping a Charter and owner it may not have, and mixes "unit of responsibility" with "scope of checking".
- **One implicit global scope**: no extra concept, but no way to validate a subsystem on its own or to say which Loci a rule applies to.

## Consequences

- Two concepts to learn instead of one.
- Whether a Locus may be in several Fabrics, and whether Fabrics get history, stay open ([OQ-002](../foundation/open-questions.md#oq-002), [OQ-007](../foundation/open-questions.md#oq-007)).
- A Locus whose purpose is to be a system (for example "the shop") can still exist as a Locus and own other Loci; the Fabric is the checking scope around them.
