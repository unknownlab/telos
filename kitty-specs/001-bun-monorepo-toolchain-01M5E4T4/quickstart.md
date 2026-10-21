# Quickstart: verify the Bun monorepo skeleton

```sh
bun --version                 # >= 1.4.4-canary.1; otherwise: bun upgrade --canary
git config core.hooksPath "$PWD/.githooks"
bun install                   # fails fast on an older Bun
bun run verify                # format check, lint, typecheck, test, grace lint
```

Scenario checks (spec acceptance):

1. Formatting only: add `const a = {b:1}; export {a}` to a staged `.ts` file under `scripts/`, commit. The file is reformatted and the commit succeeds.
2. Lint error: stage a file with `debugger;`, commit. The commit is blocked naming the lint check.
3. Type error: stage `export const n: number = "x";`, commit. The commit is blocked naming the typecheck.
4. Non-code commit: change only a `.md` file, commit. The hook passes.
5. Old Bun: run `bun install` with Bun `1.4.3`. It fails with the required version and the upgrade command.
6. Review gate: run the configured `review.test_command` with `{output_file}` set; it exits 0 on the skeleton and leaves `git status` clean.

Revert the scratch files after each scenario.
