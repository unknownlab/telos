---
id: grant
title: Grant
kind: term
order: 18
classification: execution-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: The permission to invoke a capability, derived only from a relation whose type grants invocation.
related:
  [relation, relation-type, capability, P15-no-arbitrary-agent-privileges]
---

# Grant

## Definition

Permission to invoke a [capability](capability.md). A grant exists in exactly two cases: a valid [relation](relation.md) whose [relation type](relation-type.md) grants invocation runs from the caller to the capability's Locus, or the caller is that Locus itself. No other source produces a grant.

The caller is identified by the `via` value passed to `invoke`. The kernel trusts that value; it is not authenticated. The CLI, web and agent packs set `via` to their own interface Locus, so a request through those packs cannot choose it.

## Avoid

"access" and "privilege". Those words suggest a role or an ambient right. A grant is derived from a declared relation and can be traced to it.

## In the model

`invoke` in `packages/kernel/src/invoke.ts` returns `NotGranted` when no grant exists. The grant check is `isGranted` in the same file. See [principle P15](../principles/P15-no-arbitrary-agent-privileges.md).

## Related

- [Relation](relation.md), [relation type](relation-type.md), [capability](capability.md).
