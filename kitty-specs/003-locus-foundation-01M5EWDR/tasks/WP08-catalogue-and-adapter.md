---
work_package_id: WP08
title: Catalogue, examples and Bun adapter
dependencies:
- WP07
requirement_refs:
- FR-012
- NFR-001
- NFR-007
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T039
- T040
- T041
- T042
- T043
- T044
phase: Phase 3 - Executable specifications
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus-specs/src/
create_intent:
- packages/locus-specs/src/catalogue.ts
- packages/locus-specs/src/examples.ts
- packages/locus-specs/src/goldens.ts
- packages/locus-specs/test/specifications.test.ts
- packages/locus-specs/test/catalogue-mutation.test.ts
- packages/locus-specs/test/examples.test.ts
- packages/locus-specs/test/determinism.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus-specs/src/catalogue.ts
- packages/locus-specs/src/examples.ts
- packages/locus-specs/src/goldens.ts
- packages/locus-specs/test/specifications.test.ts
- packages/locus-specs/test/catalogue-mutation.test.ts
- packages/locus-specs/test/examples.test.ts
- packages/locus-specs/test/determinism.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP08 – Catalogue, examples and Bun adapter

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

Write the 44 executable specifications LOC-001 to LOC-044 as plain data, exactly as listed in the contract table. Also write:

- the playground starting examples;
- independent golden Revision ids;
- the `bun test` adapter;
- the integrity and coverage checks (NFR-007);
- a mutation pass that proves every record can fail.

Done means:

1. `bun test packages/locus-specs` runs one test per record. All 44 records pass, and every expectation equals the one given in this prompt.
2. Integrity holds:
   - ids are `LOC-001` to `LOC-044`, unique and in sequence;
   - every INV-001 to INV-012 has at least one positive and one negative record;
   - every NS-001 to NS-017 is referenced;
   - records survive a JSON round trip unchanged.
3. Mutation pass: for **every** record, a mutated expectation gives `fail`.
4. Determinism: the Revision ids of every `revision-compare` fixture equal the golden ids below. These were computed independently with `shasum -a 256`. Also, validating the LOC-030 Fabric 100 times gives byte-identical output.
5. `bun run verify` passes.

## ⛔ The one rule that matters most

**Never change an expectation to match what the runner observed.** The expectations below are derived from the contracts. If a record fails, one of two things is true:

- The bug is in `@telos/locus`. Report it, name the record, and **do not** "fix" the expectation. Fixing core code is outside this WP: stop and report.
- This prompt contradicts a contract rule. Cite the rule and the line, change the expectation to what the contract says, and list the change in your final report.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/specifications.md` — **Catalogue (version 1)** table (authoritative for ids, kinds, polarity, invariants and scenarios)
- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md` — diagnostic rules, canonical form, wire format
- `packages/locus-specs/src/{model,runner}.ts` (WP07)

Records are plain data. To keep the file short, you may use small builder functions **that return plain JSON**, for example a `locus(id, extra)` that fills a default Charter. The integrity test checks that each record survives `JSON.parse(JSON.stringify(record))` unchanged.

Default Charter helper:

```ts
const locus = (id: string, extra: Partial<LocusJson> = {}): LocusJson => ({
  id,
  charter: { purpose: `Purpose of ${id}.`, responsibilities: [`Work of ${id}`] },
  ...extra,
});
const fabric = (id: string, loci: LocusJson[]): FabricJson => ({ id, loci });
const diag = (code: DiagnosticCode, subject: string, path: string, more: { detail?: string; members?: string[] } = {}): ExpectedDiagnostic =>
  ({ code, scope: "locus", subject, path, ...more });
```

Every record includes `invariants`, `scenarios` and `polarity` exactly as in the contract table.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP08 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append export lines to `packages/locus-specs/src/index.ts` and its `START_MODULE_MAP`. Name that edit in your commit body.
- No new dependencies. `src/` stays portable: no `bun`, `node:*`, `process` or `Buffer`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree.
- No fake tests.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commit messages follow Conventional Commits, for example `feat(locus-specs): add catalogue LOC-001 to LOC-044`. No AI names, and no `Co-Authored-By` line.
- GRACE file markup with `LINKS: M-LOCUS-SPECS`. Each export gets a `START_CONTRACT` block and TSDoc.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP08 --agent claude`.

## Subtasks & Detailed Guidance

Expected diagnostics are listed **in report order**: by subject, then code, then path, then detail, comparing UTF-16 code units. Uppercase letters sort before lowercase ones.

### Subtask T039 – LOC-001 to LOC-014

| Id | Input | `expect` |
| --- | --- | --- |
| LOC-001 | `fabric("cat:identities", [locus("a1:b2-c3"), locus("telos:locus-core"), locus("shop:checkout")])` | `{ valid: true, diagnostics: [] }` |
| LOC-002 | `fabric("cat:f", [locus("checkout")])` | `[diag("identity.malformed", "checkout", "id")]` |
| LOC-003 | `fabric("cat:f", [locus("Shop:Checkout")])` | `[diag("identity.malformed", "Shop:Checkout", "id")]` |
| LOC-004 | `fabric("cat:f", [locus("shop:check out"), locus("shop:")])` | `[diag("identity.malformed", "shop:", "id"), diag("identity.malformed", "shop:check out", "id")]` |
| LOC-005 | `fabric("System", [locus("shop:a")])` | `[{ code: "identity.malformed", scope: "fabric", subject: "System", path: "id" }]` |
| LOC-006 | `fabric("cat:f", [locus("shop:a"), locus("shop:b")])` | valid |
| LOC-007 | `fabric("cat:f", [locus("shop:a"), locus("shop:a")])` | `[diag("identity.duplicate", "shop:a", "id", { detail: "2" })]` |
| LOC-008 | revision-compare: `a` = the `checkout` fixture with `metadata: { source: "src/checkout.ts" }`, `b` = the same with `metadata: { source: "lib/checkout.ts", line: "12" }` | `{ sameLocus: true, sameId: true }` |
| LOC-009 | revision-compare: `a` = `checkout`, `b` = `checkout` with `owner: "shop:orders"` | `{ sameLocus: true, sameId: false }` |
| LOC-010 | `fabric("cat:f", [locus("shop:a", { charter: { purpose: "Sell.", responsibilities: ["Take orders"], excluded: ["Ship goods"], successConditions: ["Orders are recorded"] } })])` | valid |
| LOC-011 | Locus `shop:a` with purpose `"   "` | `[diag("charter.purpose-blank", "shop:a", "charter.purpose")]` |
| LOC-012 | Locus `shop:a` with `responsibilities: []` | `[diag("charter.responsibilities-empty", "shop:a", "charter.responsibilities")]` |
| LOC-013 | Locus `shop:a` with `responsibilities: ["Do", " "]`, `excluded: [""]` | `[diag("charter.entry-blank", "shop:a", "charter.excluded"), diag("charter.entry-blank", "shop:a", "charter.responsibilities")]` |
| LOC-014 | Locus `shop:a` with `responsibilities: ["Do", "Do"]`, `successConditions: ["Done", "Done"]` | `[diag("charter.entry-duplicate", "shop:a", "charter.responsibilities", { detail: "Do" }), diag("charter.entry-duplicate", "shop:a", "charter.successConditions", { detail: "Done" })]` |

The `checkout` fixture (shared, exact):

```ts
const checkout: LocusJson = {
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: { purpose: "Turn a basket into an order.", responsibilities: ["Collect payment details"] },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
};
```

### Subtask T040 – LOC-015 to LOC-020 (ownership)

| Id | Input | `expect` |
| --- | --- | --- |
| LOC-015 | `org:root`; `org:mid` owned by `org:root`; `org:leaf` owned by `org:mid` | valid |
| LOC-016 | `shop:a` with owner `shop:ghost` | `[diag("owner.missing", "shop:a", "owner", { detail: "shop:ghost" })]` |
| LOC-017 | `shop:a` with owner `shop:a` | `[diag("owner.self", "shop:a", "owner")]` |
| LOC-018 | `shop:a` owned by `shop:b`; `shop:b` owned by `shop:a` | `[diag("owner.cycle", "shop:a", "owner", { members: ["shop:a", "shop:b"] })]` |
| LOC-019 | `shop:a` owned by `shop:b`; `shop:b` owned by `shop:c`; `shop:c` owned by `shop:a`; `shop:x` owned by `shop:c`. List the Loci in the order `shop:x`, `shop:c`, `shop:b`, `shop:a`. | `[diag("owner.cycle", "shop:a", "owner", { members: ["shop:a", "shop:b", "shop:c"] })]` |
| LOC-020 | `deep:l0`, plus `deep:l1`…`deep:l199`, where `deep:l<i>` is owned by `deep:l<i-1>` (generated with `Array.from`) | valid |

LOC-019's members follow the owner direction: `shop:a`'s owner is `shop:b`, whose owner is `shop:c`. The diagnostic is reported once, and nothing is reported for `shop:x`.

### Subtask T041 – LOC-021 to LOC-029 (Relations)

| Id | Kind | Input | `expect` |
| --- | --- | --- | --- |
| LOC-021 | validate | `shop:a` with `depends-on shop:b`, `refines shop:c`, `satisfies shop:d`, `verifies shop:e`. Loci `shop:b`…`shop:e` exist. | valid |
| LOC-022 | decode | `JSON.stringify(fabric("cat:f", [{ ...locus("shop:a"), relations: [{ kind: "owns", target: "shop:b" }] }]))` | `{ ok: false, paths: ["loci[0].relations[0].kind"] }` |
| LOC-023 | validate | `shop:a` with `depends-on shop:ghost` | `[diag("relation.target-missing", "shop:a", "relations", { detail: "depends-on shop:ghost" })]` |
| LOC-024 | validate | `shop:a` with `depends-on shop:a` | `[diag("relation.self", "shop:a", "relations", { detail: "depends-on shop:a" })]` |
| LOC-025 | validate | `shop:a` with `depends-on shop:b` twice. `shop:b` exists. | `[diag("relation.duplicate", "shop:a", "relations", { detail: "depends-on shop:b" })]` |
| LOC-026 | validate | `shop:a` with `depends-on shop:b` and `verifies shop:b` | valid |
| LOC-027 | validate | `shop:a refines shop:b`, `shop:b refines shop:c`, `shop:c refines shop:a` | `[diag("relation.refines-cycle", "shop:a", "relations", { members: ["shop:a", "shop:b", "shop:c"] })]` |
| LOC-028 | validate | the same three Loci, with `depends-on` instead of `refines` | valid |
| LOC-029 | validate | `shop:a refines shop:b`, `shop:b refines shop:c` | valid |

The LOC-022 input must be **text** (`decode` checks take `input: string`).

### Subtask T042 – LOC-030 to LOC-044

The **LOC-030 Fabric** is shared with LOC-031 and LOC-032:

```ts
const mixed: FabricJson = fabric("cat:mixed", [
  locus("Bad"),
  locus("shop:b", { charter: { purpose: " ", responsibilities: ["Work of b", "Also b"] } }),
  locus("shop:c", { owner: "shop:ghost" }),
  locus("shop:d", { relations: [{ kind: "depends-on", target: "shop:ghost" }, { kind: "depends-on", target: "shop:b" }] }),
]);
```

`mixedReordered` puts the Loci in reverse order and also reverses each Locus's `responsibilities` and `relations`.

| Id | Kind | Input | `expect` |
| --- | --- | --- | --- |
| LOC-030 | validate | `mixed` | `[diag("identity.malformed", "Bad", "id"), diag("charter.purpose-blank", "shop:b", "charter.purpose"), diag("owner.missing", "shop:c", "owner", { detail: "shop:ghost" }), diag("relation.target-missing", "shop:d", "relations", { detail: "depends-on shop:ghost" })]` |
| LOC-031 | validate-stable | `variants: [mixed, mixedReordered]`, `runs: 1` | `"identical"` |
| LOC-032 | validate-stable | `variants: [mixed, mixed]`, `runs: 5` | `"identical"` |
| LOC-033 | revision-immutable | `checkout` | `"immutable"` |
| LOC-034 | revision-compare | `a` = `{ id: "shop:catalogue", charter: { purpose: "Present products.", responsibilities: ["Show prices", "List products", "Show prices"], excluded: ["Take payments"] }, metadata: { team: "web" } }`; `b` = its canonical definition written out: `{ id: "shop:catalogue", charter: { purpose: "Present products.", responsibilities: ["List products", "Show prices"], excluded: ["Take payments"], successConditions: [] }, relations: [] }` | `{ sameLocus: true, sameId: true }` |
| LOC-035 | history | `revisions: [checkout, checkoutPaid]`, `steps: [{ append: 0, expectedHead: null }, { append: 1, expectedHead: 0 }]` | `{ outcomes: ["appended", "appended"], entries: [0, 1] }` |
| LOC-036 | history | `revisions: [checkout, checkoutPaid, checkoutRenamed]`, steps `(0, null)`, `(1, 0)`, `(2, 0)` | `{ outcomes: ["appended", "appended", "stale"], entries: [0, 1] }` |
| LOC-037 | history | `revisions: [checkout, checkoutPaid]`, steps `(0, 1)` | `{ outcomes: ["stale"], entries: [] }` |
| LOC-038 | history | `revisions: [checkout, checkoutPaid]`, steps `(0, null)`, `(0, 0)`, `(1, 0)`, `(0, 1)` | `{ outcomes: ["appended", "no-op", "appended", "appended"], entries: [0, 1, 0] }` |
| LOC-039 | revision-compare | `a` = `payment` with `metadata: { source: "a" }`; `b` = `payment` with `responsibilities` and `relations` reversed and `metadata: { source: "b" }` | `{ sameLocus: true, sameId: true }` |
| LOC-040 | diff | `from` = `checkout` without `relations`; `to` = the same with purpose `"Turn a basket into a paid order."` and `relations: [{ kind: "depends-on", target: "shop:payment" }]` | `{ ok: true, changes: [{ part: "charter.purpose", kind: "changed", from: "Turn a basket into an order.", to: "Turn a basket into a paid order." }, { part: "relations", kind: "added", value: "depends-on shop:payment" }] }` |
| LOC-041 | diff | `from` = `locus("shop:a")`, `to` = `locus("shop:b")` | `{ ok: false, error: "LocusMismatchError" }` |
| LOC-042 | decode | `"{"` | `{ ok: false, paths: [""] }` |
| LOC-043 | decode | `JSON.stringify({ id: "cat:f", loci: [{ id: "shop:a" }, { id: "shop:b", charter: { purpose: 3, responsibilities: ["x"] } }, { ...locus("shop:c"), extra: true }] })` | `{ ok: false, paths: ["loci[0].charter", "loci[1].charter.purpose", "loci[2].extra"] }` |
| LOC-044 | validate | `fabric("cat:empty", [])` | valid |

Fixtures:

- `checkoutPaid` is `checkout` with purpose `"Turn a basket into a paid order."`.
- `checkoutRenamed` is `checkout` with purpose `"Create orders."`.
- `payment` is:
  ```ts
  { id: "shop:payment", owner: "shop:storefront",
    charter: { purpose: "Authorise payments.", responsibilities: ["Call the payment provider", "Record the outcome"], successConditions: ["Every payment has an outcome"] },
    relations: [{ kind: "verifies", target: "shop:checkout" }, { kind: "depends-on", target: "shop:ledger" }] }
  ```

Why LOC-030 has this order: `"Bad"` sorts before `"shop:…"` because `"B"` (0x42) is less than `"s"` (0x73). `shop:d`'s second Relation, to `shop:b`, is valid. It exists only so that LOC-031's reordering has something to reorder.

**Contract note on LOC-044**: the record rule says `invariants` "may be empty only for decode checks", but the catalogue table gives LOC-044 (a `validate` check) no invariant. Keep `invariants: []` as the table says. The integrity test allows empty invariants for `decode` records and for the explicitly listed exception `["LOC-044"]`. Report this tension in your final report so it can be recorded.

### Subtask T043 – `examples.ts` and `goldens.ts`

```ts
/** Starting inputs for the playground scenarios. Plain JSON. */
export const examples: {
  readonly valid: FabricJson;
  readonly invalid: FabricJson;
  readonly relations: FabricJson;
  readonly history: { readonly a: LocusJson; readonly b: LocusJson };
};
```

- `valid`: the contract's example Fabric `shop:system`, with `shop:storefront`, `shop:checkout` and `shop:payment`. Copy it from `locus-api.md` **Wire format**.
- `invalid`: the same Fabric, except that `shop:checkout` has `purpose: ""` and `responsibilities: ["Collect payment details", "Collect payment details"]`.
- `relations`: the same Fabric, except that `shop:checkout` has `relations: [{ kind: "refines", target: "shop:payment" }]`, `shop:payment` has `relations: [{ kind: "refines", target: "shop:checkout" }]`, and `shop:storefront` has `relations: [{ kind: "depends-on", target: "shop:ghost" }]`.
- `history.a`: the contract's `shop:checkout`. `history.b`: the same with `responsibilities: ["Collect payment and delivery details"]`.

The contract types `examples` as `Readonly<Record<…, unknown>>`. The precise type above is compatible with that, and the playground needs it.

`test/examples.test.ts` asserts these exact outcomes:

- `valid` gives `{ valid: true, diagnostics: [] }`.
- `invalid` gives exactly `[diag("charter.entry-duplicate", "shop:checkout", "charter.responsibilities", { detail: "Collect payment details" }), diag("charter.purpose-blank", "shop:checkout", "charter.purpose")]`, with `message` stripped.
- `relations` gives exactly `[diag("relation.refines-cycle", "shop:checkout", "relations", { members: ["shop:checkout", "shop:payment"] }), diag("relation.target-missing", "shop:storefront", "relations", { detail: "depends-on shop:ghost" })]`.
- For `history`: the two have the same `locus` and different ids, and `diffRevisions(a, b)` gives exactly `[{ part: "charter.responsibilities", kind: "removed", value: "Collect payment details" }, { part: "charter.responsibilities", kind: "added", value: "Collect payment and delivery details" }]`.

`goldens.ts`:

```ts
/** Revision ids of every revision-compare fixture, computed independently of this code with `shasum -a 256` over canonical form v1. */
export const revisionGoldens: Readonly<Record<string, `sha256:${string}`>> = {
  "LOC-008.a": "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-008.b": "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-009.a": "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-009.b": "sha256:a7ab044ffa34fd3a0e5e2e044da0f49c7757c1e3cabc276173f18c698ddfe20b",
  "LOC-034.a": "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "LOC-034.b": "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "LOC-039.a": "sha256:8a9333897e78439849c9d89b9f873187b2045c9e646a00633bf48c7981f9c4bd",
  "LOC-039.b": "sha256:8a9333897e78439849c9d89b9f873187b2045c9e646a00633bf48c7981f9c4bd",
};
```

These values only hold if the fixtures are **exactly** as written above. For example, the canonical string for LOC-009.b is `{"v":1,"id":"shop:checkout","charter":{"purpose":"Turn a basket into an order.","responsibilities":["Collect payment details"],"excluded":[],"successConditions":[]},"owner":"shop:orders","relations":[{"kind":"depends-on","target":"shop:payment"}]}`. If a golden does not match, compare your fixture with this prompt first.

Append to `src/index.ts`:

```ts
export { catalogue } from "./catalogue";
export { examples } from "./examples";
export { revisionGoldens } from "./goldens";
```

### Subtask T044 – Adapter, integrity, mutation pass, determinism

**`test/specifications.test.ts`**:

```ts
for (const spec of catalogue) {
  test(`${spec.id} ${spec.title}`, async () => {
    const result = await Effect.runPromise(runSpecification(spec));
    if (result.status !== "pass") console.error(JSON.stringify({ expected: result.expected, observed: result.observed }, null, 2));
    expect(result.status).toBe("pass");
  });
}
```

In the same file, add a `describe("catalogue integrity")` block that checks:

- ids are exactly `LOC-001`…`LOC-044`, in order;
- titles are not blank;
- each record survives a JSON round trip unchanged (`toEqual`);
- each invariant matches `/^INV-0(0[1-9]|1[0-4])$/`, and invariants are empty only for `decode` records and `LOC-044`;
- for each of `INV-001`…`INV-012`, at least one `positive` and one `negative` record list it (NFR-007);
- each of `NS-001`…`NS-017` appears in some record's `scenarios`;
- each `kind`, `polarity`, invariant and scenario matches the contract table. Paste the table into the test as a compact array of `[id, kind, polarity, invariant | null, scenario | null]`.

**`test/catalogue-mutation.test.ts`**: for every record, build one mutated copy with `structuredClone` and assert `status === "fail"`. The mutation depends on the kind:

- `validate`: flip `valid`. If there are diagnostics, also drop the last one. Otherwise add `diag("owner.self", "x:x", "owner")`.
- `validate-stable`: `expect = "different"`.
- `decode`: if `ok` is true, use `{ ok: false, paths: [""] }`. Otherwise append `"zzz"` to `paths`.
- `revision-compare`: flip `sameId`.
- `revision-immutable`: `expect = "mutable"`.
- `history`: append `"stale"` to `outcomes`.
- `diff`: if `ok` is true, append `{ part: "owner", kind: "changed", from: null, to: "x:x" }`. Otherwise use `{ ok: true, changes: [] }`.

Type the mutated value loosely, for example as `unknown` cast through the record. The test is about the runner, not about types.

**`test/determinism.test.ts`** (NFR-001, Bun side):

- For each `revision-compare` record, decode `a` and `b`, create both Revisions, and assert `id === revisionGoldens["<id>.a"]` and `revisionGoldens["<id>.b"]`. Also assert that every `revision-compare` record has both golden keys.
- Validate the LOC-030 Fabric 100 times and assert that every `JSON.stringify` output is equal.

Then:

- Run `bun test packages/locus-specs`: 44 adapter tests plus the integrity, mutation, examples and determinism tests pass.
- Run `bun run verify`.

## Definition of Done

- [ ] `catalogue.ts` has 44 records that match the contract table and this prompt.
- [ ] `examples.ts` and `goldens.ts` exist and are exported.
- [ ] The adapter, integrity, mutation, examples and determinism tests pass.
- [ ] The final report lists every record whose expectation differs from this prompt, with the contract rule it follows (ideally none), and mentions the LOC-044 tension.
- [ ] `bun run verify` passes.

## Risks

- **Fitting expectations to the output.** See ⛔ above. The reviewer will diff your expectations against this prompt.
- **Sort order**: `"Shop:…"` or `"Bad"` sorts before lowercase subjects.
- **Fixture drift**: a one-character change to a fixture changes its golden id.

## Reviewer Guidance

- Diff every `expect` in `catalogue.ts` against the tables in this prompt.
- Check that the mutation test covers all 44 records: `catalogue.length` is used, not a hand-picked subset.
- Run `bun test packages/locus-specs` and `bun run verify`.
