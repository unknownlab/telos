---
id: P13-no-unverified-guarantees
title: No Unverified Claims as Guarantees
kind: principle
number: 13
code: P13
status: provisional
maturity: proposed
summary: A statement about the system is presented as a guarantee only when a rule produced it by a real check, and every other statement carries its knowledge status.
related:
  [
    P04-code-is-the-source-of-truth,
    P06-archetypes-specialize-verification,
    P07-no-universal-correctness,
    knowledge-status,
    finding,
  ]
---

# P13 — No Unverified Claims as Guarantees

## Definition

A claim about a Locus is either declared, derived, verified, failed, not run, observed, invalidated or unknown, as recorded by its [knowledge status](../terminology/knowledge-status.md). "Verified" is used only for a [rule result](../terminology/finding.md) produced by a real execution in this repository. A declaration, a definition or a person's assertion is never verified, however complete it looks.

## Motivation

A model that mixes declarations with checked results invites readers to trust declarations as if they were checks. Keeping the status explicit lets a reader see what was actually tested and what was only written down.

## In practice

- The status vocabulary is the type `Knowledge` in `packages/kernel/src/describe.ts`, and every finding carries one.
- Rules run by `verify` in `packages/kernel/src/verify.ts` record `verified` or `failed` only after execution; a rule that did not run records `not run`.
- The documentation site refuses the words "verified", "passing" and "all tests pass" in front matter and status columns, in `apps/docs/scripts/content.ts`.

## Limits

- A status tells what was checked, not whether the check was complete. A rule can pass and still miss a case.
- The reserved statuses `observed` and `invalidated` are defined but not produced by this model yet.
