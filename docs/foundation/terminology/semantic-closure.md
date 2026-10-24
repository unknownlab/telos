---
id: semantic-closure
title: Semantic Closure
kind: term
order: 14
classification: derived-composition
fundamental: false
engine: false
stage0: in-scope
status: provisional
maturity: implemented
summary: The property that every managed code file belongs to a discoverable Locus owner.
related: [semantic-model, containment, finding, P03-no-code-outside-semantics]
---

# Semantic Closure

## Definition

The property that every managed code file belongs to a discoverable [Locus](locus.md) owner. A file with no owner is reported as a [finding](finding.md) against the model.

## Avoid

"coverage" on its own. A coverage figure counts lines or tests; closure asks whether every managed file has an owner that the model can find.

## In the model

The check is in `packages/kernel/src/closure.ts`. `bun run telos check` runs it and prints each unowned file. The check is part of the repository gate that WP15 adds.

## Related

- [Semantic model](semantic-model.md), [containment](containment.md), [principle P03](../principles/P03-no-code-outside-semantics.md).
