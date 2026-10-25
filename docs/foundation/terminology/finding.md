---
id: finding
title: Finding
kind: term
order: 11
classification: verification-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: The outcome of one rule on one Locus, recorded as passed, failed or error.
related: [rule, diagnostic, knowledge-status, archetype]
---

# Finding

## Definition

The outcome of one [rule](rule.md) on one [Locus](locus.md). A finding is passed, failed or error. An error means the rule could not be run, not that the Locus failed.

## Avoid

"diagnostic". A finding comes from a rule and concerns one Locus; a [diagnostic](diagnostic.md) is a structural problem in the model.

## In the model

`verify` in `packages/kernel/src/verify.ts` produces one finding per rule and Locus. Each finding carries a [knowledge status](knowledge-status.md) that says whether the rule was run.

## Related

- [Rule](rule.md), [archetype](archetype.md), [knowledge status](knowledge-status.md).
