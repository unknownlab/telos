# Development tooling

Describe what you want in plain language. Claude Code or Codex chooses and runs the tools, and asks you only for decisions. The agent rules live in [`AGENTS.md`](../AGENTS.md); Claude Code loads them through `CLAUDE.md`.

## Who does what

| Concern                                                                                                     | Authority                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Change lifecycle (spec → plan → tasks → implement/review → accept → merge), worktrees, reviews, integration | Spec Kitty 3.2.7 (`.kittify/`, `kitty-specs/`, `.worktrees/`)                                                                                   |
| Architecture knowledge: contracts, module graph, verification, semantic-markup validation                   | GRACE 4.2.1 skills and `grace` CLI. Active: `.grace/` models the code modules, and `grace lint` runs in the pre-commit hook and the review gate |
| Choosing tools, running checks, asking you for decisions                                                    | Claude Code / Codex                                                                                                                             |

## What you will be asked

- Product and architecture decisions.
- Approval of each mission's spec and plan.
- Accepting or merging into `main`, pushing, releasing.
- Destructive actions and gate bypasses.
- Anything outside this repository: global installs, credentials, external services.

Everything else runs without asking. The full list is in `AGENTS.md`.

## Enforced vs. advisory

Enforced by the tools:

- Spec Kitty merge gates block (`policy.merge_gates.mode: block` in `.kittify/config.yaml`). A mission can't merge until its reviews are approved, its dependencies are done and its lane risk is acceptable.
- Spec Kitty's protected-branch guard keeps its commits off `main`/`master`.
- The `commit-msg` hook in `.githooks/` rejects any commit message that doesn't follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) and any AI author or attribution line. It rewrites the four messages Spec Kitty writes in another format (for example `Add spec for feature <slug>` becomes `docs(<slug>): add spec`). It works only after `core.hooksPath` is set (see setup).
- The `pre-commit` hook in `.githooks/` formats and restages your staged files, then blocks the commit on any lint, typecheck, test or `grace lint` failure. See [Toolchain](#toolchain).
- Spec Kitty's review gate runs the whole check suite through `scripts/review-gate.ts` and blocks a review on any new failure (`review:` in `.kittify/config.yaml`).
- Spec Kitty checks review artifacts at merge; bypassing that needs a recorded note.
- Claude Code hooks (`.claude/settings.json`). `spec-kitty session-start` injects orientation and open Ops. `spec-kitty session-stop` reminds about open Ops.

Advisory: the instructions in `AGENTS.md`. Agents normally follow them, but nothing guarantees it. They cover:

- tool routing
- reading state before work
- approval boundaries
- running `bun run verify` before review, accept and merge

No CI, by owner decision. All checks run locally, in the pre-commit hook and in Spec Kitty's review gate.

## Toolchain

The repository is a Bun workspaces monorepo. Bun is the only tool: package manager, test runner, type checker (`bun check`), linter (`bun lint`) and formatter (`bun fmt`). There is no Turborepo, Nx, ESLint or Prettier.

### Bun version

You need Bun `1.4.4-canary.1` or later, because `bun lint` and `bun fmt` exist only in canary builds so far. The minimum lives in `engines.bun` in `package.json`. Bun does not enforce that field, so `scripts/check-bun-version.ts` does: `bun install`, `bun run verify` and the pre-commit hook stop on an older Bun with:

```text
Bun >=1.4.4-canary.1 required, found 1.4.3. Run: bun upgrade --canary
```

`bun run lint`, `bun run typecheck` and `bun run test` run the same guard first, so they also refuse an unsupported Bun.

### Layout

- `apps/`: applications, one directory per app.
- `apps/docs`: the documentation site. It is built from `docs/`, and its content is never edited in the app.
- `packages/`: library packages, one directory per package.
- `packages/locus`: `@telos/locus`, the Stage 0 Locus model, validation, revisions, history and decoding. It depends only on `effect`.
  - `packages/locus/src`: the core. It never imports the specifications, a runner, an adapter or a test runner (INV-014, checked by a test).
  - `packages/locus/specs`: the sub-path `@telos/locus/specs`, the executable specifications LOC-001 to LOC-044 and their runner. Its tests are in `packages/locus/test/specs`.
- `scripts/`: repository scripts (the version guard and the review gate runner).
- `tsconfig.base.json`: strict compiler options shared by every package. `tsconfig.json` at the root checks `scripts/` and lists packages under `references`.
- `bunfig.toml`: linter, formatter and test-discovery settings. Spec Kitty, GRACE and generated files are excluded from the linter and formatter. `bun test` skips Spec Kitty's folders (`kitty-specs/`, `.kittify/`, `.spec-kitty/`), `.worktrees/` and `node_modules/`.

A new package gets its own `package.json`, a reference `{ "path": "<area>/<name>" }` in the root `tsconfig.json`, and this `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "noEmit": false,
    "emitDeclarationOnly": true
  },
  "include": ["src"]
}
```

`bun run typecheck` checks every referenced package and writes no files.

### Commands

Run them from the repository root.

| Command                                   | What it does                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun install`                             | Installs dependencies. Run it once per clone and once in every Spec Kitty worktree.                                                                  |
| `bun run verify`                          | The whole check suite, in order: version, format check, lint, typecheck, tests, docs build, browser tests, `grace lint`. Stops at the first failure. |
| `bun run typecheck`                       | `bun check -b`: the root and every referenced package.                                                                                               |
| `bun run lint` / `bun run lint:fix`       | Lint, or lint and apply safe fixes. Warnings do not fail.                                                                                            |
| `bun run format` / `bun run format:check` | Format files, or only report unformatted files.                                                                                                      |
| `bun run test`                            | `bun test`. Passes when no test files exist. Test discovery skips `kitty-specs/`, `.kittify/`, `.spec-kitty/`, `.worktrees/` and `node_modules/`.    |
| `bun run grace:lint`                      | `grace lint --path . --assertions current`.                                                                                                          |
| `bun run docs:build`                      | Builds the documentation site in `apps/docs` and prerenders every page, then checks the built Verification page.                                     |
| `bun run docs:preview`                    | Serves the built site on the loopback address. Run `bun run docs:build` first.                                                                       |
| `bun run test:e2e`                        | Playwright browser tests (Chromium) against the built site. Needs the one-time browser setup.                                                        |
| `bun run check:bun`                       | The version guard alone.                                                                                                                             |

### Pre-commit hook

`.githooks/pre-commit` runs on every commit once `core.hooksPath` is set (see setup). In order, it:

1. checks that Bun is installed and new enough, and that `node_modules/` exists,
2. formats your staged files and stages the result (`bun fmt --staged`),
3. lints your staged files (`bun lint --staged`),
4. type-checks and tests the whole repository,
5. runs `grace lint`.

Any failure stops the commit with a `pre-commit:` message. The docs build and the browser tests (`docs:build`, `test:e2e`) are not in the hook. They run in `verify` and in the review gate.

Commits that stage only files under `kitty-specs/` or `.kittify/` (Spec Kitty's bookkeeping commits) pass at once: the hook exits silently, without running the checks and without installed dependencies. `bun test` never runs test files in those folders (see [Commands](#commands)), so this exception cannot hide a failing test. Any other staged path brings back the full run above, including the `dependencies not installed` message when `node_modules/` is absent. A commit that moves a file out of any other directory runs the full checks too, because the old path counts as a staged path.

Formatting restages whole files. If you staged only part of a file, the hook blocks the commit with `pre-commit: format failed` and nothing is committed. Fix it by staging the rest of the file (`git add <file>`), or by setting the unstaged changes aside with `git stash --keep-index`.

### Review gate

Spec Kitty runs `bun scripts/review-gate.ts` when a work package goes to review. It runs every check, writes one JUnit report with a test case per check (`verify.lint`, `verify.typecheck`, and so on) plus every `bun test` result, and Spec Kitty blocks the review on any failure that is not already failing on the base branch. The docs build and the browser tests appear as `verify.docs:build` and `verify.test:e2e`. A unit test compares the gate's step list with the root `verify` script, so the two cannot drift apart.

If `node_modules/` is missing, as in the base-branch checkout that Spec Kitty uses to tell new failures from old ones, the gate first runs `bun install --frozen-lockfile` once. A failed install appears as a failing `verify.install` case, and the other checks still run. When dependencies are already installed, the gate adds no install case.

The report is always well-formed XML. Escape codes and other characters that XML cannot represent are removed from messages. A failed check's message shows the first real error line of that check, not the wrapper line that `bun run` prints. The checks run without colour, and their environment drops `CLAUDECODE`, `CLAUDE_CODE_ENTRYPOINT` and `FORCE_COLOR`, so the tools print plain messages instead of agent-specific formats such as `<error code="...">` tags.

## One-time setup on a new machine or fresh clone

`.claude/`, `.codex/` and `.agents/skills/` are generated per machine and gitignored. Once you approve, an agent can run:

```sh
git config core.hooksPath "$PWD/.githooks"    # commit-msg and pre-commit hooks
uv tool install spec-kitty-cli    # if missing; tested with 3.2.7
spec-kitty doctor tool-surfaces --tool claude --fix
spec-kitty doctor tool-surfaces --tool codex --fix
git clone --depth 1 --branch v4.2.1 https://github.com/osovv/grace-marketplace /tmp/grace-marketplace
cp -R /tmp/grace-marketplace/skills/grace/grace-* .claude/skills/
cp -R /tmp/grace-marketplace/skills/grace/grace-* .agents/skills/
bun upgrade --canary && bun add -g @osovv/grace-cli    # Bun >= 1.4.4-canary.1; also installs the grace CLI
bun install    # project dependencies; repeat in every Spec Kitty worktree
bunx playwright install chromium    # browser for test:e2e; downloads into ~/Library/Caches/ms-playwright
```

Codex may ask once to trust the project directory.

## After a mission merge

Spec Kitty 3.2.7 resets `mission_number` to `null` in the mission's `meta.json` when it merges (an upstream bug). After every merge, check `kitty-specs/<number>-<slug>/meta.json`. If `mission_number` is `null`, set it back to the number in the directory name and commit the fix.

Accept runs strictly. `project.path_conventions` in `.kittify/config.yaml` points Spec Kitty's workspace and tests checks at `packages/`, so `--lenient` is not needed.

## Global footprint

Skills live only in the project (`.claude/skills/`, `.agents/skills/`). Spec Kitty 3.2.7 also writes into your home directory, and no setting turns that off:

- **Global skill copies** in `~/.claude/skills/` and `~/.agents/skills/`. Spec Kitty writes them once per CLI version. They duplicate the project skills, so delete them after every Spec Kitty install or upgrade (see Upgrading). They stay gone until the version changes.
- **Global commands**: 15 `spec-kitty.*` files in `~/.claude/commands/`, plus the matching folders of 11 other agents (`~/.gemini`, `~/.cursor`, `~/.github/prompts`, and so on). Every `spec-kitty` run except `next` puts them back, including the Claude Code session hooks, so deleting them has no lasting effect. Claude Code's `/spec-kitty.*` commands come from these files. Codex is not affected: `~/.codex` stays clean.
- **Runtime state** in `~/.kittify/` and a sync database under `~/.spec-kitty/projects/<project uuid>/`.
- **GRACE CLI** installed globally with Bun (`~/.bun/bin/grace`). It is a Bun global, not a Claude or Codex file.
- **Chromium** for `test:e2e`, downloaded by `bunx playwright install chromium` into `~/Library/Caches/ms-playwright`. Remove that folder to undo it.

## Upgrading

- **Spec Kitty:** run `uv tool upgrade spec-kitty-cli`, then `spec-kitty upgrade --project --yes`. The second command applies migrations and commits them. Then delete the global skill copies that Spec Kitty put back: in `~/.claude/skills/` and `~/.agents/skills/`, remove every entry that also exists in the project's `.claude/skills/`. Keep `~/.claude/skills/synced`, which belongs to Claude.
- **GRACE:** delete `.claude/skills/grace-*` and `.agents/skills/grace-*`, then repeat the two `cp` lines from the new tag. Then run `bun add -g @osovv/grace-cli@latest`.
