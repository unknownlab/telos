---
id: purpose
title: Purpose
kind: term
order: 19
classification: extension-model
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: The declaration of why a Locus exists, given by the built-in telos.purpose extension with its purpose, responsibilities and excluded scope.
related: [locus, semantic-extension, identity]
---

# Purpose

## Definition

The declaration of why a [Locus](locus.md) exists. It is given by the built-in `telos.purpose` [semantic extension](semantic-extension.md), which has three properties: `purpose`, `responsibilities` and `excluded`.

## Avoid

"charter" in the Telos model. A charter is a different thing in Spec Kitty, and the Locus-level declaration is called a purpose.

## In the model

The extension is in `packages/kernel/src/extensions/purpose.ts`. It replaces the earlier charter concept of the minimal-model hypothesis.

## Related

- [Locus](locus.md), [semantic extension](semantic-extension.md).
