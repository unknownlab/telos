---
work_package_id: WP15
title: Repository self-description, telos command and gate
dependencies:
- WP14
- WP08
- WP22
requirement_refs:
- FR-022
- FR-023
- FR-024
- NFR-003
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
base_branch: kitty/mission-semantic-foundation-rebuild-01M5JFR0
base_commit: 4bf5c72e10cca6d0efe03744c32ac971881d7212
created_at: '2026-10-24T14:45:45.262020+00:00'
subtasks:
- T084
- T085
- T086
- T087
- T088
- T089
phase: Phase 5 – Repository gate
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: scripts/telos.ts
create_intent:
- telos.ts
- scripts/telos.ts
- scripts/telos.test.ts
- .grace/graph/tooling.xml
- .grace/verification/tooling.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- telos.ts
- scripts/telos.ts
- scripts/telos.test.ts
- scripts/review-gate.ts
- scripts/review-gate.test.ts
- .grace/graph/tooling.xml
- .grace/verification/tooling.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP15 – Repository self-description, telos command and gate

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Resume: the remaining work (added 2026-10-24)

WP15 is `in_progress`. Its worktree is `/Users/unknownhero/projects/unknownlab/telos/.worktrees/semantic-foundation-rebuild-01M5JFR0-lane-o` (branch `kitty/mission-semantic-foundation-rebuild-01M5JFR0-lane-o`). It already contains WP08 (lane-h), WP14 (lane-n) and WP22 (lane-v). T084 to T087 are written there and are **not committed yet**:

- new: `telos.ts`, `scripts/telos.ts`, `scripts/telos.test.ts`

Work only in that worktree. Run `git status --short` first and check that it shows exactly these three untracked files. **Keep this work.** Do not delete, rewrite or `git checkout`/`git restore` these files, and do not stash them. Change them only as R4 says. Do not run `spec-kitty agent action implement` again: the WP is already claimed. Then do R1 to R10 in order.

At planning time, `bun test scripts/telos.test.ts` gave 10 pass and 3 fail (`check on the repository exits 0 with ok true`, `report --out writes a version 1 SemanticReport ...`, `closure completes in under 10000 ms`). All three fail only because `bun scripts/telos.ts closure` reports closure errors. These are the 129 `closure.unknown-external` findings of `telos:docs-site` (R4 declares them) and two `closure.unresolved-import` findings caused by a defect in the kernel (R1 to R3 fix it):

- `apps/docs/src/router.tsx` imports `./routeTree.gen`
- `apps/docs/test/components.test.tsx` imports `@/routeTree.gen`

`apps/docs/src/routeTree.gen.ts` exists and is tracked. `isAssetPath` in `packages/kernel/src/closure.ts` treats any extension other than `.ts`, `.tsx` or `.js` as an asset, so `.gen` is looked up as the file `routeTree.gen`, and `routeTree.gen.ts` is never tried. The contract was wrong and is now corrected (see the quoted closure contract below, the asset rule). You fix the code as a sanctioned edit of WP08's files. **Never exclude files from `CLOSURE_SCOPE`** to make an error go away.

The six `closure.dynamic-import` **warnings** (two docs tests, `packages/kernel/src/closure.ts`, two kernel closure tests and `packages/locus/test/specs/scan.test.ts`) are expected. Warnings do not fail `check`. Leave them as they are.

### R1 – Regression tests in `packages/kernel/test/closure.test.ts` (write them first, see them fail)

Sanctioned edit. Change nothing else in the file. The module map does not change: the new tests add no local helper.

1. Inside `describe("closure.unresolved-import", () => { ... })`, directly after the end of the test `"asset imports are allowed when the file exists and are unresolved when it does not"` (that is, just before the `});` that closes the describe, which is followed by `describe("workspace packages", () => {`), add:

```ts
  test("closure.unresolved-import is not reported for a dotted module name that resolves to a .ts, .tsx or index file", async () => {
    const dir = fixture({
      "a/x.ts":
        'import "./routeTree.gen";\nimport "./app.config";\nimport "./parts.v2";\n',
      "a/routeTree.gen.ts": "export {};\n",
      "a/app.config.tsx": "export {};\n",
      "a/parts.v2/index.ts": "export {};\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts", "a/**/*.tsx"] },
    });
    const report = await check(model, dir, {
      include: ["**/*.ts", "**/*.tsx"],
    });
    expect(withCode(report, "closure.unresolved-import")).toEqual([]);
    expect(report.findings).toEqual([]);
  });

  test("closure.unresolved-import is reported for a dotted module name when neither the file nor a code file exists", async () => {
    const dir = fixture({ "a/x.ts": 'import "./routeTree.gen";\n' });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: ["a/**/*.ts"] },
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.unresolved-import",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:root"],
        detail: "./routeTree.gen",
        message: "./routeTree.gen does not resolve to a file.",
        knowledge: "derived",
      },
    ]);
  });

  test("an existing asset file wins over a code file with the same name plus .ts", async () => {
    const dir = fixture({
      "a/x.ts": 'import "./style.css";\n',
      "a/style.css": "",
      "a/style.css.ts": "export {};\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: [] },
      contains: [
        Owned.make({ id: "app:a", properties: { sources: ["a/x.ts"] } }),
        Owned.make({
          id: "app:b",
          properties: { sources: ["a/style.css.ts"] },
        }),
      ],
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([]);
  });

  test("closure.undeclared-dependency is reported for a dotted module import of an unrelated Locus", async () => {
    const dir = fixture({
      "a/x.ts": 'import "../b/routeTree.gen";\n',
      "b/routeTree.gen.ts": "export {};\n",
    });
    const model = Owned.make({
      id: "app:root",
      properties: { sources: [] },
      contains: [
        Owned.make({ id: "app:a", properties: { sources: ["a/**/*.ts"] } }),
        Owned.make({ id: "app:b", properties: { sources: ["b/**/*.ts"] } }),
      ],
    });
    const report = await check(model, dir);
    expect(report.findings).toEqual([
      {
        code: "closure.undeclared-dependency",
        severity: "error",
        file: "a/x.ts",
        loci: ["app:a", "app:b"],
        detail: "../b/routeTree.gen",
        message:
          "app:a imports app:b through ../b/routeTree.gen without a declared relation.",
        knowledge: "derived",
      },
    ]);
  });
```

2. Inside `describe("path aliases", () => { ... })`, directly after the end of the test `"an alias import from a file under the alias app resolves to the aliased file"` (just before the `});` that closes the describe, which is followed by `describe("closure.dynamic-import", () => {`), add:

```ts
  test("an alias import of a dotted module name resolves to its .ts file", async () => {
    const dir = fixture({
      "apps/d/src/routeTree.gen.ts": "export const tree = 1;\n",
      "apps/d/test/x.ts":
        'import { tree } from "@/routeTree.gen";\nexport { tree };\n',
    });
    const model = Owned.make({
      id: "app:d",
      properties: { sources: ["apps/d/**/*.ts"] },
    });
    const report = await check(model, dir, {
      aliases: [{ prefix: "@/", dir: "apps/d/src/" }],
    });
    expect(report.findings).toEqual([]);
  });
```

Run `bun test packages/kernel/test/closure.test.ts`. Before R2 it must report **3 fail**: the `.ts, .tsx or index file` test, the `closure.undeclared-dependency ... dotted module import` test and the alias test. The other two new tests pass already; they pin behaviour that must not change. When this was planned, the result was 31 pass, 3 fail. Note the failures for your report.

### R2 – Fix the resolver (sanctioned edit of `packages/kernel/src/closure.ts`)

Make exactly these two changes and nothing else. The module map, the module contract and the `checkClosure` contract do not change (the new function is module-local and not exported).

1. Directly before the line `function isAssetPath(path: string): boolean {`, add:

```ts
// Returns the first existing code file named by a repository-relative path plus a
// code suffix, or null. Used when the last segment of the path has a non-code
// extension but no such file exists, such as "./routeTree.gen" for routeTree.gen.ts.
function resolveSuffixedCodePath(root: string, path: string): string | null {
  const candidates = [
    `${path}.ts`,
    `${path}.tsx`,
    `${path}/index.ts`,
    `${path}/index.tsx`,
  ];
  for (const candidate of candidates) {
    if (isFile(posix.join(root, candidate))) return candidate;
  }
  return null;
}
```

2. In `checkLocalPath`, replace this block:

```ts
  if (isAssetPath(path)) {
    if (!isFile(posix.join(ctx.root, path))) {
      unresolved(ctx, raw, `${raw} does not resolve to a file.`);
    }
    return;
  }
```

with:

```ts
  if (isAssetPath(path)) {
    // An existing file with a non-code extension is an asset. Otherwise the last
    // segment is a dotted module name, such as "./routeTree.gen", and the code
    // suffixes are tried before the import is reported as unresolved.
    if (isFile(posix.join(ctx.root, path))) return;
    const target = resolveSuffixedCodePath(ctx.root, path);
    if (target === null) {
      unresolved(ctx, raw, `${raw} does not resolve to a file.`);
      return;
    }
    checkTarget(ctx, raw, target);
    return;
  }
```

Acceptance for R1 and R2: `bun test packages/kernel/test/closure.test.ts packages/kernel/test/closure-unparsable.test.ts` passes. When this was planned, the patched copy gave 34 pass in `closure.test.ts` (29 old + 5 new) and 35 pass over both files before the new tests were added; `bun fmt --check` and `bun lint` were clean on both changed files. Then run `bun test packages/kernel/test`: it must pass.

### R3 – GRACE for the kernel-closure fix (sanctioned edit of `.grace/verification/kernel-closure.xml`)

In `V-M-KERNEL-CLOSURE` only:

1. Directly after the second `<Scenario>` line (the one that starts `A file that cannot be read or does not parse`), add this line with the same indentation:

```xml
      <Scenario>A relative or alias import whose last segment has a non-code extension is an asset when that exact file exists; otherwise it resolves to the .ts, .tsx or index file of that name (./routeTree.gen to routeTree.gen.ts), which then follows the owner and dependency rules, and it is unresolved when neither exists.</Scenario>
```

2. In `<TraceAssertion>`, replace the text `and the report, determinism and hasClosureErrors tests.` with `the dotted-module-name tests (resolved to a .ts, .tsx or index file, unresolved when nothing exists, an existing asset wins, the dependency rule through a dotted name, and the alias form), and the report, determinism and hasClosureErrors tests.`

`.grace/graph/kernel-closure.xml` (`M-KERNEL-CLOSURE`) does not change.

### R4 – Docs externals in `telos.ts` (finish T085)

Run `bun scripts/telos.ts closure > /tmp/closure.json` (exit 1 is expected here) and collect the sorted, de-duplicated `detail` of every finding with `code` `closure.unknown-external` whose `loci[0]` is `telos:docs-site`. Check that each name is a key of `dependencies` or `devDependencies` in `apps/docs/package.json`. If one is not, stop and report it. When this was planned, the list was exactly these 17 names, all in the manifest:

```ts
    packages: [
      "@axe-core/playwright",
      "@playwright/test",
      "@tailwindcss/vite",
      "@tanstack/react-router",
      "@tanstack/react-start",
      "@vitejs/plugin-react",
      "class-variance-authority",
      "clsx",
      "effect",
      "lucide-react",
      "mermaid",
      "minisearch",
      "radix-ui",
      "react",
      "react-dom",
      "tailwind-merge",
      "vite",
    ],
```

In `telos.ts`, in `docsSite`, replace `packages: [],` with the list the closure check gave you (sorted by code unit, as above). Do not touch `repository`'s `packages: []`. Then run `bun scripts/telos.ts closure` again: it must exit 0, and its `findings` must contain no finding with `severity` `"error"` (only the six `closure.dynamic-import` warnings). If any error is left, stop and report it with its `code`, `file` and `detail`. Do not exclude files and do not add a relation that is not true.

Also check the descriptions in `telos.ts`. The contract asks for "a `purpose` sentence and a `description`" per Locus, where the description is one further sentence that states what the package does. Replace short placeholders such as `"The documentation site."` or `"The Telos repository."` with one real sentence each (for example, for `telos:docs-site`: `"A TanStack Start site that renders the foundation documents, the playground on the real kernel and the semantic report."`). Do not change ids, purposes, sources, packages, relations or containment.

### R5 – Gate wiring (T088)

1. Root `package.json` (sanctioned edit), in `scripts`:
   - add `"telos": "bun scripts/telos.ts",` and `"telos:check": "bun scripts/telos.ts check",` directly after the `"calculator:agent-demo"` line;
   - change `verify` to end with `&& bun run grace:lint && bun run telos:check` (append ` && bun run telos:check`; nothing else in the line changes).
2. `scripts/review-gate.ts`:
   - append `  { name: "telos:check", command: ["bun", "run", "telos:check"] },` as the last entry of `CHECK_STEPS`, after the `grace:lint` entry;
   - in the `START_CONTRACT: CHECK_STEPS` block, change `//   OUTPUTS: { ReadonlyArray<CheckStep> - check:bun, format:check, lint, typecheck, test, docs:build, test:e2e, grace:lint; the test step` to `//   OUTPUTS: { ReadonlyArray<CheckStep> - check:bun, format:check, lint, typecheck, test, docs:build, test:e2e, grace:lint, telos:check; the test step` (the rest of the line stays).
3. `scripts/review-gate.test.ts`: replace the whole test `"docs:build runs after test, test:e2e runs after docs:build, and grace:lint runs last"` with:

```ts
  test("docs:build runs after test, test:e2e runs after docs:build, grace:lint runs after test:e2e, and telos:check runs last", () => {
    const names = CHECK_STEPS.map((step) => step.name);
    const at = (name: string) => names.indexOf(name);
    expect(at("docs:build")).toBeGreaterThan(at("test"));
    expect(at("test:e2e")).toBeGreaterThan(at("docs:build"));
    expect(at("grace:lint")).toBeGreaterThan(at("test:e2e"));
    expect(at("telos:check")).toBeGreaterThan(at("grace:lint"));
    expect(names.at(-1)).toBe("telos:check");
  });
```

   Write this test change first and run `bun test scripts/review-gate.test.ts`: it must fail before steps 1 and 2 are done (`telos:check` is not in `CHECK_STEPS`), and pass after them, including the no-drift test `"verifyStepNames of the verify script equals the gate's step names, in order (no drift)"`.
4. Do not edit `.kittify/config.yaml`.

Then run `bun run telos check`. It must exit 0 with `"ok":true`.

### R6 – Register `M-REPOSITORY-MODEL` and `M-TELOS-COMMAND` (T089)

Write `.grace/graph/tooling.xml` exactly as (the two existing modules are unchanged; the two new ones are added after them):

```xml
<GraceGraphDocument graceVersion="4.0">
  <GD-TOOLING>
    <M-BUN-VERSION-GUARD>
      <Summary>Refuses to run the toolchain on a Bun older than engines.bun in package.json.</Summary>
      <Path>scripts/check-bun-version.ts</Path>
    </M-BUN-VERSION-GUARD>
    <M-REVIEW-GATE>
      <Summary>Runs the whole check suite for Spec Kitty's review gate and writes one JUnit report with a test case per check.</Summary>
      <Path>scripts/review-gate.ts</Path>
      <M-BUN-VERSION-GUARD />
    </M-REVIEW-GATE>
    <M-REPOSITORY-MODEL>
      <Summary>Describes the repository as a Telos model: one Locus per package, application and tooling area, with its purpose, source claims, external packages and dependency relations.</Summary>
      <Path>telos.ts</Path>
      <M-KERNEL-API />
      <M-CALC-INTERFACES />
    </M-REPOSITORY-MODEL>
    <M-TELOS-COMMAND>
      <Summary>Runs the bun run telos developer command over the repository model: list, inspect, verify, closure, impact, check and report, each printing one JSON document.</Summary>
      <Path>scripts/telos.ts</Path>
      <M-REPOSITORY-MODEL />
      <M-KERNEL-API />
      <M-KERNEL-CLOSURE />
    </M-TELOS-COMMAND>
  </GD-TOOLING>
</GraceGraphDocument>
```

In `.grace/verification/tooling.xml`:

1. In `V-M-REVIEW-GATE`, replace the Scenario `The gate runs the check steps in the order of the root verify script, and the no-drift test fails when the two lists differ, so a step cannot be added to one and not the other.` with `The gate runs the check steps in the order of the root verify script, ending with grace:lint and then telos:check, and the no-drift test fails when the two lists differ, so a step cannot be added to one and not the other.` Nothing else in `V-M-REVIEW-GATE` changes.
2. Directly after `</V-M-REVIEW-GATE>` and before `</VD-TOOLING>`, add:

```xml
    <V-M-REPOSITORY-MODEL>
      <TestFiles>
        <File>scripts/telos.test.ts</File>
      </TestFiles>
      <Command>bun test scripts/telos.test.ts</Command>
      <Scenario>The repository model lists telos:kernel and calculator:arithmetic, describes telos:kernel as declared knowledge, and passes check on the real repository with no error diagnostic, no failed or errored verification finding and no closure error.</Scenario>
      <TraceAssertion>telos.test.ts names the list test, the inspect telos:kernel test and the check-on-the-repository test.</TraceAssertion>
    </V-M-REPOSITORY-MODEL>
    <V-M-TELOS-COMMAND>
      <TestFiles>
        <File>scripts/telos.test.ts</File>
      </TestFiles>
      <Command>bun test scripts/telos.test.ts</Command>
      <Scenario>Each command prints one JSON document with its documented exit code: list, inspect (exit 2 with LocusNotFound for an unknown id), check (exit 1 for a fixture root with a malformed relation), closure (closure.unowned for an unclaimed fixture file), impact (calculator:arithmetic#add reaches calculator:cli), report (writes a version 1 SemanticReport) and the usage errors (exit 2).</Scenario>
      <Scenario>On the real repository, verify --static completes in under 2000 ms and closure in under 10000 ms (NFR-003).</Scenario>
      <TraceAssertion>telos.test.ts names one test per command, the usage error tests, the closure scope test and the two NFR-003 timing tests.</TraceAssertion>
    </V-M-TELOS-COMMAND>
```

In `.grace/graph/index.xml`, change only the `GD-TOOLING` block's `<Owns>` to:

```xml
      <Owns>
        <M-BUN-VERSION-GUARD />
        <M-REVIEW-GATE />
        <M-REPOSITORY-MODEL />
        <M-TELOS-COMMAND />
      </Owns>
```

In `.grace/verification/index.xml`, change only the `VD-TOOLING` block's `<Owns>` to:

```xml
      <Owns>
        <V-M-BUN-VERSION-GUARD />
        <V-M-REVIEW-GATE />
        <V-M-REPOSITORY-MODEL />
        <V-M-TELOS-COMMAND />
      </Owns>
```

Check the markup of the three new files against "GRACE file markup" below: every export of `telos.ts` and `scripts/telos.ts` has a MODULE_MAP line in file order and a contract block (types and interfaces need only the map line), and `scripts/telos.test.ts` uses `ROLE: TEST`, `MAP_MODE: LOCALS` with every local helper in its map. Run `bun run grace:lint`: it must report `Errors: 0`. If it reports errors in your files, fix them with those rules and name each one in your report.

### R7 – Closure rerun, timing and the fast checks

1. `bun run telos closure`: exit 0, no error finding.
2. `bun test scripts/telos.test.ts`: 0 fail, including `verify --static completes in under 2000 ms` and `closure completes in under 10000 ms`. At planning time the corrected closure check ran over the 276 files of lane-o in about 70 ms. The limits come from NFR-003; never raise them.
3. `bun run format` (it writes). At planning time `telos.ts` and `scripts/telos.ts` needed formatting.
4. `bun run typecheck`, `bun run lint` (exit 0; the existing `no-explicit-any` warning on `parseJson` in `scripts/telos.test.ts` is a warning, not an error), `bun run grace:lint`.

### R8 – The full gate, through the lock wrapper

Other agents may run e2e tests on the same fixed port, so run the full gate through the lock wrapper:

`bash /private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/48f2abba-47cc-4641-91d5-0369d350dc60/scratchpad/withlock.sh bun run verify`

It waits until no other agent holds the lock. Report each step exactly: `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `docs:build`, `test:e2e`, `grace:lint`, `telos:check`. If a step fails and the fix is outside your owned files and the sanctioned edits, stop and report it. If `docs:build` changes a tracked file (for example `apps/docs/src/routeTree.gen.ts`), report it and do not commit that change unless it is part of your work.

### R9 – Commit in the lane worktree

Commit only after R8 is green: the pre-commit hook runs `bun test` and `grace lint` on the whole working tree, so it fails while any part of R1 to R6 is missing. Stage paths explicitly. Never use `git add -A` or `git add .`, never `--no-verify`, and add no AI names or author, co-author or session lines. The shell is fish: pass the body with a second `-m`.

1. The kernel fix:
   `git add packages/kernel/src/closure.ts packages/kernel/test/closure.test.ts .grace/verification/kernel-closure.xml`
   `git commit -m "fix(kernel): resolve dotted module names in the closure check" -m "Sanctioned edit by WP15 (tasks.md Shared files): packages/kernel/src/closure.ts, packages/kernel/test/closure.test.ts and .grace/verification/kernel-closure.xml. A relative or alias path with a non-code extension is an asset only when that file exists; otherwise its .ts, .tsx and index files are tried, so ./routeTree.gen resolves to routeTree.gen.ts."`
2. The repository model and the telos command:
   `git add telos.ts scripts/telos.ts scripts/telos.test.ts .grace/graph/tooling.xml .grace/verification/tooling.xml .grace/graph/index.xml .grace/verification/index.xml`
   `git commit -m "feat(tooling): describe the repository with the kernel and add the telos command" -m "Sanctioned edits: own GD-TOOLING and VD-TOOLING blocks of the two GRACE index files."`
3. The gate wiring:
   `git add package.json scripts/review-gate.ts scripts/review-gate.test.ts`
   `git commit -m "build(gate): run telos:check at the end of verify and the review gate" -m "Sanctioned edit: root package.json (telos and telos:check scripts, verify ends with telos:check)."`
4. `git status --short` must now show nothing outside `kitty-specs/`. `git diff --stat HEAD~3 HEAD` (your three commits) must list only your owned files and the sanctioned edits named in this prompt. Do not compare against `feat/semantic-foundation-rebuild`: lane-o also contains the merged dependency lanes, so that diff is larger.

If the hook fails, fix the cause and commit again. Never bypass it.

### R10 – Clean the lane's planning files, then hand over to review

1. In the lane worktree, run `git restore --source feat/semantic-foundation-rebuild --staged --worktree -- kitty-specs/`. If `git status --short -- kitty-specs/` then shows changes, commit them: `git commit -m "chore(workspace): remove planning artifacts from lane branch"`. Finally `git diff --stat feat/semantic-foundation-rebuild -- kitty-specs/` must print nothing.
2. Mark T084 to T089 done: `spec-kitty agent tasks mark-status T084 --status done --mission semantic-foundation-rebuild-01M5JFR0`, and the same for T085, T086, T087, T088 and T089.
3. `spec-kitty agent tasks move-task WP15 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "Repository model, telos command and gate; dotted-module-name fix in the kernel closure check (sanctioned)"`.
4. If `mark-status` or `move-task` refuses, stop and report the exact message. Do not use `--force` or any skip flag.

Your final message is the reviewer's evidence. Report:

- the R1 failures before the fix (test names and counts);
- the docs externals list from R4 and the closure result after R4;
- the R5 review-gate test failure before the wiring and its pass after;
- each `verify` step from R8, and `grace lint`;
- the three commit hashes;
- the move-task result.

---

## Objective

Make the repository describe itself with the kernel, give developers and agents one command to read that description, and put it into the gate:

- root `telos.ts`: the repository as a Telos model (Loci with purpose, source claims, external packages and dependency relations);
- `scripts/telos.ts`: the `bun run telos <command>` developer command, including the closure check and the `SemanticReport` that the docs site reads (WP19);
- the gate: `telos:check` at the end of `verify` and as the last review-gate step.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/repository.md` (authoritative).

# Contract: repository self-description and gate (WP15)

The repository describes itself with the kernel (FR-022). One command reads that description (FR-023), and the gate enforces it (FR-024, spec D7).

## Root `telos.ts`

The root file imports only `@telos/kernel` and `@telos/calculator`. The root `package.json` has these as `workspace:*` dependencies since WP01, together with `@telos/cli` and `"effect": "4.0.4"` (owner decision of 2026-10-24: `scripts/telos.ts` runs kernel Effects, and Bun's isolated installs expose `effect` to root files only when the root declares it).

```ts
import { External, Locus, Purpose, Source, SourceDependsOn, buildModel } from "@telos/kernel"
import { app as calculatorApp } from "@telos/calculator"
const Module = Locus.extend(Purpose, Source, External)
export const kernel = Module.make({ id: "telos:kernel", ... })
// ... one const per Locus below
export const repository = Module.make({ id: "telos:repository", ..., contains: [kernel, cliPack, agentPack, webPack, calculator, tooling, docsSite, legacyLocus] })
export const repositoryModel = buildModel(repository)
```

| Id | `sources` | `packages` (External) | Relations (`SourceDependsOn.to(...)`) | Contains |
| --- | --- | --- | --- | --- |
| `telos:repository` | `telos.ts` | — (`[]`) | — | all below |
| `telos:kernel` | `packages/kernel/src/**/*.ts`, `packages/kernel/test/**/*.ts` | `effect` | — | — |
| `telos:cli-pack` | `packages/cli/src/**/*.ts`, `packages/cli/test/**/*.ts` | `effect` | kernel | — |
| `telos:agent-pack` | `packages/agent/src/**/*.ts`, `packages/agent/test/**/*.ts` | `effect` | kernel | — |
| `telos:web-pack` | `packages/web/src/**/*.ts`, `packages/web/test/**/*.ts` | `effect` | kernel | — |
| `telos:calculator` | `apps/calculator/src/**/*.ts`, `apps/calculator/bin/**/*.ts`, `apps/calculator/test/**/*.ts` | `effect` | kernel, cli-pack, agent-pack, web-pack | `calculatorApp` |
| `telos:tooling` | `scripts/**/*.ts` | `effect` | kernel | — |
| `telos:docs-site` | `apps/docs/*.ts`, `apps/docs/src/**/*.ts`, `apps/docs/src/**/*.tsx`, `apps/docs/scripts/**/*.ts`, `apps/docs/test/**/*.ts`, `apps/docs/test/**/*.tsx`, `apps/docs/e2e/**/*.ts` | the third-party packages the docs files import today (see below) | kernel, web-pack, calculator, legacy-locus | — |
| `telos:legacy-locus` | `packages/locus/src/**/*.ts`, `packages/locus/test/**/*.ts`, `packages/locus/specs/**/*.ts` | `effect` | — | — |

Notes:

- Each Locus has a `purpose` sentence and a `description`. The texts are written by the implementer and state what the package does.
- **Docs externals**: run the closure check once, take every `closure.unknown-external` reported for `telos:docs-site`, check that each package is listed in `apps/docs/package.json` (`dependencies` or `devDependencies`), and add them to `packages`, sorted. A package that is imported but not in the manifest is a real finding: stop and report it rather than listing it.
- **Later changes**:
  - `telos:docs-site` declares its relations to kernel, web-pack and calculator from the start, because WP18–WP20 add those imports to the docs app. A declared relation without an import is allowed; the closure check only rejects imports without a relation.
  - WP20 removes `telos:legacy-locus` and the relation to it.
  - Every WP that adds a cross-Locus import adds the matching relation in the same commit.

## Closure scope (constant `CLOSURE_SCOPE` in `scripts/telos.ts`)

```ts
export const CLOSURE_SCOPE = {
  include: [
    "telos.ts", "scripts/**/*.ts",
    "packages/*/src/**/*.ts", "packages/*/test/**/*.ts", "packages/*/specs/**/*.ts",
    "apps/calculator/src/**/*.ts", "apps/calculator/bin/**/*.ts", "apps/calculator/test/**/*.ts",
    "apps/docs/*.ts", "apps/docs/src/**/*.ts", "apps/docs/src/**/*.tsx", "apps/docs/scripts/**/*.ts",
    "apps/docs/test/**/*.ts", "apps/docs/test/**/*.tsx", "apps/docs/e2e/**/*.ts",
  ],
  exclude: ["**/node_modules/**", "**/*.d.ts", "apps/docs/src/generated/**", "apps/docs/test/fixtures/**"],
  aliases: [{ prefix: "@/", dir: "apps/docs/src/" }],
} as const
```

`packages` (workspace packages) are read at run time from `packages/*/package.json` and `apps/*/package.json`: `{ name, dir }` for each manifest.

## `scripts/telos.ts` — the developer command

`bun run telos <command> [args]`. Every command prints exactly one JSON document and a newline to stdout. Errors print `{"tag","message"}` JSON to stderr.

| Command | Output (stdout) | Exit code |
| --- | --- | --- |
| `list` | `{ "loci": string[] }` (model ids) | 0 |
| `inspect <id>` | the `LocusDescription` | 0; 2 with `LocusNotFound` |
| `verify [--static]` | the `VerificationReport` (`--static` = `methods: ["static"]`; runner `bun <Bun.version>`) | 0 when `failed + error === 0`, else 1 |
| `closure` | the `ClosureReport` | 0 when `!hasClosureErrors`, else 1 |
| `impact <target>` | the `ImpactReport` (target is a Locus id or `locus#capability`) | 0; 2 with `LocusNotFound` / `CapabilityNotFound` |
| `check` | `{ ok, diagnostics, verification: summary, failures: Finding[], closure: { errors, warnings, findings: ClosureFinding[] } }`. `failures` lists the failed or errored findings, and `closure.findings` lists the error findings. | 0 when `ok`, else 1 |
| `report --out <path>` | writes the `SemanticReport` (below) to `<path>` (directories created), prints `{ "written": <path> }` | 0, or 1 when `check` would fail |
| anything else | `{"tag":"UsageError","message":"Usage: telos list|inspect <id>|verify [--static]|closure|impact <target>|check|report --out <path>"}` on stderr | 2 |

`ok` is true when there are no error diagnostics, `summary.failed === 0 && summary.error === 0`, and there are no closure errors.

### Exports for tests

```ts
export interface TelosRunResult { readonly exitCode: number; readonly stdout: string; readonly stderr: string }
export const runTelos: (argv: ReadonlyArray<string>, options?: { readonly root?: LocusDefinition; readonly cwd?: string }) => Promise<TelosRunResult>
// root defaults to the repository Locus from "../telos"; cwd defaults to the repository root (resolved from import.meta.dir)
export const CLOSURE_SCOPE: { include; exclude; aliases }
export interface SemanticReport {
  readonly version: 1
  readonly provenance: { readonly runner: string; readonly generatedAt: string; readonly commit: string | null }  // commit from `git rev-parse HEAD`, null when unavailable
  readonly model: ModelDescription
  readonly verification: VerificationReport
  readonly verifications: Readonly<Record<string, ReadonlyArray<VerificationDescription>>>   // per Locus id, from describeVerifications
  readonly closure: { readonly limits: ReadonlyArray<string>; readonly scope: ClosureReport["scope"]; readonly fileCount: number; readonly findings: ReadonlyArray<ClosureFinding> }
  readonly ok: boolean
}
if (import.meta.main) { const r = await runTelos(process.argv.slice(2)); process.stdout.write(r.stdout); process.stderr.write(r.stderr); process.exitCode = r.exitCode }
```

### Tests (`scripts/telos.test.ts`)

- `runTelos(["list"])` includes `telos:kernel` and `calculator:arithmetic`.
- `inspect telos:kernel` has `knowledge: "declared"`.
- `inspect nope:nope` exits 2.
- `check` on the real repository exits 0 with `ok: true`.
- `check` with a fixture root (a Locus with a malformed relation) exits 1.
- `closure` with a fixture root and a temporary directory `cwd` containing an unowned file reports `closure.unowned`.
- `impact calculator:arithmetic#add` lists `calculator:cli`.
- `report --out <tmp>/r.json` writes a file whose `version` is 1 and whose `model.loci` contains `telos:repository`.
- An unknown command exits 2.
- Timing (NFR-003): `verify --static` on the repository completes in under 2000 ms and `closure` in under 10000 ms, measured with `performance.now()` around `runTelos`.

## Gate wiring

- Root `package.json` `scripts`:
  - `"telos": "bun scripts/telos.ts"`
  - `"telos:check": "bun scripts/telos.ts check"`
  - `verify` gains `&& bun run telos:check` at the **end**, after `grace:lint`.
- `scripts/review-gate.ts` `CHECK_STEPS` gains `{ name: "telos:check", command: ["bun", "run", "telos:check"] }` as the last entry. Its `START_CONTRACT: CHECK_STEPS` OUTPUTS text lists `telos:check`.
- The existing `scripts/review-gate.test.ts` already compares `CHECK_STEPS` with `verifyStepNames(verify)`. It must stay green, so update any expected list in it.
- `.kittify/config.yaml` `review.test_command` is **not** edited: it already runs the review gate, which now includes the new step. Editing that file is an owner decision.

The closure API you call (kernel, Bun only, import from `@telos/kernel/closure`):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## closure.ts (WP08) — `@telos/kernel/closure`, Bun only

```ts
export type ClosureCode = "closure.unowned" | "closure.ambiguous" | "closure.empty-claim" | "closure.undeclared-dependency" | "closure.unknown-external" | "closure.unresolved-import" | "closure.dynamic-import" | "closure.unparsable"
// eight codes; "closure.unparsable" was added by WP22 (kernel hardening)
export interface ClosureFinding {
  readonly code: ClosureCode
  readonly severity: "error" | "warning"     // warning for empty-claim and dynamic-import
  readonly file: string | null               // repository-relative path with "/" separators
  readonly loci: ReadonlyArray<string>
  readonly detail: string                    // the glob, import specifier or package name concerned; "parse" for closure.unparsable
  readonly message: string
  readonly knowledge: "derived" | "unknown"  // "unknown" for closure.dynamic-import (the dependency cannot be determined), "derived" for every other code
}
export interface ClosureOptions {
  readonly root: string                                  // absolute repository root
  readonly include: ReadonlyArray<string>                // globs of managed files, e.g. ["packages/*/src/**/*.ts", ...]
  readonly exclude?: ReadonlyArray<string>               // globs removed from the scope
  readonly packages?: ReadonlyArray<{ readonly name: string; readonly dir: string }>  // workspace packages (dir repository-relative)
  readonly aliases?: ReadonlyArray<{ readonly prefix: string; readonly dir: string }> // TS path aliases, e.g. { prefix: "@/", dir: "apps/docs/src/" }
}
export interface ClosureReport {
  readonly scope: { readonly include: ReadonlyArray<string>; readonly exclude: ReadonlyArray<string> }
  readonly files: ReadonlyArray<{ readonly file: string; readonly owner: string | null }>   // sorted by file
  readonly findings: ReadonlyArray<ClosureFinding>   // sorted by code, file ("" for null), detail
  readonly limits: ReadonlyArray<string>             // CLOSURE_LIMITS
  readonly knowledge: "derived"
}
export const CLOSURE_LIMITS: ReadonlyArray<string>  // the four limits of research R11, as sentences
export const checkClosure: (model: SemanticModel, options: ClosureOptions) => Effect.Effect<ClosureReport>
export function hasClosureErrors(report: ClosureReport): boolean
```

Algorithm:

1. Scope = the union of `new Bun.Glob(g).scan({ cwd: root, onlyFiles: true })` over `include`, minus files matching any `exclude` glob (`new Bun.Glob(x).match(file)`). The result is sorted.
2. Claims: for every model Locus with the `telos.source` extension, each glob in `properties.sources` claims the files it matches. A glob matching no file in scope → `closure.empty-claim`.
3. Owner of a file: the claiming Loci, reduced to those not an ancestor of another claimant. Exactly one → that Locus. More than one → `closure.ambiguous` (loci sorted). Zero → `closure.unowned`.
4. For each owned file, in file order, read its text and run `scanImports` (loader `tsx` for `.tsx`, else `ts`). If reading the file throws (for example it is not readable) or `scanImports` throws (the file does not parse), the check does not fail: it records one `closure.unparsable` finding (error, `file` = the file, `loci` = [owner], `detail` = `"parse"`, message `"<file> could not be parsed, so its imports were not checked."`, `knowledge` = `"derived"`), skips the imports of that file and continues with the next file. `checkClosure` never fails or dies because of a file's content or permissions. Otherwise resolve each specifier:
   - Relative (`./`, `../`) → try `<path>`, `<path>.ts`, `<path>.tsx`, `<path>/index.ts`, `<path>/index.tsx`, and `.js` → `.ts` replacement. Not found → `closure.unresolved-import`. Its owner B is checked with the dependency rule.
   - `node:*`, `bun`, `bun:*` → platform, always allowed.
   - A specifier starting with an alias `prefix` → replace the prefix with the alias `dir` and resolve it like a relative path from the repository root. Aliases apply only to files under the alias `dir`'s app (the first path segment pair, e.g. `apps/docs/`).
   - A name in `options.packages` (exact, or `name/<sub>`) → read `<root>/<dir>/package.json` and take `exports["."]` (bare name) or `exports["./<sub>"]`. Only string values are used. Resolve it to a repository-relative file. B = the owner of that file. A missing export or file → `closure.unresolved-import`. Then the dependency rule.
   - Before resolving, remove a query suffix (`?url`, `?raw`). A relative or alias path whose last segment then has an extension other than `.ts`, `.tsx` or `.js` (for example `.css`, `.json`, `.svg`, and also dotted module names such as `routeTree.gen` or `app.config`) is resolved in this order, which is the order Bun and Vite use (the exact file first, then the code suffixes):
     1. The file `<path>` exists → an **asset**: allowed, with no owner or dependency check.
     2. Otherwise the first existing file of `<path>.ts`, `<path>.tsx`, `<path>/index.ts`, `<path>/index.tsx` is a code target (for example `./routeTree.gen` → `routeTree.gen.ts`). It follows the unowned-target rule and the dependency rule below, like any other resolved file.
     3. Neither → `closure.unresolved-import` with the message `"<specifier> does not resolve to a file."`.

     A path with no extension, or ending with `.ts`, `.tsx` or `.js`, keeps the candidate list of the relative rule above. A workspace subpath that ends with `/package.json` is also an asset and is allowed. (Amended 2026-10-24 while implementing WP15: the first version treated every non-code extension as an asset, so `./routeTree.gen` was reported as unresolved although `routeTree.gen.ts` exists. See the tasks.md deviation "Dotted module names in the closure resolver".)
   - A resolved target file that has no owner (outside the scope or unowned) → `closure.unresolved-import` with the message `"<specifier> resolves to <file>, which no Locus owns."`.
   - Another bare specifier → package name = `@scope/name` or the first segment. Allowed if it is listed in `properties.packages` of an `telos.external` Locus that is the owner or an ancestor of the owner. Otherwise → `closure.unknown-external`.
   - Dependency rule: allowed when B === A, B is an ancestor or descendant of A, or a valid relation (any type) exists from A or any ancestor of A to B or to a capability of B. Otherwise → `closure.undeclared-dependency` (loci = [A, B]).
5. A file whose text matches `/\bimport\s*\(\s*(?!["'`])/` (a non-literal argument, e.g. `import(name)`) or `/\bimport\s*\(\s*`[^`]*\$\{/` (a template literal with an interpolation, e.g. ``import(`./m/${name}`)``) → one `closure.dynamic-import` finding for that file. A template literal without `${` is a literal: `scanImports` returns it, and it is resolved like a static import (checked with Bun 1.4.4-canary.1 while planning). This text scan runs on every file whose text was read, before `scanImports`, so a file that was read but does not parse can have both `closure.dynamic-import` and `closure.unparsable`. A file that could not be read has only `closure.unparsable`.

Other kernel functions you use (from `@telos/kernel`): `buildModel`, `hasErrors`, `verify` (`VerifyOptions { runner, methods?, loci?, now? }` → `Effect<VerificationReport>` with `summary { passed, failed, error }` and `findings`), `describeLocus(model, id)` and `describeModel(model)` (both `Effect`), `describeVerifications(model, id, report)`, `impact(model, target)` (plain function), `parseCapabilityKey`, `LocusNotFound`, `CapabilityNotFound`, and the types `ModelDescription`, `VerificationReport`, `VerificationDescription`, `LocusDefinition`.

Current state you change:

- Root `package.json` `verify` is `bun run check:bun && bun run format:check && bun run lint && bun run typecheck && bun run test && bun run docs:build && bun run test:e2e && bun run grace:lint`.
- `scripts/review-gate.ts` `CHECK_STEPS` has the eight steps of that script in order, and `scripts/review-gate.test.ts` compares `CHECK_STEPS` with `verifyStepNames(pkg.scripts.verify)` (the no-drift test, lines 208–235).
- WP01 already set the root `tsconfig.json` `include` to `["scripts", "telos.ts"]` and the root `dependencies` to `@telos/calculator`, `@telos/cli` and `@telos/kernel` (`workspace:*`) and `"effect": "4.0.4"`, so `scripts/telos.ts` can `import { Effect } from "effect"`. Do not add or change any dependency.

## Rules for this work package

Read these rules before you write anything. They are part of the acceptance criteria.

1. **Baseline first.** Before you change a file, run `bun run verify` in your worktree and note the result of each step. If the baseline is not green, stop and report it; do not fix unrelated failures.
2. **Only your files.** Edit only the files in `owned_files` (frontmatter) and the sanctioned edits listed below. If you need any other change, stop and report it. Never edit `kitty-specs/**`, `AGENTS.md`, `CLAUDE.md`, `.kittify/**` or the charter.
3. **Contracts are exact.** Names, signatures, messages, ids and sort orders are copied from the quoted contracts. If an Effect API in a contract does not exist or behaves differently, stop and report it. Do not invent a replacement.
4. **Tests first.** Write the tests of a subtask before its implementation, run them and see them fail, then implement.
5. **No new dependencies** and no global installs. Do not run `bun add`. `bun install` is allowed only where this prompt says so.
6. **No fake work.** No placeholder code, no `TODO`, no skipped tests, no test that asserts nothing, no hard-coded counts of things that grow.
7. **Shell.** The shell is fish. Use `echo '-----'` as a separator, and pass paths explicitly instead of shell globs with `--include=*.ts`.
8. **Report exactly.** In your final message, list every check you ran and its exact result. Never claim a check passed that you did not run.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Commands

| Purpose | Command |
| --- | --- |
| Full gate (run before handing a WP to review, and it must pass) | `bun run verify` |
| Fast loop while working | `bun run typecheck`, `bun test <paths>`, `bun run lint`, `bun run format` (writes), `bun run grace:lint` |
| One package's tests | `bun test packages/kernel/test` (example) |

`bun run verify` = `check:bun && format:check && lint && typecheck && test && docs:build && test:e2e && grace:lint`, plus `&& telos:check` from WP15 on. Report each step's result exactly. Never claim a step passed that you did not run.

## Code

- TypeScript, strict, using the repository `tsconfig.base.json`. Imports have **no** `.ts` extension. Use `import type` for types only.
- Format: run `bun run format` and follow its output. The repository uses double quotes, semicolons and trailing commas.
- Effect 4.0.4 APIs only, as quoted in the contracts. If an API in a contract does not exist, stop and report it. Do not invent a replacement.
- No new dependency, no upgrade, no global install (C-002). Workspace links already exist from WP01.
- No placeholder code, no `TODO` stubs, no tests that assert nothing, no skipped tests.
- No compatibility aliases for removed names (C-004).
- Comments and messages are in English (C-009). Diagnostic and error messages are exactly as written in the contracts.
- Determinism (NFR-002): sort with plain code-unit comparison (`a < b ? -1 : a > b ? 1 : 0`), never `localeCompare`. Never depend on object key insertion order from user input. Never use `Date.now()` or randomness in output except the `now` option of `verify`.

## Tests

- `bun:test` (`describe`, `test`, `expect`). Test files are `test/<module>.test.ts` next to the package's `src/`.
- Every diagnostic code, closure code and Archetype rule has at least one test where it is reported or fails, and one where it is not reported or passes (NFR-005). The test name names the code or rule id.
- Never hard-code counts of documents, files, Loci or findings that change as the repository grows. Assert membership, or compare with a value computed from the same source.
- No network and no credentials (NFR-007). Subprocess tests use `Bun.spawn(["bun", <absolute path>], ...)` with a 20 s test timeout.
- Fixtures are built in the test file or in `test/fixture.ts`. Never import another package's `test/` files.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## Git

- Spec Kitty creates your worktree and branch. Commit only inside it.
- Commit messages follow Conventional Commits 1.0.0: `feat(kernel): build the semantic model`, `docs(foundation): ...`, `test(cli): ...`.
- No AI names, and no author, co-author or session lines. The `.githooks/commit-msg` hook enforces this. Never use `--no-verify`.
- Never edit files that another WP owns (see each WP's "Owned files"). If a needed change falls outside your files, stop and report it.

**Sanctioned edits outside `owned_files`** (name each one in your commit body):

- Root `package.json` (owned by WP01): add the `telos` and `telos:check` scripts and append `&& bun run telos:check` to `verify`.
- `packages/kernel/src/closure.ts` (owned by WP08): the dotted-module-name fix, exactly as in Resume R2.
- `packages/kernel/test/closure.test.ts` (owned by WP08): the five tests of Resume R1.
- `.grace/verification/kernel-closure.xml` (owned by WP08): one Scenario and the TraceAssertion change of Resume R3.
- Your own `GD-TOOLING` / `VD-TOOLING` blocks of `.grace/graph/index.xml` and `.grace/verification/index.xml`.

## GRACE synchronisation (part of this WP)

Every source and test file you create carries GRACE markup, and your modules are registered in **your own** area documents in the same commit as the code. `bun run grace:lint` (`grace lint --path . --assertions current`) must pass.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

## GRACE file markup

Every new `src/*.ts`, `bin/*.ts` and `scripts/*.ts` file starts with this header. Copy the shape from `scripts/review-gate.ts`:

```ts
// START_MODULE_CONTRACT
//   PURPOSE: <one sentence>
//   SCOPE: <what the file contains and what it never does>
//   DEPENDS: <module ids, comma-separated, or none>
//   LINKS: <M-ID>, <V-M-ID>
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   <exportName> - <short description>      (one line per export, every export, in file order)
// END_MODULE_MAP
```

Each exported function, constant or class has a contract block right above it:

```ts
// START_CONTRACT: <exportName>
//   PURPOSE: ...
//   INPUTS: { name: type - meaning, ... }
//   OUTPUTS: { type - meaning }
//   SIDE_EFFECTS: none | <what>
//   LINKS: <M-ID>
// END_CONTRACT: <exportName>
```

Exported types and interfaces need only the MODULE_MAP line. Test files use `ROLE: TEST` and `MAP_MODE: LOCALS`, and list their local helpers in the map. A test file with no local helpers has exactly one map line `(none) - no local helpers`, with the parentheses. Never write `none - no local helpers`: `grace lint` reads the leading identifier of each map line as a symbol name, so a bare `none` counts as a helper that does not exist and fails with `markup.module-map-mismatch`. `(none)` does not start with an identifier, so it keeps the map non-empty (no `markup.module-map-missing`) without naming a symbol. Optional named regions use `// START_BLOCK_<NAME>` / `// END_BLOCK_<NAME>`. The guides quote these regions (contracts/docs.md).

## GRACE graph and verification layout (created by WP01)

WP01 replaces `graph/main.xml` and `verification/main.xml` with one document per area:

- It moves the existing modules unchanged into `tooling`, `legacy` and `docs`.
- It creates the other documents empty with `<Owns />`.
- It rewrites both index files to list every document.

A WP edits **only** its own area documents and its own `<GD-…>` / `<VD-…>` block in `graph/index.xml` and `verification/index.xml`.

| Area | Graph doc / id | Verification doc / id | Owner WP | Modules (graph id → paths) |
| --- | --- | --- | --- | --- |
| tooling | `graph/tooling.xml` `GD-TOOLING` | `verification/tooling.xml` `VD-TOOLING` | WP01 (move), WP15, WP20 | `M-BUN-VERSION-GUARD`, `M-REVIEW-GATE` (moved); WP15: `M-REPOSITORY-MODEL` → `telos.ts`, `M-TELOS-COMMAND` → `scripts/telos.ts` |
| legacy | `graph/legacy.xml` `GD-LEGACY` | `verification/legacy.xml` `VD-LEGACY` | WP01 (move), WP20 (delete) | the six `M-LOCUS-*` modules (moved) |
| docs | `graph/docs.xml` `GD-DOCS` | `verification/docs.xml` `VD-DOCS` | WP01 (move), WP18, WP19, WP20 | `M-DOCS-CONTENT`, `M-DOCS-SPEC-REPORT`, `M-DOCS-SITE`, `M-DOCS-PLAYGROUND` (moved); WP18: rewrite `M-DOCS-PLAYGROUND`; WP19: `M-DOCS-SPEC-REPORT` → `M-DOCS-SEMANTIC-REPORT`, add `M-DOCS-INSPECTOR`; WP20: add `M-DOCS-CALCULATOR` |
| kernel-base | `graph/kernel-base.xml` `GD-KERNEL-BASE` | `verification/kernel-base.xml` `VD-KERNEL-BASE` | WP02 | `M-KERNEL-IDENTITY` → identity.ts, freeze.ts; `M-KERNEL-CANONICAL` → canonical.ts, digest.ts; `M-KERNEL-DIAGNOSTIC` → diagnostic.ts, cycles.ts |
| kernel-definitions | `GD-KERNEL-DEFINITIONS` | `VD-KERNEL-DEFINITIONS` | WP03 | `M-KERNEL-DEFINITIONS` → relation.ts, capability.ts, extension.ts, archetype.ts, locus.ts, extensions/purpose.ts, extensions/source.ts |
| kernel-model | `GD-KERNEL-MODEL` | `VD-KERNEL-MODEL` | WP04 (WP22: adds a path and test files) | `M-KERNEL-MODEL` → model.ts; WP22 adds readonly-map.ts |
| kernel-verify | `GD-KERNEL-VERIFY` | `VD-KERNEL-VERIFY` | WP05 | `M-KERNEL-VERIFY` → verify.ts |
| kernel-describe | `GD-KERNEL-DESCRIBE` | `VD-KERNEL-DESCRIBE` | WP06 | `M-KERNEL-DESCRIBE` → describe.ts, fields.ts; `M-KERNEL-INVOKE` → invoke.ts |
| kernel-decode | `GD-KERNEL-DECODE` | `VD-KERNEL-DECODE` | WP07 | `M-KERNEL-DECODE` → decode.ts |
| kernel-closure | `GD-KERNEL-CLOSURE` | `VD-KERNEL-CLOSURE` | WP08 (WP22: adds a test file) | `M-KERNEL-CLOSURE` → closure.ts |
| kernel-api | `GD-KERNEL-API` | `VD-KERNEL-API` | WP09 | `M-KERNEL-INTROSPECTION` → introspection.ts; `M-KERNEL-IMPACT` → impact.ts; `M-KERNEL-API` → index.ts |
| pack-cli | `GD-PACK-CLI` | `VD-PACK-CLI` | WP10 | `M-PACK-CLI` → all `packages/cli/src/*.ts` |
| pack-agent | `GD-PACK-AGENT` | `VD-PACK-AGENT` | WP11 | `M-PACK-AGENT` → semantics, archetype, tools, introspection-tools, index; `M-PACK-AGENT-MCP` → mcp.ts, client.ts |
| pack-web | `GD-PACK-WEB` | `VD-PACK-WEB` | WP12 | `M-PACK-WEB` → all `packages/web/src/*.ts` |
| calculator-core | `GD-CALCULATOR-CORE` | `VD-CALCULATOR-CORE` | WP13 | `M-CALC-ARITHMETIC` → errors.ts, arithmetic.ts, archetypes.ts (index.ts until WP14 takes it) |
| calculator-interfaces | `GD-CALCULATOR-INTERFACES` | `VD-CALCULATOR-INTERFACES` | WP14 | `M-CALC-INTERFACES` → interfaces.ts, app.ts, index.ts, bin/cli.ts, bin/mcp.ts, bin/agent-demo.ts |

The file name of a graph or verification document is the area name, e.g. `graph/kernel-model.xml`. Kernel paths are under `packages/kernel/src/`, and calculator paths under `apps/calculator/`.

### Graph entry

Each module lists its dependency modules as empty child elements, as in the existing documents:

```xml
<M-KERNEL-MODEL>
  <Summary>Builds a checked semantic model from a root Locus and reports structural diagnostics.</Summary>
  <Path>packages/kernel/src/model.ts</Path>
  <M-KERNEL-DEFINITIONS />
  <M-KERNEL-DIAGNOSTIC />
</M-KERNEL-MODEL>
```

### Verification entry

```xml
<V-M-KERNEL-MODEL>
  <TestFiles>
    <File>packages/kernel/test/model.test.ts</File>
  </TestFiles>
  <Command>bun test packages/kernel/test/model.test.ts</Command>
  <Scenario>One sentence per tested behaviour.</Scenario>
  <TraceAssertion>Names the tests that prove the scenarios.</TraceAssertion>
</V-M-KERNEL-MODEL>
```

Register a module **only together with** its verification entry, and only once the listed test files exist. Otherwise `grace lint` reports `missing-module-coverage` or `invalid-test-file` (research R8). Add the ids to your `<Owns>` blocks in both index files.

### How to edit the area documents (exact shapes)

WP01 created your area documents empty. Replace the empty element with the filled one. Example for the area `kernel-base` (use your own area name and ids):

```xml
<GraceGraphDocument graceVersion="4.0">
  <GD-KERNEL-BASE>
    <M-KERNEL-IDENTITY>
      <Summary>One sentence.</Summary>
      <Path>packages/kernel/src/identity.ts</Path>
      <Path>packages/kernel/src/freeze.ts</Path>
    </M-KERNEL-IDENTITY>
  </GD-KERNEL-BASE>
</GraceGraphDocument>
```

```xml
<GraceVerificationDocument graceVersion="4.0">
  <VD-KERNEL-BASE>
    <V-M-KERNEL-IDENTITY>
      <TestFiles>
        <File>packages/kernel/test/identity.test.ts</File>
      </TestFiles>
      <Command>bun test packages/kernel/test/identity.test.ts</Command>
      <Scenario>One sentence per tested behaviour.</Scenario>
      <TraceAssertion>Names the tests that prove the scenarios.</TraceAssertion>
    </V-M-KERNEL-IDENTITY>
  </VD-KERNEL-BASE>
</GraceVerificationDocument>
```

In `.grace/graph/index.xml` change only your block, from `<Owns />` to:

```xml
    <GD-KERNEL-BASE>
      <Path>graph/kernel-base.xml</Path>
      <Owns>
        <M-KERNEL-IDENTITY />
      </Owns>
    </GD-KERNEL-BASE>
```

and in `.grace/verification/index.xml` the same with `<VD-…>` and `<V-M-… />`. Editing your own `GD-`/`VD-` block of the two index files is a sanctioned edit for every WP.

Lint rules that were confirmed while planning (they fail the gate when ignored):

- `START_MODULE_MAP` lists **every** export of the file, one line each (types and interfaces too), in file order.
- Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`, and a **non-empty** map: list the local helpers, or exactly one line `(none) - no local helpers` (with the parentheses; a bare `none` fails `grace lint` with `markup.module-map-mismatch`).
- Every `<File>` in a verification entry must exist. Register a module only together with its verification entry, after the test files exist.
- A module's dependency modules are empty child elements (`<M-KERNEL-DIAGNOSTIC />`) and must be registered ids.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP15 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T084 – Failing tests

Create `scripts/telos.test.ts` (GRACE test markup) with every test of the contract's Tests list. Use `mkdtempSync(join(tmpdir(), "telos-cmd-"))` for temporary directories and remove them in `afterEach`. The fixture root for `check` is `Locus.make({ id: "fix:root", contains: [Locus.extend(Source).make({ id: "fix:a", properties: { sources: ["a/**/*.ts"] }, relations: [SourceDependsOn.to("fix:missing")] })] })` (a relation to a missing Locus is an error diagnostic). The closure fixture writes `scripts/a/x.ts` (claimed) and `scripts/b/y.ts` (unclaimed) into the temporary directory and runs `runTelos(["closure"], { root, cwd: dir })` with a root whose Source Locus claims `scripts/a/**/*.ts`; assert a `closure.unowned` finding for `scripts/b/y.ts` and exit code 1. (The files must be under `scripts/`, because `closure` always uses `CLOSURE_SCOPE`, and `a/x.ts` or `b/y.ts` would be outside it. Corrected 2026-10-24.) Timing tests measure `performance.now()` around `runTelos` on the real repository. Each test that runs on the real repository gets a 30 s timeout.

Run them and see them fail.

### T085 – Root `telos.ts`

Write `telos.ts` exactly by the contract table and code shape. Purposes (use these exact texts; descriptions are one further sentence you write):

| Id | `purpose` |
| --- | --- |
| `telos:repository` | `Holds the Telos framework, its packs, the calculator proof and the documentation site.` |
| `telos:kernel` | `Builds, checks, describes, verifies and invokes semantic models.` |
| `telos:cli-pack` | `Derives command-line interfaces from capabilities exposed by CLI Loci.` |
| `telos:agent-pack` | `Derives agent tools and an MCP server from capabilities exposed by agent Loci.` |
| `telos:web-pack` | `Derives web form models from capabilities exposed by web Loci.` |
| `telos:calculator` | `Proves that one arithmetic implementation serves a command line, a web page and agent tools.` |
| `telos:tooling` | `Runs the repository checks, the review gate and the telos command.` |
| `telos:docs-site` | `Builds the documentation site from the foundation documents and the semantic report.` |
| `telos:legacy-locus` | `Keeps the previous Locus package until the documentation no longer uses it.` |

`telos:tooling` declares `packages: ["effect"]` (as in the contract table), because `scripts/telos.ts` runs kernel Effects. `telos:calculator` contains the imported `app` Locus (`calculator:app`), so the calculator Loci are part of the repository model.

**Docs externals procedure** (contract): first write `telos:docs-site` with `packages: []`, run `bun scripts/telos.ts closure`, collect the `detail` of every `closure.unknown-external` finding whose `loci[0]` is `telos:docs-site`, check each against `apps/docs/package.json` (`dependencies` or `devDependencies`), and write the sorted list into `packages`. A planning scan found these third-party packages in the docs files today, all in the manifest: `@axe-core/playwright, @playwright/test, @tailwindcss/vite, @tanstack/react-router, @tanstack/react-start, @vitejs/plugin-react, class-variance-authority, clsx, effect, lucide-react, mermaid, minisearch, radix-ui, react, react-dom, tailwind-merge, vite`. Use the list the closure check gives you; if it names a package that is not in the manifest, stop and report it.

### T086 – `scripts/telos.ts` commands

Implement `runTelos`, `CLOSURE_SCOPE` and the command table exactly. Details:

- Parse `argv[0]` as the command. Every successful command writes `JSON.stringify(value) + "\n"` to stdout. Errors write `JSON.stringify({ tag, message }) + "\n"` to stderr.
- `inspect <id>`: unknown id → `{"tag":"LocusNotFound","message":"No Locus <id> in the model."}`, exit 2.
- `impact <target>`: a target with `#` is parsed with `parseCapabilityKey`; unknown Locus → `LocusNotFound` as above; unknown capability → `{"tag":"CapabilityNotFound","message":"Locus <locus> has no capability <name>."}`; exit 2.
- `verify`: runner is `` `bun ${Bun.version}` ``.
- `closure`: `checkClosure(model, { root: cwd, include, exclude, aliases, packages })`, where `packages` are read from `cwd` with `new Bun.Glob("{packages,apps}/*/package.json").scanSync({ cwd })`: `{ name: manifest.name, dir: <the manifest's directory> }`, sorted by name.
- `check`: build the model, run `verify` (all methods) and `closure`; `ok` by the contract; exit 0 when `ok`, else 1.
- Missing arguments (`inspect` without id, `impact` without target, `report` without `--out <path>`) and unknown commands print the `UsageError` line and exit 2.
- `if (import.meta.main)` block exactly as the contract.

### T087 – `report` and `SemanticReport`

`report --out <path>`: compute everything `check` computes, then write the `SemanticReport` (`version: 1`; `provenance.runner` as `verify`; `generatedAt = new Date().toISOString()`; `commit` from `Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd })`, trimmed, or `null` when the exit code is not 0; `model = describeModel(model)`; `verification` = the full report; `verifications` = `describeVerifications(model, id, report)` for every id in `model.ids`; `closure = { limits, scope, fileCount: report.files.length, findings: report.findings }`; `ok`). Create parent directories with `mkdirSync(dirname(path), { recursive: true })`. Print `{"written":"<path>"}` and exit 0, or 1 when `ok` is false (the file is still written).

### T088 – Gate wiring

Sanctioned edit of the root `package.json`: add `"telos": "bun scripts/telos.ts"` and `"telos:check": "bun scripts/telos.ts check"`, and append ` && bun run telos:check` to the end of `verify`. In `scripts/review-gate.ts` append `{ name: "telos:check", command: ["bun", "run", "telos:check"] }` as the last `CHECK_STEPS` entry and add `telos:check` to the end of the step list in its `START_CONTRACT: CHECK_STEPS` OUTPUTS text. Update any hard-coded expected step list in `scripts/review-gate.test.ts` so the no-drift test stays green. Do not edit `.kittify/config.yaml`.

Then run `bun run telos check` on the repository. If it reports closure errors, fix them with declarations in `telos.ts` (claims, externals or relations that are true), never by adding files to `exclude`. If a finding shows a real architecture problem (for example a Pack importing another Pack), stop and report it.

### T089 – GRACE

Area `tooling` (you own `.grace/graph/tooling.xml` and `.grace/verification/tooling.xml` now): add `M-REPOSITORY-MODEL` (path `telos.ts`; children `<M-KERNEL-API />`, `<M-CALC-INTERFACES />`) with `V-M-REPOSITORY-MODEL` (`scripts/telos.test.ts`, `bun test scripts/telos.test.ts`), and `M-TELOS-COMMAND` (path `scripts/telos.ts`; children `<M-REPOSITORY-MODEL />`, `<M-KERNEL-API />`, `<M-KERNEL-CLOSURE />`) with `V-M-TELOS-COMMAND` (same test file). Update the `V-M-REVIEW-GATE` scenario text to mention the `telos:check` step. Add the new ids to the `GD-TOOLING` / `VD-TOOLING` `<Owns>` blocks. Run `bun run grace:lint`.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP15 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- Closure findings on the real repository must be fixed by true declarations, not by excluding files.
- `verify` now ends with `telos:check`; the review-gate no-drift test must stay green.
- Timing tests depend on machine speed; the limits come from NFR-003 and must not be raised.

## Reviewer guidance

- `bun run telos check` exits 0 and `bun run verify` runs it last.
- `telos.ts` matches the contract table (ids, claims, relations, containment).
- The docs externals list came from the closure check, not from guessing.
