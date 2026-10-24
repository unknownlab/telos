---
work_package_id: WP01
title: Workspace scaffolds and GRACE area layout
dependencies: []
requirement_refs:
- C-002
- FR-030
- NFR-006
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T001
- T002
- T003
- T004
- T005
phase: Phase 1 – Foundations
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/kernel/package.json
create_intent:
- scripts/manifest.test.ts
- packages/kernel/package.json
- packages/kernel/tsconfig.json
- packages/kernel/test/tsconfig.json
- packages/cli/package.json
- packages/cli/tsconfig.json
- packages/cli/test/tsconfig.json
- packages/agent/package.json
- packages/agent/tsconfig.json
- packages/agent/test/tsconfig.json
- packages/web/package.json
- packages/web/tsconfig.json
- packages/web/test/tsconfig.json
- apps/calculator/package.json
- apps/calculator/tsconfig.json
- apps/calculator/test/tsconfig.json
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- package.json
- tsconfig.json
- bun.lock
- apps/docs/package.json
- apps/docs/test/manifest.test.ts
- scripts/manifest.test.ts
- packages/kernel/package.json
- packages/kernel/tsconfig.json
- packages/kernel/test/tsconfig.json
- packages/cli/package.json
- packages/cli/tsconfig.json
- packages/cli/test/tsconfig.json
- packages/agent/package.json
- packages/agent/tsconfig.json
- packages/agent/test/tsconfig.json
- packages/web/package.json
- packages/web/tsconfig.json
- packages/web/test/tsconfig.json
- apps/calculator/package.json
- apps/calculator/tsconfig.json
- apps/calculator/test/tsconfig.json
- .grace/graph/index.xml
- .grace/verification/index.xml
- .grace/graph/main.xml
- .grace/verification/main.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP01 – Workspace scaffolds and GRACE area layout

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

## Objective

Create the five new workspaces (`@telos/kernel`, `@telos/cli`, `@telos/agent`, `@telos/web`, `@telos/calculator`) as empty, type-checked projects; link them in the root and docs manifests and in `bun.lock`; add a manifest test; and split the GRACE graph and verification documents into one document per area. After this WP no later WP needs to edit `tsconfig.json`, `bun.lock` or another WP's GRACE document.

Nothing in this WP adds behaviour. No source file except the five `src/index.ts` files with `export {};` is created.

## Context

- Plan: `kitty-specs/semantic-foundation-rebuild-01M5JFR0/plan.md`, sections "Sequencing and parallelism" and "Project Structure".
- Research R8 (GRACE layout), R9 (workspace linking: Bun installs workspaces in isolated mode, so the **root** manifest must depend on the workspace packages that root files import), R10 (an empty TypeScript project fails with TS18003, so each project gets `src/index.ts`), R12 (no dependency is added or upgraded).
- Child `tsconfig.json` files need `"composite": true` and `"noEmit": false` for `bun check -b` with project references (verified while planning).

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

- Create `packages/{kernel,cli,agent,web}/src/index.ts` and `apps/calculator/src/index.ts` with the single line `export {};` (owned later by WP09, WP10, WP11, WP12 and WP14).
- Create the 16 area documents `.grace/graph/<area>.xml` and `.grace/verification/<area>.xml` with the split script (each is owned later by its area WP; see the conventions table).

These created files are deliberately **not** in `owned_files` (listing them would collapse the later WPs' lanes into this one). Commit all of them yourself, in your worktree, before you run `move-task`: the move-task auto-commit refuses uncommitted files outside `owned_files` (`OWNED_DELIVERABLE_SCOPE_REFUSED`). Run `git status --short` before `move-task` and check that it prints nothing.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP01 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T001 – Write the five package scaffolds

Create these files with exactly this content. The fastest safe way is the generator script below: save it **outside** the repository (for example `$TMPDIR/wp01/setup.py`), then run it from the worktree root with `python3 -I $TMPDIR/wp01/setup.py`. It writes the package files (T001) and edits the root and docs manifests and the root `tsconfig.json` (T002). Never commit the script.

```python
import json,os
def w(p,c):
    os.makedirs(os.path.dirname(p) or '.',exist_ok=True); open(p,'w').write(c)
def pkg(dir,name,exports,deps):
    w(f'{dir}/package.json', json.dumps({"name":name,"version":"0.1.0","private":True,"type":"module","exports":exports,"dependencies":deps},indent=2)+"\n")
pkg('packages/kernel','@telos/kernel',{".":"./src/index.ts","./closure":"./src/closure.ts","./package.json":"./package.json"},{"effect":"4.0.4"})
for n,ex in [('cli',{".":"./src/index.ts","./bun":"./src/bun.ts","./package.json":"./package.json"}),('agent',{".":"./src/index.ts","./mcp":"./src/mcp.ts","./client":"./src/client.ts","./package.json":"./package.json"}),('web',{".":"./src/index.ts","./package.json":"./package.json"})]:
    pkg('packages/'+n,'@telos/'+n,ex,{"@telos/kernel":"workspace:*","effect":"4.0.4"})
pkg('apps/calculator','@telos/calculator',{".":"./src/index.ts","./package.json":"./package.json"},{"@telos/agent":"workspace:*","@telos/cli":"workspace:*","@telos/kernel":"workspace:*","@telos/web":"workspace:*","effect":"4.0.4"})
for d in ['packages/kernel','packages/cli','packages/agent','packages/web']:
    w(f'{d}/tsconfig.json', json.dumps({"extends":"../../tsconfig.base.json","compilerOptions":{"lib":["ESNext","DOM"],"composite":True,"noEmit":False},"include":["src"]},indent=2)+"\n")
    w(f'{d}/test/tsconfig.json', json.dumps({"extends":"../../../tsconfig.base.json","compilerOptions":{"lib":["ESNext","DOM"],"composite":True,"noEmit":False},"include":[".","../src"]},indent=2)+"\n")
    w(f'{d}/src/index.ts','export {};\n')
d='apps/calculator'
w(f'{d}/tsconfig.json', json.dumps({"extends":"../../tsconfig.base.json","compilerOptions":{"lib":["ESNext","DOM"],"composite":True,"noEmit":False},"include":["src","bin"]},indent=2)+"\n")
w(f'{d}/test/tsconfig.json', json.dumps({"extends":"../../../tsconfig.base.json","compilerOptions":{"lib":["ESNext","DOM"],"composite":True,"noEmit":False},"include":[".","../src","../bin"]},indent=2)+"\n")
w(f'{d}/src/index.ts','export {};\n')
r=json.load(open('package.json')); r['dependencies']={"@telos/calculator":"workspace:*","@telos/cli":"workspace:*","@telos/kernel":"workspace:*","effect":"4.0.4"}
# keep key order: put dependencies before devDependencies
order=['name','private','type','workspaces','engines','packageManager','scripts','dependencies','devDependencies']
r={k:r[k] for k in order}
w('package.json',json.dumps(r,indent=2)+"\n")
dp=json.load(open('apps/docs/package.json')); deps=dp['dependencies']; deps.update({"@telos/calculator":"workspace:*","@telos/kernel":"workspace:*","@telos/web":"workspace:*"}); dp['dependencies']=dict(sorted(deps.items()))
w('apps/docs/package.json',json.dumps(dp,indent=2)+"\n")
t=json.load(open('tsconfig.json')); t['include']=["scripts","telos.ts"]
t['references']=[{"path":p} for p in ["packages/locus","packages/locus/test","packages/kernel","packages/kernel/test","packages/cli","packages/cli/test","packages/agent","packages/agent/test","packages/web","packages/web/test","apps/calculator","apps/calculator/test","apps/docs"]]
w('tsconfig.json',json.dumps(t,indent=2)+"\n")
```

Expected results (check them after the script ran):

`packages/kernel/package.json`:

```json
{
  "name": "@telos/kernel",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./closure": "./src/closure.ts",
    "./package.json": "./package.json"
  },
  "dependencies": {
    "effect": "4.0.4"
  }
}
```

`packages/kernel/tsconfig.json` (the cli, agent and web ones are identical):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": [
      "ESNext",
      "DOM"
    ],
    "composite": true,
    "noEmit": false
  },
  "include": [
    "src"
  ]
}
```

`packages/kernel/test/tsconfig.json` (cli, agent and web identical):

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "lib": [
      "ESNext",
      "DOM"
    ],
    "composite": true,
    "noEmit": false
  },
  "include": [
    ".",
    "../src"
  ]
}
```

`apps/calculator/package.json`:

```json
{
  "name": "@telos/calculator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./package.json": "./package.json"
  },
  "dependencies": {
    "@telos/agent": "workspace:*",
    "@telos/cli": "workspace:*",
    "@telos/kernel": "workspace:*",
    "@telos/web": "workspace:*",
    "effect": "4.0.4"
  }
}
```

`apps/calculator/tsconfig.json` includes `["src", "bin"]`, and `apps/calculator/test/tsconfig.json` includes `[".", "../src", "../bin"]`; otherwise they equal the kernel ones. Each of the five `src/index.ts` files contains exactly `export {};` and a newline.

**Acceptance**: the 20 package files and 5 index files exist with this content.

### T002 – Root and docs manifests, root tsconfig, docs manifest test, bun install

The script of T001 already:

- added to the root `package.json`, between `scripts` and `devDependencies`: `"dependencies": { "@telos/calculator": "workspace:*", "@telos/cli": "workspace:*", "@telos/kernel": "workspace:*", "effect": "4.0.4" }` (the root `telos.ts` of WP15 and `scripts/telos.ts` import these; `scripts/telos.ts` runs kernel Effects, and Bun's isolated installs expose `effect` to root files only when the root declares it. The owner approved this root `effect` dependency on 2026-10-24; the version is the one already pinned in `bun.lock`);
- set the root `tsconfig.json` `include` to `["scripts", "telos.ts"]` and its `references` to `packages/locus`, `packages/locus/test`, `packages/kernel`, `packages/kernel/test`, `packages/cli`, `packages/cli/test`, `packages/agent`, `packages/agent/test`, `packages/web`, `packages/web/test`, `apps/calculator`, `apps/calculator/test`, `apps/docs` (in this order);
- added `"@telos/calculator": "workspace:*"`, `"@telos/kernel": "workspace:*"` and `"@telos/web": "workspace:*"` to `apps/docs/package.json` `dependencies`, keeping the keys sorted.

Now do by hand:

1. In `apps/docs/test/manifest.test.ts`, add the same three entries to `approvedDependencies`, in sorted key position (after `"@tanstack/react-start"`, around the existing `"@telos/locus": "workspace:*"`):
   ```ts
   "@telos/calculator": "workspace:*",
   "@telos/kernel": "workspace:*",
   "@telos/locus": "workspace:*",
   "@telos/web": "workspace:*",
   ```
2. Run `bun run format` (it normalises the JSON the script wrote).
3. Run `bun install`. Then run `git diff bun.lock` and check that the only changes are workspace entries for the five new packages, the new `workspace:*` dependencies and the root `"effect": "4.0.4"` dependency entry. `effect` must stay at the version already in the lockfile (4.0.4). If any third-party package version is added or changed, stop and report it (C-002).
4. Check the links: `ls node_modules/@telos` lists `calculator`, `cli` and `kernel` (root dependencies), and `ls node_modules/effect/package.json` exists (root `effect` dependency).

**Acceptance**: `bun run typecheck` passes with the new references; `bun test apps/docs/test/manifest.test.ts` passes; `bun.lock` diff contains workspace entries and the root `effect` 4.0.4 entry only (no third-party version added or changed); `bun -e 'import("effect").then(() => console.log("ok"))'` run from the repository root prints `ok`.

### T003 – `scripts/manifest.test.ts`

Create this file exactly (it was run while planning):

```ts
// START_MODULE_CONTRACT
//   PURPOSE: Prove that every workspace package manifest pins its dependencies exactly, trusts no install script and exposes only its declared entry points (charter 051).
//   SCOPE: Reads the package.json of each workspace package and of the repository root. Out: the packages' code, which their own tests cover.
//   DEPENDS: none
//   LINKS: none
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ROOT - the repository root directory
//   PACKAGES - the expected name, directory, exports and dependencies of each new workspace package
//   readManifest - reads one package.json as JSON
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const PACKAGES: ReadonlyArray<{
  readonly name: string;
  readonly dir: string;
  readonly exports: Readonly<Record<string, string>>;
  readonly dependencies: Readonly<Record<string, string>>;
}> = [
  {
    name: "@telos/kernel",
    dir: "packages/kernel",
    exports: {
      ".": "./src/index.ts",
      "./closure": "./src/closure.ts",
      "./package.json": "./package.json",
    },
    dependencies: { effect: "4.0.4" },
  },
  {
    name: "@telos/cli",
    dir: "packages/cli",
    exports: {
      ".": "./src/index.ts",
      "./bun": "./src/bun.ts",
      "./package.json": "./package.json",
    },
    dependencies: { "@telos/kernel": "workspace:*", effect: "4.0.4" },
  },
  {
    name: "@telos/agent",
    dir: "packages/agent",
    exports: {
      ".": "./src/index.ts",
      "./mcp": "./src/mcp.ts",
      "./client": "./src/client.ts",
      "./package.json": "./package.json",
    },
    dependencies: { "@telos/kernel": "workspace:*", effect: "4.0.4" },
  },
  {
    name: "@telos/web",
    dir: "packages/web",
    exports: { ".": "./src/index.ts", "./package.json": "./package.json" },
    dependencies: { "@telos/kernel": "workspace:*", effect: "4.0.4" },
  },
  {
    name: "@telos/calculator",
    dir: "apps/calculator",
    exports: { ".": "./src/index.ts", "./package.json": "./package.json" },
    dependencies: {
      "@telos/agent": "workspace:*",
      "@telos/cli": "workspace:*",
      "@telos/kernel": "workspace:*",
      "@telos/web": "workspace:*",
      effect: "4.0.4",
    },
  },
];

// START_CONTRACT: readManifest
//   PURPOSE: Read one package.json of the repository as JSON.
//   INPUTS: { path: string - the path relative to the repository root }
//   OUTPUTS: { Promise<Record<string, unknown>> - the parsed manifest }
//   SIDE_EFFECTS: reads one file
//   LINKS: none
// END_CONTRACT: readManifest
async function readManifest(path: string): Promise<Record<string, unknown>> {
  return (await Bun.file(join(ROOT, path)).json()) as Record<string, unknown>;
}

describe("workspace package manifests", () => {
  for (const expected of PACKAGES) {
    test(`${expected.name} has exactly the expected fields, exports and dependencies`, async () => {
      const pkg = await readManifest(`${expected.dir}/package.json`);
      expect(Object.keys(pkg).sort()).toEqual([
        "dependencies",
        "exports",
        "name",
        "private",
        "type",
        "version",
      ]);
      expect(pkg.name).toBe(expected.name);
      expect(pkg.private).toBe(true);
      expect(pkg.type).toBe("module");
      expect(pkg.exports).toEqual(expected.exports);
      expect(pkg.dependencies).toEqual(expected.dependencies);
    });
  }

  test("every dependency is an exact pin or a workspace link, and no manifest trusts install scripts", async () => {
    const root = await readManifest("package.json");
    expect("trustedDependencies" in root).toBe(false);
    for (const expected of PACKAGES) {
      const pkg = await readManifest(`${expected.dir}/package.json`);
      expect("trustedDependencies" in pkg).toBe(false);
      for (const version of Object.values(
        pkg.dependencies as Record<string, string>,
      )) {
        expect(version).toMatch(/^(\d+\.\d+\.\d+|workspace:\*)$/);
      }
    }
  });
});
```

**Acceptance**: `bun test scripts/manifest.test.ts` passes (6 tests).

### T004 – Split the GRACE documents per area

Save this script **outside** the repository (for example `$TMPDIR/wp01/split.py`) and run it once from anywhere with the worktree root as argument: `python3 -I $TMPDIR/wp01/split.py <absolute worktree path>`. It moves the 12 existing modules unchanged into `tooling`, `legacy` and `docs`, creates the 13 other area documents empty, rewrites both index files, and deletes `graph/main.xml` and `verification/main.xml`. Its final `assert` checks that all 12 modules were moved.

```python
import re,sys,os
root=sys.argv[1]; g=root+'/.grace/graph/'; v=root+'/.grace/verification/'
gm=open(g+'main.xml').read(); vm=open(v+'main.xml').read()
def blocks(text, prefix):
    out={}
    for m in re.finditer(r'(    <(%s[A-Z0-9-]+)>.*?\n    </\2>\n)'%prefix, text, re.S):
        out[m.group(2)]=m.group(1)
    return out
gb=blocks(gm,'M-'); vb=blocks(vm,'V-M-')
areas=[('tooling',['M-BUN-VERSION-GUARD','M-REVIEW-GATE']),('legacy',['M-LOCUS-MODEL','M-LOCUS-VALIDATION','M-LOCUS-REVISION','M-LOCUS-HISTORY','M-LOCUS-DECODE','M-LOCUS-SPECS']),('docs',['M-DOCS-CONTENT','M-DOCS-SPEC-REPORT','M-DOCS-SITE','M-DOCS-PLAYGROUND'])]
for a in ['kernel-base','kernel-definitions','kernel-model','kernel-verify','kernel-describe','kernel-decode','kernel-closure','kernel-api','pack-cli','pack-agent','pack-web','calculator-core','calculator-interfaces']: areas.append((a,[]))
gi=['<GraceGraphIndex graceVersion="4.0">','  <GraphDocuments>']; vi=['<GraceVerificationIndex graceVersion="4.0">','  <VerificationDocuments>']
for a,mods in areas:
    A=a.upper()
    if mods:
        open(g+a+'.xml','w').write('<GraceGraphDocument graceVersion="4.0">\n  <GD-%s>\n%s  </GD-%s>\n</GraceGraphDocument>\n'%(A,''.join(gb[m] for m in mods),A))
        open(v+a+'.xml','w').write('<GraceVerificationDocument graceVersion="4.0">\n  <VD-%s>\n%s  </VD-%s>\n</GraceVerificationDocument>\n'%(A,''.join(vb['V-'+m] for m in mods),A))
        gi+=['    <GD-%s>'%A,'      <Path>graph/%s.xml</Path>'%a,'      <Owns>']+['        <%s />'%m for m in mods]+['      </Owns>','    </GD-%s>'%A]
        vi+=['    <VD-%s>'%A,'      <Path>verification/%s.xml</Path>'%a,'      <Owns>']+['        <V-%s />'%m for m in mods]+['      </Owns>','    </VD-%s>'%A]
    else:
        open(g+a+'.xml','w').write('<GraceGraphDocument graceVersion="4.0">\n  <GD-%s />\n</GraceGraphDocument>\n'%A)
        open(v+a+'.xml','w').write('<GraceVerificationDocument graceVersion="4.0">\n  <VD-%s />\n</GraceVerificationDocument>\n'%A)
        gi+=['    <GD-%s>'%A,'      <Path>graph/%s.xml</Path>'%a,'      <Owns />','    </GD-%s>'%A]
        vi+=['    <VD-%s>'%A,'      <Path>verification/%s.xml</Path>'%a,'      <Owns />','    </VD-%s>'%A]
gi+=['  </GraphDocuments>','</GraceGraphIndex>','']; vi+=['  </VerificationDocuments>','</GraceVerificationIndex>','']
open(g+'index.xml','w').write('\n'.join(gi)); open(v+'index.xml','w').write('\n'.join(vi))
os.remove(g+'main.xml'); os.remove(v+'main.xml')
assert sum(len(m) for _,m in areas)==12 and len(gb)==12 and len(vb)==12
```

The area table it implements:

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/conventions.md` (authoritative).

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
| kernel-model | `GD-KERNEL-MODEL` | `VD-KERNEL-MODEL` | WP04 | `M-KERNEL-MODEL` → model.ts |
| kernel-verify | `GD-KERNEL-VERIFY` | `VD-KERNEL-VERIFY` | WP05 | `M-KERNEL-VERIFY` → verify.ts |
| kernel-describe | `GD-KERNEL-DESCRIBE` | `VD-KERNEL-DESCRIBE` | WP06 | `M-KERNEL-DESCRIBE` → describe.ts, fields.ts; `M-KERNEL-INVOKE` → invoke.ts |
| kernel-decode | `GD-KERNEL-DECODE` | `VD-KERNEL-DECODE` | WP07 | `M-KERNEL-DECODE` → decode.ts |
| kernel-closure | `GD-KERNEL-CLOSURE` | `VD-KERNEL-CLOSURE` | WP08 | `M-KERNEL-CLOSURE` → closure.ts |
| kernel-api | `GD-KERNEL-API` | `VD-KERNEL-API` | WP09 | `M-KERNEL-INTROSPECTION` → introspection.ts; `M-KERNEL-IMPACT` → impact.ts; `M-KERNEL-API` → index.ts |
| pack-cli | `GD-PACK-CLI` | `VD-PACK-CLI` | WP10 | `M-PACK-CLI` → all `packages/cli/src/*.ts` |
| pack-agent | `GD-PACK-AGENT` | `VD-PACK-AGENT` | WP11 | `M-PACK-AGENT` → semantics, archetype, tools, introspection-tools, index; `M-PACK-AGENT-MCP` → mcp.ts, client.ts |
| pack-web | `GD-PACK-WEB` | `VD-PACK-WEB` | WP12 | `M-PACK-WEB` → all `packages/web/src/*.ts` |
| calculator-core | `GD-CALCULATOR-CORE` | `VD-CALCULATOR-CORE` | WP13 | `M-CALC-ARITHMETIC` → errors.ts, arithmetic.ts, archetypes.ts (index.ts until WP14 takes it) |
| calculator-interfaces | `GD-CALCULATOR-INTERFACES` | `VD-CALCULATOR-INTERFACES` | WP14 | `M-CALC-INTERFACES` → interfaces.ts, app.ts, index.ts, bin/cli.ts, bin/mcp.ts, bin/agent-demo.ts |

The file name of a graph or verification document is the area name, e.g. `graph/kernel-model.xml`. Kernel paths are under `packages/kernel/src/`, and calculator paths under `apps/calculator/`.

Then:

1. `ls .grace/graph .grace/verification` shows `index.xml` plus 16 area files each, and no `main.xml`.
2. `bun run grace:lint` passes.
3. `git diff --stat .grace` shows only these files.

**Acceptance**: `grace lint --path . --assertions current` passes; the 12 module blocks are byte-identical to their old text (compare with `git show HEAD:.grace/graph/main.xml`).

### T005 – Verify

Run `bun run verify` and record the exact result of every step. Commit with a message such as `build(workspace): scaffold kernel, packs and calculator workspaces and split GRACE areas`. In the commit body name the sanctioned creations (the five `src/index.ts` files and the 16 area documents).

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP01 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- `bun install` rewriting third-party pins: check the lock diff, stop if anything other than workspace entries changes.
- `bun fmt` may reflow the generated JSON: run `bun run format` before `format:check`.
- A project without input files fails with TS18003: every project has `src/index.ts`.

## Reviewer guidance

- Compare each package manifest with T001 and `scripts/manifest.test.ts`.
- `git diff main -- bun.lock` must contain only workspace entries.
- `.grace/graph/*.xml`: 16 area files, the moved module blocks unchanged, `index.xml` lists all 16 `GD-` blocks.
