---
id: contract
title: Contract
kind: term
order: 8
classification: execution-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: proposed
summary: The input, output and error schemas of a capability, together with their digest.
related: [capability, semantic-model, knowledge-status]
---

# Contract

## Definition

The input, output and error schemas of a [capability](capability.md), together with a digest of them. The digest changes when any schema changes, so a caller can tell that the contract it used is no longer the current one.

## Avoid

"spec" and "signature". A signature names only the types of a call; a contract also includes declared errors and a digest. A spec is a document, not a checked definition.

## In the model

Contracts are built from schemas in `packages/kernel/src/contract.ts`. The digest is computed by the canonical JSON and digest functions in `packages/kernel/src/digest.ts`.

## Related

- [Capability](capability.md), [semantic model](semantic-model.md).
