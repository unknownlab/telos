# Research: Toolchain Hardening

## R-01 Colour output breaks the report (finding F1)

- **Evidence** (mission review, reproduced): with `FORCE_COLOR=1`, a failing check's message carries ESC (0x1B). XML 1.0 forbids it, `xmllint` reports `PCDATA invalid Char value 27`, and Spec Kitty's `_parse_junit_xml` raises `ParseError`. Spec Kitty's fail-open path turns any parse error into a "no coverage" warning, so the review is not blocked.
- **Decision**: sanitize at the one place text enters the report. Remove ANSI CSI sequences first (`ESC [ ... final byte`), then drop every remaining character outside the XML 1.0 `Char` set (`#x9 | #xA | #xD | #x20-#xD7FF | #xE000-#xFFFD | #x10000-#x10FFFF`). Apply it to step messages (inside `escapeXml`) and to the embedded `bun test` JUnit text.
- **Rationale**: Well-formedness is then guaranteed for any input, not just for colour. Setting `NO_COLOR` alone would depend on every tool honouring it.
- **Alternatives**: only set `NO_COLOR` (not a guarantee); encode invalid characters as numeric references (XML 1.0 cannot represent them at all).

## R-02 Useful failure messages (finding F8)

- **Evidence**: today the message is the last output line. For `bun run typecheck` that is `error: script "typecheck" exited with code 1`, and for tests `Ran 12 tests across 3 files.`
- **Decision**: after sanitizing, split the output into trimmed non-empty lines and choose, in order: the first line that looks like an error (contains `error`, case-insensitive, or starts with `(fail)`) and is not Bun's wrapper line (`error: script "<name>" exited with code <n>`); else the last non-empty line that is not the wrapper line; else the wrapper line; else `exit code <n>`. Limit to 300 characters.
- **Rationale**: simple, deterministic, testable on plain strings; no tool-specific parsing.

## R-03 Bookkeeping commits and the dependency check (finding F3)

- **Evidence**: Spec Kitty commits status and planning files in coordination and lane worktrees that have no `node_modules`. The hook's dependency check blocks them. `bunfig.toml` already excludes `kitty-specs/**` and `.kittify/**` from lint and format, and neither directory holds code that the type checker, tests or GRACE govern.
- **Decision**: right after changing to the repository root, read the staged paths with `git diff --cached --name-only`; if there is at least one and every path matches `kitty-specs/*` or `.kittify/*` (shell `case`), print nothing and exit 0. Anything else follows the existing steps unchanged. An empty staged set keeps today's behavior.
- **Rationale**: smallest change that satisfies the spec edge case; skipping checks that cannot be affected by these paths costs nothing. Superseded during review: the staged paths are read with `git -c core.quotePath=false diff --cached --name-only --no-renames`, so non-ASCII names are matched and a rename out of a code path is seen as a code change (see `contracts/hook-bookkeeping.md`).
- **Alternatives**: skip only the dependency check (still runs typecheck and tests, which need dependencies and gain nothing); a hook environment variable (hidden state).

## R-04 `.spec-kitty/` ignore (finding F7)

- **Evidence**: the repository `.gitignore` has no `.spec-kitty` entry (the earlier belief that an auto-managed block covered it was wrong). `bunfig.toml` already ignores `.spec-kitty/**` for lint and format.
- **Decision**: add `.spec-kitty/` as its own line next to `node_modules/`, outside the Spec Kitty auto-managed block.

## R-05 Guard on every check (finding F10)

- **Decision**: the `lint`, `typecheck` and `test` scripts become `bun run check:bun && <existing command>`. The hook and the gate runner call their commands directly and already run the guard first, so behavior there is unchanged. Cost: about 10 ms per script.
- **Note**: `preinstall` already uses the invoking Bun's path; the new prefix uses `bun` from `PATH`, which is what the developer runs the scripts with.
