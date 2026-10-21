# Development tooling

Describe what you want in plain language. Claude Code or Codex chooses and runs the tools, and asks you only for decisions. The agent rules live in [`AGENTS.md`](../AGENTS.md); Claude Code loads them through `CLAUDE.md`.

## Who does what

| Concern | Authority |
| --- | --- |
| Change lifecycle (spec → plan → tasks → implement/review → accept → merge), worktrees, reviews, integration | Spec Kitty 3.2.7 (`.kittify/`, `kitty-specs/`, `.worktrees/`) |
| Architecture knowledge: contracts, module graph, verification, semantic-markup validation | GRACE 4.2.1 skills and `grace` CLI. Inactive until you approve `grace-init` |
| Choosing tools, running checks, asking you for decisions | Claude Code / Codex |

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
- Spec Kitty checks review artifacts at merge; bypassing that needs a recorded note.
- Claude Code hooks (`.claude/settings.json`). `spec-kitty session-start` injects orientation and open Ops. `spec-kitty session-stop` reminds about open Ops.

Advisory: the instructions in `AGENTS.md`. Agents normally follow them, but nothing guarantees it. They cover:

- tool routing
- reading state before work
- approval boundaries
- running typecheck, lint, format, tests and `grace lint`

Not in place yet: CI and code checks, because there is no code or toolchain. The mission that introduces the toolchain adds them, including CI and Spec Kitty's `review.test_command`.

## One-time setup on a new machine or fresh clone

`.claude/`, `.codex/` and `.agents/skills/` are generated per machine and gitignored. Once you approve, an agent can run:

```sh
git config core.hooksPath "$PWD/.githooks"    # commit message checks
uv tool install spec-kitty-cli    # if missing; tested with 3.2.7
spec-kitty doctor tool-surfaces --tool claude --fix
spec-kitty doctor tool-surfaces --tool codex --fix
git clone --depth 1 --branch v4.2.1 https://github.com/osovv/grace-marketplace /tmp/grace-marketplace
cp -R /tmp/grace-marketplace/skills/grace/grace-* .claude/skills/
cp -R /tmp/grace-marketplace/skills/grace/grace-* .agents/skills/
bun upgrade && bun add -g @osovv/grace-cli    # the grace CLI needs Bun >= 1.3.14
```

Codex may ask once to trust the project directory.

## Global footprint

Skills live only in the project (`.claude/skills/`, `.agents/skills/`). Spec Kitty 3.2.7 also writes into your home directory, and no setting turns that off:

- **Global skill copies** in `~/.claude/skills/` and `~/.agents/skills/`. Spec Kitty writes them once per CLI version. They duplicate the project skills, so delete them after every Spec Kitty install or upgrade (see Upgrading). They stay gone until the version changes.
- **Global commands**: 15 `spec-kitty.*` files in `~/.claude/commands/`, plus the matching folders of 11 other agents (`~/.gemini`, `~/.cursor`, `~/.github/prompts`, and so on). Every `spec-kitty` run except `next` puts them back, including the Claude Code session hooks, so deleting them has no lasting effect. Claude Code's `/spec-kitty.*` commands come from these files. Codex is not affected: `~/.codex` stays clean.
- **Runtime state** in `~/.kittify/` and a sync database under `~/.spec-kitty/projects/<project uuid>/`.
- **GRACE CLI** installed globally with Bun (`~/.bun/bin/grace`). It is a Bun global, not a Claude or Codex file.

## Upgrading

- **Spec Kitty:** run `uv tool upgrade spec-kitty-cli`, then `spec-kitty upgrade --project --yes`. The second command applies migrations and commits them. Then delete the global skill copies that Spec Kitty put back: in `~/.claude/skills/` and `~/.agents/skills/`, remove every entry that also exists in the project's `.claude/skills/`. Keep `~/.claude/skills/synced`, which belongs to Claude.
- **GRACE:** delete `.claude/skills/grace-*` and `.agents/skills/grace-*`, then repeat the two `cp` lines from the new tag. Then run `bun add -g @osovv/grace-cli@latest`.
