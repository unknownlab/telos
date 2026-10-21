---
work_package_id: WP03
title: Validation
dependencies:
- WP02
requirement_refs:
- FR-005
- FR-006
- FR-007
- NFR-001
- NFR-002
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T013
- T014
- T015
- T016
- T017
- T018
phase: Phase 2 - Core package
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus/src/
create_intent:
- packages/locus/src/diagnostic.ts
- packages/locus/src/validate.ts
- packages/locus/test/diagnostic.test.ts
- packages/locus/test/validate.test.ts
- packages/locus/test/validate-determinism.test.ts
- packages/locus/test/validate-performance.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus/src/diagnostic.ts
- packages/locus/src/validate.ts
- packages/locus/test/diagnostic.test.ts
- packages/locus/test/validate.test.ts
- packages/locus/test/validate-determinism.test.ts
- packages/locus/test/validate-performance.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP03 – Validation

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

Implement `validateFabric(fabric) => ValidationReport`. It is a **pure, total** function: it never throws and never returns an Effect. It reports **every** violation of INV-001 to INV-008 as a `Diagnostic`, with the stable codes from `contracts/locus-api.md`, in an order that depends only on content.

Done means:

1. All 13 diagnostic codes are produced exactly as in the contract table: scope, subject, path, detail and members.
2. Reordering Loci, Charter entries or Relations never changes the output. Validating the same Fabric 100 times gives byte-identical `JSON.stringify` (NFR-001).
3. Each cycle is reported once, on its smallest member, with members in cycle order starting there. Loci that lead into a cycle are not reported. A self-owner gives `owner.self` only, and a self-`refines` gives `relation.self` only.
4. A 200-level ownership chain validates without recursion. 1,000 Loci with 3 Relations each validate in under 1 s (NFR-002, `validate-performance.test.ts`).
5. The tests were written first and seen failing. `bun run verify` passes.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md` — **Diagnostic codes** and their rules (**authoritative**)
- `kitty-specs/locus-foundation-01M5EWDR/data-model.md` — Charter rules, Diagnostic, ValidationReport
- `kitty-specs/locus-foundation-01M5EWDR/research.md` R-03
- `kitty-specs/locus-foundation-01M5EWDR/spec.md` — User Story 1, NS-001 to NS-012, Edge Cases
- `packages/locus/src/{identity,locus,fabric,freeze}.ts` from WP02

The order key is (subject, code, path, detail, members joined with `,`), each compared by UTF-16 code unit: `a < b ? -1 : a > b ? 1 : 0`. Never use `localeCompare`, because it depends on the locale. A missing `detail` or `members` counts as the empty string.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP03 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append your export lines to `packages/locus/src/index.ts` and its `START_MODULE_MAP`. Name the edit in your commit body.
- No new dependencies. Portability: no `bun`, `node:*`, `process` or `Buffer` in `src/`.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree. Put evidence in your final report and commit body.
- Test-first, no fake tests. With `exactOptionalPropertyTypes`, optional fields are absent, never `undefined`.
- Style: double quotes, semicolons, trailing commas, extensionless imports. Run `bun run format`.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/`, `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commits follow Conventional Commits, for example `feat(locus): validate Fabrics with stable diagnostics`. No AI names, no `Co-Authored-By` line.
- GRACE file markup in every new source file. `LINKS: M-LOCUS-VALIDATION` and `DEPENDS: M-LOCUS-MODEL`. Add a `START_CONTRACT` block plus TSDoc for each export, and `START_BLOCK_<NAME>` / `END_BLOCK_<NAME>` around each check phase inside `validateFabric` (see `scripts/review-gate.ts` for the block style).

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP03 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T013 – `diagnostic.ts`

```ts
import type { Identity } from "./identity";

/** Stable diagnostic codes. Adding a code is allowed; renaming or removing one is breaking. */
export type DiagnosticCode =
  | "identity.malformed"
  | "identity.duplicate"
  | "charter.purpose-blank"
  | "charter.responsibilities-empty"
  | "charter.entry-blank"
  | "charter.entry-duplicate"
  | "owner.missing"
  | "owner.self"
  | "owner.cycle"
  | "relation.target-missing"
  | "relation.self"
  | "relation.duplicate"
  | "relation.refines-cycle";

/** One reported rule violation. `message` is for people and is not part of any contract. */
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly scope: "fabric" | "locus";
  readonly subject: string;
  readonly path: string;
  readonly detail?: string;
  readonly members?: ReadonlyArray<Identity>;
  readonly message: string;
}

/** The result of validating a Fabric. `valid` is true exactly when there are no diagnostics. */
export interface ValidationReport {
  readonly valid: boolean;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}
```

Also add two functions. Both are exported from `diagnostic.ts`, but **not** from `index.ts`.

- `makeDiagnostic(fields)` builds the object with keys in this fixed order: `code, scope, subject, path, detail, members, message`. Leave out `detail` and `members` when they are not given. A fixed key order keeps `JSON.stringify` byte-stable.
- `compareDiagnostics(a, b)` implements the order key above.

**`test/diagnostic.test.ts`**: `compareDiagnostics` orders by subject first, then code, then path, then detail, then members. It puts a diagnostic with no detail before one with a detail. It compares by code unit, so `"B" < "a"` and `"Z:x" < "a:x"`. `makeDiagnostic` key order is checked with `Object.keys`.

### Subtask T014 – Write the failing validation tests

**`packages/locus/test/validate.test.ts`**. Build inputs with `defineLocus`/`defineFabric`. Compare diagnostics **without** `message` using a helper:

```ts
const strip = (r: ValidationReport) => r.diagnostics.map(({ message: _m, ...rest }) => rest);
```

Required cases. Expected values are exact:

1. **US1-1 (valid)**: `shop:storefront` owns `shop:checkout` and `shop:payment`, and `shop:checkout` `depends-on` `shop:payment`. The result is `{ valid: true, diagnostics: [] }`.
2. **US1-2**: one Locus with `id: "Shop:Checkout"`, `purpose: " "`, `responsibilities: ["Take orders"]` and `relations: [{ kind: "depends-on", target: "shop:payment" }]`, inside Fabric `shop:system`. Exactly:
   ```ts
   [
     { code: "charter.purpose-blank", scope: "locus", subject: "Shop:Checkout", path: "charter.purpose" },
     { code: "identity.malformed", scope: "locus", subject: "Shop:Checkout", path: "id" },
     { code: "relation.target-missing", scope: "locus", subject: "Shop:Checkout", path: "relations", detail: "depends-on shop:payment" },
   ]
   ```
3. **US1-3**: the same invalid Fabric with Loci, responsibilities and Relations reversed gives an identical `JSON.stringify(report)`.
4. Fabric id `"System"` gives `{ code: "identity.malformed", scope: "fabric", subject: "System", path: "id" }`.
5. Two Loci with id `shop:a` (and otherwise valid) give exactly one `{ code: "identity.duplicate", scope: "locus", subject: "shop:a", path: "id", detail: "2" }`. With three of them the detail is `"3"`.
6. Empty responsibilities give `charter.responsibilities-empty` at path `charter.responsibilities`.
7. Responsibilities `["a", " ", ""]` give **one** `charter.entry-blank` at `charter.responsibilities`. Excluded `[""]` gives one at `charter.excluded`.
8. Responsibilities `["a", "a", "b", "b", "b"]` give two `charter.entry-duplicate` at `charter.responsibilities`, with details `"a"` and `"b"`. A duplicated success condition gives one at `charter.successConditions`.
9. Owner `shop:ghost`, which is not in the Fabric, gives `{ code: "owner.missing", …, path: "owner", detail: "shop:ghost" }`. A malformed owner `"Ghost"` that exists nowhere gives `owner.missing` with detail `"Ghost"`, not a malformed-identity diagnostic.
10. A Locus owning itself gives exactly one diagnostic, `owner.self` (path `owner`, no detail), and **no** `owner.cycle`.
11. **Ownership cycle of two**: `shop:b` is owned by `shop:a`, and `shop:a` is owned by `shop:b`. The result is exactly one `{ code: "owner.cycle", scope: "locus", subject: "shop:a", path: "owner", members: ["shop:a", "shop:b"] }`.
12. **Ownership cycle of three plus a lead-in**: the owners are `shop:c → shop:a`, `shop:a → shop:b`, `shop:b → shop:c`, and `shop:x → shop:c`. Here `X → Y` means X's owner is Y. The result is exactly one diagnostic, `owner.cycle` on `shop:a`, with `members: ["shop:a", "shop:b", "shop:c"]`. Nothing is reported for `shop:x`.
13. An ownership chain 200 levels deep (`deep:l0` is the root and `deep:l<i>` is owned by `deep:l<i-1>`) is valid.
14. One Relation of each kind to existing other Loci is valid. The same target with two different kinds is valid.
15. A Relation to itself gives `relation.self` with detail `"refines shop:a"` (for kind `refines`), and **no** `relation.refines-cycle`.
16. The same `(kind, target)` twice gives one `relation.duplicate` with detail `"depends-on shop:b"`.
17. **`refines` cycle of three**: `shop:a refines shop:b`, `shop:b refines shop:c`, `shop:c refines shop:a`. The result is one `{ code: "relation.refines-cycle", scope: "locus", subject: "shop:a", path: "relations", members: ["shop:a", "shop:b", "shop:c"] }`.
18. A `depends-on` cycle of three is valid (NS-011). A `refines` chain without a cycle is valid.
19. **NS-012**: one Fabric with a malformed identity, a blank purpose on another Locus, a missing owner on a third and a missing Relation target on a fourth. All four are reported, in order.
20. An owner that is itself invalid (blank purpose) still counts as existing. Only `charter.purpose-blank` is reported, on the owner.
21. An empty Fabric is valid.
22. `validateFabric` does not throw on odd strings (`""` ids, Unicode).

**`packages/locus/test/validate-determinism.test.ts`** (NFR-001):

- Validate the case-19 Fabric 100 times. All `JSON.stringify` outputs are equal.
- Validate it with its Loci in 5 different permutations, each with its Charter entries and Relations reversed. All outputs are equal.

**`packages/locus/test/validate-performance.test.ts`** (NFR-002):

```ts
import { expect, test } from "bun:test";
import { defineFabric, defineLocus, validateFabric } from "../src/index";

test("1,000 Loci with 3 Relations each validate in under 1 s", () => {
  const n = 1000;
  const id = (i: number) => `perf:l${i}`;
  const loci = Array.from({ length: n }, (_, i) =>
    defineLocus({
      id: id(i),
      ...(i === 0 ? {} : { owner: id(Math.floor((i - 1) / 2)) }),
      charter: { purpose: `Locus ${i}`, responsibilities: [`Do ${i}`] },
      relations: [1, 2, 3].map((k) => ({ kind: "depends-on" as const, target: id((i + k) % n) })),
    }),
  );
  const fabric = defineFabric({ id: "perf:fabric", loci });
  const start = performance.now();
  const report = validateFabric(fabric);
  const elapsed = performance.now() - start;
  expect(report.valid).toBe(true);
  expect(elapsed).toBeLessThan(1000);
});
```

Run the tests and confirm they fail because `validateFabric` is missing.

### Subtask T015 – `validate.ts`: structure, identity and Charter checks

```ts
const BLANK = /^\s*$/u;
const SET_FIELDS = ["responsibilities", "excluded", "successConditions"] as const;
```

Outline of `validateFabric`. Use exactly these phases, each in a `START_BLOCK_…`:

1. **FABRIC_IDENTITY**: if `!isIdentity(fabric.id)`, report `identity.malformed` with scope `fabric`, subject `fabric.id`, path `id`.
2. **COUNT_IDENTITIES**: `counts: Map<string, number>` over `fabric.loci`. For each distinct id: if it is malformed, report `identity.malformed` once (scope `locus`). If its count is above 1, report `identity.duplicate` once, with detail `String(count)`.
3. **CHARTER**, for each Locus:
   - If `BLANK.test(purpose)`, report `charter.purpose-blank` at path `charter.purpose`.
   - If `responsibilities.length === 0`, report `charter.responsibilities-empty` at path `charter.responsibilities`.
   - For each field in `SET_FIELDS`: if any entry is blank, report **one** `charter.entry-blank` at path `charter.<field>`. Then, for each distinct **non-blank** value that occurs more than once, report one `charter.entry-duplicate` with `detail: value`.
4. **OWNER**, for each Locus with an `owner`: if `owner === id`, report `owner.self`. Otherwise, if `!counts.has(owner)`, report `owner.missing` with `detail: owner`.
5. **RELATIONS**, for each Locus, with `key = \`${kind} ${target}\``. If `target === id`, report `relation.self` with `detail: key`. Otherwise, if `!counts.has(target)`, report `relation.target-missing` with `detail: key`. Then, for each key that occurs more than once in that Locus, report one `relation.duplicate` with `detail: key`.
6. **OWNERSHIP_CYCLES** (T016) and **REFINES_CYCLES** (T017).
7. **ORDER**: sort with `compareDiagnostics`, then drop exact repeats (`JSON.stringify` equal to the previous item). Repeats can only come from two Loci sharing a duplicated id. Return `deepFreeze({ valid: diagnostics.length === 0, diagnostics })`.

All diagnostics have scope `locus` and subject = the Locus `id` (the raw string), except where stated otherwise. Write short, fixed messages, for example `Charter purpose is blank.` or `Owner "shop:ghost" is not in the Fabric.`.

**Cycle checks only use Loci whose id occurs exactly once** (`counts.get(id) === 1`). A duplicated id is already reported, and its edges would be ambiguous.

### Subtask T016 – Ownership cycles (iterative)

Build `ownerOf: Map<Identity, Identity>`. It holds an entry for a unique Locus whose owner is not itself and is also a unique Locus. Then walk each chain once:

```ts
// state: 1 = on the current path, 2 = finished
const state = new Map<Identity, 1 | 2>();
for (const start of [...uniqueIds].sort()) {
  if (state.has(start)) continue;
  const path: Identity[] = [];
  let current: Identity | undefined = start;
  while (current !== undefined && !state.has(current)) {
    state.set(current, 1);
    path.push(current);
    current = ownerOf.get(current);
  }
  if (current !== undefined && state.get(current) === 1) {
    const cycle = path.slice(path.indexOf(current));
    report(rotateToSmallest(cycle)); // owner.cycle, subject = members[0], path "owner", members
  }
  for (const p of path) state.set(p, 2);
}
```

`rotateToSmallest` finds the smallest member by code unit and rotates the list so that it comes first, keeping the order: `[...c.slice(i), ...c.slice(0, i)]`. The members follow the owner direction (A's owner is B, so B comes after A). Every node is visited once, so a 200-level chain costs 200 steps and no recursion.

### Subtask T017 – `refines` cycles (iterative SCC)

The nodes are the unique ids, sorted. The edges are the `refines` Relations of unique Loci whose target is a unique Locus other than the source, de-duplicated and sorted. Find the strongly connected components with an **iterative** Tarjan:

```ts
function components(nodes: ReadonlyArray<string>, edges: ReadonlyMap<string, ReadonlyArray<string>>): string[][] {
  let next = 0;
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const out: string[][] = [];
  const open = (n: string) => {
    index.set(n, next);
    low.set(n, next);
    next += 1;
    stack.push(n);
    onStack.add(n);
  };
  for (const root of nodes) {
    if (index.has(root)) continue;
    open(root);
    const work: Array<{ node: string; i: number }> = [{ node: root, i: 0 }];
    while (work.length > 0) {
      const frame = work[work.length - 1]!;
      const targets = edges.get(frame.node) ?? [];
      if (frame.i < targets.length) {
        const t = targets[frame.i]!;
        frame.i += 1;
        if (!index.has(t)) {
          open(t);
          work.push({ node: t, i: 0 });
        } else if (onStack.has(t)) {
          low.set(frame.node, Math.min(low.get(frame.node)!, index.get(t)!));
        }
      } else {
        work.pop();
        const parent = work[work.length - 1];
        if (parent) low.set(parent.node, Math.min(low.get(parent.node)!, low.get(frame.node)!));
        if (low.get(frame.node) === index.get(frame.node)) {
          const component: string[] = [];
          let w: string;
          do {
            w = stack.pop()!;
            onStack.delete(w);
            component.push(w);
          } while (w !== frame.node);
          out.push(component);
        }
      }
    }
  }
  return out;
}
```

Report each component with **two or more** members once, as `relation.refines-cycle` with subject = the smallest member, path `relations` and `members` in cycle order:

```ts
// Start at the smallest member. Repeatedly go to the smallest unvisited member that the current
// member refines; if there is none, take the smallest unvisited member of the component.
```

For a simple cycle, this gives the cycle order: `["shop:a", "shop:b", "shop:c"]` for test 17. A self-loop is never an edge, so a single-node component is never reported.

### Subtask T018 – Determinism, performance, exports, markup

Append to `index.ts`:

```ts
export type { Diagnostic, DiagnosticCode, ValidationReport } from "./diagnostic";
export { validateFabric } from "./validate";
```

Then:

- `bun test packages/locus` passes, including the determinism and performance files.
- Prove the tests bite. Temporarily (a) remove the sort, (b) make cycle detection report every member, and (c) swap the self-owner check after the missing check. Each change must break at least one test. Restore the code, and record which tests failed in your report.
- `bun run verify` passes.

## Definition of Done

- [ ] `diagnostic.ts` and `validate.ts` exist, with markup and TSDoc on every export.
- [ ] All 22 validation cases, the determinism tests and the performance test pass, and were seen failing first.
- [ ] Three deliberate breakages each failed a test (listed in the report).
- [ ] There is no recursion anywhere in `validate.ts`.
- [ ] `bun run verify` passes.

## Risks

- **Order dependence**: never iterate a `Map` or `Set` built from input order when emitting. Sort ids first, or rely on the final sort. The final sort covers emission order, but the cycle *members* order must come from the rules above.
- **Double reporting**: the self-owner and self-refines rules. A malformed owner must count as missing, not malformed.

## Reviewer Guidance

- Check the exact expected arrays in cases 2, 11, 12 and 17 against the contract.
- Check that `localeCompare` and recursion are absent (`grep -n "localeCompare\|function .*(.*) {" src/validate.ts`, and read it).
- Run `bun test packages/locus` and `bun run verify`.
