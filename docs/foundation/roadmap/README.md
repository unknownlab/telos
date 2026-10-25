---
id: roadmap
title: Roadmap
kind: roadmap
status: provisional
maturity: vision
summary: What the semantic foundation rebuild delivers, the next candidate steps toward a self-describing Telos, and why all of it is direction only.
related:
  [
    capabilities,
    open-questions,
    P16-no-speculative-implementation,
    future-semantic-evolution,
  ]
---

# Roadmap

**North star ([ADR-0017](../../decisions/ADR-0017-north-star-telos-built-with-telos.md)): Telos is developed with Telos.** It is a direction, not a plan; the owner decides what comes next.

Under [ADR-0016](../../decisions/ADR-0016-mvp-style-development.md), Telos is developed in small working slices. Only TypeScript with Effect is fixed, and Bun is the first target. Every entry below is therefore direction only: each candidate becomes a Spec Kitty mission of its own, specified and approved before it is built, and the evidence from one step may reorder the next. No candidate gets placeholder code before its mission.

## Done in this mission

The semantic foundation rebuild replaces the earlier Stage 0 model with one fundamental entity, the Locus, composed from semantic extensions. Delivered on this branch, with module paths in the [capability map](../architecture/capabilities.md):

- Loci, identity and containment, relations and relation types, capabilities and contracts.
- Semantic extensions, composition and Locus kinds, with conflicts reported as diagnostics.
- The semantic model, Archetype rules, findings with knowledge statuses, and Semantic Closure, which checks file ownership and file-level imports.
- The repository model in `telos.ts`, which describes every workspace package as Loci, and the `bun run telos` commands that check it.
- The Packs: the CLI Pack (`@telos/cli`), the Agent Pack (`@telos/agent`, with its MCP server and client) and the Web Pack (`@telos/web`).
- Introspection through `bun run telos inspect` and agent tools, and invocation that needs a grant.
- The calculator as the proof application, and a documentation site and playground that run the real kernel.

Exit criterion for this step: a new contributor or agent can read the model, declare a small system as Loci, run its Archetype checks and see the real findings, from the repository alone.

## Next candidates

These are the next steps the model points to. None is committed.

1. **Detect drift below the file level.** Semantic Closure checks file ownership and file-level imports, but it does not detect a Locus whose declared capabilities no longer match the code behind them, and it does not attribute code inside one file ([OQ-012](../open-questions.md#oq-012), [ADR-0026](../../decisions/ADR-0026-semantic-closure-at-file-granularity.md)).
2. **Reconcile with GRACE.** Decide how the `.grace/` architecture description relates to the semantic model ([OQ-021](../open-questions.md#oq-021)).
3. **Persist the model.** A file-based store so that a model survives between runs. Revisions and history are designed first, in [future semantic evolution](../future-semantic-evolution.md).
4. **Requirements extension.** Design it against one real case before adding it ([OQ-008](../open-questions.md#oq-008)).
5. **More Archetypes.** Apply the rules to more Loci than the calculator, and decide the cycle policy with evidence ([OQ-005](../open-questions.md#oq-005)).

## Later

Evidence records with provenance, governed agents that work only through capabilities and grants ([OQ-016](../open-questions.md#oq-016)), and governed evolution through revisions. Processes, applications, infrastructure, observability and knowledge capabilities follow, in an order driven by the cases Telos is used for, and eventually the Software Factory ([CAP-14](../architecture/capabilities.md#cap-14-software-factory)), which is out of scope for the current mission.

## Explicitly not planned

A replacement for Pulumi, Playwright or an AI orchestration platform; a custom TypeScript compiler; a proprietary universal database. Telos integrates such engines ([P09](../principles/P09-no-duplicated-frameworks.md)).
