# Research: M0 Cleanup

All findings were checked on the repository at `f95ae8d` and in throwaway clones under the session scratchpad. No external sources were needed.

## R1 — Which hook runs in a Spec Kitty lane

**Finding.** `.git/config` sets `core.hooksPath` to the absolute path `/Users/unknownhero/projects/unknownlab/telos/.githooks` (the documented setup line is `git config core.hooksPath "$PWD/.githooks"`). All worktrees share `.git/config`, so every lane runs the main checkout's `.githooks/pre-commit`, that is the `feat/m0-cleanup` version, until the mission merges. That version ends with `grace lint --path . --assertions current`. Without `.grace/`, `grace lint` fails with `project.missing-grace` and exit 1. With `.grace/` but without `apps/docs`, it fails too, because `.grace/verification/docs.xml` names 47 `apps/docs` files.

**Test.** In a scratch repository with two worktrees, `git config core.hooksPath .githooks` (relative) made each worktree run the hook from its own checkout, including the commit that edits the hook.

**Decision.** Precondition P1: the coordinator switches to the relative path before implementation and restores the absolute path after the merge. WP01 removes the `grace lint` step; WP02 and WP03 build on WP01.

**Alternatives rejected.**
- Commit the hook change directly on `feat/m0-cleanup` before implementation: a product-tooling change outside a reviewed WP.
- Keep `.grace/` until after the mission: FR-003 would not be met by the mission.
- `--no-verify` or any gate bypass: forbidden without the owner.

## R2 — Charter regeneration

**Findings.**
- `spec-kitty charter generate` always writes the main checkout's `.kittify/charter/`, even when run from another worktree. Trials need a separate `git clone`.
- `generate` keeps the directive list of `charter.yaml`; removing `DIRECTIVE_037` from `answers.yaml` alone does not deactivate it. `spec-kitty charter deactivate directive 037-living-documentation-sync` does, and a later `generate --force` keeps it off. `.kittify/config.yaml` is not touched.
- After deactivation, the generated reference entry for `DIRECTIVE_037` reads `title: DIRECTIVE_037`, `summary: Definition unavailable in bundled doctrine.` This is Spec Kitty output, covered by the NFR-005 exception for generated doctrine summaries.

**Decision.** Done before the baseline, in commit `f95ae8d` (`chore(charter): drop docs and GRACE rules for the M0 cleanup`), which stages only `.kittify/charter/interview/answers.yaml`, `charter.md` and `charter.yaml`. `spec-kitty charter context --action implement` no longer mentions 037.

## R3 — How to prove behavior parity

**Decision.** A mission-local harness, `kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts`, with a baseline captured before any product change.

- **Runtime code**: `new Bun.Transpiler({ loader: "ts", trimUnusedImports: false }).transformSync(source)` drops comments and types and prints the code in a fixed format. Equal outputs mean equal runtime behavior of that file. Checked: a comment-only change keeps the output; `a + 1` to `a + 2` changes it.
- **Type-level code**: the transpiler drops types, so the harness also compares the token stream without comments and whitespace (`lex.ts`). Trailing commas before a closer are ignored, because the formatter may join a list once a trailing comment is gone.
- **Outputs**: CLI, agent demo and MCP `tools/list` outputs, runtime export names, calculator model outputs (fixed clock for `verify`).
- **Owner notes**: text and anchor per note.

**Alternatives rejected.** Comparing `bun test` case names through a JUnit report: identical test code already implies identical names and assertions, and `verify` proves they pass. Comparing `bun run telos report`: its line positions and the docs-site Locus change by design (spec edge cases).

## R4 — Comment stripper

**Decision.** `lex.ts` scans TypeScript with string, template-literal (nested `${}`), regex-versus-division and comment states. `strip` removes every comment that is not an owner note (`//@unknownhero...`) or a `// @ts-expect-error` directive:

- a line that holds only comments is deleted with its newline;
- a trailing comment is deleted with the spaces before it;
- an inline block comment is deleted, keeping one space where needed;
- runs of blank lines collapse to one, leading blank lines of a file go, the file ends with one newline.

It refuses to run when a removable comment contains `@unknownhero` or starts like a toolchain directive (`@ts-`, `eslint`, `oxlint`, `biome-ignore`, `prettier-ignore`, `<reference`, `__PURE__`, `sourceMappingURL`). The scan found none of these.

**Dry run** (clone at `f95ae8d`, after the WP01/WP02 edits): `strip` changed 112 files; `bun run format` then changed 0 files; `scan --expect-clean` gave 34 / 7 / 0; `check` and `same-code` passed; lint reported the same 31 warnings as before (26 `no-explicit-any`, 5 `no-empty-object-type`).

**Alternatives rejected.** Hand editing 112 files (error-prone for a Haiku implementer, and unprovable); a regex over lines (breaks on `"**/*.ts"`, URLs and `//` in strings and templates).

## R5 — Work package boundaries

- The gate and the hook change first and alone (WP01), so every later commit in every lane runs a hook that needs nothing M0 removes.
- Docs and GRACE go in one WP (WP02). `grace lint` couples them (`.grace/` names `apps/docs` files), `bunfig.toml` holds the ignore entries for both, and the `grace:lint` script can go only once `docs/guides/agent-reference.md` is gone. Two parallel WPs would edit the same files and conflict at lane merge.
- Comments go after the docs (WP03), because the docs build and the guide tests read the `START_BLOCK` regions.
- `AGENTS.md` goes after the docs (WP04), because `guides.test.ts` reads it. It is a dedicated commit, as US4 requires, and runs in parallel with WP03.

## R6 — `tools/README.md`

**Decision.** A trimmed move of `docs/tooling.md`, with the text fixed in the WP02 prompt. Kept: who does what (without the GRACE row), what the owner is asked, enforced versus advisory, toolchain (Bun version, layout, new package template), commands, pre-commit hook, review gate, one-time setup, after a mission merge, global footprint, upgrading. Removed: GRACE, `apps/docs`, `docs:*`, `test:e2e`, `grace:lint`, Playwright and Chromium, the GRACE skills and CLI. Links are rewritten relative to `tools/`.

## R7 — Expected changes outside the parity scope

- `bun run telos list` no longer lists `telos:docs-site`; `telos check` reports closure warnings 3 instead of 5 (dry run), still `ok: true` with 20 verifications passed.
- `bun run verify` drops from 24.4 s to about 7.4 s; `bun test` from 846 tests to about 526 after WP02 and about 522 after WP03 (the four ergonomics tests).
- `bun.lock` loses the `apps/docs` workspace and every package only it used: 776 lines removed, 0 added.
