---
id: introduction
title: Introduction
kind: guide
order: 1
section: introduction
status: provisional
maturity: implemented
summary: What Telos by UnknownLab is today, what exists in the repository, and how to read this site.
related: [foundation, locus, semantic-extension, archetype, first-locus]
---

# Introduction

## What Telos is

**Telos by UnknownLab** is a semantic-first, agent-native framework. The name comes from the Greek _telos_, "purpose" or "end". Every unit that Telos manages exists for a declared purpose, which is written in its [Charter](../foundation/terminology/purpose.md).

Software is described as [Loci](../foundation/terminology/locus.md) composed from [semantic extensions](../foundation/terminology/semantic-extension.md). Each Locus is checked by [Archetypes](../foundation/terminology/archetype.md) and is exposed to people and agents through Packs. A Pack turns the model into an interface, such as a command line, a web form or an agent tool.

The [foundation documents](../foundation/README.md) are the source for what Telos means. This guide and the other guides describe what exists in the repository today.

## What exists today

- The kernel, `@telos/kernel`, which builds a semantic model from Loci and describes, verifies and invokes it. Its entry point is [`packages/kernel/src/index.ts`](../../packages/kernel/src/index.ts).
- The Packs `@telos/cli`, [`packages/cli/src/index.ts`](../../packages/cli/src/index.ts), `@telos/agent`, [`packages/agent/src/index.ts`](../../packages/agent/src/index.ts), and `@telos/web`, [`packages/web/src/index.ts`](../../packages/web/src/index.ts).
- The calculator reference implementation, [`apps/calculator/src/index.ts`](../../apps/calculator/src/index.ts). It is a small application with one arithmetic Locus and three interfaces.
- [`telos.ts`](../../telos.ts), which describes this repository as a semantic model, and the `bun run telos` command, which reads that model.
- This site, which is built from the documents in `docs/` and the model of the repository.

## How to read this site

The site has one section per item below, in navigation order.

- **Introduction** is this page.
- **[Philosophy](../foundation/philosophy/evolution-of-determinism.md)** gives the reasoning behind Telos.
- **[Principles](../foundation/principles/README.md)** lists the foundational principles.
- **[Terminology](../foundation/terminology/README.md)** defines the vocabulary.
- **[Architecture](../foundation/conceptual-model/README.md)** shows how the concepts relate.
- **[First Locus](first-locus.md)** is a tutorial that defines, composes, inspects and invokes a small Locus.
- **[Examples](examples.md)** shows the calculator reference implementation and the invalid definitions that the kernel reports.
- **[Inspector](/inspector)** shows the Loci of this repository as the semantic model describes them.
- **[Playground](/playground)** runs the kernel on input that you can edit.
- **[Calculator](/calculator)** runs the calculator forms in your browser.
- **[Verification](/verification)** shows the report of the verification run at build time.
- **[Roadmap](../foundation/roadmap/README.md)** shows the order of the later stages.
- **[Decisions](../decisions/README.md)** is the register of architecture decision records.
- **[Agent Reference](agent-reference.md)** lists the entry points, state queries, check commands and public API for agents.

## Maturity and evidence

Each page shows two badges from its front matter. The `status` badge says how settled the text is. Provisional text is expected to change as the model is tested. Decisions use proposed, accepted, superseded or deprecated, and open questions use open.

The `maturity` badge says how far the concept has been built. `vision` is an intended direction with no design commitment. `proposed` means a concrete design is written down and no code exists yet. `implemented` means that code realising the concept exists on the branch the page is on. The full vocabulary is in the [foundation README](../foundation/README.md#maturity-vocabulary).

Results of running checks appear only on the Verification page, the inspector and the playground, each with where and when it was produced. The calculator page shows the outcome of each submit, computed in the browser at that moment (it is an invocation result, not a check result, and it has no provenance label).
