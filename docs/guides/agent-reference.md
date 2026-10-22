---
id: agent-reference
title: Agent Reference
kind: guide
order: 4
section: agent-reference
status: provisional
maturity: implemented
summary: The entry points, state queries, check commands, public API and diagnostic codes an agent needs to reconstruct the project state from the repository.
related: [foundation, decisions, open-questions]
---

# Agent Reference

An agent can reconstruct the state of this project from the repository alone. This page lists where to look, what to run, and what the code exposes.

## Start here

[`AGENTS.md`](../../AGENTS.md) holds the rules that every coding agent follows in this repository. Read it first.

Then read the [foundation README](../foundation/README.md), which sets the reading order and the maturity vocabulary. The [decision register](../decisions/README.md) lists the architecture decisions, and the [open questions](../foundation/open-questions.md) list what is still unresolved. Missions, which are the units of change, are under [`kitty-specs/`](../../kitty-specs/).

## Entry points

| Path                                                                           | What it is                                                                                     |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [`packages/locus/src/index.ts`](../../packages/locus/src/index.ts)             | The public entry point of `@telos/locus`. The API table below lists its runtime exports.       |
| [`packages/locus-specs/src/index.ts`](../../packages/locus-specs/src/index.ts) | The entry point of `@telos/locus-specs`, the executable specifications.                        |
| [`apps/docs/scripts/content.ts`](../../apps/docs/scripts/content.ts)           | The content compiler. It turns `docs/` into the site files and reports every invalid document. |
| [`apps/docs/package.json`](../../apps/docs/package.json)                       | The scripts and dependencies of the documentation site.                                        |
| [`package.json`](../../package.json)                                           | The root scripts, including the check commands below.                                          |
| [`bunfig.toml`](../../bunfig.toml)                                             | The Bun settings of the repository, including the lint and format ignore lists.                |
| [`docs/tooling.md`](../tooling.md)                                             | The owner's overview of the tools, what they enforce, and how to set them up.                  |
| [`.grace/`](../../.grace/)                                                     | The GRACE records of the code: the module graph, the contracts and the verification map.       |

## State queries

Run these before you start or resume work. They match the rules in [`AGENTS.md`](../../AGENTS.md), which is the authority.

```sh
git status
git worktree list
spec-kitty agent tasks status --mission <slug> --json
spec-kitty next --mission <slug> --json
spec-kitty invocations list
grace status --path . --json
```

Replace `<slug>` with the name of a mission directory under `kitty-specs/`. The query mode of `spec-kitty next` does not advance a mission. It only reports the next step.

## Check commands

Run these from the repository root, unless a line says `--cwd apps/docs`.

```sh
bun run verify
bun run test
bun run typecheck
bun run lint
bun run format:check
bun run grace:lint
bun run --cwd apps/docs content
bun run --cwd apps/docs build
bun run --cwd apps/docs test:e2e
```

- `bun run verify` runs the Bun version check, the format check, the lint, the typecheck, the tests, the docs build with its check of the built Verification page, the browser tests and the GRACE lint, in that order. It stops at the first failure. The browser tests need Chromium, installed once as described in [the tooling guide](../tooling.md).
- `bun run test` runs the test suite.
- `bun run typecheck` type checks the workspace.
- `bun run lint` lints the workspace.
- `bun run format:check` reports files that are not formatted, without changing them.
- `bun run grace:lint` checks the GRACE records and the code markup.
- `bun run --cwd apps/docs content` compiles `docs/` and lists every content problem.
- `bun run --cwd apps/docs build` builds the documentation site.
- `bun run --cwd apps/docs test:e2e` runs the browser tests with Playwright.

## Public API of `@telos/locus`

| Export                    | What it does                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DecodeError`             | The error for external input that cannot be decoded. It carries at least one located issue.            |
| `DigestError`             | The error for a content digest that cannot be computed, for example when Web Crypto is missing.        |
| `LocusMismatchError`      | The error for a comparison of two Revisions of different Loci.                                         |
| `RELATION_KINDS`          | The four Relation kinds, in a fixed order.                                                             |
| `RevisionHistory`         | The history service: the head, the entries, the lookup and the compare-and-set append, for each Locus. |
| `RevisionHistoryInMemory` | A layer that provides an empty in-memory history each time it is built.                                |
| `RevisionNotFoundError`   | The error for a lookup of a Revision id that has not been recorded.                                    |
| `StaleBaselineError`      | The error for an append whose expected head is not the current head.                                   |
| `canonicalForm`           | The canonical JSON, version 1, of a Locus definition.                                                  |
| `createRevision`          | Computes the Revision of a definition: a frozen copy and its SHA-256 id.                               |
| `decodeFabric`            | Decodes a Fabric object into a frozen Fabric, or reports located decode errors.                        |
| `decodeFabricJson`        | Decodes Fabric JSON text. It refuses text over 1,048,576 UTF-16 code units before parsing.             |
| `decodeLocus`             | Decodes one Locus object into a frozen definition, or reports located decode errors.                   |
| `defineFabric`            | Copies a Fabric and deeply freezes it.                                                                 |
| `defineLocus`             | Copies a Locus input into a deeply frozen definition, with empty defaults for the optional sets.       |
| `diffRevisions`           | Returns the ordered change set between two Revisions of the same Locus.                                |
| `isIdentity`              | Reports whether a string has the form `namespace:name`.                                                |
| `validateFabric`          | Checks a Fabric against the rules INV-001 to INV-008 and returns every diagnostic.                     |

Type-only exports, such as `Fabric`, `LocusDefinition`, `Revision` and `ChangeSet`, are TypeScript types rather than runtime values, so they are not in this table.

## Diagnostic codes

The package reports each rule violation with one of the stable codes below. The [API contract](../../kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md) gives each code's scope, path, detail and invariant.

- `identity.malformed`
- `identity.duplicate`
- `charter.purpose-blank`
- `charter.responsibilities-empty`
- `charter.entry-blank`
- `charter.entry-duplicate`
- `owner.missing`
- `owner.self`
- `owner.cycle`
- `relation.target-missing`
- `relation.self`
- `relation.duplicate`
- `relation.refines-cycle`
- `relation.refines-cycle-limit`

`validateFabric` reports at most 100 `relation.refines-cycle` diagnostics per Fabric. When more than 100 refines cycles exist, it reports the first 100 in a fixed search order and then one `relation.refines-cycle-limit` on the Fabric, with detail `100`. The Fabric is invalid in that case, as it is whenever any diagnostic is reported.
