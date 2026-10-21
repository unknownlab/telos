# Contract: executable specifications (`@telos/locus-specs`)

Package: `packages/locus-specs`, name `@telos/locus-specs`, `"private": true`. Its dependencies are `@telos/locus` (workspace) and `effect`. It is a temporary engineering tool (ADR-0011, ADR-0013): it may be replaced, and `@telos/locus` never imports it (INV-014).

## Specification record

Every specification is a plain, JSON-serialisable record. The same records run under `bun test`, in the build-time report and in the playground.

```ts
export type InvariantId = `INV-${string}`   // INV-001 … INV-012
export type ScenarioId = `NS-${string}`     // negative scenarios from spec.md

export interface Specification {
  readonly id: `LOC-${string}`              // LOC-001 …, three digits, never reused
  readonly title: string                    // one sentence, reader-facing
  readonly invariants: ReadonlyArray<InvariantId> // may be empty only for decode checks
  readonly scenarios: ReadonlyArray<ScenarioId>
  readonly polarity: "positive" | "negative" // positive: input is accepted or equal; negative: input is rejected or distinguished
  readonly check: SpecCheck
}
```

Inputs inside checks use the JSON wire format from [locus-api.md](locus-api.md#wire-format-json) (`FabricJson`, `LocusJson`). The runner decodes them with the public decoders, so every check also exercises decoding.

## Check kinds

| `kind` | Fields | Runner action | Observed value compared with `expect` |
| --- | --- | --- | --- |
| `validate` | `fabric: FabricJson`; `expect: { valid: boolean; diagnostics: ExpectedDiagnostic[] }` | `decodeFabric` → `validateFabric` | `valid` and the full ordered diagnostic list, each reduced to `ExpectedDiagnostic` |
| `validate-stable` | `variants: FabricJson[]` (at least 2), `runs: number` (≥ 1); `expect: "identical"` | validate each variant `runs` times | `"identical"` when all `JSON.stringify` outputs are byte-equal, else `"different"` with the first differing pair |
| `decode` | `input: string` (JSON text); `expect: { ok: true } \| { ok: false; paths: string[] }` | `decodeFabricJson` | success, or the ordered list of issue paths |
| `revision-compare` | `a: LocusJson`, `b: LocusJson`; `expect: { sameLocus: boolean; sameId: boolean }` | `decodeLocus` → `createRevision` on both | whether `locus` and `id` are equal |
| `revision-immutable` | `locus: LocusJson`; `expect: "immutable"` | create a Revision; attempt, in strict mode, to assign to `id`, `definition.charter.purpose`, push to `definition.relations`; then recompute the id from `definition` | `"immutable"` when every assignment throws, all values are unchanged and the recomputed id equals `id` |
| `history` | `revisions: LocusJson[]`; `steps: { append: number; expectedHead: number \| null }[]`; `expect: { outcomes: ("appended" \| "no-op" \| "stale")[]; entries: number[] }` | fresh `RevisionHistoryInMemory`; for each step, append `revisions[append]` with `expectedHead` given as an index into `revisions` (or `null`) | the outcome of each step and the final entries as indices into `revisions` |
| `diff` | `from: LocusJson`, `to: LocusJson`; `expect: { ok: true; changes: Change[] } \| { ok: false; error: "LocusMismatchError" }` | `createRevision` on both → `diffRevisions` | the change list, or the error tag |

`ExpectedDiagnostic` is `{ code, scope, subject, path, detail?, members? }`. It never includes `message`, so messages may be reworded without breaking a specification.

## Runner

```ts
export interface SpecResult {
  readonly id: Specification["id"]
  readonly status: "pass" | "fail" | "error"   // error: the runner itself failed (e.g. a fixture did not decode)
  readonly expected: unknown
  readonly observed: unknown
  readonly durationMs: number
}

export interface SpecReport {
  readonly results: ReadonlyArray<SpecResult>  // in catalogue order
  readonly summary: { readonly total: number; readonly passed: number; readonly failed: number; readonly errored: number }
}

export const runSpecification: (spec: Specification) => Effect<SpecResult>   // never fails; errors become status "error"
export const runSpecifications: (specs: ReadonlyArray<Specification>) => Effect<SpecReport>
export const catalogue: ReadonlyArray<Specification>
export const examples: Readonly<Record<"valid" | "invalid" | "relations" | "history", unknown>> // playground starting inputs
```

Rules:

- The runner calls only the public `@telos/locus` API. Each `history` check gets its own fresh layer.
- A result is `pass` only when the observed value deep-equals the expected value. Comparison uses canonical JSON (sorted keys).
- The runner is pure apart from time measurement. `durationMs` is excluded from all equality checks.
- Provenance is not part of `SpecReport`. The caller adds it (see [docs-site.md](docs-site.md#provenance)).

## Adapters

| Adapter | Location | Behaviour |
| --- | --- | --- |
| Bun test | `packages/locus-specs/test/specifications.test.ts` | one `test(id + " " + title)` per catalogue record; a test fails when `status !== "pass"` and prints expected and observed |
| Runner meta-tests | `packages/locus-specs/test/runner.meta.test.ts` | for every check kind, take a catalogue record, alter its expectation, and assert the runner reports `fail`; also assert that a fixture that does not decode reports `error` |
| Catalogue integrity | `packages/locus-specs/test/specifications.test.ts` | ids are unique, sequential and three-digit; every INV-001 to INV-012 has at least one positive and one negative record (NFR-007); every NS-001 to NS-017 that the package can check is referenced |
| Determinism | `packages/locus-specs/test/determinism.test.ts` | Revision ids of every `revision-compare` fixture equal golden values recorded in the test file (NFR-001; the same goldens are checked in Chromium by the browser tests) |
| Build report | `apps/docs/scripts/spec-report.ts` | runs `runSpecifications(catalogue)` under Bun at build time and writes `apps/docs/src/generated/spec-report.json` with `bun-build` provenance |
| Playground | `apps/docs/src/playground/` | scenario E runs `runSpecifications(catalogue)` in the browser and labels the report `browser` |

Separate checks (not catalogue records):

- INV-013: Playwright suites (provenance coverage, "not run" state) and content-pipeline tests. See [docs-site.md](docs-site.md).
- INV-014: `packages/locus-specs/test/core-independence.test.ts` scans `packages/locus/src/**` and `packages/locus/package.json`. It fails on any import of `@telos/locus-specs`, `bun:test`, `@playwright/*` or a test runner, and on any such dependency. `portability.test.ts` enforces the portability rule from locus-api.md.
- NFR-002: a timed Bun test in `packages/locus-specs/test/` that generates 1,000 Loci with 3 Relations each and asserts that validation finishes in under 1 s.

## Catalogue (version 1)

Polarity: **+** accepted or equal, **−** rejected or distinguished.

| Id | Kind | Pol. | Invariant | Scenario | Case |
| --- | --- | --- | --- | --- | --- |
| LOC-001 | validate | + | INV-001 | — | well-formed identities, including digits and single hyphens |
| LOC-002 | validate | − | INV-001 | NS-001 | identity without a namespace |
| LOC-003 | validate | − | INV-001 | NS-001 | identity with uppercase letters |
| LOC-004 | validate | − | INV-001 | NS-001 | identity with a space; identity with an empty part |
| LOC-005 | validate | − | INV-001 | NS-001 | malformed Fabric identity (`scope: "fabric"`) |
| LOC-006 | validate | + | INV-002 | — | distinct identities that share a namespace |
| LOC-007 | validate | − | INV-002 | NS-002 | the same identity twice, reported once with count `2` |
| LOC-008 | revision-compare | + | INV-003 | — | same definition with different `metadata` (e.g. a source path) gives the same id |
| LOC-009 | revision-compare | − | INV-003 | — | changing the owner keeps the Locus identity and changes the Revision id |
| LOC-010 | validate | + | INV-004 | — | full Charter with exclusions and success conditions |
| LOC-011 | validate | − | INV-004 | NS-003 | whitespace-only purpose |
| LOC-012 | validate | − | INV-004 | NS-004 | no responsibilities |
| LOC-013 | validate | − | INV-004 | NS-004 | blank responsibility and blank exclusion |
| LOC-014 | validate | − | INV-004 | NS-004 | duplicated responsibility and duplicated success condition |
| LOC-015 | validate | + | INV-005 | — | ownership tree three levels deep |
| LOC-016 | validate | − | INV-005 | NS-005 | owner not in the Fabric |
| LOC-017 | validate | − | INV-005 | NS-006 | Locus owning itself (`owner.self` only) |
| LOC-018 | validate | − | INV-006 | NS-007 | ownership cycle of two, reported once |
| LOC-019 | validate | − | INV-006 | NS-007 | ownership cycle of three plus a Locus leading into it, reported once, members from the smallest |
| LOC-020 | validate | + | INV-006 | — | ownership chain 200 levels deep |
| LOC-021 | validate | + | INV-007 | — | one Relation of each of the four kinds |
| LOC-022 | decode | − | INV-007 | NS-008 | unknown Relation kind is a decode error at `loci[0].relations[0].kind` |
| LOC-023 | validate | − | INV-007 | NS-009 | Relation to a missing target |
| LOC-024 | validate | − | INV-007 | NS-009 | Relation to the Locus itself |
| LOC-025 | validate | − | INV-007 | NS-009 | the same kind and target twice |
| LOC-026 | validate | + | INV-007 | — | the same target with two different kinds |
| LOC-027 | validate | − | INV-008 | NS-010 | `refines` cycle of three |
| LOC-028 | validate | + | INV-008 | NS-011 | `depends-on` cycle is valid |
| LOC-029 | validate | + | INV-008 | — | `refines` chain without a cycle |
| LOC-030 | validate | − | INV-009 | NS-012 | one Fabric with an identity, Charter, owner and Relation violation; all four reported in order |
| LOC-031 | validate-stable | + | INV-009 | — | the LOC-030 Fabric with Loci, Relations and Charter entries reordered gives an identical report |
| LOC-032 | validate-stable | + | INV-009 | — | the same Fabric validated 5 times gives byte-identical output |
| LOC-033 | revision-immutable | − | INV-010 | NS-013 | attempts to modify a Revision have no effect |
| LOC-034 | revision-compare | + | INV-010 | — | a Revision recreated from its own definition has the same id |
| LOC-035 | history | + | INV-011 | — | append to empty with `null`, then with the correct head |
| LOC-036 | history | − | INV-011 | NS-014 | append with a stale expected head is refused; entries unchanged |
| LOC-037 | history | − | INV-011 | NS-015 | append to an empty history with a non-null expected head is refused |
| LOC-038 | history | + | INV-011 | — | appending the current head is a no-op; a revert `A, B, A` is appended |
| LOC-039 | revision-compare | + | INV-012 | — | set order and metadata differences give the same id |
| LOC-040 | diff | − | INV-012 | — | a purpose change and an added Relation give a different id and the expected change set |
| LOC-041 | diff | − | INV-012 | NS-016 | diff across two Loci fails with `LocusMismatchError` |
| LOC-042 | decode | − | — | NS-017 | text that is not JSON: one issue at path `""` |
| LOC-043 | decode | − | — | NS-017 | JSON of the wrong shape: missing `charter`, number as `purpose`, unknown key |
| LOC-044 | validate | + | — | — | empty Fabric is valid |

Coverage: INV-001 to INV-012 each have at least one positive and one negative record. NS-001 to NS-017 are each referenced. NS-018 to NS-020 are checked by the docs site tests.

Changing a record's meaning requires a new id. Ids are never reused.
