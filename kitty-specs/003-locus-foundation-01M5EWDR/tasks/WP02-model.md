---
work_package_id: WP02
title: 'Model: identity, Charter, Relation, Locus, Fabric'
dependencies:
- WP01
requirement_refs:
- FR-001
- FR-002
- FR-003
- FR-004
- NFR-006
planning_base_branch: feat/locus-foundation
merge_target_branch: feat/locus-foundation
branch_strategy: Planning artifacts for this mission were generated on feat/locus-foundation. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/locus-foundation unless the human explicitly redirects the landing branch.
subtasks:
- T007
- T008
- T009
- T010
- T011
- T012
phase: Phase 2 - Core package
history:
- !!omap
  - at: '2026-10-21T10:18:46Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: implementer-ivan
authoritative_surface: packages/locus/src/
create_intent:
- packages/locus/src/identity.ts
- packages/locus/src/charter.ts
- packages/locus/src/relation.ts
- packages/locus/src/freeze.ts
- packages/locus/src/locus.ts
- packages/locus/src/fabric.ts
- packages/locus/test/identity.test.ts
- packages/locus/test/locus.test.ts
- packages/locus/test/fabric.test.ts
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- packages/locus/src/identity.ts
- packages/locus/src/charter.ts
- packages/locus/src/relation.ts
- packages/locus/src/freeze.ts
- packages/locus/src/locus.ts
- packages/locus/src/fabric.ts
- packages/locus/test/identity.test.ts
- packages/locus/test/locus.test.ts
- packages/locus/test/fabric.test.ts
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP02 – Model: identity, Charter, Relation, Locus, Fabric

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

Implement the Stage 0 value types and their two constructors in `@telos/locus`: Identity, Charter, Relation, LocusDefinition, LocusInput and Fabric, plus `isIdentity`, `defineLocus` and `defineFabric`. Everything follows `contracts/locus-api.md` exactly.

Done means:

1. `isIdentity` is true exactly for the grammar in data-model.md, with a maximum length of 128.
2. `defineLocus` copies its input, defaults missing sets to `[]`, keeps order and duplicates as given, returns a deeply frozen value and never throws.
3. `defineFabric` copies (through `defineLocus`) and deeply freezes.
4. `RELATION_KINDS` is `["depends-on", "refines", "satisfies", "verifies"]` in this order, and frozen.
5. Every exported symbol has a TSDoc comment and a GRACE `START_CONTRACT` block (NFR-006).
6. The tests were written first and seen failing. `bun run verify` passes.

**Not in this WP**: validation (WP03), revisions (WP04), history (WP05), decoding (WP06). Identity grammar is **checked by validation**, not enforced by the type: `Identity` is a plain `string` alias.

## Context & Constraints

Read first:

- `kitty-specs/locus-foundation-01M5EWDR/contracts/locus-api.md` — Types, Functions (`isIdentity`, `defineLocus`, `defineFabric`), Portability (**authoritative**)
- `kitty-specs/locus-foundation-01M5EWDR/data-model.md` — Identity, Charter, Relation, LocusDefinition, Fabric
- `packages/locus/src/index.ts` (entry module from WP01)
- `scripts/check-bun-version.ts`, an example of the GRACE file markup used in this repo

Portability (C-004, NFR-003): `packages/locus/src` may use only ECMAScript built-ins, `globalThis.crypto.subtle`, `TextEncoder` and `effect`. There are no imports of `bun`, `bun:*` or `node:*`, and no `process`/`Buffer`. The `src` tsconfig has `types: []`, so the type check catches most violations.

## Rules (all WPs of this mission)

- Work only inside the worktree that `spec-kitty agent action implement WP02 --agent claude` gives you. Run `bun install --frozen-lockfile` there first if `node_modules/` is missing.
- Stay inside `owned_files`. **Sanctioned shared edit**: append export lines for your modules to `packages/locus/src/index.ts`, and update its `START_MODULE_MAP`. Name the edit in your commit body.
- No new dependencies, and no version changes.
- **Never edit or delete anything under `kitty-specs/`** in your lane worktree. Put evidence in your final report and commit body.
- Test-first: write the tests, run them, and see them fail for the right reason (missing module or wrong value) before implementing.
- No fake tests: a test must fail when the behavior it names breaks.
- TypeScript strict with `exactOptionalPropertyTypes`: an optional property is either absent or has a value. Never assign `undefined` to it.
- Style: double quotes, semicolons, trailing commas, **extensionless** relative imports (`./identity`). Run `bun run format` before committing.
- Never use `--no-verify`, `--force`, `--skip-*` or `*_DISABLE` variables. Do not push. Do not touch `.grace/` (WP17 registers modules), `AGENTS.md`, `CLAUDE.md` or `.kittify/`.
- Commits follow Conventional Commits, for example `feat(locus): add Locus and Fabric model`. No AI names, no `Co-Authored-By` line.

### GRACE file markup (required in every new source file)

```ts
// START_MODULE_CONTRACT
//   PURPOSE: <one sentence>
//   SCOPE: <what is in and out>
//   DEPENDS: <modules or "none">
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   isIdentity - true when a string matches the Identity grammar
// END_MODULE_MAP

// START_CONTRACT: isIdentity
//   PURPOSE: ...
//   INPUTS: { value: string - candidate identity }
//   OUTPUTS: { boolean - ... }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: isIdentity
/** TSDoc comment for readers and editors. */
export function isIdentity(value: string): boolean { ... }
```

Types and constants get a `START_CONTRACT` block too, with `INPUTS: none` and `OUTPUTS` describing the shape. All files in this WP use `LINKS: M-LOCUS-MODEL`.

## Branch Strategy

- **Planning base branch**: `feat/locus-foundation`
- **Merge target branch**: `feat/locus-foundation`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP02 --agent claude`.

## Subtasks & Detailed Guidance

### Subtask T007 – Write the failing tests

**`packages/locus/test/identity.test.ts`**: a table test covering at least these cases.

| Value | Expected |
| --- | --- |
| `shop:checkout`, `telos:locus-core`, `a1:b2-c3`, `a:b` | `true` |
| `checkout` (no namespace) | `false` |
| `Shop:checkout` (uppercase) | `false` |
| `shop:check out` (space) | `false` |
| `shop:`, `:x` (empty part) | `false` |
| `shop:-x` (leading hyphen), `shop:x-` (trailing hyphen) | `false` |
| `shop:x--y` (double hyphen) | `false` |
| `shop:a:b` (three parts) | `false` |
| `1shop:x` (part starts with a digit) | `false` |
| `shop:ü` (non-ASCII) | `false` |
| `" shop:x"` (leading space), `"shop:x\n"` (trailing newline) | `false` |
| exactly 128 characters, e.g. `"a:" + "b".repeat(126)` | `true` |
| 129 characters, e.g. `"a:" + "b".repeat(127)` | `false` |

**`packages/locus/test/locus.test.ts`**:

- With `excluded`, `successConditions` and `relations` omitted, the result has each of them as `[]`.
- Without `owner` and `metadata`, the result has no such key (`"owner" in def` is `false`).
- Order and duplicates are kept: responsibilities `["b", "a", "b"]` stay `["b", "a", "b"]`.
- The result is deeply frozen. `Object.isFrozen` is true for the definition, its charter, each charter array, the relations array, each relation and metadata. In strict mode (ES modules are strict), assigning `def.charter.purpose = "x"` throws `TypeError`.
- The result is a copy. Mutating the input arrays after the call does not change the definition, and the input arrays are **not** frozen by the call.
- Invalid content still constructs without throwing, for example `id: "Not An Id"` with `purpose: ""`. Rules are checked by validation, not here.
- Unicode text is preserved exactly. A purpose of `"Café — ✓"` round-trips unchanged.

**`packages/locus/test/fabric.test.ts`**:

- `defineFabric({ id: "shop:system", loci: [a, b] })` keeps the id and the order of `loci`.
- The result and its `loci` array are frozen.
- A non-frozen plain object passed as a Locus is copied, so the caller's object stays unfrozen while the Fabric's member is frozen.
- An empty Fabric (`loci: []`) is allowed.

Run `bun test packages/locus` and confirm that the tests fail because the modules are missing.

### Subtask T008 – `identity.ts`

```ts
/** A Locus or Fabric identity, `namespace:name`. The grammar is checked by validation, not by the type. */
export type Identity = string;

const PART = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";
const GRAMMAR = new RegExp(`^${PART}:${PART}$`);
const MAX_LENGTH = 128;

/** True exactly when `value` matches the Identity grammar and is at most 128 characters long. */
export function isIdentity(value: string): boolean {
  return value.length <= MAX_LENGTH && GRAMMAR.test(value);
}
```

There is no `u` or `i` flag, and `$` without the `m` flag does not match before a trailing newline in JavaScript. Your `"shop:x\n"` test proves that.

### Subtask T009 – `charter.ts`, `relation.ts`

`charter.ts`:

```ts
/** Why a Locus exists: purpose, responsibilities, exclusions and success conditions. */
export interface Charter {
  readonly purpose: string;
  readonly responsibilities: ReadonlyArray<string>;
  readonly excluded: ReadonlyArray<string>;
  readonly successConditions: ReadonlyArray<string>;
}
```

`relation.ts`:

```ts
import type { Identity } from "./identity";

/** The four Stage 0 Relation kinds. */
export type RelationKind = "depends-on" | "refines" | "satisfies" | "verifies";

/** All Relation kinds, in this fixed order. */
export const RELATION_KINDS: ReadonlyArray<RelationKind> = Object.freeze([
  "depends-on",
  "refines",
  "satisfies",
  "verifies",
]);

/** A typed, directed link from one Locus to another. */
export interface Relation {
  readonly kind: RelationKind;
  readonly target: Identity;
}
```

### Subtask T010 – `freeze.ts`, `locus.ts`

`freeze.ts` is internal and **not** exported from `index.ts`. WP04 reuses it for Revisions.

```ts
/** Freezes a value made of plain objects and arrays, all the way down. Returns the same value. */
export function deepFreeze<T>(value: T): T {
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current !== "object" || current === null || Object.isFrozen(current)) continue;
    Object.freeze(current);
    for (const child of Object.values(current)) stack.push(child);
  }
  return value;
}
```

It is iterative on purpose, so no recursion depth limit applies.

`locus.ts`:

```ts
import type { Charter } from "./charter";
import { deepFreeze } from "./freeze";
import type { Identity } from "./identity";
import type { Relation } from "./relation";

/** An immutable Locus definition. Create it with `defineLocus`. */
export interface LocusDefinition {
  readonly id: Identity;
  readonly charter: Charter;
  readonly owner?: Identity;
  readonly relations: ReadonlyArray<Relation>;
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Input to `defineLocus`; the optional sets default to empty. */
export interface LocusInput {
  readonly id: Identity;
  readonly charter: {
    readonly purpose: string;
    readonly responsibilities: ReadonlyArray<string>;
    readonly excluded?: ReadonlyArray<string>;
    readonly successConditions?: ReadonlyArray<string>;
  };
  readonly owner?: Identity;
  readonly relations?: ReadonlyArray<Relation>;
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Copies the input into a deeply frozen definition. Keeps order and duplicates. Never throws. */
export function defineLocus(input: LocusInput): LocusDefinition {
  return deepFreeze({
    id: input.id,
    charter: {
      purpose: input.charter.purpose,
      responsibilities: [...input.charter.responsibilities],
      excluded: [...(input.charter.excluded ?? [])],
      successConditions: [...(input.charter.successConditions ?? [])],
    },
    ...(input.owner === undefined ? {} : { owner: input.owner }),
    relations: (input.relations ?? []).map((r) => ({ kind: r.kind, target: r.target })),
    ...(input.metadata === undefined ? {} : { metadata: { ...input.metadata } }),
  });
}
```

### Subtask T011 – `fabric.ts`

```ts
import type { Identity } from "./identity";
import { defineLocus, type LocusDefinition } from "./locus";
import { deepFreeze } from "./freeze";

/** A named set of Loci validated together. Order of `loci` has no meaning. */
export interface Fabric {
  readonly id: Identity;
  readonly loci: ReadonlyArray<LocusDefinition>;
}

/** Copies every member through `defineLocus` and freezes the result. Never throws. */
export function defineFabric(input: {
  readonly id: Identity;
  readonly loci: ReadonlyArray<LocusDefinition>;
}): Fabric {
  return deepFreeze({ id: input.id, loci: input.loci.map((l) => defineLocus(l)) });
}
```

A `LocusDefinition` is assignable to `LocusInput`, so `defineLocus(l)` type-checks.

### Subtask T012 – Export, document, mark up

Append to `packages/locus/src/index.ts`, and list each export in its `START_MODULE_MAP`:

```ts
export type { Charter } from "./charter";
export { defineFabric, type Fabric } from "./fabric";
export { isIdentity, type Identity } from "./identity";
export { defineLocus, type LocusDefinition, type LocusInput } from "./locus";
export { RELATION_KINDS, type Relation, type RelationKind } from "./relation";
```

Remove the placeholder `export {};` once there is a real export. Keep `deepFreeze` out of the public surface.

Then check:

- Every exported symbol has a `/** … */` comment directly above it and a `START_CONTRACT: <name>` … `END_CONTRACT: <name>` block.
- `bun run verify` passes (format:check, lint, typecheck, test, grace:lint).

## Definition of Done

- [ ] Six source files and three test files, all with GRACE markup.
- [ ] The tests were seen failing before implementation (quote the output in the report).
- [ ] The identity table, freezing, copying, defaults, order and duplicates, and Unicode tests pass.
- [ ] `index.ts` exports exactly the symbols above; `deepFreeze` is not exported.
- [ ] `bun run verify` passes; output tail in the report.

## Risks

- `exactOptionalPropertyTypes`: writing `owner: input.owner` when it may be undefined fails the type check. Use the conditional spread shown above.
- Freezing the caller's input: always copy first. The test "input arrays are not frozen" guards this.

## Reviewer Guidance

- Check the identity table against data-model.md, including the 128/129 boundary and the trailing-newline case.
- Check that the tests would fail if `deepFreeze` were removed, or if `defineLocus` returned the input object.
- Check that `src/` has no `bun`/`node` imports and no `process`.
- Run `bun run verify`.
