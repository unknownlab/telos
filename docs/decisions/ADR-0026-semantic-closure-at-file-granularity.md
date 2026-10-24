---
id: ADR-0026
title: Semantic Closure at file granularity
kind: decision
status: proposed
maturity: proposed
date: 2026-10-22
summary: Every managed code file belongs to a discoverable Locus owner, and its imports follow declared relations or external packages. The check works at file granularity.
related:
  [
    semantic-closure,
    P03-no-code-outside-semantics,
    P13-no-unverified-guarantees,
    diagnostic,
  ]
---

# ADR-0026 — Semantic Closure at file granularity

## Context

[P03](../foundation/principles/P03-no-code-outside-semantics.md) says that no code may exist outside the semantics of the system. [Semantic Closure](../foundation/terminology/semantic-closure.md) is the property that makes this checkable: every managed code file belongs to a Locus, and every import of that file is explained by the model. Without a check, the property is a promise, which P13 does not allow.

## Decision

1. Each managed file has exactly one owner, the most specific Locus whose `Source` globs match it.
2. The imports of a file must follow a declared relation of its owner, or name an `External` package. The check is `checkClosure`, exported from `@telos/kernel/closure`.
3. The check runs on Bun only. It uses `Bun.Glob` and the Bun transpiler's import scanner.
4. The known limits are part of the decision:
   - no attribution below file level: code inside one file has one owner;
   - type-only imports are not seen by the scanner, so type dependencies are not checked;
   - a computed `import()` with a non-literal specifier is reported as a warning, with the knowledge status `unknown`.

## Alternatives

- **Symbol-level attribution.** Rejected for now as too costly: it needs a full type-aware analysis of every file. It may be reconsidered when the file-level check is in use.
- **No automated check; rely on review.** Rejected: it would state a guarantee that nothing verifies, which P13 forbids.
- **Owner by directory only.** Rejected: directories do not match meaning, which is the reason for Loci ([ADR-0003](ADR-0003-identity-independent-of-paths.md)).

## Consequences

- A new file with no owner is reported as a `closure.*` finding, so the gate fails until the file is placed.
- The limits are stated where the check is documented, so a passing check is not read as a full proof.
- Generated files and `node_modules` are excluded by the scope globs.
