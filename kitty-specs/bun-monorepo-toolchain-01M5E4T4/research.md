# Research: Bun Monorepo Toolchain

All findings were reproduced on 2026-10-21 in a scratch repository using Bun `1.4.4-canary.1+9b4284f78` (current) and Bun `1.4.3` (previous stable, from `@oven/bun-darwin-aarch64@1.4.3`).

## R-01 Built-in lint and format availability

- **Decision**: Require Bun `>=1.4.4-canary.1`.
- **Rationale**: `bun lint` and `bun fmt` were merged upstream on 2026-10-13..16 (oven-sh/bun #45119, #45121, #45482), after the `1.4.3` release (2026-10-10). On `1.4.3` both commands fail with `Script not found`. On `1.4.4-canary.1` both work and support `--staged`.
- **Alternatives considered**: Biome, oxlint + oxfmt, ESLint + Prettier (owner chose Bun built-ins); exact canary pin (owner chose a minimum).

## R-02 Minimum-version enforcement

- **Decision**: A `preinstall` guard `scripts/check-bun-version.ts`, invoked as `$npm_execpath scripts/check-bun-version.ts`, comparing `Bun.version` with `engines.bun` via `Bun.semver.order`.
- **Rationale**: Bun `1.4.3` installed a project with `engines.bun: ">=1.4.4-canary.1"` without complaint, so Bun does not enforce engines. A lifecycle script invoked as `bun …` used the PATH Bun (canary), not the running Bun; `$npm_execpath` points to the running binary. With the guard, `1.4.3` fails: `Bun >=1.4.4-canary.1 required, found 1.4.3. Run: bun upgrade --canary`.
- **Semver check**: `Bun.semver.satisfies` returned `false` for `1.4.5-canary.1` against `>=1.4.4-canary.1` (prereleases on another tuple are excluded), while `order` gave the intended result for `1.4.3` (-1), `1.4.4-canary.1` (0), `1.4.4-canary.7`, `1.4.4`, `1.4.5-canary.1`, `1.5.0` (all 1).
- **Alternatives considered**: `packageManager` field only (not enforced by Bun); `satisfies` (wrong for later canaries).

## R-03 Empty-skeleton behavior of the checks

| Check | No source files | With the guard script |
|-------|-----------------|-----------------------|
| `bun install` | ok, lockfile deleted ("No packages!") | lockfile created once `@types/bun` is added |
| `bun check` | fails TS18002 with `"files": []` | `No type errors` |
| `bun lint` | exit 2, "all files … are ignored" | `No problems` |
| `bun fmt --check` | ok | ok |
| `bun test` | exit 1, "0 test files" | `--pass-with-no-tests` exits 0 |

- **Decision**: The guard script is the first real source file; the root `tsconfig.json` includes `scripts/`. No placeholder files.

## R-04 Bun type definitions

- **Decision**: Add `@types/bun@1.4.3` as the only devDependency (owner decision `01M5E5A78WNSD86240841QTRT0`).
- **Rationale**: Without it `bun check` reports `Cannot find name 'process'` and suggests `bun add -d @types/bun`. With it, `bun check` passes (250 files).
- **Supply chain**: Published by the Bun maintainers on npm; `@types/bun` has no lifecycle scripts and depends only on `bun-types@1.4.3`, whose scripts are dev-only (not run on install). Transitive: `@types/node`, `undici-types` (types only). Lockfile committed; no Node runtime involved. No canary-tagged types exist; `1.4.3` types are accepted until a stable `1.4.4` release.

## R-05 Spec Kitty review gate

- **Decision**: `review.test_command: "bun scripts/review-gate.ts {output_file}"`, `review.test_output_format: junit_xml`, `review.fail_on_pre_review_regression: true`. `scripts/review-gate.ts` runs every check step and always writes one JUnit report: a `verify` suite with one test case per step, plus `bun test`'s own suites (contract: [contracts/review-gate.md](contracts/review-gate.md)).
- **Rationale**: Spec Kitty 3.2.7 reads `review.test_command`, substitutes `{output_file}`, and parses JUnit XML when the file exists; otherwise it falls back to the `FAIL <test>` text convention. Blocking is opt-in via `fail_on_pre_review_regression`, and only a `NEW_FAILURES` verdict blocks.
- **Rejected**: `bun run verify && bun test … --reporter=junit …`. Read from the installed source (`specify_cli/review/scope_source.py`, `parse_mode`): when `verify` fails before the tests, no JUnit file exists, so the head run is parsed as `text` while a green baseline was parsed as `junit_xml`. That is a `SOURCE_MISMATCH` verdict, which only warns. Lint, format, typecheck and grace failures would never block a review, breaking SC-003.
- **Verified on the prototype**: with a type error present, the runner exits 1 and writes a report that Spec Kitty's own `_parse_junit_xml` reads as 17 cases, 1 failure, `verify.typecheck`. On a clean skeleton every case passes. The runner writes only `{output_file}` and a file in the OS temp directory (NFR-003).

## R-06 Pre-commit cost

- **Finding**: Guard + `bun fmt --staged` + `bun lint --staged` + `bun check` + `bun test --pass-with-no-tests` + `grace` took ~0.5 s on the prototype (NFR-002 threshold: 5 s).

## R-07 Format scope

- **Finding**: `bun fmt` formats Markdown, JSON, YAML and TOML as well as TypeScript, and skips gitignored paths (`.claude/`, `.codex/`). On the current repo it would rewrite `AGENTS.md` (Spec Kitty regenerates its orientation block, so the two would fight), every mission artifact, `.kittify/` files and `docs/tooling.md`.
- **Decision**: `[lint]` and `[fmt]` `ignorePatterns` cover `node_modules/**`, `.worktrees/**`, `kitty-specs/**`, `.kittify/**`, `.grace/**`; `[fmt]` also ignores `bun.lock`, `AGENTS.md` and `CLAUDE.md`. `docs/tooling.md` stays formatted: the docs work package rewrites and formats it, so `format:check` is clean once it lands.

## R-08 GRACE model

- **Finding** (prototype, `grace` 4.2.1): the unmodified `grace-init` templates lint clean, but describe nothing. A module needs a `V-M-*` entry with at least one `Scenario`, and its file needs `START_MODULE_CONTRACT` markup; otherwise `grace status` marks it `blocked`. `ROLE: RUNTIME` requires `MAP_MODE: EXPORTS`; `ROLE: TEST` requires `MAP_MODE: LOCALS`.
- **Decision**: Model the two real modules, `M-BUN-VERSION-GUARD` (`scripts/check-bun-version.ts`) and `M-REVIEW-GATE` (`scripts/review-gate.ts`), with markup in the four script files. Prototype result: `grace lint` 0 errors, both modules `ready`. No modules for workspace areas, which hold no code yet.

## R-09 Hook in fresh worktrees

- **Finding**: Spec Kitty lane worktrees have no `node_modules`, so `bun check` fails there with missing `bun` types.
- **Decision**: The hook checks for `node_modules` after the version guard and fails with `pre-commit: dependencies not installed. Run: bun install`. Every work package starts with `bun install`.

## R-10 Type-checking workspace packages

- **Finding** (prototype with a throwaway `packages/foo`): plain `bun check` reports "No type errors" while a referenced package has a type error. It checks only the root project. `bun check -b` checks every referenced project ("checked 5 files across 2 projects") and writes no files. A referenced project that inherits `noEmit: true` fails with TS6310 ("may not disable emit").
- **Decision**: `typecheck` and the hook use `bun check -b`. A package `tsconfig.json` is `{ "extends": "../../tsconfig.base.json", "compilerOptions": { "composite": true, "noEmit": false, "emitDeclarationOnly": true }, "include": ["src"] }`. On the empty skeleton `bun check -b` passes ("1 project").

## Adversarial evidence

One dependency decision (R-04) was made. An adversarial-squad pass is deferred with rationale: types-only package from the runtime's own maintainers, no install scripts, exact version pinned, owner-approved. Disposition: `deferred_with_rationale`.
