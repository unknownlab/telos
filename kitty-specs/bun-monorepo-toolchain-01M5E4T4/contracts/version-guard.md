# Contract: version guard (`scripts/check-bun-version.ts`)

## Interface

- **Input**: `Bun.version` (the running Bun) and `engines.bun` from the root `package.json`.
- **Output**: exit `0` silently when the version is supported; otherwise exit `1` and print exactly one line on stderr:

```
Bun <required> required, found <actual>. Run: bun upgrade --canary
```

where `<required>` is the full `engines.bun` value (for example `>=1.4.4-canary.1`) and `<actual>` is `Bun.version`.

- If `engines.bun` is missing or does not start with `>=`, exit `1` with: `package.json engines.bun must be ">=<version>"`.

## Rules

- Compare with `Bun.semver.order(actual, minimum) >= 0`. Never use `Bun.semver.satisfies`, because it rejects `1.4.5-canary.1` against `>=1.4.4-canary.1`.
- The `preinstall` script invokes the guard as `$npm_execpath scripts/check-bun-version.ts`, so it checks the Bun that is running the install, not the first `bun` on `PATH`.
- No dependencies and no network access. It reads `package.json` with a JSON import.

## Acceptance table

| `Bun.version` | Expected |
|---|---|
| `1.4.3` | exit 1, message |
| `1.4.4-canary.1` | exit 0 |
| `1.4.4-canary.7` | exit 0 |
| `1.4.4` | exit 0 |
| `1.4.5-canary.1` | exit 0 |
| `1.5.0` | exit 0 |

The comparison logic is a pure exported function `isSupported(actual: string, required: string): boolean`, covered by a real `bun test` file (`scripts/check-bun-version.test.ts`) that runs every row above. That test is the first real test in the repo (test-first, charter).
