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

The property that every managed code file belongs to a discoverable [Locus](locus.md) owner, and that every import of such a file follows a declared relation of its owner or names a package that a Locus declares as an external dependency. A file with no owner, or an import the model does not explain, is reported as a [finding](finding.md) against the model.

## Avoid

"coverage" on its own. A coverage figure counts lines or tests; closure asks whether every managed file has an owner that the model can find.

## In the model

The check is in `packages/kernel/src/closure.ts` and runs on Bun only. `bun run telos check` runs it, prints each finding, and is the last step of `bun run verify`. It reports:

- unowned files (`closure.unowned`) and files with more than one owner (`closure.ambiguous`);
- imports between Loci that no valid relation explains (`closure.undeclared-dependency`). A relation of any type from the importer or one of its ancestors counts, and imports within one Locus or between a group and its members are always allowed;
- third-party packages that no External Locus declares (`closure.unknown-external`);
- imports that do not resolve to a file or to an owned file (`closure.unresolved-import`), and files it cannot parse (`closure.unparsable`);
- a computed `import(...)` with a non-literal specifier, as a warning (`closure.dynamic-import`), with the knowledge status `unknown`;
- a Locus whose source globs match no file, as a warning (`closure.empty-claim`).

The limits are stated in [ADR-0026](../../decisions/ADR-0026-semantic-closure-at-file-granularity.md):

- ownership is per file; code inside one file is not attributed to a narrower Locus;
- type-only imports are not seen by the scanner, so type-only dependencies are not checked;
- a computed `import(...)` is reported as an unknown dependency, not as a failure, so a computed import can pass unexamined;
- generated files, `node_modules` and files outside the include globs are not checked;
- the dependency rule is lenient: any valid relation type counts, not only one that declares a dependency. The check does not print this limit; it is documented here and in a code comment on the rule.

## Related

- [Semantic model](semantic-model.md), [containment](containment.md), [principle P03](../principles/P03-no-code-outside-semantics.md).
