# Quickstart: verify Toolchain Hardening

1. `bun run verify` exits 0.
2. Colour: `FORCE_COLOR=1 bun scripts/review-gate.ts <file>` with a deliberate type error in `scripts/x.ts` (delete it afterwards) exits 1, `xmllint --noout <file>` succeeds, and the message names the type error, not the `error: script ...` line.
3. Hook, in a throwaway clone with `core.hooksPath` set only there and `node_modules/` removed: committing one file under `kitty-specs/` succeeds in under 2 s; adding `scripts/x.ts` to the same commit is blocked with the dependencies message.
4. `touch .spec-kitty/review-lock.json && git status --short` does not list it.
5. `grace lint --path . --assertions current` exits 0 with both modules ready.
