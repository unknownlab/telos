---
id: ADR-0018
title: The semantic foundation is rebuilt by owner directive
kind: decision
status: accepted
maturity: proposed
date: 2026-10-22
summary: The owner directive of 2026-10-22 replaces the Stage 0 model. The detailed design records ADR-0019 to ADR-0028 stay proposed until the owner accepts them.
related: [ADR-0017, foundation, future-semantic-evolution]
---

# ADR-0018 — The semantic foundation is rebuilt by owner directive

## Context

The Stage 0 model grew many concepts that overlap or have no consumer: Fabric next to Locus, Facet, Lens, Law, Act, Mandate, Revision, and a closed set of relation kinds. Each concept added documentation and checks, but the model could not yet describe a small system end to end. The owner issued a directive on 2026-10-22 (kept at `kitty-specs/semantic-foundation-rebuild-01M5JFR0/research/owner-directive.md`) that replaces the Stage 0 model with a smaller one built from a [Locus](../foundation/terminology/locus.md), composable [semantic extensions](../foundation/terminology/semantic-extension.md) and a few derived concepts.

## Decision

1. The Stage 0 model is replaced by the owner directive. The foundation documents, principles, terminology and the decision records ADR-0019 to ADR-0028 describe the new model.
2. The audit kept these records and their substance: the identity grammar of [ADR-0003](ADR-0003-identity-independent-of-paths.md), the TypeScript and Effect choice of [ADR-0004](ADR-0004-typescript-and-effect.md), the product naming of [ADR-0015](ADR-0015-product-naming.md), the MVP style of [ADR-0016](ADR-0016-mvp-style-development.md), the temporary tools of [ADR-0011](ADR-0011-temporary-engineering-tools.md), the canonical foundation content of [ADR-0012](ADR-0012-foundation-content-is-canonical.md), and ADR-0001 for the record format. The decision that the north star is self-application stays in [ADR-0017](ADR-0017-north-star-telos-built-with-telos.md).
3. These records are superseded by the new model: ADR-0002, ADR-0005, ADR-0006, ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0013 and ADR-0014. Each one links to its replacement.
4. The calculator proof is now decided by this directive. [ADR-0017](ADR-0017-north-star-telos-built-with-telos.md) remains the north star.
5. ADR-0019 to ADR-0028 stay `proposed` until the owner accepts them (spec D8). Only this record is accepted.

## Alternatives

- **Patch the Stage 0 model in place.** Rejected: the owner directive changes the core concepts, not only their wording, and the overlapping concepts would remain.
- **Accept all design records at once.** Rejected for now: the owner decides each design record after reading it (spec D8).

## Consequences

- Readers of older records find the superseded status and the link to the replacement at the top of each superseded record.
- The principles and terms are the ones of the directive. Older vocabulary is listed as words to avoid in the terminology pages.
- Later choices, such as revisioning, can build on the digests and model comparison of [ADR-0024](ADR-0024-digests-and-model-comparison.md) without a history service.
