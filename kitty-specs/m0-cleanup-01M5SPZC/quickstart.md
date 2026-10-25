# Quickstart: checking M0

Run from the repository root of the checkout or worktree under test, with `node_modules/` installed (`bun install --frozen-lockfile`). `P` is the parity harness.

```sh
P=kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts
```

## Before implementation (coordinator, once)

```sh
git config core.hooksPath .githooks          # P1: each worktree runs its own branch's hook
git config --get core.hooksPath              # must print .githooks
bun $P selftest                              # harness works on this machine
bun $P check                                 # passes on the unchanged tree
```

## Per WP

| WP | Checks |
| --- | --- |
| WP01 | `bun run verify`; `bun test scripts/review-gate.test.ts`; `grep -c grace .githooks/pre-commit` prints `0` |
| WP02 | `bun run verify`; `bun $P check`; `git diff --numstat <WP02 base> -- bun.lock` shows `0` added lines; the NFR-005 search below, ignoring `AGENTS.md` and comment-only matches in `.ts` files |
| WP03 | `bun $P same-code <WP03 base>`; `bun $P scan --expect-clean`; `bun $P check`; `bun run verify` |
| WP04 | `git diff <WP04 base> -- AGENTS.md` matches spec edits 1-11; `bun run verify` |

## Mission acceptance (after all WPs are merged into the coordination branch)

```sh
bun run verify                                        # 6 steps, all pass, under 60 s
bun scripts/review-gate.ts /tmp/m0-gate.xml; echo $?  # 0, one well-formed report
bun $P check                                          # parity with the baseline
bun $P scan --expect-clean                            # {"ownerNotes":34,"directives":7,"other":0}
git ls-files apps/docs docs .grace | wc -l            # 0
test -f tools/README.md && echo ok                    # ok
git diff --stat f95ae8d -- CLAUDE.md .kittify/config.yaml human-notes.md   # empty
git diff --numstat f95ae8d -- bun.lock                # first column 0 (no added lines)
```

NFR-005 reference search. It must print nothing. It skips the historical records, `human-notes.md` and the Spec Kitty-generated `charter.yaml`:

```sh
git ls-files \
  | grep -v -E '^(kitty-specs/|kitty-ops/|\.kittify/archive/|tools/agents/experiments/|tools/agents/usage/ledgers/|human-notes\.md$|\.kittify/charter/charter\.yaml$)' \
  | tr '\n' '\0' \
  | xargs -0 grep -n -E 'apps/docs|@telos/docs|docs/|\.grace|grace lint|grace:lint|docs:build|docs:preview|test:e2e|START_MODULE|START_CONTRACT|END_CONTRACT|START_BLOCK|END_BLOCK'
```

## After the mission merge (coordinator)

```sh
git config core.hooksPath "$PWD/.githooks"   # back to the documented setup in tools/README.md
```
