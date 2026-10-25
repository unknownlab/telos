# Contract: parity harness

`bun kitty-specs/m0-cleanup-01M5SPZC/parity/parity.ts <command>`, run from the repository root of any checkout or worktree with `node_modules/` installed. It reads the repository through `git` and the files on disk. It never edits files, except `capture` (writes `baseline/`) and `strip` (rewrites source files).

| Command | What it does | Exit |
| --- | --- | --- |
| `selftest` | runs the lexer and stripper examples | 0 all pass, 1 otherwise |
| `capture` | writes `baseline/`; refuses when the code scope has uncommitted changes. **Already done at `f95ae8d`; never run it again in this mission.** | 0 / 1 |
| `check` | compares the current tree with `baseline/`: code parity per file in `packages/` and `apps/calculator/`, commands, exports, model outputs, owner notes; prints every difference | 0 no difference, 1 differences |
| `same-code <rev>` | compares every tracked `.ts` file in the comment scope with the same file at `<rev>`: runtime output and token stream must match; only `apps/calculator/test/ergonomics.test.ts` may be missing | 0 / 1, 2 without `<rev>` |
| `scan` | prints `{"ownerNotes":n,"directives":n,"other":n}` for the comment scope | 0 |
| `scan --expect-clean` | as `scan`, and requires exactly 34 / 7 / 0; lists up to 20 remaining comments | 0 / 1 |
| `strip` | removes every comment except owner notes and `@ts-expect-error` directives from the comment scope; refuses (throws) when a removable comment looks like a note or a directive | 0, or a thrown error |

Comment scope: tracked `.ts` files under `packages/`, `apps/calculator/`, `scripts/`, and `telos.ts`.

After `strip`, always run `bun run format`.
