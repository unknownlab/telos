---
id: P15-no-arbitrary-agent-privileges
title: No Arbitrary Agent Privileges
kind: principle
number: 15
code: P15
status: provisional
maturity: proposed
summary: An agent can invoke a capability only when a relation in the model grants that invocation, and it has no ambient access to tools or data beyond those grants.
related:
  [
    P05-agents-use-semantic-apis,
    P14-no-ai-in-the-kernel,
    capability,
    grant,
    relation-type,
  ]
---

# P15 — No Arbitrary Agent Privileges

## Definition

An agent acts through [capabilities](../terminology/capability.md) that Loci provide. It may invoke a capability only when a [grant](../terminology/grant.md) exists: a relation whose [relation type](../terminology/relation-type.md) grants invocation, or the capability's own Locus as caller. An agent has no ambient permission, no general shell and no tool that is not declared as a capability of some Locus.

## Motivation

An agent with general access can do anything the person running it can do, and the reason for each action is not recorded in the system. Declaring the grants in the model makes each permission visible, reviewable and removable.

## In practice

- `invoke` in `packages/kernel/src/invoke.ts` returns `NotGranted` unless the caller is the capability's Locus or a relation whose type grants invocation exists between the caller and the capability.
- The agent tools in `packages/agent/src/tools.ts` are built only from capabilities in the model; no tool is added outside that list.
- `bun run telos inspect` lists the grants so that a reviewer can see which agent can invoke which capability.

## Limits

- A grant states that an invocation is permitted, not that it is wise. The capability's own contract and effect class still apply.
- Grants are only as narrow as the relations that declare them. Broad relations give broad grants.
- The caller identity (`via`) is trusted in process and is not authenticated by the kernel. The interface packs fix it; isolation of an agent runtime is open ([OQ-016](../open-questions.md)).
