---
work_package_id: WP01
title: Workspace and dependencies
dependencies: []
requirement_refs:
- C-001
- C-004
- C-005
- NFR-003
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-locus-foundation-01M5EWDR
base_commit: 856cde7b25f678695666240cfbd101bded934a01
created_at: '2026-10-21T12:31:14.219053+00:00'
subtasks:
- T001
- T002
- T003
- T004
- T005
- T006
phase: Phase 1 - Setup
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus/
create_intent:
- packages/locus/package.json
- packages/locus/tsconfig.json
- packages/locus/src/index.ts
- packages/locus/test/tsconfig.json
- packages/locus/test/manifest.test.ts
- packages/locus-specs/package.json
- packages/locus-specs/tsconfig.json
- packages/locus-specs/src/index.ts
- packages/locus-specs/test/tsconfig.json
- packages/locus-specs/test/manifest.test.ts
- apps/docs/package.json
- apps/docs/tsconfig.json
- apps/docs/test/manifest.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus/package.json
- packages/locus/tsconfig.json
- packages/locus/src/index.ts
- packages/locus/test/tsconfig.json
- packages/locus/test/manifest.test.ts
- packages/locus-specs/package.json
- packages/locus-specs/tsconfig.json
- packages/locus-specs/src/index.ts
- packages/locus-specs/test/tsconfig.json
- packages/locus-specs/test/manifest.test.ts
- apps/docs/package.json
- apps/docs/tsconfig.json
- apps/docs/test/manifest.test.ts
- tsconfig.json
- bunfig.toml
- .gitignore
- bun.lock
- packages/.gitkeep
- apps/.gitkeep
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Workspace and dependencies

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (Haiku-class model, high effort)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## ⚠️ IMPORTANT: Review Feedback

Check the Activity Log and `spec-kitty agent tasks status --mission locus-foundation-01M5EWDR` for review feedback. You must address all feedback before your work is complete.

---

## Objectives & Success Criteria

Create the three Bun workspace projects of this mission with **exactly** the dependencies the owner approved, pinned to exact versions. Wire TypeScript so that the core packages cannot use Bun or Node APIs. Add the ignores the later WPs need, install everything including Playwright's Chromium, and leave `bun run verify` green.

Done means:

1. `packages/locus` (`@telos/locus`), `packages/locus-specs` (`@telos/locus-specs`) and `apps/docs` (`@telos/docs`) exist with the manifests below, byte for byte in content (formatting may follow `bun fmt`).
2. `bun install` produced a `bun.lock` that contains these pins, and `apps/docs/package.json` still has exact versions afterwards (no `^`, no `~`).
3. `bun run typecheck` type-checks five projects: locus src, locus test, specs src, specs test, and docs. You proved it by planting a type error in each project and watching the check fail. Using `process` in `packages/locus/src` also fails it.
4. The manifest tests pass and fail when a pin or the dependency set changes.
5. `bunx playwright --version` prints `Version 1.64.1` and Chromium is installed.
6. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/plan.md` (Technical Context, Project Structure, IC-01)
- `kitty-specs/locus-foundation-01M5EWDR/research.md` R-01 (approved pins; **authoritative**)
- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md` (Package and Portability sections)
- Repository root: `package.json`, `tsconfig.json`, `tsconfig.base.json`, `bunfig.toml`, `.gitignore`

Repository facts:

- Bun 1.4.4 workspaces are `apps/*` and `packages/*`. Both folders exist with only a `.gitkeep`. Delete each `.gitkeep` once the folder has real content.
- `bun check -b` is the type checker (`bun run typecheck`). `tsconfig.base.json` is strict, with `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `lib: ["ESNext"]`, `types: ["bun"]` and `noEmit`.
- Lint is `bun lint --no-script`, format is `bun fmt --no-script`, tests are `bun test`. All three read `bunfig.toml`.
- Experiments done in the planning phase, which you can rely on:
  - A project with `noEmit` cannot be a *composite* reference (TS6310). Plain, non-composite `references` in the root `tsconfig.json` do work with `bun check -b`.
  - A project with no input files fails with TS18003, so every project below gets at least one file.
  - Relative imports must be extensionless (`./x`, not `./x.ts`), or the check fails with TS5097.
  - A `src` project with `"types": []` and `"lib": ["ESNext", "DOM"]` rejects `process` with TS2591. That is how portability (NFR-003, C-004) is enforced at type level.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP01 --agent claude` gives you.
- Stay inside `owned_files`. No other file changes.
- No dependency other than those listed here. Never use `bun add`, `bun update` or `^`/`~` ranges.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree, because the review gate rejects it. Put your evidence (command outputs) in your final report and in your commit body.
- No fake tests: a test must fail when the behavior it names breaks.
- Code style: double quotes, semicolons, trailing commas, extensionless relative imports. Run `bun run format` before committing.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push.
- Do not touch `AGENTS.md`, `CLAUDE.md`, `.kittify/` or `.grace/`.
- Commits follow Conventional Commits with no AI names and no `Co-Authored-By` line. Example: `build(workspace): add locus, locus-specs and docs workspace projects`.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP01 --agent claude` and work only in the worktree it gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing, because the pre-commit hook needs it. (In this WP you then run the real `bun install` in T004.)

## Subtasks & Detailed Guidance

### Subtask T001 – Write the three package manifests

**`packages/locus/package.json`**:

```json
{
  "name": "@telos/locus",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "dependencies": {
    "effect": "4.0.4"
  }
}
```

**`packages/locus-specs/package.json`**:

```json
{
  "name": "@telos/locus-specs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "dependencies": {
    "@telos/locus": "workspace:*",
    "effect": "4.0.4"
  }
}
```

**`apps/docs/package.json`**. The scripts are written now, although the files they call arrive in later WPs (content in WP09, spec-report in WP13, the static server and Playwright config in WP16):

```json
{
  "name": "@telos/docs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run content && bun --bun vite dev",
    "content": "bun scripts/content.ts",
    "spec-report": "bun scripts/spec-report.ts",
    "build:site": "bun --bun vite build",
    "build": "bun run content && bun run spec-report && bun run build:site",
    "preview": "bun scripts/serve-static.ts",
    "test:e2e": "bun --bun playwright test"
  },
  "dependencies": {
    "@tanstack/react-router": "1.170.44",
    "@tanstack/react-start": "1.169.2",
    "@telos/locus": "workspace:*",
    "@telos/locus-specs": "workspace:*",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "effect": "4.0.4",
    "lucide-react": "1.57.0",
    "mermaid": "12.2.0",
    "minisearch": "7.2.0",
    "radix-ui": "1.8.1",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "tailwind-merge": "3.7.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.64.1",
    "@tailwindcss/vite": "4.3.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    "tailwindcss": "4.3.3",
    "tw-animate-css": "1.4.0",
    "vite": "8.3.4"
  }
}
```

`@tanstack/router-plugin` is deliberately **not** listed. Start's Vite plugin brings it in transitively (research R-01). Playwright runs under Bun (`bun --bun playwright test`). This was checked in planning with 1.64.1 and `@axe-core/playwright` 4.13.0, so Node is not needed.

### Subtask T002 – TypeScript projects, entry modules, root references

Create these files.

**`packages/locus/tsconfig.json`** (source must stay portable: no Bun or Node types):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "types": []
  },
  "include": ["src"]
}
```

**`packages/locus/test/tsconfig.json`** (tests use Bun types and see the sources):

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ESNext", "DOM"]
  },
  "include": [".", "../src"]
}
```

Create the same two files for `packages/locus-specs`, with the same contents.

**`apps/docs/tsconfig.json`**:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["bun", "vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src",
    "scripts",
    "test",
    "e2e",
    "vite.config.ts",
    "playwright.config.ts"
  ]
}
```

Include patterns that match no files yet are fine, as long as the project has at least one file: `test/manifest.test.ts` from T005.

**Entry modules**. Later WPs append export lines to these files (a sanctioned shared edit, see `tasks.md`). Use the repository's GRACE file markup:

`packages/locus/src/index.ts`:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Public entry point of @telos/locus; re-exports the Stage 0 Locus model, validation, revisions, history and decoding.
//   SCOPE: Export statements only. No logic lives here.
//   DEPENDS: none
//   LINKS: M-LOCUS-MODEL, M-LOCUS-VALIDATION, M-LOCUS-REVISION, M-LOCUS-HISTORY, M-LOCUS-DECODE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (filled in as modules are added)
// END_MODULE_MAP

export {};
```

`packages/locus-specs/src/index.ts`: the same shape, with PURPOSE "Public entry point of @telos/locus-specs; re-exports the executable specification model, catalogue, examples and runner.", LINKS `M-LOCUS-SPECS`, and `export {};`.

**Root `tsconfig.json`**. Keep `scripts` and add the references:

```json
{
  "extends": "./tsconfig.base.json",
  "include": ["scripts"],
  "references": [
    { "path": "packages/locus" },
    { "path": "packages/locus/test" },
    { "path": "packages/locus-specs" },
    { "path": "packages/locus-specs/test" },
    { "path": "apps/docs" }
  ]
}
```

### Subtask T003 – Ignores [P]

Add these entries to **`bunfig.toml`**. Keep the existing entries and their order, and append the new ones at the end of each list.

- `[lint] ignorePatterns`: `"apps/docs/src/routeTree.gen.ts"`, `"apps/docs/src/generated/**"`, `"apps/docs/dist/**"`, `"apps/docs/public/llms.txt"`, `"apps/docs/public/index.json"`, `"apps/docs/test-results/**"`, `"apps/docs/playwright-report/**"`, `"apps/docs/test/fixtures/**"`
- `[fmt] ignorePatterns`: the same eight entries
- `[test] pathIgnorePatterns`: `"apps/docs/e2e/**"`, `"apps/docs/dist/**"`, `"apps/docs/test/fixtures/**"`

Why: TanStack generates `routeTree.gen.ts` and asks for it to be excluded from linters and formatters. It **is** committed (WP11), because type checking needs it on a clean checkout. `src/generated/` and the two public files are build output. The fixtures in `test/fixtures/` are deliberately invalid content. Playwright files end in `.e2e.ts` and must never run under `bun test`.

Append to **`.gitignore`**:

```
# docs app build output (locus-foundation)
apps/docs/dist/
apps/docs/src/generated/
apps/docs/public/llms.txt
apps/docs/public/index.json
apps/docs/test-results/
apps/docs/playwright-report/
apps/docs/.tanstack/
```

### Subtask T004 – Install

From the worktree root:

```bash
bun install
git diff --stat -- package.json packages apps    # only your new files; root package.json unchanged
bunx playwright --version                        # Version 1.64.1
bunx playwright install chromium                 # owner-approved download into ~/Library/Caches/ms-playwright (may already be present)
```

Then confirm:

- `bun.lock` changed, and each pinned version appears in it, for example with `grep '"effect@4.0.4"' bun.lock` and `grep 'vite@8.3.4' bun.lock`.
- No `package.json` has `trustedDependencies`, so no dependency lifecycle scripts run.
- Every version in `apps/docs/package.json` is still exact.

If `bun install` fails on a pin, stop and report the exact error. Do not choose another version (C-005).

### Subtask T005 – Manifest tests

These are real checks: they fail if someone adds a dependency, loosens a pin or adds install scripts.

**`packages/locus/test/manifest.test.ts`**:

```ts
import { describe, expect, test } from "bun:test";
import pkg from "../package.json";

describe("@telos/locus manifest", () => {
  test("depends on effect 4.0.4 and nothing else", () => {
    expect(pkg.dependencies).toEqual({ effect: "4.0.4" });
  });

  test("has no dev, peer or optional dependencies and no trusted install scripts", () => {
    expect(Object.keys(pkg).sort()).toEqual(
      ["dependencies", "exports", "name", "private", "type", "version"].sort(),
    );
  });

  test("exposes only the entry point and its manifest", () => {
    expect(pkg.exports).toEqual({
      ".": "./src/index.ts",
      "./package.json": "./package.json",
    });
  });
});
```

**`packages/locus-specs/test/manifest.test.ts`**: the same three tests, with dependencies `{ "@telos/locus": "workspace:*", effect: "4.0.4" }`.

**`apps/docs/test/manifest.test.ts`**:

```ts
import { describe, expect, test } from "bun:test";
import pkg from "../package.json";
import root from "../../../package.json";

const approvedDependencies = {
  "@tanstack/react-router": "1.170.44",
  "@tanstack/react-start": "1.169.2",
  "@telos/locus": "workspace:*",
  "@telos/locus-specs": "workspace:*",
  "class-variance-authority": "0.7.1",
  clsx: "2.1.1",
  effect: "4.0.4",
  "lucide-react": "1.57.0",
  mermaid: "12.2.0",
  minisearch: "7.2.0",
  "radix-ui": "1.8.1",
  react: "19.3.1",
  "react-dom": "19.3.1",
  "tailwind-merge": "3.7.0",
};

const approvedDevDependencies = {
  "@axe-core/playwright": "4.13.0",
  "@playwright/test": "1.64.1",
  "@tailwindcss/vite": "4.3.3",
  "@types/react": "19.3.0",
  "@types/react-dom": "19.3.0",
  "@vitejs/plugin-react": "6.1.2",
  tailwindcss: "4.3.3",
  "tw-animate-css": "1.4.0",
  vite: "8.3.4",
};

describe("@telos/docs manifest", () => {
  test("runtime dependencies are exactly the owner-approved pins", () => {
    expect(pkg.dependencies).toEqual(approvedDependencies);
  });

  test("dev dependencies are exactly the owner-approved pins", () => {
    expect(pkg.devDependencies).toEqual(approvedDevDependencies);
  });

  test("every external version is exact", () => {
    const versions = [
      ...Object.values(pkg.dependencies),
      ...Object.values(pkg.devDependencies),
    ].filter((v) => v !== "workspace:*");
    for (const v of versions) expect(v).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("no workspace manifest trusts dependency install scripts", () => {
    expect("trustedDependencies" in pkg).toBe(false);
    expect("trustedDependencies" in root).toBe(false);
  });
});
```

Prove each test can fail. Temporarily change `effect` to `^4.0.4` in one manifest, run `bun test <that file>`, see it fail, then restore the line. Do the same once by adding a dependency. Quote both failing outputs in your report.

### Subtask T006 – Prove the type-check wiring, then run verify

For each of the five projects, temporarily add a type error and run `bun run typecheck`. It must fail and name the file. Then remove the error. Use these temporary errors:

| Project | Temporary line | Expected |
| --- | --- | --- |
| `packages/locus` (src) | `export const broken: number = "x";` in `src/index.ts` | TS2322 |
| `packages/locus` (src) | `export const env = process.env;` in `src/index.ts` | TS2591 (no Node/Bun types: portability) |
| `packages/locus/test` | `const n: number = "x";` in `manifest.test.ts` | TS2322 |
| `packages/locus-specs` (src and test) | the same two kinds of error | TS2322 |
| `apps/docs` | `const n: number = "x";` in `test/manifest.test.ts` | TS2322 |

If one of them does **not** fail, the reference wiring is wrong. Fix `tsconfig.json`; do not weaken the base config. Then run:

```bash
bun run verify
```

All steps must pass: check:bun, format:check, lint, typecheck, test, grace:lint. `grace:lint` should be unaffected, because no `.grace/` entries change in this WP.

## Definition of Done

- [ ] Three manifests exist exactly as specified, and `bun.lock` contains the pins.
- [ ] Root `tsconfig.json` references five projects; each one fails on a planted error, and `process` in `packages/*/src` fails.
- [ ] `bunfig.toml` and `.gitignore` entries are added, with the existing entries untouched.
- [ ] The manifest tests pass, and you have shown that a loosened pin and an extra dependency make them fail.
- [ ] `bunx playwright --version` is 1.64.1, and Chromium is installed.
- [ ] `bun run verify` passes; the full output tail is in your report.
- [ ] The `.gitkeep` files in `apps/` and `packages/` are removed.

## Risks

- `bun install` may add `^` ranges if `bun add` is used. Write the manifests by hand and run plain `bun install`.
- Bun types plus DOM in `apps/docs` may clash. If they do, report the exact error before changing `lib`/`types`. Do not add `skipLibCheck` changes, because the base already skips lib checks.

## Reviewer Guidance

- Compare the manifests with research.md R-01 entry by entry. Any extra or missing dependency means a rejection.
- Check that the evidence of each planted type error is quoted, including the `process` portability case.
- Check that `bunfig.toml` only gained entries.
- Run `bun run verify` in the lane worktree yourself.
