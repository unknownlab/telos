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
maturity: proposed
summary: The permission to invoke a capability, derived only from a relation whose type grants invocation.
related:
  [relation, relation-type, capability, P15-no-arbitrary-agent-privileges]
---

# Grant

## Definition

Permission to invoke a [capability](capability.md). A grant is derived only from a [relation](relation.md) whose [relation type](relation-type.md) grants invocation. No other source produces a grant.

## Avoid

"access" and "privilege". Those words suggest a role or an ambient right. A grant is derived from a declared relation and can be traced to it.

## In the model

`invoke` in `packages/kernel/src/invoke.ts` returns `NotGranted` when no grant exists. The grant derivation is in `packages/kernel/src/grant.ts`. See [principle P15](../principles/P15-no-arbitrary-agent-privileges.md).

## Related

- [Relation](relation.md), [relation type](relation-type.md), [capability](capability.md).
