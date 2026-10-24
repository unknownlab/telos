---
id: ADR-0024
title: Digests and model comparison replace revisions
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: A digest is SHA-256 over canonical JSON. Capability contracts carry a digest, diffModels compares two models, and impact lists the affected Loci, relations and rules.
related:
  [
    ADR-0005,
    impact,
    contract,
    semantic-model,
    P11-no-compatibility-for-mistakes,
    future-semantic-evolution,
  ]
---

# ADR-0024 — Digests and model comparison replace revisions

## Context

[ADR-0005](ADR-0005-immutable-content-addressed-revisions.md) proposed immutable, content-addressed revisions with baselines that advance by compare-and-set. The directive finds no consumer for a history service yet (spec D1). What the model needs now is a way to name a state and to tell whether two states differ. [P11](../foundation/principles/P11-no-compatibility-for-mistakes.md) rules out keeping history for its own sake.

## Decision

1. `digestOf` computes SHA-256 over the canonical JSON of a value and returns `sha256:<hex>`. It uses Web Crypto, so it runs in Bun and in the browser.
2. A capability [contract](../foundation/terminology/contract.md) carries a `contractDigest`, so a changed contract is visible.
3. `diffModels` compares two [semantic models](../foundation/terminology/semantic-model.md).
4. `impact` lists the Loci, relations and rules affected by a change, as the [impact](../foundation/terminology/impact.md) term defines.
5. The RevisionHistory service is removed (spec D1). Later revisioning can build on digests and `diffModels`, as [future semantic evolution](../foundation/future-semantic-evolution.md) describes.

## Alternatives

- **`Bun.CryptoHasher`.** Rejected: it is synchronous and Bun-only, so it would break the requirement to run in the browser (research R4).
- **Keep the RevisionHistory service.** Rejected by spec D1: no consumer uses it yet.
- **Compare models by file hashes.** Rejected: file hashes change with formatting and unrelated files, while the model should change only when its meaning changes.

## Consequences

- Two runs over the same model give the same digest, which makes the documentation and the checks reproducible.
- The old revision code is reused for canonical JSON and hashing, and the history storage is not built.
