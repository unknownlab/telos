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

- **Decision**: `review.test_command: "bun run verify && bun test --pass-with-no-tests --reporter=junit --reporter-outfile={output_file}"` and `review.fail_on_pre_review_regression: true`.
- **Rationale**: Spec Kitty 3.2.7 reads `review.test_command`, substitutes `{output_file}`, runs it through `sh -c` (so `&&` works), and parses JUnit XML (falling back to a `FAIL <test>` text convention). Blocking is opt-in via `fail_on_pre_review_regression`.
- **Open risk**: When `verify` fails before tests run, no JUnit file exists. Implementation must confirm the gate reports this as a failure, not as "no coverage"; if it does not, `verify` prints failures in the `FAIL <name>` form the gate parses.

## R-06 Pre-commit cost

- **Finding**: Guard + `bun fmt --staged` + `bun lint --staged` + `bun check` + `bun test --pass-with-no-tests` + `grace` took ~0.5 s on the prototype (NFR-002 threshold: 5 s).

## Adversarial evidence

One dependency decision (R-04) was made. An adversarial-squad pass is deferred with rationale: types-only package from the runtime's own maintainers, no install scripts, exact version pinned, owner-approved. Disposition: `deferred_with_rationale`.
