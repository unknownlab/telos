---
work_package_id: "WP12"
title: "Web Pack @telos/web (form model)"
dependencies: ["WP09"]
requirement_refs: ["FR-019"]
subtasks: ["T068", "T069", "T070", "T071"]
owned_files:
  - "packages/web/src/semantics.ts"
  - "packages/web/src/archetype.ts"
  - "packages/web/src/form.ts"
  - "packages/web/src/index.ts"
  - "packages/web/test/fixture.ts"
  - "packages/web/test/semantics.test.ts"
  - "packages/web/test/form.test.ts"
  - "packages/web/test/archetype.test.ts"
  - "packages/web/test/exports.test.ts"
  - ".grace/graph/pack-web.xml"
  - ".grace/verification/pack-web.xml"
authoritative_surface: "packages/web/"
execution_mode: "code_change"
create_intent:
  - "packages/web/src/semantics.ts"
  - "packages/web/src/archetype.ts"
  - "packages/web/src/form.ts"
  - "packages/web/test/fixture.ts"
  - "packages/web/test/semantics.test.ts"
  - "packages/web/test/form.test.ts"
  - "packages/web/test/archetype.test.ts"
  - "packages/web/test/exports.test.ts"
agent_profile: "implementer-ivan"
role: "implementer"
agent: "claude"
model: ""
---

# Work Package Prompt: WP12 – Web Pack @telos/web (form model)

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `implementer-ivan`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Build the `@telos/web` Pack in `packages/web`: a relation type (`web.form`), an extension (`telos.web`), an Archetype (`telos.web.interface`) with four rules, and `formModel`, which derives a UI-independent form model (fields, labels, input modes and a `submit` function) from the capabilities a web Locus exposes. Submission goes through kernel `invoke`. There is no React and no DOM in this package.

## Context

- Mission: `semantic-foundation-rebuild-01M5JFR0`. Requirement: FR-019 (web pack). The tests also serve NFR-005 (every Archetype rule has a passing and a failing test). Errors are the kernel's `InvocationOutcome`, unchanged (NFR-004).
- Depends on WP09: `@telos/kernel` exports its full public API. You consume only that entry. The names you use are `Archetype, Rule, violation, RuleViolation, RuleContext, Extension, RelationType, CapabilityRef, capabilityKey, SemanticModel, buildModel, outgoing, hasErrors, verify, describeCapability, inputFields, coerceInput, InputField, InputFieldType, invoke, InvocationOutcome, LocusNotFound, Locus, Capability, Purpose`.
- Depended on by WP14 (the calculator `interfaces.ts` uses `WebSemantics`, `WebForm`; its parity rule and tests call `formModel(...).forms[i].submit(text)`) and by WP20 (the `/calculator` page renders the `WebFormModel`). Do not change names, signatures or field order.
- WP01 already created `packages/web/package.json` (export map `".": "./src/index.ts"`, `"./package.json"`; dependencies `@telos/kernel` and `effect` 4.0.4), `packages/web/tsconfig.json`, `packages/web/test/tsconfig.json` and `packages/web/src/index.ts` containing only `export {};`. You overwrite `src/index.ts`. You do not touch the manifests or tsconfig files.
- Parallel WPs WP10, WP11, WP13 run at the same time. Never edit their files. A Pack imports only `@telos/kernel` and `effect`, never another Pack, and never a kernel path such as `@telos/kernel/src/...`. The Web Pack has a single entry, so the whole package is browser-safe.

### Read first (read-only; the contracts are authoritative, and if this prompt and a contract disagree, the contract wins and you report the conflict)

All paths are under `kitty-specs/semantic-foundation-rebuild-01M5JFR0/`:

1. `contracts/packs.md`: sections "Shared rules", "`@telos/web` (WP12)" and "Tests (each Pack's `test/` directory)".
2. `contracts/conventions.md`: whole file (commands, code rules, GRACE markup, graph/verification layout, git rules).
3. `contracts/kernel.md`: sections `model.ts`, `verify.ts`, `describe.ts`, `invoke.ts`, `fields.ts`, `relation.ts`, `capability.ts`, `archetype.ts`, `extension.ts`, `locus.ts`, `introspection.ts` (`LocusNotFound` only). Signatures you call only.
4. `data-model.md`: "Invocation error tags".

### Owned files and sanctioned edits

You own exactly the files in `owned_files`. You make one sanctioned edit each in `.grace/graph/index.xml` and `.grace/verification/index.xml`: change only the `GD-PACK-WEB` / `VD-PACK-WEB` `<Owns>` block. Those index files are not in `owned_files`, so Spec Kitty's automatic commit refuses them. Commit them yourself with `git add` and `git commit` before you move the WP (see "Implementation command and gate"), and name them in the commit body. Never edit any other WP's file.

### Open questions (the planner answers them; apply the default until then)

- **Q1. Failing test for the execution rule `web.invalid-input-error`.** With the shared kernel, `submit({})` on a form with a required field always returns `{ ok: false }` with `error.tag === "InvalidInput"` (the kernel decodes before it calls the handler), so no real model makes the rule fail. *Recommended default (apply it):* in `archetype.ts` write the rule body as an internal function `invalidInputErrorViolation(forms)` that takes a list of `{ name: string; required: boolean; submit: (raw: Record<string, string | undefined>) => Effect.Effect<InvocationOutcome> }` and returns `Effect<string | null>`. Export it from `archetype.ts` only (not from `index.ts`). The rule's `check` calls it with the real forms from `formModel`. The passing test goes through `WebInterface` with the real model (via `verify`). The failing tests call `invalidInputErrorViolation` with stub forms whose `submit` returns `{ ok: true, output: {} }`, and another that returns `{ ok: false, error: { tag: "Negative", message: "x", issues: [] } }`. Name those tests "(stub forms)". If the planner supplies a real failing model, replace the stub tests.
- **Q2. `LocusNotFound` message for a Locus without `WebSemantics`.** The contract only says `formModel` fails with `LocusNotFound` for an unknown id or a Locus lacking `WebSemantics`. *Default (apply it):* both cases fail with `new LocusNotFound({ id: webLocusId, message: "No web Locus <id> in the model." })`.
- **Q3. `title` property that is not a string** (the Locus has a `property.invalid` diagnostic). *Default:* use it when it is a string, else the Locus id.

## Subtasks and detailed guidance

### Subtask T068 – Write the fixture model and failing tests

- **Purpose**: tests first. Tests fail on import until T069–T071 land, which is expected.
- **Steps**:
  1. Create `packages/web/test/fixture.ts` (header `ROLE: TEST`, `MAP_MODE: LOCALS`). It builds, with `@telos/kernel` and `effect` only:
     - `export class Negative extends Schema.TaggedError<Negative>()("Negative", { message: Schema.String }) {}` and `export const NEGATIVE_MESSAGE = "n must not be negative."`
     - `math`: `Locus.extend(Purpose).make({ id: "example:math", properties: { purpose: "Doubles numbers." }, capabilities: { double, ping, flag, list, secret } })` where
       - `double`: `Capability.make({ description: "Doubles n.", input: Schema.Struct({ n: Schema.Finite }), output: Schema.Struct({ value: Schema.Finite }), errors: [Negative], effect: "pure", handler: ({ n }) => n < 0 ? Effect.fail(new Negative({ message: NEGATIVE_MESSAGE })) : Effect.succeed({ value: n * 2 }) })`
       - `ping`: input `Schema.Struct({})`, output `Schema.Struct({ ok: Schema.Boolean })`, effect `"read"`, handler returns `{ ok: true }`
       - `flag`: input `Schema.Struct({ id: Schema.Int, on: Schema.Boolean, label: Schema.String })`, output `Schema.Struct({ id: Schema.Int })`, effect `"pure"`, handler returns `{ id }` (covers integer, boolean and string field types)
       - `list`: input `Schema.Struct({ items: Schema.Array(Schema.String) })` (an unsupported field), output `Schema.Struct({ count: Schema.Finite })`, effect `"pure"`, handler returns `{ count: items.length }`
       - `secret`: input `Schema.Struct({})`, output `Schema.Struct({ ok: Schema.Boolean })`, effect `"read"`, handler returns `{ ok: true }` (never exposed by any form)
     - `other`: a second Locus `example:other` (plain `Locus.make`) with a capability `double` of the same contract (for the duplicate-name test).
     - `webLocus(exposes: ReadonlyArray<CapabilityRef>, id = "example:web")`: `Locus.extend(WebSemantics).make({ id, properties: { title: "Math" }, relations: exposes.map((ref) => WebForm.to(ref)) })`. Import `WebSemantics`, `WebForm` from `../src/semantics`.
     - `makeRoot(...children)`: `Locus.make({ id: "example:root", contains: children })`.
     - `export const web = webLocus([math.capability("double"), math.capability("ping")])`, `export const root = makeRoot(math, web)`, `export const model = buildModel(root)`.
  2. Create the test files listed under "Test list". Test names must contain the rule id or code they cover. Imports in tests: `bun:test`, `effect`, `@telos/kernel` and relative `../src/<module>` (no extension). Never import another package's `test/` files.
- **Files**: `fixture.ts` (about 80 lines), four `*.test.ts` files (about 50 to 110 lines each).
- **Validation**: `bun test packages/web/test` fails only with missing-module errors from `../src/...`.

#### Test list (exact behaviours)

`form.test.ts` (use `Effect.runPromise`; for failures use `Effect.flip`)
- "formModel returns the title and the forms sorted by name": `model.locus === "example:web"`, `title === "Math"`, `forms.map((f) => f.name)` equals `["double","ping"]`.
- "formModel derives double: ref, description and fields": `ref === "example:math#double"`, `description === "Doubles n."`, `fields` equals `[{ name: "n", label: "N", type: "number", required: true, inputMode: "decimal", description: null }]`. `ping.fields` equals `[]`.
- "formModel maps integer, boolean and string fields": a web Locus exposing `flag` gives fields (in key order) `id` (type `integer`, inputMode `numeric`, label `Id`), `on` (type `boolean`, inputMode `text`, label `On`), `label` (type `string`, inputMode `text`, label `Label`).
- "formModel marks an unsupported field": a web Locus exposing `list` gives `items` with type `unsupported`, inputMode `text`.
- "formModel fails with LocusNotFound for an unknown id": the flipped error has `_tag === "LocusNotFound"`, `id === "example:nope"` and `message === "No web Locus example:nope in the model."`.
- "formModel fails with LocusNotFound for a Locus without WebSemantics": id `"example:math"`, same message shape.
- "formModel uses only the first of two capabilities with the same name": a web Locus exposing `math.capability("double")` and `other.capability("double")`; one `double` form whose `ref` is `"example:math#double"` (sorted by name, then Locus id).
- "formModel ignores relations that are not valid": a web Locus with `WebForm.to("example:math#missing")` (model reports `relation.capability-missing`); no form named `missing`.
- "formModel does not expose a capability that no web.form relation targets": `secret` is not among the forms (discovery is not exposure).
- "submit with valid text returns the output": `double.submit({ n: "4" })` equals `{ ok: true, output: { value: 8 } }`.
- "submit reports a declared error": `submit({ n: "-1" })` equals `{ ok: false, error: { tag: "Negative", message: NEGATIVE_MESSAGE, issues: [] } }`.
- "submit reports InvalidInput for a non-numeric value": `{ n: "abc" }` gives `ok: false`, `error.tag === "InvalidInput"`, and an issue whose `path` equals `["n"]`.
- "submit reports InvalidInput for empty input": `submit({})` gives `error.tag === "InvalidInput"`.
- "submit equals kernel invoke": for `{ n: "abc" }` the outcome equals `invoke(model, "example:math#double", { n: "abc" }, { via: "example:web" })` (NFR-004).

`archetype.test.ts` (run through `verify(model, { runner: "test", loci: [webId] })` and look up `findings.find((f) => f.rule === ruleId && f.locus === webId)`)
- For each rule id, one test named "<rule id> passes ..." and one named "<rule id> fails ..." with the fixed message:

| Rule id | Failing model | Expected `message` |
| --- | --- | --- |
| `web.forms-exist` | `webLocus([])` | `Web Locus example:web exposes no capability.` |
| `web.unique-forms` | `webLocus([math.capability("double"), other.capability("double")])` | `Web Locus example:web exposes more than one capability named double.` |
| `web.fields-derivable` | `webLocus([math.capability("list")])` | `Capability example:math#list has an unsupported field items.` |
| `web.invalid-input-error` | stub forms (Q1): `submit` returns `{ ok: true, output: {} }` | `Form double of example:web did not report InvalidInput for empty input.` |

- Passing models: `web` from the fixture (`double`, `ping`) for all four rules.
- "no WebInterface finding is produced for a Locus without WebSemantics": `verify` on `example:math` has no finding with `archetype === "telos.web.interface"`.
- A form with no required field (`ping`) is skipped by `web.invalid-input-error` (test "web.invalid-input-error skips forms without a required field": stub forms where `ping`-like form has `required: false` and a `submit` that would fail the rule; result is `null`).
- Failing models need `makeRoot(math, other, brokenWeb)`: every Locus id is unique and each object is contained once.

`semantics.test.ts`
- "WebForm has the contract fields": `id === "web.form"`, `target === "capability"`, `grantsInvocation === true`, `acyclic === false`, `description === "Exposes the target capability as a web form named after the capability."`.
- "WebSemantics has the contract fields": `id === "telos.web"`, `description === "Marks a Locus as a web interface. Its \`title\` is the page title."`, `relationTypes` equals `[WebForm]` (same object), `archetypes` equals `[WebInterface]`.
- "composing WebSemantics with Purpose has no conflicts": `Locus.extend(Purpose, WebSemantics).conflicts` is `[]`. The fixture `model` has `hasErrors(model) === false` and `model.diagnostics` equals `[]`.

`exports.test.ts`
- "the main entry exports exactly the contract values": `Object.keys(await import("../src/index")).sort()` equals `["WEB_FORM_TYPE","WebForm","WebInterface","WebSemantics","formModel"]` in code-unit order (the types `WebFormModel`, `WebFormDefinition`, `WebField` do not exist at run time).
- "the package has no React or DOM import": read each `packages/web/src/*.ts` and assert every `from "<specifier>"` is relative, `@telos/kernel` or `effect`; no specifier starts with `react`, `bun`, `node:`, `effect/cli` or `effect/process`.

### Subtask T069 – Implement form.ts

- **Purpose**: the form model derivation.
- **Steps** (header `LINKS: M-PACK-WEB, V-M-PACK-WEB`, `DEPENDS: M-KERNEL-API`):
  1. `export const WEB_FORM_TYPE = "web.form"` (a `const`, so its type is the literal).
  2. Types exactly as in `contracts/packs.md`:
     ```ts
     export interface WebField {
       readonly name: string;
       readonly label: string; // the field name, first letter upper-cased ("a" -> "A")
       readonly type: InputFieldType;
       readonly required: boolean;
       readonly inputMode: "decimal" | "numeric" | "text"; // number -> decimal, integer -> numeric, otherwise text
       readonly description: string | null;
     }
     export interface WebFormDefinition {
       readonly name: string; // capability name
       readonly ref: string; // capability key, "<locus>#<capability>"
       readonly description: string;
       readonly fields: ReadonlyArray<WebField>;
       readonly submit: (raw: Readonly<Record<string, string | undefined>>) => Effect.Effect<InvocationOutcome>;
       // invoke(model, ref, coerceInput(fields, raw), { via: webLocusId })
     }
     export interface WebFormModel { readonly locus: string; readonly title: string; readonly forms: ReadonlyArray<WebFormDefinition> }
     ```
  3. Module-internal helpers, exported from `form.ts` but **not** re-exported by `index.ts`: `WEB_EXTENSION_ID = "telos.web"`, `isWebLocus(model, id): boolean` (`model.loci.get(id)?.definition.kind.extensions.some((e) => e.id === WEB_EXTENSION_ID) === true`), and `exposedTargets(model, id): ReadonlyArray<{ locus: string; capability: string }>`.
  4. `exposedTargets`: `[]` unless `isWebLocus`. Otherwise take `outgoing(model, id)`, keep entries with `valid === true`, `type.id === WEB_FORM_TYPE` and `target.capability !== null`, map to `{ locus: target.locus, capability: target.capability }`, sort by capability name then Locus id with plain code-unit comparison (`a < b ? -1 : a > b ? 1 : 0`, never `localeCompare`). **Do not de-duplicate** (the Archetype needs the duplicates).
  5. `formModel(model, webLocusId): Effect.Effect<WebFormModel, LocusNotFound>`: if `!isWebLocus(...)` fail with `new LocusNotFound({ id: webLocusId, message: "No web Locus " + webLocusId + " in the model." })` (Q2). Otherwise keep the first target per capability name, and for each call `describeCapability(model, locus, capability)`. With `const inputs = inputFields(description)`, build the form: `name = capability`, `ref = capabilityKey(locus, capability)`, `description = description.description`, `fields = inputs.map(toWebField)`, `submit = (raw) => invoke(model, ref, coerceInput(inputs, raw), { via: webLocusId })`. `title = properties["title"]` when it is a string, else the Locus id (Q3). `label = name.charAt(0).toUpperCase() + name.slice(1)`.
  6. Each export gets a `START_CONTRACT` / `END_CONTRACT` block (conventions). Exported types need only the MODULE_MAP line.
- **Files**: `packages/web/src/form.ts` (about 110 lines).
- **Validation**: `bun test packages/web/test/form.test.ts` passes (after T070 for the semantics import in the fixture).
- **Notes**: `submit` must pass the **raw text** map through `coerceInput`; never parse numbers yourself. Do not import React, the DOM or any other UI library. The same derivation exists in the CLI Pack; do not import it from there (no Pack imports another Pack). Duplicated code is expected.

### Subtask T070 – Implement semantics.ts and archetype.ts

- **Purpose**: the extension and the Archetype.
- **Module order** (contract "Shared rules"): `archetype.ts` imports `form.ts` and never `semantics.ts`. `semantics.ts` imports `WEB_FORM_TYPE` from `form.ts` and `WebInterface` from `archetype.ts` and is the only module that builds the RelationType and the Extension. Write `archetype.ts` first, then `semantics.ts`.
- **Steps**:
  1. `archetype.ts`: `export const WebInterface = Archetype.make({ id: "telos.web.interface", description: "Checks that a web interface Locus exposes derivable, uniquely named forms that report invalid input.", appliesTo: ["telos.web"], rules: [...] })`. Build each rule with `Rule.make({ id, description, method, check })`. `check` receives `ctx: RuleContext` (`ctx.model`, `ctx.locus.id`) and returns `Effect.Effect<void, RuleViolation>`; fail with `violation(message)`.

     | Rule id | Method | Passes when | Failure message (exact) |
     | --- | --- | --- | --- |
     | `web.forms-exist` | static | `exposedTargets(...)` is non-empty | `Web Locus <id> exposes no capability.` |
     | `web.unique-forms` | static | no capability name appears twice in `exposedTargets` | `Web Locus <id> exposes more than one capability named <name>.` (first duplicated name in sorted order) |
     | `web.fields-derivable` | static | for every target, `inputFields(describeCapability(...))` has no field of type `unsupported` | `Capability <locus>#<capability> has an unsupported field <field>.` (first offending target in order) |
     | `web.invalid-input-error` | execution | for every form (from `formModel`) with at least one required field, `submit({})` gives `{ ok: false }` with `error.tag === "InvalidInput"` | `Form <name> of <id> did not report InvalidInput for empty input.` |

     Rule descriptions (use these): "The Locus exposes at least one capability as a form." / "No two exposed capabilities share a form name." / "Every exposed capability has input fields the form can show." / "A form with required input reports InvalidInput when submitted empty."
     Implement `web.invalid-input-error` through `invalidInputErrorViolation(forms)` per Q1. In `check`, obtain the forms with `formModel(ctx.model, ctx.locus.id)`; map its (impossible) `LocusNotFound` failure to a violation with the message `Web Locus <id> exposes no capability.`. Keep `invalidInputErrorViolation` and no other helper in the exports of `archetype.ts` besides `WebInterface`.
  2. `semantics.ts`:
     - `export const WebForm = RelationType.make(WEB_FORM_TYPE, { description: "Exposes the target capability as a web form named after the capability.", target: "capability", grantsInvocation: true })`
     - `export const WebSemantics = Extension.make("telos.web", { description: "Marks a Locus as a web interface. Its \`title\` is the page title.", properties: { title: Schema.String }, relationTypes: [WebForm], archetypes: [WebInterface] })` (the description text contains backticks around `title` exactly as in the contract; escape them in the string).
- **Files**: `archetype.ts` (about 100 lines), `semantics.ts` (about 30 lines).
- **Validation**: `bun test packages/web/test/archetype.test.ts packages/web/test/semantics.test.ts` passes. Every rule has a passing and a failing test (NFR-005).

### Subtask T071 – Write index.ts and register M-PACK-WEB in GRACE

- **Purpose**: the public entry and the architecture knowledge.
- **Steps**:
  1. Overwrite `packages/web/src/index.ts` with the contract export list: values `WEB_FORM_TYPE, WebForm, WebSemantics, WebInterface, formModel`, and types `WebFormModel, WebFormDefinition, WebField` (use `export type { ... }`; the repository sets `verbatimModuleSyntax`). No `.ts` extension in imports. Do not export `exposedTargets`, `isWebLocus`, `WEB_EXTENSION_ID` or `invalidInputErrorViolation`.
  2. Every new `src/*.ts` and test file starts with the GRACE header in `contracts/conventions.md` (copy the shape from `scripts/review-gate.ts`). Src files: `LINKS: M-PACK-WEB, V-M-PACK-WEB`, `ROLE: RUNTIME`, `MAP_MODE: EXPORTS`, `DEPENDS: M-KERNEL-API`. Test files: `ROLE: TEST`, `MAP_MODE: LOCALS`.
  3. Register the module only now, when all test files exist. Open `.grace/graph/pack-web.xml` and `.grace/verification/pack-web.xml` (WP01 created them with an empty `<Owns />`; keep their root element and style, as in `.grace/graph/main.xml` before the split) and add:

     ```xml
     <M-PACK-WEB>
       <Summary>Derives a UI-independent form model from the capabilities a web Locus exposes and submits it through kernel invoke.</Summary>
       <Path>packages/web/src/semantics.ts</Path>
       <Path>packages/web/src/archetype.ts</Path>
       <Path>packages/web/src/form.ts</Path>
       <Path>packages/web/src/index.ts</Path>
       <M-KERNEL-API />
     </M-PACK-WEB>
     ```

     and in the verification document a `V-M-PACK-WEB` entry with `<TestFiles>` listing the four `*.test.ts` files, `<Command>bun test packages/web/test</Command>`, one `<Scenario>` per tested behaviour (form derivation, field mapping, submission, the four rules, extension fields, export list and browser-safe imports) and a `<TraceAssertion>` naming the tests that prove them.
  4. In `.grace/graph/index.xml` add `<M-PACK-WEB />` to the `<Owns>` block of `GD-PACK-WEB`, and in `.grace/verification/index.xml` add `<V-M-PACK-WEB />` to `VD-PACK-WEB`. Edit nothing else in those files. If `M-KERNEL-API` does not exist in the graph, stop and report (WP09 must have registered it).
- **Files**: `packages/web/src/index.ts` (about 20 lines), the two area documents, the two index files (own block only).
- **Validation**: `bun test packages/web/test/exports.test.ts` passes, and `bun run grace:lint` passes (no `missing-module-coverage`, no `invalid-test-file`).

## Implementation command and gate

```bash
spec-kitty agent action implement WP12 --agent claude
```

Fast loop while you work: `bun test packages/web/test`, `bun run typecheck`, `bun run lint`, `bun run format` (this one writes files), `bun run grace:lint`.
Run `bun run format` once so the files match the repository style, then before you hand over run the full gate `bun run verify` and report each step's result exactly. Then:

1. Commit the sanctioned index edits yourself (`git add .grace/graph/index.xml .grace/verification/index.xml`) with a Conventional Commit such as `feat(web): register the Web Pack in GRACE` and a body line `Sanctioned edit: own Owns block in .grace/graph/index.xml and .grace/verification/index.xml.` No AI names, no co-author lines, never `--no-verify`.
2. Record each subtask: `spec-kitty agent tasks mark-status T068 --status done` (and T069 to T071).
3. Move the WP to review: `spec-kitty agent tasks move-task WP12 --to for_review` (run `spec-kitty agent tasks status --mission semantic-foundation-rebuild-01M5JFR0` if the lane name differs).

## Definition of Done

- `bun test packages/web/test` passes with every test in the lists above, and no test is skipped or empty.
- `bun run typecheck`, `bun run lint`, `bun run format:check` and `bun run grace:lint` pass. `bun run verify` passes as a whole.
- `packages/web/src/index.ts` exports exactly the contract list. The package imports only `@telos/kernel`, `effect` and relative modules, with no React, DOM, `bun` or `node:` import.
- `formModel`, `WebFormDefinition`, `WebField` and `WebFormModel` match `contracts/packs.md` field for field, and `submit` equals `invoke(model, ref, coerceInput(fields, raw), { via })`.
- Every `WebInterface` rule has one passing and one failing test with the exact messages above (the `web.invalid-input-error` failing tests use the stub forms of Q1 until the planner answers).
- `M-PACK-WEB` and `V-M-PACK-WEB` are registered in the `pack-web` documents and in the `<Owns>` blocks of both index files, and `grace lint --path . --assertions current` passes.
- Each subtask has a `mark-status ... --status done` record. Commits follow Conventional Commits with no AI attribution.
- No file outside `owned_files` changed, except the sanctioned own-block edits of the two GRACE index files.

## Risks

- **Kernel names differ from the contract** (for example `outgoing` also returning invalid relations). Mitigation: always filter `valid === true`; if a kernel export is missing, stop and report.
- **Import cycle** `semantics.ts` to `archetype.ts` to `form.ts` and back. Mitigation: the module order rule above; `bun run typecheck` catches it.
- **Strict compiler options** (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`): use `export type` for types, and handle `undefined` from index access.
- **GRACE lint** fails if a module is registered before its test files exist, or without its `V-` entry. Register in T071 only.
- **Move-task auto-commit refuses non-owned files** (the two index files). Commit them yourself first.
- **Q1 stub tests** can be mistaken for fake tests. Name them clearly, and keep the passing path on the real model.

## Reviewer Guidance

- Check each contract signature in `contracts/packs.md` (Web section) against the code: `WebField`, `WebFormDefinition`, `WebFormModel`, `formModel`, labels, and `inputMode` mapping.
- Check that every `WebInterface` rule has a passing and a failing test, that failure messages match this prompt exactly, and that `submit` outcomes equal the kernel's.
- Confirm no import of another Pack or a kernel internal path, no React/DOM/platform import, and no `localeCompare`.
- Confirm that only the own `<Owns>` blocks changed in the two GRACE index files and that headers and `START_CONTRACT` blocks exist for every export.
- Confirm that `bun run verify` output is quoted exactly in the hand-over, and that the open questions Q1 to Q3 were applied as written.

## Activity Log

- 2026-10-24T00:00:00Z – system – Prompt created.
