---
work_package_id: WP19
title: Documentation semantic report, inspector and verification page
dependencies:
- WP15
- WP18
requirement_refs:
- FR-012
- FR-025
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T110
- T111
- T112
- T113
- T114
- T115
- T116
- T117
- T118
- T119
phase: Phase 7 – Documentation site
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/
create_intent:
- apps/docs/scripts/semantic-report.ts
- apps/docs/src/lib/locus-slug.ts
- apps/docs/src/components/locus-view.tsx
- apps/docs/src/components/knowledge-badge.tsx
- apps/docs/src/components/semantic-report-view.tsx
- apps/docs/src/components/inspector-tree.tsx
- apps/docs/test/semantic-report-fixture.ts
- apps/docs/src/routes/inspector/index.tsx
- apps/docs/src/routes/inspector/$slug.tsx
- apps/docs/test/semantic-report.test.ts
- apps/docs/test/inspector.test.tsx
- apps/docs/e2e/inspector.e2e.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/scripts/semantic-report.ts
- apps/docs/scripts/spec-report.ts
- apps/docs/scripts/check-verification.ts
- apps/docs/scripts/content.ts
- apps/docs/src/lib/build-data.ts
- apps/docs/src/lib/build.ts
- apps/docs/src/lib/generated.ts
- apps/docs/src/lib/provenance.ts
- apps/docs/src/lib/content-types.ts
- apps/docs/src/lib/prerender.ts
- apps/docs/src/lib/locus-slug.ts
- apps/docs/vite.config.ts
- apps/docs/src/components/locus-view.tsx
- apps/docs/src/components/knowledge-badge.tsx
- apps/docs/src/components/semantic-report-view.tsx
- apps/docs/src/components/spec-report-table.tsx
- apps/docs/src/components/inspector-tree.tsx
- apps/docs/src/components/result-panel.tsx
- apps/docs/src/components/provenance-label.tsx
- apps/docs/src/components/site-nav.tsx
- apps/docs/test/components.test.tsx
- apps/docs/test/semantic-report-fixture.ts
- apps/docs/src/components/verification-view.tsx
- apps/docs/src/routes/inspector/index.tsx
- apps/docs/src/routes/inspector/$slug.tsx
- apps/docs/src/routes/verification.tsx
- apps/docs/test/semantic-report.test.ts
- apps/docs/test/inspector.test.tsx
- apps/docs/test/verification.test.tsx
- apps/docs/test/spec-report.test.ts
- apps/docs/test/provenance.test.ts
- apps/docs/e2e/inspector.e2e.ts
- apps/docs/e2e/navigation.e2e.ts
- apps/docs/e2e/a11y.e2e.ts
- apps/docs/e2e/provenance.e2e.ts
- apps/docs/e2e/machine-files.e2e.ts
- .gitignore
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP19 – Documentation semantic report, inspector and verification page

## Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile named in the frontmatter, and behave according to its guidance before you read the rest of this prompt.

- **Profile**: `frontend-freddy`
- **Role**: `implementer`
- **Agent/tool**: `claude` (model `claude-haiku-5-5`)

If the profile cannot be loaded, run `spec-kitty agent profile list` and pick the closest implementer profile.

---

## Important: Review Feedback

Check `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` and the review feedback of this WP before you start. If the WP was rejected before, address every point of the feedback first.

---

## Objective

Replace the old build-time specification report (`@telos/locus/specs`, `scripts/spec-report.ts`, `spec-report.json`) with the **semantic report** that `bun run telos report` writes (WP15). Show it on the site: a new `/inspector` page (the Locus tree of the real repository model), one prerendered `/inspector/<slug>` page per Locus, and a rewritten `/verification` page (Archetype findings and Semantic Closure). Serve the report as `/semantic-report.json` (FR-025).

State when you start:

- WP15 is merged. `bun run telos report --out <path>` exists in the root `scripts/telos.ts`. It writes a `SemanticReport` and exits 0, or 1 when the repository check fails (the file is still written).
- WP18 is merged. The playground is one `/playground` page that imports neither `src/lib/build*.ts` nor `src/lib/provenance.ts`. The routes `/playground/a` … `/playground/e` are gone.
- `apps/docs/package.json` depends on `@telos/kernel`, `@telos/web` and `@telos/calculator` (WP01). It still depends on `@telos/locus`; WP20 removes that dependency. After this WP, **no file under `apps/docs/src`, `apps/docs/scripts` or `apps/docs/e2e` imports `@telos/locus`**. Only `apps/docs/test/guides.test.ts` and `apps/docs/test/guide-examples.test.ts` may still import it, because WP20 rewrites them.

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

## Site pipeline (WP19)

| Change | Detail |
| --- | --- |
| `apps/docs/scripts/semantic-report.ts` (new; replaces `spec-report.ts`) | Writes `src/generated/build-info.json` (`{ commit, dirty }`, same shape and git logic as the old script) first. Then it spawns `bun <repo>/scripts/telos.ts report --out <docs>/src/generated/semantic-report.json` (a subprocess, not an import) and copies the file to `public/semantic-report.json`. It exits 1 when the spawn fails. |
| `apps/docs/package.json` scripts | `"semantic-report": "bun scripts/semantic-report.ts"`, `"build": "bun run content && bun run semantic-report && bun run build:site"`. Remove `spec-report`. |
| `.gitignore` | Add `apps/docs/public/semantic-report.json`. |
| `src/lib/generated.ts` | Inline `../generated/semantic-report.json` (`semanticReportJson`) instead of `spec-report.json`. |
| `src/lib/build-data.ts` | Replace the SpecReport types and `readSpecReportFile` with `readSemanticReport(value: unknown): SemanticReport \| null`. It checks `version === 1` and the presence and type of `provenance`, `model.loci`, `verification.findings`, `verifications`, `closure.findings` and `ok`. It throws `"semantic-report.json: <field> is invalid"`. The `SemanticReport` type is imported as a type from `scripts/telos.ts`'s contract, copied as a local interface (the docs app does not import root scripts). |
| `scripts/check-verification.ts` | `RESULT_MARKER = 'data-result="semantic-report"'`. Messages say "semantic report". |
| `src/lib/content-types.ts` | WP18 removes `"/playground/a"`…`"/playground/e"` from `APP_ROUTES`. WP19 adds `"inspector"` to `NavSectionId`, inserts it into `NAV_SECTIONS` after `examples`, and adds `"/inspector"` to `APP_ROUTES`. WP20 then adds `"calculator"` after `playground` and adds `"/calculator"`. The final order is introduction, philosophy, principles, terminology, architecture, first-locus, examples, inspector, playground, calculator, verification, roadmap, decisions, agent-reference. |
| `src/lib/prerender.ts` | WP18 removes `"/playground/a"`…`"/playground/e"` from `APP_PAGES`. WP19 adds `"/inspector"` to `APP_PAGES` and a new export `inspectorPages(report: { readonly model: { readonly loci: ReadonlyArray<{ readonly id: string }> } }): string[]` that returns `"/inspector/" + locusSlug(id)` for every Locus, in report order. WP20 adds `"/calculator"`. The module comment names the WPs that edit the list. |
| `vite.config.ts` (WP19) | Next to `readContent()`, add `readSemanticReport()`, which reads `./src/generated/semantic-report.json` the same way and throws `"apps/docs/src/generated/semantic-report.json is missing or unreadable; run \`bun run semantic-report\` first"`. `pages` becomes `prerenderPaths(readContent(), [...APP_PAGES, ...inspectorPages(readSemanticReport())])`. |
| `scripts/content.ts` `llmsText` | One fixed bullet per app page, like the existing playground and verification branches. WP18, Playground: "Type a Locus definition as JSON; the real @telos/kernel decodes, builds and verifies it in your browser." WP19, Inspector: "The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json." WP19, Verification: "The Archetype verification and Semantic Closure report from the build-time run, with its provenance." WP20, Calculator: "The calculator web interface: forms derived from the capability contracts of calculator:arithmetic." Each WP updates the same text in `test/content.test.ts`, `e2e/machine-files.e2e.ts` (`APP_PAGE_LINES`) and the page's own intro. |

### Locus slugs (`src/lib/locus-slug.ts`, WP19)

```ts
export const locusSlug = (id: string): string => id.replace(":", "--")   // "telos:kernel" -> "telos--kernel"
export const locusIdOf = (slug: string): string => slug.replace("--", ":")
```

These are safe because Locus ids never contain `--` (identity grammar).

### Pages (WP19)

- `/inspector`: the Locus tree (containment, indented), each Locus linking to its page. Each row shows the extension ids, the capability count and the verification counts. The page shows the model digest and the provenance (runner, generated time, commit).
- `/inspector/<slug>` shows, in this order:
  - id and description
  - extensions
  - properties as JSON
  - outgoing relations and incoming relations, with type and knowledge badges
  - capabilities: name, effect, input/output JSON Schema, declared error tags, `contractDigest`, `exposedBy`, implemented
  - Archetypes with rules
  - verifications: outcome, method and knowledge badge (`verified` / `failed` / `not-run`)
  - diagnostics

  An unknown slug renders the not-found component.
- `/verification`: provenance, the summary counts, a table of findings (Locus, Archetype, rule, method, outcome, message), the closure limits, and the closure findings, each with a knowledge badge (`derived` or `unknown`) (empty state text "No closure findings."). The root element carries `data-result="semantic-report"`.
- Components:
  - new: `src/components/locus-view.tsx`, `src/components/knowledge-badge.tsx`, `src/components/semantic-report-view.tsx`
  - delete: `spec-report-table.tsx`, and `verification-view.tsx` or rewrite it as the new view

### Tests (WP19)

- `test/semantic-report.test.ts`: `readSemanticReport` accepts a valid fixture and rejects each missing field.
- `test/inspector.test.tsx`: renders a `LocusView` from a fixture description. It asserts the capability schema and the knowledge badges.
- `test/verification.test.tsx`: rewritten for the semantic report.
- e2e:
  - `navigation.e2e.ts` uses the new nav order, and the Verification page shows at least one finding row (no hard-coded count).
  - `inspector.e2e.ts` (new): `/inspector` lists `telos:kernel`, `/inspector/calculator--arithmetic` shows the `add` capability and `exposedBy` `calculator:cli`.
  - `a11y.e2e.ts` covers `/inspector`.
- Delete `scripts/spec-report.ts`, `test/spec-report.test.ts`, and the spec-report parts of `test/provenance.test.ts` and `e2e/provenance.e2e.ts`.

### The `SemanticReport` shape (contracts/repository.md, written by `scripts/telos.ts report`)

```ts
export interface SemanticReport {
  readonly version: 1
  readonly provenance: { readonly runner: string; readonly generatedAt: string; readonly commit: string | null }  // runner "bun <Bun.version>"; commit from `git rev-parse HEAD`, null when unavailable
  readonly model: ModelDescription
  readonly verification: VerificationReport
  readonly verifications: Readonly<Record<string, ReadonlyArray<VerificationDescription>>>   // per Locus id
  readonly closure: { readonly limits: ReadonlyArray<string>; readonly scope: ClosureReport["scope"]; readonly fileCount: number; readonly findings: ReadonlyArray<ClosureFinding> }
  readonly ok: boolean
}
```

Kernel types it uses (all exported as types from `@telos/kernel`, except the closure types):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## verify.ts (WP05)

```ts
export type Outcome = "passed" | "failed" | "error"
export interface Finding {
  readonly archetype: string
  readonly rule: string
  readonly locus: string
  readonly method: RuleMethod
  readonly outcome: Outcome
  readonly message: string | null   // RuleViolation.message for failed; String(defect) for error; null for passed
}
export interface Provenance {
  readonly runner: string           // e.g. "bun 1.4.4-canary.1" or "browser"; given by the caller
  readonly startedAt: string        // ISO 8601
  readonly finishedAt: string       // ISO 8601
}
export interface VerificationReport {
  readonly provenance: Provenance
  readonly findings: ReadonlyArray<Finding>      // sorted by locus, archetype, rule
  readonly summary: { readonly passed: number; readonly failed: number; readonly error: number }
}
export interface VerifyOptions {
  readonly runner: string
  readonly methods?: ReadonlyArray<RuleMethod>   // default ["static", "execution"]
  readonly loci?: ReadonlyArray<string>          // default all model ids
  readonly now?: () => Date                      // default () => new Date()
}
export function applicableArchetypes(model: SemanticModel, locusId: string): ReadonlyArray<Archetype>
// all archetypes in model.archetypes whose appliesTo ids are all in the Locus kind's extension ids; sorted by id; [] for unknown id
export const verify: (model: SemanticModel, options: VerifyOptions) => Effect.Effect<VerificationReport>
```

Each `(locus, archetype, rule)` with a selected method runs sequentially. The rule check runs with `Effect.exit`:

- success → `passed`
- `Fail(RuleViolation)` → `failed`
- any other cause, including a defect or a thrown exception wrapped by `Effect.suspend`/`Effect.try` → `error`

A rule never stops other rules.

## describe.ts (WP06)

```ts
export type Knowledge = "declared" | "derived" | "verified" | "failed" | "not-run" | "observed" | "invalidated" | "unknown"
// "observed" and "invalidated" are reserved: no function in this mission returns them (directive §5)
export interface JsonSchemaDocument { readonly dialect: string; readonly schema: unknown; readonly definitions: Readonly<Record<string, unknown>> }
export interface RelationDescription {
  readonly type: string
  readonly typeDescription: string
  readonly from: string
  readonly target: RelationTarget
  readonly grantsInvocation: boolean
  readonly knowledge: "declared" | "derived"   // "declared" in outgoing lists, "derived" in incoming lists
}
export interface CapabilityDescription {
  readonly ref: string                          // capabilityKey(locus, name)
  readonly locus: string
  readonly name: string
  readonly description: string
  readonly effect: EffectClass
  readonly input: JsonSchemaDocument
  readonly output: JsonSchemaDocument
  readonly errors: ReadonlyArray<{ readonly tag: string; readonly schema: JsonSchemaDocument }>  // sorted by tag
  readonly implemented: boolean
  readonly contractDigest: Digest               // digestOf({ input, output, errors, effect })
  readonly exposedBy: ReadonlyArray<{ readonly locus: string; readonly relationType: string }> // valid granting relations to it; sorted
  readonly knowledge: "declared"
}
export interface VerificationDescription {
  readonly archetype: string
  readonly rule: string
  readonly description: string
  readonly method: RuleMethod
  readonly outcome: Outcome | "not-run"
  readonly message: string | null
  readonly knowledge: "verified" | "failed" | "not-run"
  readonly provenance: Provenance | null
}
export interface LocusDescription {
  readonly id: string
  readonly description: string | null
  readonly container: string | null
  readonly contains: ReadonlyArray<string>
  readonly extensions: ReadonlyArray<{ readonly id: string; readonly description: string }>
  readonly properties: unknown                  // encoded with Schema.encodeUnknownSync(Schema.Struct(kind.properties)); raw value when issues exist
  readonly relations: { readonly outgoing: ReadonlyArray<RelationDescription>; readonly incoming: ReadonlyArray<RelationDescription> }
  readonly capabilities: ReadonlyArray<CapabilityDescription>   // sorted by name
  readonly archetypes: ReadonlyArray<{ readonly id: string; readonly description: string; readonly rules: ReadonlyArray<{ readonly id: string; readonly description: string; readonly method: RuleMethod }> }>
  readonly diagnostics: ReadonlyArray<Diagnostic>              // model diagnostics whose subject is this id
  readonly digest: Digest                                      // digestOf(the description without digest and knowledge)
  readonly knowledge: "declared"
}
export interface ModelDescription {
  readonly root: string
  readonly loci: ReadonlyArray<LocusDescription>   // in model.ids order
  readonly diagnostics: ReadonlyArray<Diagnostic>
  readonly digest: Digest                          // digestOf(loci.map(l => l.digest))
}
export const toJsonSchema: (schema: Schema.Top) => JsonSchemaDocument  // Schema.toJsonSchemaDocument
export const describeCapability: (model: SemanticModel, locus: string, name: string) => Effect.Effect<CapabilityDescription>
export const describeLocus: (model: SemanticModel, id: string) => Effect.Effect<LocusDescription>   // dies for an unknown id; callers check first
export const describeModel: (model: SemanticModel) => Effect.Effect<ModelDescription>
export function describeVerifications(model: SemanticModel, id: string, report: VerificationReport | null): ReadonlyArray<VerificationDescription>
// one entry per rule of applicableArchetypes(model, id), sorted by archetype then rule;
// with a matching finding: outcome = finding.outcome, knowledge = "verified" when passed else "failed", provenance = report.provenance;
// otherwise outcome "not-run", knowledge "not-run", message null, provenance null
```

The closure finding type lives in `@telos/kernel/closure`, which is Bun-only. **Do not import it in the docs app.** Copy it as a local interface in `build-data.ts` (exact shape below).

```ts
export interface ClosureFinding {
  readonly code: string            // "closure.unowned", "closure.undeclared-dependency", ...
  readonly severity: "error" | "warning"
  readonly file: string | null
  readonly loci: ReadonlyArray<string>
  readonly detail: string
  readonly message: string
  readonly knowledge: "derived" | "unknown"   // "unknown" for closure.dynamic-import
}
```

### Files today (read them before you change them)

| File | Today | After this WP |
| --- | --- | --- |
| `apps/docs/scripts/spec-report.ts` | runs `@telos/locus/specs`, writes `build-info.json` and `spec-report.json`; has `readGit(root)` in `START_BLOCK_READ_GIT` | **deleted**; `readGit` moves unchanged into `semantic-report.ts` |
| `apps/docs/scripts/check-verification.ts` | `RESULT_MARKER = 'data-result="spec-report"'` | marker `'data-result="semantic-report"'`, messages say "semantic report" |
| `apps/docs/src/lib/build-data.ts` | `SpecReportFile`, `readSpecReportFile`, `BuildInfo`, `readBuildInfo` and private helpers `invalid`, `isPlain`, `objectAt`, `stringAt`, `booleanAt`, `numberAt` | keep `BuildInfo`, `readBuildInfo` and the helpers you still use; remove everything spec-report; add `SemanticReport`, `ClosureFinding`, `readSemanticReport` |
| `apps/docs/src/lib/generated.ts` | globs `content.json`, `spec-report.json`, `build-info.json`; exports `content`, `specReportJson`, `buildInfoJson` | `spec-report.json` → `semantic-report.json`; `specReportJson` → `semanticReportJson` |
| `apps/docs/src/lib/build.ts` | `specReportFile` (needs the `@telos/locus/specs` catalogue), `SITE_COMMIT` | `semanticReport`, `BUILD_PROVENANCE` (below); `SITE_COMMIT` removed |
| `apps/docs/src/lib/provenance.ts` | five origins (`browser`, `bun-build`, `ci`, `historical`, none), `PACKAGE_VERSIONS` from `@telos/locus/package.json` | rewritten (below): one origin, `bun-build` |
| `apps/docs/src/components/provenance-label.tsx`, `result-panel.tsx` | icons for five origins; `ResultKind` has seven old kinds | icons for `bun-build` and `none`; `ResultKind = "semantic-report"`; no historical styling |
| `apps/docs/src/components/verification-view.tsx`, `spec-report-table.tsx` | the old page | **deleted**; replaced by `semantic-report-view.tsx` |
| `apps/docs/src/routes/verification.tsx` | imports `@telos/locus/specs` | renders `SemanticReportView` |
| `apps/docs/test/spec-report.test.ts` | spec-report script and `verificationProblem` tests | **deleted**; the `verificationProblem` and command tests move to `semantic-report.test.ts` |
| `apps/docs/test/provenance.test.ts`, `verification.test.tsx` | old provenance and page | rewritten |
| `apps/docs/test/components.test.tsx` | mocks `@/lib/generated` with `specReportJson: null` | mock key renamed to `semanticReportJson: null` (nothing else changes) |

### `provenance.ts` (rewrite; exact exports, in this order)

```ts
export interface BuildProvenance {
  readonly origin: "bun-build"
  readonly runner: string        // SemanticReport.provenance.runner
  readonly generatedAt: string   // ISO instant
  readonly commit: string | null
  readonly dirty: boolean        // from build-info.json; false when it is absent
}
export type Provenance = BuildProvenance
export type ProvenanceOrigin = Provenance["origin"] | "none"
export function formatInstant(iso: string): string   // unchanged from today
export function shortCommit(commit: string): string   // unchanged from today
export function buildProvenanceOf(
  report: { readonly provenance: { readonly runner: string; readonly generatedAt: string; readonly commit: string | null } } | null,
  info: { readonly dirty: boolean } | null,
): BuildProvenance | null
// null report -> null; otherwise { origin: "bun-build", runner, generatedAt, commit, dirty: info?.dirty ?? false }
export function provenanceText(provenance: Provenance | null): string
// null -> "Not run"
// bun-build -> `Run by ${runner} at build time, ${formatInstant(generatedAt)} · commit ${commit === null ? "unknown" : shortCommit(commit)}${dirty ? " (uncommitted changes)" : ""}`
```

Remove `PackageVersions`, `BrowserProvenance`, `CiProvenance`, `HistoricalProvenance`, `PACKAGE_VERSIONS`, `CI_PROVENANCE`, `browserProvenance`, `toHistorical`, `siteCommitOf` and the `@telos/locus/package.json` import.

### `build.ts` (rewrite)

```ts
import { readBuildInfo, readSemanticReport } from "./build-data"
import { buildInfoJson, semanticReportJson } from "./generated"
import { buildProvenanceOf } from "./provenance"
export const semanticReport = readSemanticReport(semanticReportJson)          // SemanticReport | null
export const BUILD_PROVENANCE = buildProvenanceOf(semanticReport, readBuildInfo(buildInfoJson))
```

### `readSemanticReport(value: unknown): SemanticReport | null` (in `build-data.ts`)

- `null` → `null`. This means the file was not produced.
- Otherwise check the fields below, in this order. The first wrong one throws `new Error("semantic-report.json: <field> is invalid")`. Use the existing `invalid(file, path)` helper with `file = "semantic-report.json"`.
- When every check passes, return the value cast to `SemanticReport`.

| `<field>` | Valid when |
| --- | --- |
| `document` | the value is a plain object |
| `version` | `=== 1` |
| `provenance` | plain object |
| `provenance.runner` | string |
| `provenance.generatedAt` | string |
| `provenance.commit` | string or `null` |
| `model` | plain object |
| `model.loci` | array |
| `verification` | plain object |
| `verification.findings` | array |
| `verification.summary` | plain object |
| `verifications` | plain object |
| `closure` | plain object |
| `closure.limits` | array |
| `closure.fileCount` | finite number |
| `closure.findings` | array |
| `ok` | boolean |

`SemanticReport` in `build-data.ts`:

```ts
import type { ModelDescription, VerificationDescription, VerificationReport } from "@telos/kernel"
export interface ClosureFinding { /* exactly as above */ }
export interface SemanticReport {
  readonly version: 1
  readonly provenance: { readonly runner: string; readonly generatedAt: string; readonly commit: string | null }
  readonly model: ModelDescription
  readonly verification: VerificationReport
  readonly verifications: Readonly<Record<string, ReadonlyArray<VerificationDescription>>>
  readonly closure: {
    readonly limits: ReadonlyArray<string>
    readonly scope: { readonly include: ReadonlyArray<string>; readonly exclude: ReadonlyArray<string> }
    readonly fileCount: number
    readonly findings: ReadonlyArray<ClosureFinding>
  }
  readonly ok: boolean
}
```

### `scripts/semantic-report.ts` (new; exact exports)

```ts
export interface GitInfo { readonly commit: string; readonly dirty: boolean }
export function readGit(root: string): GitInfo        // moved unchanged from spec-report.ts, with its START_BLOCK_READ_GIT region
export interface ReportRun { readonly exitCode: number | null; readonly stderr: string }
export interface ReportProblem { readonly fatal: boolean; readonly message: string }
export function reportProblem(run: ReportRun, written: boolean, out: string): ReportProblem | null
export interface WriteOptions {
  readonly docsDir: string                 // the apps/docs directory
  readonly repoRoot: string                // the repository root
  readonly git: () => GitInfo
  readonly run?: (cmd: ReadonlyArray<string>, cwd: string) => ReportRun   // default: Bun.spawnSync, see below
}
export async function writeSemanticReport(options: WriteOptions): Promise<ReportProblem | null>
```

`reportProblem` rules, in this order:

1. `exitCode` not `0` and not `1` → `{ fatal: true, message: "telos report exited with <exitCode, or \"no exit code\" for null>: <stderr.trim()>" }`
2. `!written` → `{ fatal: true, message: "telos report did not write <out>" }`
3. `exitCode === 1` → `{ fatal: false, message: "telos report: the repository check failed; the report was written and the site shows the failures" }`
4. otherwise `null`

`writeSemanticReport` steps:

1. Let `generated = join(docsDir, "src/generated")` and `out = join(generated, "semantic-report.json")`. Let `publicFile = join(docsDir, "public/semantic-report.json")`.
2. Run `mkdir(generated, { recursive: true })`. Remove both `out` and `publicFile` with `rm(..., { force: true })`, so a stale report never survives a failed run.
3. Write `join(generated, "build-info.json")` as `JSON.stringify({ commit, dirty }, null, 2) + "\n"` from `options.git()`.
4. Run `[process.execPath, join(repoRoot, "scripts/telos.ts"), "report", "--out", out]` in `repoRoot`. The default `run` uses `Bun.spawnSync({ cmd, cwd, stdout: "pipe", stderr: "pipe" })` and returns `{ exitCode: result.exitCode, stderr: result.stderr.toString() }`. If it throws, return `{ exitCode: null, stderr: <the error message> }`.
5. Set `written = await Bun.file(out).exists()` and `problem = reportProblem(run, written, out)`.
6. When `written` is true, create `join(docsDir, "public")` and copy `out` to `publicFile` (`Bun.write(publicFile, Bun.file(out))`).
7. Return `problem`.

The `import.meta.main` block:

- `docsDir = resolve(import.meta.dir, "..")` and `repoRoot = resolve(import.meta.dir, "../../..")`.
- Fatal problem: print `semantic-report: <message>` to stderr and `process.exit(1)`.
- Non-fatal problem: print the same line to stderr and exit 0.
- No problem: print `semantic-report: wrote src/generated/semantic-report.json and public/semantic-report.json`.

The app never imports the root `scripts/telos.ts`, because that would be an undeclared cross-Locus import for the closure check. It spawns the script instead.

### Pages and components (exact selectors and texts; the tests rely on them)

`src/lib/locus-slug.ts`: `locusSlug` and `locusIdOf` exactly as in the contract above.

`src/components/knowledge-badge.tsx`:

- `KNOWLEDGE_LABELS: Readonly<Record<Knowledge, string>>`:
  - `declared` → "declared", `derived` → "derived", `verified` → "verified", `failed` → "failed"
  - `"not-run"` → "not run"
  - `observed` → "observed", `invalidated` → "invalidated", `unknown` → "unknown"
- `KnowledgeBadge({ knowledge })` renders the existing `Badge` (`@/components/ui/badge`, variant `outline`) with `data-knowledge={knowledge}` and the label as text. `Knowledge` is `import type` from `@telos/kernel`.

`src/components/inspector-tree.tsx`:

- `INSPECTOR_INTRO` is exactly: "The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json."
- `InspectorTree({ report, provenance })` with `report: SemanticReport | null` and `provenance: BuildProvenance | null` renders:
  - `<main id="content" data-page="inspector" className="flex flex-col gap-8 py-8">`, then `<h1>Inspector</h1>` and `<p>{INSPECTOR_INTRO}</p>`.
  - `report === null`: `<p data-slot="no-report"><strong>Not run.</strong> No semantic report was produced for this build.</p>`.
  - Otherwise:
    - `<ProvenanceLabel provenance={provenance} />`
    - a `<dl>` with "Root" (`<code>{report.model.root}</code>`), "Loci" (the count) and "Model digest" (`<code data-slot="model-digest">{report.model.digest}</code>`)
    - a link `<a href="/semantic-report.json">semantic-report.json</a>`
    - the tree: start at the Locus whose id is `report.model.root`. Each Locus is `<li data-locus-id={id}>` holding:
      - `<Link to="/inspector/$slug" params={{ slug: locusSlug(id) }}>{id}</Link>`
      - its extension ids as `<code>` elements
      - `<span data-slot="capability-count">{n} capabilities</span>`
      - `<span data-slot="verification-counts">{p} passed · {f} failed · {r} not run</span>`, counted from `report.verifications[id] ?? []` by outcome (`passed`; `failed` or `error`; `not-run`)
      - a nested `<ul>` for its `contains` ids, in the order given
    - The outermost list is `<ul data-slot="locus-tree">`. Find each child's description with `report.model.loci.find(l => l.id === childId)`, and skip ids that are not found.

`src/components/locus-view.tsx`:

`LocusView({ locus, verifications })` takes `locus: LocusDescription` and `verifications: ReadonlyArray<VerificationDescription>`. It renders, in this order:

1. `<main id="content" data-page="inspector-locus" data-locus-id={locus.id} className="flex flex-col gap-8 py-8">`, then `<h1>{locus.id}</h1>` and `<p>{locus.description ?? "No description."}</p>`. When `locus.container` is not null, add a link back: `<Link to="/inspector/$slug" params={{ slug: locusSlug(locus.container) }}>` with text "Contained in <container>". Always add a link to `/inspector` with text "All Loci".
2. `<h2>Extensions</h2>`: `<li data-extension-id={id}><code>{id}</code> {description}</li>`, or the text "No extensions."
3. `<h2>Properties</h2>`: `<pre data-slot="properties">{JSON.stringify(locus.properties, null, 2)}</pre>`.
4. `<h2>Relations</h2>` with `<h3>Outgoing</h3>` and `<h3>Incoming</h3>`. Each is a table with the columns Type, From, Target, Grants invocation, Knowledge.
   - Rows are `<tr data-relation-type={type}>`.
   - Target text is `capability === null ? locus : \`${locus}#${capability}\``.
   - Grants invocation is "yes" or "no".
   - Knowledge is a `KnowledgeBadge`.
   - An empty list shows "No outgoing relations." or "No incoming relations.".
5. `<h2>Capabilities</h2>`: one `<article data-capability={name}>` per capability. It holds:
   - `<h3>{name}</h3>`, the description, and `<span data-slot="effect">{effect}</span>`
   - `<KnowledgeBadge knowledge={capability.knowledge} />`
   - "Implemented" or "Not implemented"
   - `<details><summary>Input schema</summary><pre data-slot="input-schema">{JSON.stringify(input.schema, null, 2)}</pre></details>`, and the same for "Output schema" with `data-slot="output-schema"`
   - errors as `<li data-error-tag={tag}>{tag}</li>`, or "No declared errors."
   - `<code data-slot="contract-digest">{contractDigest}</code>`
   - `exposedBy` as `<li data-exposed-by={e.locus}>{e.locus} via {e.relationType}</li>`, or "Not exposed by any interface."

   With no capabilities, show "No capabilities."
6. `<h2>Archetypes</h2>`: `<li data-archetype={id}>` with its description and a nested list of `<li data-rule={rule.id}><code>{rule.id}</code> ({rule.method}) {rule.description}</li>`, or "No Archetype applies to this Locus."
7. `<h2>Verification</h2>`: a table with the columns Archetype, Rule, Method, Outcome, Knowledge, Message.
   - Rows are `<tr data-verification-outcome={outcome}>`.
   - Message shows the message or "—".
   - With no rows, show "No Archetype applies to this Locus."
8. `<h2>Diagnostics</h2>`: `<tr data-diagnostic-code={code}>` with the columns Code, Severity, Path, Message, or "No diagnostics.".

`src/components/semantic-report-view.tsx`:

- `VERIFICATION_INTRO` is exactly: "The Archetype verification and Semantic Closure report from the build-time run, with its provenance."
- `SemanticReportView({ report, provenance })` renders:
  - `<main id="content" data-page="verification" className="flex flex-col gap-8 py-8">`, then `<h1>Verification</h1>` and `<p>{VERIFICATION_INTRO}</p>`.
  - `report === null`: `<p data-slot="no-report"><strong>Not run.</strong> No semantic report was produced for this build, so no result is shown.</p>`. There is no `ResultPanel` in this case, so `check-verification.ts` fails the build.
  - Otherwise one `<ResultPanel kind="semantic-report" provenance={provenance} title="Build-time semantic report">` holding:
    - `<p data-slot="report-ok" data-ok={String(report.ok)}>`. When ok, the text is "The build-time check found no model errors, no failed rules and no closure errors.". Otherwise it is "The build-time check found problems; they are listed below.".
    - `<dl data-slot="summary">` with Passed, Failed, Error (from `verification.summary`), "Closure findings" (`closure.findings.length`) and "Files checked" (`closure.fileCount`).
    - `<h2>Archetype verification</h2>` and a table with the columns Locus, Archetype, Rule, Method, Outcome, Message. Each row is `<tr data-finding-outcome={f.outcome}>`. The Locus cell is a `Link` to `/inspector/$slug`. With no findings, show `<p data-slot="no-findings">No Archetype applies to this model.</p>`.
    - `<h2>Semantic Closure</h2>`:
      - `<h3>Limits</h3>` with `<li data-closure-limit>` per limit
      - `<h3>Findings</h3>` with a table with the columns Code, Severity, File, Loci, Knowledge, Message. Each row is `<tr data-closure-code={code}>`, File shows the file or "—", and Knowledge is `<KnowledgeBadge knowledge={finding.knowledge} />`. With no findings, show `<p data-slot="no-closure-findings">No closure findings.</p>`.
  - After the panel: `<section>` with `<h2>Run it yourself</h2>` and a paragraph that names these commands as `<code>`:
    - `bun run telos verify` runs the Archetype rules.
    - `bun run telos closure` runs the Semantic Closure check.
    - `bun run telos report --out <path>` writes this report.

    The paragraph links to `/inspector` with the text "The inspector shows the model." and to `/playground` with the text "The playground runs the kernel in this browser.".

`result-panel.tsx`: `ResultKind = "semantic-report"`, and `provenance: Provenance | null`. Remove `data-stale` and the dashed historical border. Keep `data-result`, `data-provenance` (`"none"` when null) and `aria-label`. `provenance-label.tsx`: `ICONS = { "bun-build": Hammer, none: CircleSlash }`. Update both module contracts.

Routes:

- `src/routes/inspector/index.tsx`: `createFileRoute("/inspector/")`.
  - head: title `pageTitle("Inspector")`, meta description `INSPECTOR_INTRO`
  - component: `<InspectorTree report={semanticReport} provenance={BUILD_PROVENANCE} />`
- `src/routes/inspector/$slug.tsx`: `createFileRoute("/inspector/$slug")`.
  - loader: `({ params }) => { const id = locusIdOf(params.slug); const locus = semanticReport?.model.loci.find((l) => l.id === id); if (locus === undefined || semanticReport === null) throw notFound(); return { locus, verifications: semanticReport.verifications[id] ?? [] } }`
  - head: title `pageTitle(locus.id)`, description `locus.description ?? \`The Locus ${locus.id} in the repository model.\``. Write the head like `documentHead` in `src/lib/load.ts`: it receives `loaderData` that may be undefined.
  - component: `<LocusView locus={…} verifications={…} />`.
- `src/routes/verification.tsx`: same head shape with `VERIFICATION_INTRO`, component `<SemanticReportView report={semanticReport} provenance={BUILD_PROVENANCE} />`.

### Navigation and machine files

- `content-types.ts`: add `"inspector"` to `NavSectionId`, insert `{ id: "inspector", title: "Inspector", route: "/inspector" }` after `examples` in `NAV_SECTIONS`, and add `"/inspector"` to `APP_ROUTES`. Do not add `/inspector/<slug>` routes to `APP_ROUTES`: the content build runs before the report exists, so guides link only to `/inspector`.
- `prerender.ts`: add `"/inspector"` to `APP_PAGES`, and add `inspectorPages` from the contract. Update the module comment: "WP18, WP19 and WP20 edit this list."
- `vite.config.ts`: `readSemanticReport()` and the `pages` line exactly as in the contract.
- `scripts/content.ts` `llmsText`: add an `inspector` branch next to the playground and verification branches with the Inspector text above, and change the verification text to `VERIFICATION_INTRO`'s text. Update the module contract comment if it names the spec report.
- `src/components/site-nav.tsx`: its comments say "twelve sections"; change them to "the sections of NAV_SECTIONS". Change comments only.

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

- `apps/docs/package.json` (WP01): the `semantic-report` and `build` scripts; remove `spec-report`.
- `apps/docs/src/routeTree.gen.ts` (WP18): regenerated by the router plugin.
- `.grace/graph/docs.xml`, `.grace/verification/docs.xml` (WP18): rename M-DOCS-SPEC-REPORT and add M-DOCS-INSPECTOR.
- `apps/docs/test/content.test.ts` (WP16): the Inspector and Verification llms bullet text only. `apps/docs/test/site.test.ts` (WP16): add `/inspector` rows only.
- `telos.ts` (WP15): add a relation only if a new cross-Locus import needs it.

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

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP19 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T110 – Script, package scripts and `.gitignore`

Write `apps/docs/scripts/semantic-report.ts` (above), with module markup.

- In `apps/docs/package.json` (sanctioned edit), set `"semantic-report": "bun scripts/semantic-report.ts"` and `"build": "bun run content && bun run semantic-report && bun run build:site"`, and remove `"spec-report"`.
- Add `apps/docs/public/semantic-report.json` to `.gitignore` under the "docs app build output" comment.
- Delete `apps/docs/scripts/spec-report.ts`.
- Run `bun run --cwd apps/docs semantic-report`. It must print the "wrote" line, or the non-fatal warning when `telos check` fails on the base. Report which one you got.

### T111 – Data, generated data and provenance

Rewrite these four files as specified above:

- `apps/docs/src/lib/generated.ts`
- `apps/docs/src/lib/build-data.ts`
- `apps/docs/src/lib/provenance.ts`
- `apps/docs/src/lib/build.ts`

Then update `result-panel.tsx` and `provenance-label.tsx`. In `apps/docs/test/components.test.tsx`, rename the mock key `specReportJson` to `semanticReportJson`. Run `bun run typecheck` and fix only errors in your files.

### T112 – `check-verification.ts`

Set the marker to `'data-result="semantic-report"'`. Change the second message to `` `${PAGE} does not contain ${RESULT_MARKER}: the page was rendered without the semantic report, usually because semantic-report.json is missing or invalid` `` and the success line to `verification check: ${PAGE} carries the semantic report`. Update the module contract text.

### T113 – Slugs, prerender, vite and navigation

Write `locus-slug.ts`, then update `prerender.ts`, `vite.config.ts`, `content-types.ts`, `scripts/content.ts` and `site-nav.tsx` as specified.

### T114 – Components

Write these new components:

- `knowledge-badge.tsx`
- `inspector-tree.tsx`
- `locus-view.tsx`
- `semantic-report-view.tsx`

Delete `verification-view.tsx` and `spec-report-table.tsx`.

### T115 – Routes

Write `src/routes/inspector/index.tsx` and `src/routes/inspector/$slug.tsx`, and rewrite `src/routes/verification.tsx`. Never edit `src/routeTree.gen.ts` by hand: `bun run docs:build` regenerates it through the router plugin, and the regenerated file is part of your commit.

### T116 – Unit tests

Write the unit tests below. Add markup to each test file: `ROLE: TEST`, `MAP_MODE: LOCALS`, and its local helpers listed.

1. **`apps/docs/test/semantic-report-fixture.ts`** (a helper, not a test). It exports `async function semanticReportFixture(): Promise<SemanticReport>`, built with the real kernel and calculator:

   ```ts
   import { calculatorModel } from "@telos/calculator"
   import { describeModel, describeVerifications, verify } from "@telos/kernel"
   import { Effect } from "effect"
   import type { SemanticReport } from "../src/lib/build-data"
   const AT = new Date("2026-10-22T10:00:00.000Z")
   export async function semanticReportFixture(): Promise<SemanticReport> {
     const model = await Effect.runPromise(describeModel(calculatorModel))
     const verification = await Effect.runPromise(
       verify(calculatorModel, { runner: "bun test", loci: ["calculator:arithmetic"], now: () => AT }),
     )
     const verifications = Object.fromEntries(
       model.loci.map((l) => [l.id, describeVerifications(calculatorModel, l.id, verification)]),
     )
     return {
       version: 1,
       provenance: { runner: "bun test", generatedAt: AT.toISOString(), commit: "0123456789abcdef0123456789abcdef01234567" },
       model, verification, verifications,
       closure: {
         limits: ["Ownership is decided per file, never below file level."],
         scope: { include: ["apps/calculator/src/**/*.ts"], exclude: [] },
         fileCount: 3,
         findings: [{ code: "closure.unowned", severity: "error", file: "apps/calculator/src/stray.ts", loci: [], detail: "apps/calculator/src/stray.ts", message: "apps/calculator/src/stray.ts has no owner.", knowledge: "derived" }],
       },
       ok: false,
     }
   }
   ```

   Only `calculator:arithmetic` is verified. So `calculator:app` keeps `not-run` verification rows, and both knowledge values can be asserted.

2. **`apps/docs/test/semantic-report.test.ts`**:
   - `readSemanticReport`:
     - It returns the fixture unchanged (`toEqual`) and returns `null` for `null`.
     - For every `<field>` of the table above, a deep copy with that field set to `"wrong"` throws `semantic-report.json: <field> is invalid`. For `document`, the whole value is `"wrong"`.
     - `provenance.commit` set to `null` is accepted.
   - `reportProblem`:
     - `(0, written)` → `null`
     - `(1, written)` → `fatal: false`
     - `(2, written)` → `fatal: true`, and the message contains `exited with 2`
     - `(null, not written)` → `fatal: true`
     - `(0, not written)` → `fatal: true`, and the message contains `did not write`
   - `writeSemanticReport` with a fake `run` and a fresh temp `docsDir` (`mkdtempSync(join(tmpdir(), "semantic-report-"))`):
     - The fake writes `JSON.stringify(fixture)` to the `--out` path it receives (`cmd[4]`) and returns exit code 0. The result is `null`, `build-info.json` equals the fake git info, and `public/semantic-report.json` equals the generated file byte for byte.
     - A fake that throws inside `run` (or returns `exitCode: null` without writing) leaves no `src/generated/semantic-report.json` and no `public/semantic-report.json`, even when stale copies existed before. The result is fatal.
   - **The real run**: `writeSemanticReport({ docsDir: <temp>, repoRoot: <the repository root>, git: () => ({ commit: "test", dirty: false }) })`, with the default `run`.
     - The result is `null` or non-fatal.
     - `readSemanticReport` of the written file is not `null`.
     - Its `model.loci` contains `telos:docs-site` and `calculator:arithmetic`.

     Give this test `{ timeout: 60_000 }`, because it runs the closure check.
   - `verificationProblem` and the three command tests, moved from `spec-report.test.ts` with the marker `data-result="semantic-report"`.

   Delete `apps/docs/test/spec-report.test.ts`.

3. **`apps/docs/test/provenance.test.ts`** (rewrite):
   - `formatInstant` and `shortCommit` keep their current tests.
   - `buildProvenanceOf`:
     - null report → null
     - with build info `{ dirty: true }` → `dirty: true`
     - without build info → `dirty: false`
   - `provenanceText`:
     - null → `"Not run"`
     - clean: `"Run by bun 1.4.4 at build time, 2026-10-22 10:00:00 UTC · commit 0123456"` for `{ runner: "bun 1.4.4", generatedAt: "2026-10-22T10:00:00.000Z", commit: "0123456789abcdef0123456789abcdef01234567", dirty: false }`
     - dirty: the same text plus `" (uncommitted changes)"`
     - `commit: null` → contains `"commit unknown"`

4. **`apps/docs/test/inspector.test.tsx`**. Render with `renderToStaticMarkup`, as `components.test.tsx` does. React escapes `"` as `&quot;` in text, so match quoted JSON as `&quot;`.
   - `locusSlug("telos:kernel") === "telos--kernel"`, `locusIdOf("telos--kernel") === "telos:kernel"`, and both round-trip every fixture Locus id.
   - `inspectorPages(fixture)` equals `fixture.model.loci.map(l => "/inspector/" + locusSlug(l.id))`.
   - `KnowledgeBadge` for each of `declared`, `derived`, `verified`, `failed`, `not-run` and `unknown` renders `data-knowledge="<value>"` and its label (`not-run` → "not run").
   - `LocusView` of `calculator:arithmetic` has:
     - `data-capability="add"`, `data-capability="divide"`
     - `data-slot="input-schema"` containing `&quot;properties&quot;`
     - `data-error-tag="DivisionByZero"`
     - `data-exposed-by="calculator:cli"`
     - a `data-slot="contract-digest"` whose text matches `/sha256:[0-9a-f]{64}/`
     - `data-knowledge="verified"`
   - `LocusView` of `calculator:app` has `data-verification-outcome="not-run"` and `data-knowledge="not-run"`.

   You need a router context for `Link`. Wrap the component the way `components.test.tsx` renders routes, or render it through a memory router (`createRouter` + `createMemoryHistory` + `RouterProvider`) with a root route whose component is your element. Copy the approach from `components.test.tsx`.
5. **`apps/docs/test/verification.test.tsx`** (rewrite):
   - `SemanticReportView` with `null` has `data-slot="no-report"` and no `data-result`.
   - With the fixture and `buildProvenanceOf(fixture, null)`:
     - one `data-result="semantic-report"` with `data-provenance="bun-build"`
     - the provenance label text
     - `data-ok="false"`
     - one `data-finding-outcome` row per `fixture.verification.findings` entry
     - one `data-closure-code="closure.unowned"` row, containing `data-knowledge="derived"`
     - one `data-closure-limit`
     - `href="/playground"`
   - With the fixture changed to `ok: true` and `closure.findings: []`, it shows `No closure findings.`.
   - `ResultPanel` and `ProvenanceLabel`:
     - `data-provenance="none"` with the label `Not run` when provenance is null
     - the icon is `aria-hidden="true"`

Run `bun test apps/docs/test`.

### T117 – e2e tests and llms bullets

- **`apps/docs/e2e/inspector.e2e.ts`** (new; use `trackPageErrors` from `./helpers`):
  - `/inspector` has `[data-locus-id="telos:kernel"] a[href="/inspector/telos--kernel"]`. Clicking it shows `h1` "telos:kernel".
  - `/inspector/calculator--arithmetic`:
    - `[data-capability="add"]` is visible
    - `[data-capability="add"] [data-exposed-by="calculator:cli"]` has count 1
    - `[data-capability="add"] [data-slot="contract-digest"]` matches `/^sha256:[0-9a-f]{64}$/`
  - `page.request.get("/semantic-report.json")` gives JSON with `version` 1. For every Locus in it, `page.request.get("/inspector/" + id.replace(":", "--"))` has status 200 and its body does not contain `data-page="not-found"`.
  - `/inspector/nope--nope` gives status 404 and contains `data-page="not-found"`.
- **`navigation.e2e.ts`**: replace "the verification report shows its 44 specification rows" with "the verification report shows at least one finding row". It opens `/verification` and expects `await page.locator("[data-finding-outcome]").count()` to be `> 0`. The nav order test uses `NAV_SECTIONS` already, so it needs no change.
- **`a11y.e2e.ts`**: add `{ name: "inspector", path: "/inspector" }` and `{ name: "inspector Locus page", path: "/inspector/calculator--arithmetic" }` to `PAGES`. Update the module comment.
- **`provenance.e2e.ts`**:
  - `ORIGINS` becomes `["browser", "bun-build", "historical", "none"]`.
  - `RESULT_ELEMENTS` becomes `"[data-diagnostic-code], [data-decode-issue], [data-finding-outcome], [data-closure-code]"`.
  - Keep "the verification page: every panel has an origin and a label, and nothing sits outside a panel".
  - Replace the verification-label test with "the verification label says the build ran the report". It expects `[data-result="semantic-report"][data-provenance="bun-build"] [data-slot="provenance-label"]` to contain "at build time" and "commit". Remove the CI assertion.
  - Leave the playground tests that WP18 wrote unchanged.
- **`machine-files.e2e.ts`**: `APP_PAGE_LINES` becomes the Inspector line, the Playground line (unchanged from WP18) and the new Verification line, in that order. Add the test "semantic-report.json is served with version 1 and the repository root". It fetches `/semantic-report.json`, and expects `version` 1 and `model.root === "telos:repository"`.
- **`apps/docs/test/content.test.ts`** (sanctioned): in the expected llms text, add `## Inspector\n\n- [Inspector](/inspector): <Inspector text>` before `## Playground`, and replace the Verification bullet text.
- **`apps/docs/test/site.test.ts`** (sanctioned): add `["/inspector/telos--kernel", "inspector"]` to `SECTION_CASES`.

### T118 – GRACE (area `docs`)

In `.grace/graph/docs.xml`:

- Rename `M-DOCS-SPEC-REPORT` to `M-DOCS-SEMANTIC-REPORT`:
  - Summary: "Runs `bun run telos report` at build time, writes the semantic report and the build info, serves the report as /semantic-report.json, and checks that the built Verification page carries it."
  - Paths: `apps/docs/scripts/semantic-report.ts`, `apps/docs/scripts/check-verification.ts`
  - Child: `<M-TELOS-COMMAND />`. Remove `<M-LOCUS-SPECS />`.
- Add `M-DOCS-INSPECTOR`:
  - Summary: "The inspector pages: the Locus tree and one page per Locus of the build-time semantic report."
  - Paths: `apps/docs/src/lib/locus-slug.ts`, `apps/docs/src/components/inspector-tree.tsx`, `apps/docs/src/components/locus-view.tsx`, `apps/docs/src/components/knowledge-badge.tsx`, `apps/docs/src/routes/inspector/`
  - Children: `<M-KERNEL-API />`, `<M-DOCS-SITE />`
- In `M-DOCS-SITE`, replace the child `<M-DOCS-SPEC-REPORT />` with `<M-DOCS-SEMANTIC-REPORT />`, and change its Summary from "verification page" to "verification page on the semantic report".

In `.grace/verification/docs.xml`:

- Rename `V-M-DOCS-SPEC-REPORT` to `V-M-DOCS-SEMANTIC-REPORT`:
  - TestFiles: `apps/docs/test/semantic-report.test.ts`
  - Commands: `bun test apps/docs/test/semantic-report.test.ts`, `bun run --cwd apps/docs semantic-report`, `bun run docs:build`
  - Scenarios:
    - The build writes the semantic report and the build info from `bun run telos report`.
    - A failed repository check still writes the report and warns.
    - A crashed run leaves no stale report.
    - An invalid report is refused with the field name.
    - The docs build fails when the Verification page does not carry the report.
- Add `V-M-DOCS-INSPECTOR`:
  - TestFiles: `apps/docs/test/inspector.test.tsx`, `apps/docs/e2e/inspector.e2e.ts`
  - Commands: `bun test apps/docs/test/inspector.test.tsx`, `bun run test:e2e apps/docs/e2e/inspector.e2e.ts`
  - Scenarios:
    - Every Locus of the report has a prerendered page.
    - A capability shows its schemas, errors, contract digest and the interfaces that expose it.
    - Knowledge badges name the knowledge status.
    - An unknown slug is the not-found page.
- In `V-M-DOCS-SITE`, keep `provenance.test.ts` and `verification.test.tsx`, and remove `spec-report.test.ts` if it is listed.
- Update the `GD-DOCS` and `VD-DOCS` `<Owns>` blocks in the two index files.

Update the `LINKS` and `DEPENDS` lines of every file you touched that named `M-DOCS-SPEC-REPORT` or `M-LOCUS-*`. Run `bun run grace:lint`.

`telos.ts`: `telos:docs-site` already declares relations to kernel, web-pack and calculator. Add a relation only if `bun run telos check` reports `closure.undeclared-dependency` for a file you wrote.

### T119 – Verify

1. Run `git grep -n "@telos/locus" -- apps/docs/src apps/docs/scripts apps/docs/e2e`. It must print nothing.
2. Run `git grep -n "spec-report\|specReport\|SpecReport" -- apps/docs ':!apps/docs/src/routeTree.gen.ts'`. It must print nothing.
3. Run `bun run format`, then `bun run verify`. `verify` runs `docs:build`, which runs `semantic-report`, then `check-verification.ts`, the e2e tests and `telos:check`. Report each step.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP19 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- **Prerender and the report.** `vite.config.ts` reads `src/generated/semantic-report.json` when Vite starts. `bun run --cwd apps/docs build` creates it first. A plain `vite dev` without it throws the contract message on purpose.
- **Closure.** Do not import `scripts/telos.ts`, `@telos/kernel/closure` or any root file from the app; spawn the command and copy the closure finding type.
- **Long test.** The real-run unit test runs the full closure check (NFR-003 allows up to 10 s); keep its 60 s timeout.
- **Failures stay visible.** A failed `telos report` still writes the file, so the site always shows the real state. Never hide failures by skipping the report.
- `routeTree.gen.ts` is generated; never hand-edit it.

## Reviewer guidance

- `/inspector`, one `/inspector/<slug>` per Locus, and `/verification` are prerendered. `/semantic-report.json` is served. The `inspector.e2e.ts` tests pass.
- No `@telos/locus`, `spec-report` or `SpecReport` remains under `apps/docs/src`, `apps/docs/scripts` or `apps/docs/e2e`.
- `provenance.ts` has one origin, and the label text matches the tests.
- `M-DOCS-SEMANTIC-REPORT` and `M-DOCS-INSPECTOR` are registered with their verification entries, and `grace lint` passes.
