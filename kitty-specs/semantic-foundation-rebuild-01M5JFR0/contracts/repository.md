# Contract: repository self-description and gate (WP15)

The repository describes itself with the kernel (FR-022). One command reads that description (FR-023), and the gate enforces it (FR-024, spec D7).

## Root `telos.ts`

The root file imports only `@telos/kernel` and `@telos/calculator`. The root `package.json` has these as `workspace:*` dependencies since WP01.

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
| `telos:tooling` | `scripts/**/*.ts` | — | kernel | — |
| `telos:docs-site` | `apps/docs/*.ts`, `apps/docs/src/**/*.ts`, `apps/docs/src/**/*.tsx`, `apps/docs/scripts/**/*.ts`, `apps/docs/test/**/*.ts`, `apps/docs/test/**/*.tsx`, `apps/docs/e2e/**/*.ts` | the third-party packages the docs files import today (see below) | legacy-locus | — |
| `telos:legacy-locus` | `packages/locus/src/**/*.ts`, `packages/locus/test/**/*.ts`, `packages/locus/specs/**/*.ts` | `effect` | — | — |

Notes:

- Each Locus has a `purpose` sentence and a `description`. The texts are written by the implementer and state what the package does.
- **Docs externals**: run the closure check once, take every `closure.unknown-external` reported for `telos:docs-site`, check that each package is listed in `apps/docs/package.json` (`dependencies` or `devDependencies`), and add them to `packages`, sorted. A package that is imported but not in the manifest is a real finding: stop and report it rather than listing it.
- **Later changes**:
  - WP18 and WP19 change `telos:docs-site` relations to kernel, web-pack and calculator.
  - WP19 removes `telos:legacy-locus` and its relation.
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
