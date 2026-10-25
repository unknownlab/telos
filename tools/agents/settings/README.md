# Claude Code routing settings

Spec Kitty keeps `.claude/` out of git, so the routing settings live only in each machine's `.claude/settings.json`. This folder is their tracked copy and the way to install, check and remove them.

| File                   | Purpose                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-settings.json` | The routing keys, without Spec Kitty's hooks and without machine paths. `${REPO}` stands for the main checkout's absolute path.                                 |
| `routing.py`           | `apply`, `check` and `remove` the keys in the `.claude/settings.json` of the checkout or worktree it runs in, or of `--target`. Needs only `python3` and `git`. |

## What the keys do

| Key                | Effect                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`            | Sessions start on Sonnet, the coordinator model in `AGENTS.md`.                                                                                                                                          |
| `modelSettings`    | Effort per model: Opus high, Sonnet medium. It applies to the session and to every subagent of that model whose Agent call sets no effort. Haiku has no entry; its Agent calls set medium (`AGENTS.md`). |
| `claudeMdExcludes` | Skips Spec Kitty's `.claude/CLAUDE.md` and the `CLAUDE.md` at each worktree root. Both repeat what `AGENTS.md` already provides.                                                                         |
| `attribution`      | Claude Code adds no attribution to commits and PRs.                                                                                                                                                      |

## Setup

On a new machine or a fresh clone, after the one-time setup in [`docs/tooling.md`](../../../docs/tooling.md) (which registers Spec Kitty's hooks), run from the main checkout:

```sh
python3 tools/agents/settings/routing.py apply
python3 tools/agents/settings/routing.py check
```

`apply` keeps every other key and saves the previous file as `.claude/settings.json.before-routing`. `check` prints `ok` or `DIFFERS` per key and exits non-zero on a difference. Settings load when a session starts, so restart open sessions.

When `sonnet` or `opus` starts to mean a newer model, add that model id to `modelSettings` in `claude-settings.json` and run `apply` again. Otherwise its effort falls back to the default.

## Rollback

```sh
python3 tools/agents/settings/routing.py remove
```

This removes the four keys and keeps the rest, such as Spec Kitty's hooks. To get back the exact earlier file, copy `.claude/settings.json.before-routing` over `.claude/settings.json`. Without the keys, sessions use the user settings in `~/.claude/settings.json`.

## Where the settings apply

Claude Code reads project settings from the directory where a session starts. Measured on 2026-10-25:

- **Main checkout.** A session started there uses them. The coordinator ran on Sonnet at medium effort.
- **Existing and future worktrees under `.worktrees/`, used by subagents.** Subagents of a session started in the main checkout keep that session's settings while they work in a worktree. In a probe started in the main checkout, a subagent reading files in a directory under `.worktrees/` loaded only the `CLAUDE.md` files the excludes allow; Haiku subagents ran at medium and Opus subagents at high. Each Agent call also sets `model` and `effort` itself (`AGENTS.md`), because Spec Kitty regenerates its agent definitions without a model.
- **A session started inside a worktree.** It does not read the main checkout's settings, and worktrees have no `.claude/` of their own because it is ignored. It falls back to the user settings: a probe started in a fresh worktree ran on Opus at xhigh, this machine's user default. The coordinator handles this at the start of every session (`AGENTS.md`, "Model routing"): `routing.py check` where the session started, `apply` and `check` again if a key differs, then one line to the owner that a restart is needed. Only that worktree gets the keys, and removing the worktree removes them.
- **Another machine or a fresh clone.** Nothing applies until `apply` runs there.

The `--model` flag, `/model` inside a session and the `ANTHROPIC_MODEL` environment variable take precedence over `model`. Claude Code ignores `claudeMdExcludes` from project settings in sessions started with `--cloud`, `--remote` or `--attach-serve`. When Spec Kitty registers its hooks again, it keeps the other keys.
