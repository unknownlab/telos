---
id: introduction
title: Introduction
kind: guide
order: 1
section: introduction
status: provisional
maturity: implemented
summary: What Telos by UnknownLab is, what Stage 0 delivers, and how to read this site.
related:
  [foundation, evolution-of-determinism, principles, terminology, first-locus]
---

# Introduction

## What Telos is

**Telos by UnknownLab** is a framework for creating, running, verifying, operating and evolving software systems. The name comes from the Greek _telos_, "purpose" or "end". Every unit that Telos manages exists for a declared purpose, which is written in its [Charter](../foundation/terminology/charter.md).

The long-term aim is one semantic model for applications, infrastructure, agents, requirements and checks. The model is written in TypeScript with Effect. Its core is a small set of primitives: an [Identity](../foundation/terminology/identity.md) for each unit, a [Locus](../foundation/terminology/locus.md) that holds the unit's Charter, typed [Relations](../foundation/terminology/relation.md) between Loci, and [Revisions](../foundation/terminology/revision.md) that record each version of a definition.

The [foundation documents](../foundation/README.md) are the source for what Telos means. This guide and the other guides describe what exists in the repository today.

## What Stage 0 delivers

Stage 0 is the first stage of the model. It delivers three things:

- The [`@telos/locus`](../../packages/locus/src/index.ts) package. It defines Loci, Charters, Relations and Fabrics. It validates a Fabric and reports every rule violation as a diagnostic. It creates Revisions, compares them as change sets, and keeps a per-Locus history.
- The executable specifications. The catalogue holds 44 records. They check the invariants INV-001 to INV-012. INV-013, that displayed verification results come from an actual run and name their origin, is checked by the site tests. INV-014, that the core does not depend on its specifications, is checked by the core-independence test.
- This site, with a playground that runs the package in your browser.

Stage 0 leaves out, on purpose: agent orchestration, sandboxing, risk modelling, deployment, graph databases, compilers, native compilation, persistent Revision storage, Facets, Acts, Mandates, and the Witness and Verdict types. Revisions and histories live in memory only, so they end when the process ends. There is no continuous integration and no deployment. Everything runs locally.

The [roadmap](../foundation/roadmap/README.md) shows the order of the later stages.

## How to read this site

The site has one section per item below, in navigation order.

- **Introduction** is this page.
- **[Philosophy](../foundation/philosophy/evolution-of-determinism.md)** gives the reasoning behind Telos.
- **[Principles](../foundation/principles/README.md)** lists the sixteen foundational principles, P01 to P16.
- **[Terminology](../foundation/terminology/README.md)** defines the vocabulary. Each term has its boundaries and its Stage 0 form.
- **[Architecture](../foundation/conceptual-model/README.md)** shows how the concepts relate, lists the invariants, and records what is still open.
- **[First Locus](first-locus.md)** is a five-step tutorial. You define a Fabric, see validation fail, relate Loci, revise a Locus and run the specifications.
- **[Examples](examples.md)** shows valid and invalid inputs, with what the package reports for each.
- **[Playground](/playground)** runs the package on input that you can edit. Its five scenarios, A to E, each cover one part of the model.
- **[Verification](/verification)** shows the report of the specification run at build time.
- **[Roadmap](../foundation/roadmap/README.md)** shows the order of the later stages.
- **[Decisions](../decisions/README.md)** is the register of architecture decision records.
- **[Agent Reference](agent-reference.md)** lists the entry points, state queries and check commands for the repository.

## Maturity and evidence

Each page shows two badges from its front matter. The `status` badge says how settled the text is. Provisional text is expected to change as the model is tested. Decisions use proposed, accepted, superseded or deprecated, and open questions use open.

The `maturity` badge says how far the concept has been built. `vision` is an intended direction with no design commitment. `proposed` means a concrete design is written down and no code exists yet. `implemented` means that code realising the concept exists on the branch the page is on. The full vocabulary is in the [foundation README](../foundation/README.md#maturity-vocabulary).

Results of running the checks are not written into any page. They appear only on the [Verification](/verification) page and in the playground. Each result shows where it was produced, in the browser or by Bun at build time, and when.
