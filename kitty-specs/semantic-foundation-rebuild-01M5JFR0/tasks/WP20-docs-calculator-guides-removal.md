---
work_package_id: WP20
title: Calculator page, guides and removal of @telos/locus
dependencies:
- WP19
requirement_refs:
- FR-026
- FR-029
- FR-031
planning_base_branch: feat/semantic-foundation-rebuild
merge_target_branch: feat/semantic-foundation-rebuild
branch_strategy: Planning artifacts for this mission were generated on feat/semantic-foundation-rebuild. During /spec-kitty.implement this WP may branch from a dependency-specific base, but completed changes must merge back into feat/semantic-foundation-rebuild unless the human explicitly redirects the landing branch.
subtasks:
- T120
- T121
- T122
- T123
- T124
- T125
phase: Phase 7 – Documentation site
history:
- !!omap
  - at: '2026-10-23T15:02:27Z'
  - actor: system
  - action: Prompt generated via /spec-kitty.tasks
agent_profile: frontend-freddy
authoritative_surface: apps/docs/
create_intent:
- apps/docs/src/routes/calculator.tsx
- apps/docs/e2e/calculator.e2e.ts
- apps/docs/test/calculator.test.tsx
- apps/docs/src/components/calculator-view.tsx
- apps/docs/test/guide-snippets.ts
- apps/docs/test/guide-snippets.test.ts
- .grace/graph/legacy.xml
- .grace/verification/legacy.xml
execution_mode: code_change
model: claude-haiku-5-5
owned_files:
- apps/docs/src/routes/calculator.tsx
- apps/docs/e2e/calculator.e2e.ts
- apps/docs/test/calculator.test.tsx
- docs/guides/**
- apps/docs/test/guide-examples.test.ts
- apps/docs/test/guides.test.ts
- packages/locus/**
- apps/docs/src/components/calculator-view.tsx
- apps/docs/test/guide-snippets.ts
- apps/docs/test/guide-snippets.test.ts
- .grace/graph/legacy.xml
- .grace/verification/legacy.xml
role: implementer
tags: []
task_type: implement
tracker_refs: []
---

# Work Package Prompt: WP20 – Calculator page, guides and removal of @telos/locus

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

Finish the documentation site and remove the old model:

1. Add the `/calculator` page. Its forms are derived from the capability contracts of `calculator:arithmetic` through `@telos/web`, and they invoke the real calculator in the browser (FR-026).
2. Rewrite the four guides in `docs/guides/`. Every code example in them is checked against the real code (FR-031).
3. Delete `packages/locus` and every reference to it, with no compatibility alias (FR-029).
4. Remove the legacy GRACE area, and register the calculator page in GRACE.

State when you start:

- WP19 is merged. The site has `/inspector`, `/inspector/<slug>`, `/verification` (semantic report) and `/playground` (WP18).
- Only `apps/docs/test/guides.test.ts` and `apps/docs/test/guide-examples.test.ts` still import `@telos/locus`. You rewrite both.
- `apps/calculator/src/arithmetic.ts` has the region `START_BLOCK_ARITHMETIC_LOCUS` (WP13).
- `apps/calculator/src/app.ts` has `START_BLOCK_CALCULATOR_APP` (WP14).
- The root scripts `calculator`, `calculator:mcp`, `calculator:agent-demo`, `telos` and `telos:check` exist (WP14, WP15).

## Context

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/docs.md` (authoritative).

### Calculator page (WP20, `/calculator`)

- `src/routes/calculator.tsx` renders `formModel(calculatorModel, "calculator:web")`.
- There is one form per capability. Labeled inputs use `inputMode`. The Submit button shows the `InvocationOutcome` JSON in a result panel with `data-result="calculator"`.
- The page states that the forms are derived from the capability contracts.

### Guides (WP20; `docs/guides/`, `section` values unchanged)

| File | Content |
| --- | --- |
| `introduction.md` | What Telos is now and where to start |
| `first-locus.md` | `Locus.make`, then an extension, composition, a capability, `buildModel`, `Telos.resolve(...).inspect()` |
| `examples.md` | The calculator reference implementation: model diagram, the four capabilities, the three interfaces, the Archetypes, change impact, and how to run the CLI, Web and Agent Tools (`bun run calculator add --a 2 --b 3`, `bun run calculator:mcp`, `bun run calculator:agent-demo`, `/calculator`) and verification (`bun run telos verify`) |
| `agent-reference.md` | For agents: the introspection tools, `bun run telos` commands, `/semantic-report.json`, knowledge statuses, the grant rule |

**Checked examples** (`apps/docs/test/guide-examples.test.ts`, rewritten). These are fenced blocks whose info string is:

- `ts source=<repo path>#<REGION>`: the block body must equal the text between `// START_BLOCK_<REGION>` and `// END_BLOCK_<REGION>` in that file, with common leading indentation removed and outer blank lines trimmed. The markers already exist: WP13 adds `ARITHMETIC_LOCUS` to `apps/calculator/src/arithmetic.ts`, and WP14 adds `CALCULATOR_APP` to `apps/calculator/src/app.ts`. WP20 only quotes them.
- `json playground=<name>`: the body must equal `PLAYGROUND_EXAMPLES` entry `<name>`'s `json`.

### Removal (WP20)

- Delete `packages/locus/` entirely.
- The workspace manifest check (exact pins, no trusted scripts) already lives in `scripts/manifest.test.ts`: WP01 creates it for the new packages. Deleting `packages/locus/` also deletes `packages/locus/test/manifest.test.ts`; WP20 removes the `@telos/locus` entry from `scripts/manifest.test.ts`'s package list if it has one.
- Remove the `packages/locus` references from the root `tsconfig.json`, `apps/docs/package.json` (`@telos/locus`), `telos.ts` (`telos:legacy-locus`) and its `.grace` legacy area documents. Run `bun install` to update `bun.lock` (workspace entries only).

The Calculator llms bullet (contract, `scripts/content.ts` `llmsText`): "The calculator web interface: forms derived from the capability contracts of calculator:arithmetic."

### APIs you use

`@telos/web` (WP12):

```ts
export interface WebField {
  readonly name: string
  readonly label: string                 // "a" -> "A"
  readonly type: InputFieldType
  readonly required: boolean
  readonly inputMode: "decimal" | "numeric" | "text"
  readonly description: string | null
}
export interface WebFormDefinition {
  readonly name: string                  // capability name
  readonly ref: string                   // capability key
  readonly description: string
  readonly fields: ReadonlyArray<WebField>
  readonly submit: (raw: Readonly<Record<string, string | undefined>>) => Effect.Effect<InvocationOutcome>
}
export interface WebFormModel { readonly locus: string; readonly title: string; readonly forms: ReadonlyArray<WebFormDefinition> }
export const formModel: (model: SemanticModel, webLocusId: string) => Effect.Effect<WebFormModel, LocusNotFound>
```

`@telos/calculator` (WP13, WP14) exports `calculatorModel` (`buildModel(app)`), `app` (`calculator:app`), `arithmetic` (`calculator:arithmetic`) and the capabilities `add`, `subtract`, `multiply` and `divide`. `divide` with `b === 0` fails with `DivisionByZero` (message "Division by zero is not defined."). Non-numeric input gives `InvalidInput`.

The calculator CLI (WP10, WP14):

- `bun run calculator add --a 2 --b 3` prints `{"result":5}` on stdout and exits 0.
- `bun run calculator divide --a 1 --b 0` prints `{"tag":"DivisionByZero","message":"Division by zero is not defined.","issues":[]}` on stderr and exits 1.

Kernel APIs for the first-locus guide snippets (from the kernel contract):

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## capability.ts (WP03)

```ts
export type EffectClass = "pure" | "read" | "write"
/** A TaggedError class schema with a `message: string` field, e.g. Schema.TaggedError<X>()("X", { message: Schema.String }). */
export type ErrorSchema = Schema.Codec<{ readonly _tag: string; readonly message: string }, any> & { readonly identifier: string }
export interface Capability<I = any, O = any, E = any> {
  readonly _tag: "Capability"
  readonly description: string
  readonly input: Schema.Codec<I, any>
  readonly output: Schema.Codec<O, any>
  readonly errors: ReadonlyArray<ErrorSchema>
  readonly effect: EffectClass
  readonly handler: ((input: I) => Effect.Effect<O, E>) | null
}
export const Capability: {
  make: <I, IE, O, OE, const Errs extends ReadonlyArray<ErrorSchema> = readonly []>(options: {
    readonly description: string
    readonly input: Schema.Codec<I, IE>
    readonly output: Schema.Codec<O, OE>
    readonly errors?: Errs
    readonly effect: EffectClass
    readonly handler: (input: I) => Effect.Effect<O, Errs[number]["Type"]>
  }) => Capability<I, O, Errs[number]["Type"]>
  /** A declared capability without implementation, used by decodeLocus; handler is null. */
  declare: (options: { readonly description: string; readonly input: Schema.Codec<any, any>; readonly output: Schema.Codec<any, any>; readonly errors?: ReadonlyArray<ErrorSchema>; readonly effect: EffectClass }) => Capability
}
export function errorTag(schema: ErrorSchema): string // schema.identifier
```

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## extension.ts (WP03)

```ts
export interface Extension<Id extends string = string, F extends Schema.Struct.Fields = Schema.Struct.Fields> {
  readonly _tag: "Extension"
  readonly id: Id
  readonly description: string
  readonly properties: F
  readonly relationTypes: ReadonlyArray<RelationType>
  readonly archetypes: ReadonlyArray<Archetype>
}
export const Extension: {
  make: <const Id extends string, const F extends Schema.Struct.Fields = {}>(id: Id, options: {
    readonly description: string
    readonly properties?: F
    readonly relationTypes?: ReadonlyArray<RelationType>
    readonly archetypes?: ReadonlyArray<Archetype>
  }) => Extension<Id, F>
}
```

## locus.ts (WP03)

Copy these type helpers verbatim. They were type-checked in research R2.

```ts
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never
type FieldsOf<E> = E extends Extension<string, infer F> ? F : never
export type MergedFields<Es extends ReadonlyArray<Extension>> =
  [Es[number]] extends [never] ? {} :
  UnionToIntersection<FieldsOf<Es[number]>> extends infer I extends Schema.Struct.Fields ? I : {}
export type PropertiesOf<Es extends ReadonlyArray<Extension>> = Schema.Struct.Type<MergedFields<Es>>

export interface CompositionConflict {
  readonly code: "composition.extension-id-conflict" | "composition.property-conflict" | "composition.relation-type-conflict" | "composition.archetype-id-conflict"
  readonly subject: string                  // the conflicting extension id, property name, relation type id or archetype id
  readonly extensions: ReadonlyArray<string> // the two extension ids involved, in composition order
}

export interface LocusDefinition<Caps extends Record<string, Capability> = Record<string, Capability>> {
  readonly _tag: "Locus"
  readonly id: string
  readonly kind: LocusKind<ReadonlyArray<Extension>>
  readonly description: string | null
  readonly contains: ReadonlyArray<LocusDefinition>
  readonly relations: ReadonlyArray<Relation>
  readonly capabilities: Caps
  readonly properties: Readonly<Record<string, unknown>>   // decoded value, or the raw input when decoding failed
  readonly propertyIssues: ReadonlyArray<{ readonly path: ReadonlyArray<PropertyKey>; readonly message: string }>
  readonly capability: <K extends keyof Caps & string>(name: K) => CapabilityRef
}

export interface LocusKind<Es extends ReadonlyArray<Extension>> {
  readonly _tag: "LocusKind"
  readonly extensions: Es                       // deduplicated by object identity, composition order kept
  readonly conflicts: ReadonlyArray<CompositionConflict>
  readonly properties: Schema.Struct.Fields     // merged fields; first definition wins on conflict
  readonly relationTypes: ReadonlyArray<RelationType>   // all relation types of the extensions, first wins on id conflict
  readonly archetypes: ReadonlyArray<Archetype>         // all archetypes of the extensions, first wins on id conflict
  readonly extend: <const More extends ReadonlyArray<Extension>>(...more: More) => LocusKind<readonly [...Es, ...More]>
  readonly make: <const Caps extends Record<string, Capability> = {}>(definition: {
    readonly id: string
    readonly description?: string
    readonly contains?: ReadonlyArray<LocusDefinition<any>>
    readonly relations?: ReadonlyArray<Relation>
    readonly capabilities?: Caps
  } & ({} extends PropertiesOf<Es> ? { readonly properties?: PropertiesOf<Es> } : { readonly properties: PropertiesOf<Es> })) => LocusDefinition<Caps>
}

/** The universal Locus kind: no extensions. `Locus.make({ id })` is a complete Locus. */
export const Locus: LocusKind<readonly []>
```

Rules for `extend` and `make`:

- `extend` builds a new kind from `[...this.extensions, ...more]`. An extension object that is already present is skipped (no conflict). It then computes `conflicts` in composition order:
  1. A different extension object with an id already seen → `composition.extension-id-conflict` (subject = the id).
  2. For each property name of each extension: if an earlier *different* extension defined it → `composition.property-conflict` (subject = the property name).
  3. For each relation type: if a *different* RelationType object with the same id was seen → `composition.relation-type-conflict`.
  4. For each archetype: if a *different* Archetype object with the same id was seen → `composition.archetype-id-conflict`.
- `make` never throws:
  - It decodes `properties ?? {}` with `Schema.decodeUnknownExit(Schema.Struct(kind.properties))(raw, { errors: "all" })`.
  - On failure it keeps the raw value and fills `propertyIssues` from `SchemaIssue.makeFormatterStandardSchemaV1()(error.issue).issues`.
  - The result is frozen with `deepFreeze` (schemas and handlers are skipped).
  - Missing optional fields become `null` (`description`) or empty (`contains`, `relations`, `capabilities`).
- `definition.capability(name)` returns `CapabilityRef.make(definition.id, name)`.

## extensions/purpose.ts (WP03)

```ts
export const Purpose: Extension<"telos.purpose", {
  purpose: Schema.String
  responsibilities: Schema.optionalKey<Schema.$Array<Schema.String>>
  excluded: Schema.optionalKey<Schema.$Array<Schema.String>>
}>
// description: "States why a Locus exists, what it is responsible for and what it explicitly excludes."
```

Use `Schema.Array(Schema.String)` in the value. The written type above is illustrative, so let TypeScript infer it from `Extension.make`.

> Quoted from `kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md` (authoritative).

## introspection.ts (WP09)

```ts
export class LocusNotFound extends Schema.TaggedError<LocusNotFound>()("LocusNotFound", { id: Schema.String, message: Schema.String }) {}
export class CapabilityNotFound extends Schema.TaggedError<CapabilityNotFound>()("CapabilityNotFound", { ref: Schema.String, message: Schema.String }) {}
export interface LocusView {
  readonly id: string
  readonly inspect: () => Effect.Effect<LocusDescription>
  readonly relations: () => Effect.Effect<LocusDescription["relations"]>
  readonly capabilities: () => Effect.Effect<ReadonlyArray<CapabilityDescription>>
  readonly verifications: () => Effect.Effect<ReadonlyArray<VerificationDescription>>  // uses the latest report of this service, else not-run
}
export interface TelosApi {
  readonly model: SemanticModel
  readonly loci: () => Effect.Effect<ReadonlyArray<string>>                      // model.ids
  readonly resolve: (id: string) => Effect.Effect<LocusView, LocusNotFound>
  readonly describe: () => Effect.Effect<ModelDescription>
  readonly diagnostics: () => Effect.Effect<ReadonlyArray<Diagnostic>>
  readonly verify: (options: VerifyOptions) => Effect.Effect<VerificationReport>  // also stores it as the latest report (Ref)
  readonly impact: (target: string) => Effect.Effect<ImpactReport, LocusNotFound | CapabilityNotFound>
  readonly invoke: (ref: CapabilityRef | string, input: unknown, options: InvokeOptions) => Effect.Effect<InvocationOutcome>
}
export class Telos extends Context.Service<Telos, TelosApi>()("@telos/kernel/Telos") {
  static readonly make: (root: LocusDefinition) => Effect.Effect<TelosApi>
  static readonly layer: (root: LocusDefinition) => Layer.Layer<Telos>
}
```

`LocusNotFound` message: `"No Locus <id> in the model."`.

`buildModel(root)` returns a `SemanticModel` whose `diagnostics` is `[]` for a valid model. `invoke(model, ref, input, { via })` is described in the kernel contract; a Locus may always invoke its own capabilities (`via === ref.locus`).

### Calculator page (exact selectors and texts; tests rely on them)

`apps/docs/src/components/calculator-view.tsx`:

- `CALCULATOR_INTRO` is exactly the llms bullet text above.
- `outcomeText(outcome: InvocationOutcome): string` returns `JSON.stringify(outcome)`.
- `CalculatorView({ formModel }: { readonly formModel: WebFormModel })` renders:
  - `<main id="content" data-page="calculator" className="flex flex-col gap-8 py-8">`, `<h1>Calculator</h1>` and `<p>{CALCULATOR_INTRO}</p>`.
  - A paragraph: "Each form is derived from a capability contract of calculator:arithmetic and submits through the calculator:web interface, so it reports the same errors as the command line and the agent tools."
  - Hydration flag: `useState(false)` plus `useEffect(() => setHydrated(true), [])`. Then `<div data-slot="calculator" data-ready={hydrated ? "true" : "false"}>`.
  - Per form, in `formModel.forms` order, a `<form data-form={form.name} aria-labelledby={\`form-${form.name}-title\`}>` holding:
    - `<h2 id={\`form-${form.name}-title\`}>{form.name}</h2>` and `<p>{form.description}</p>`
    - for each field: `<label htmlFor={\`${form.name}-${field.name}\`}>{field.label}</label>` and the existing `Input` (`@/components/ui/input`) with `id={\`${form.name}-${field.name}\`}`, `name={field.name}`, `inputMode={field.inputMode}` and `aria-required={field.required}`. Do **not** set the HTML `required` attribute: the kernel must report missing input.
    - `<Button type="submit" data-action="submit">Submit</Button>` (`@/components/ui/button`)
    - after a submit, `<section data-result="calculator" data-form={form.name} aria-live="polite"><pre data-slot="outcome">{outcomeText(outcome)}</pre></section>`
  - `onSubmit`:
    1. Call `event.preventDefault()`.
    2. Build `const data = new FormData(event.currentTarget)` and `raw = Object.fromEntries(form.fields.map((f) => [f.name, String(data.get(f.name) ?? "")]))`.
    3. Run `Effect.runPromise(form.submit(raw)).then((outcome) => setOutcomes((prev) => ({ ...prev, [form.name]: outcome })))`. The state is `Readonly<Record<string, InvocationOutcome>>`.
- `apps/docs/src/routes/calculator.tsx`: `createFileRoute("/calculator")`.
  - Module constant `const CALCULATOR_FORMS = Effect.runSync(formModel(calculatorModel, "calculator:web"))`. Build it here, not in a loader, because loader data is serialized and `submit` is a function.
  - head: title `pageTitle("Calculator")`, meta description `CALCULATOR_INTRO`
  - component: `<CalculatorView formModel={CALCULATOR_FORMS} />`

Navigation (sanctioned edits in WP19's files):

- `content-types.ts`: add `"calculator"` to `NavSectionId`, insert `{ id: "calculator", title: "Calculator", route: "/calculator" }` after `playground`, and add `"/calculator"` to `APP_ROUTES`.
- `prerender.ts`: add `"/calculator"` to `APP_PAGES`.
- `scripts/content.ts`: add a `calculator` branch in `llmsText` with the bullet above.
- `e2e/machine-files.e2e.ts`: add the Calculator line after the Playground line in `APP_PAGE_LINES`.
- `e2e/a11y.e2e.ts`: add `{ name: "calculator", path: "/calculator" }`.
- `test/content.test.ts`: add `## Calculator\n\n- [Calculator](/calculator): <bullet>` after the Playground block in the expected llms text.
- `test/site.test.ts`: add `["/calculator", "calculator"]` to `SECTION_CASES`.

### Guides (rewrite all four; keep `id`, `title`, `kind: guide`, `order`, `section`, `status: provisional`, `maturity: implemented`)

The front matter `related` lists use document ids that exist after WP16:

- `introduction`: `[foundation, locus, semantic-extension, archetype, first-locus]`
- `first-locus`: `[locus, semantic-extension, composition, capability, semantic-model, examples]`
- `examples`: `[first-locus, capability, interface-locus, archetype, impact]`
- `agent-reference`: `[foundation, decisions, knowledge-status, grant, capability]`

Each `summary` is one new sentence. None of them contains `verified` or `passing`.

**Allowed fenced blocks.** Any other info string fails `guides.test.ts`:

| Info string | Rule (checked by tests) |
| --- | --- |
| `ts source=<repo path>#<REGION>` | The body equals the region between `// START_BLOCK_<REGION>` and `// END_BLOCK_<REGION>` of that file. Common leading indentation is removed and outer blank lines are trimmed. |
| `json playground=<name>` | The body equals `PLAYGROUND_EXAMPLES` entry `<name>`'s `json`. |
| `sh` | Every line is a known command (see `commandProblem` below). |
| `text` | Allowed only directly after an `sh` block that has exactly one line starting with `bun run calculator ` (with a trailing space). The body equals the trimmed `stdout + stderr` of that command. |
| `mermaid` | A diagram; not checked beyond the content build. |

**Inline code and prose.** The prose check rejects `verified`, `passing` and `all tests pass` outside code. Write knowledge statuses as inline code, for example `` `verified` ``. Site links to app pages may only target `/`, `/inspector`, `/playground`, `/calculator`, `/verification` and document routes. Write `/semantic-report.json`, `/llms.txt` and `/index.json` as inline code, never as links.

**Guide snippets file.** The first-locus guide quotes `apps/docs/test/guide-snippets.ts`. That file is real code and its own test runs it. Write exactly:

```ts
import { Effect, Schema } from "effect";
import { Capability, Extension, Locus, Purpose, Telos, buildModel } from "@telos/kernel";

// START_BLOCK_GUIDE_FIRST_LOCUS
export const hello = Locus.make({
  id: "demo:hello",
  description: "The smallest complete Locus: an identity and a description.",
});
// END_BLOCK_GUIDE_FIRST_LOCUS

// START_BLOCK_GUIDE_EXTENSION
export const Greeting = Extension.make("demo.greeting", {
  description: "Gives a Locus the greeting it answers with.",
  properties: { greeting: Schema.String },
});
// END_BLOCK_GUIDE_EXTENSION

// START_BLOCK_GUIDE_COMPOSITION
export const Greeter = Locus.extend(Purpose, Greeting);
// END_BLOCK_GUIDE_COMPOSITION

// START_BLOCK_GUIDE_CAPABILITY
export const greet = Capability.make({
  description: "Greets a person by name.",
  input: Schema.Struct({ name: Schema.String }),
  output: Schema.Struct({ text: Schema.String }),
  effect: "pure",
  handler: ({ name }) => Effect.succeed({ text: `Hello, ${name}.` }),
});

export const greeter = Greeter.make({
  id: "demo:greeter",
  description: "Answers with a greeting.",
  properties: { purpose: "Greet people by name.", greeting: "Hello" },
  capabilities: { greet },
});
// END_BLOCK_GUIDE_CAPABILITY

// START_BLOCK_GUIDE_MODEL
export const demo = Locus.make({ id: "demo:app", contains: [hello, greeter] });
export const demoModel = buildModel(demo);
// END_BLOCK_GUIDE_MODEL

// START_BLOCK_GUIDE_INSPECT
export const inspectGreeter = Effect.gen(function* () {
  const telos = yield* Telos;
  const view = yield* telos.resolve("demo:greeter");
  return yield* view.inspect();
}).pipe(Effect.provide(Telos.layer(demo)));
// END_BLOCK_GUIDE_INSPECT
```

Add the GRACE module header above the imports (`ROLE: RUNTIME`, `MAP_MODE: EXPORTS`, a map line for each export). If the typecheck rejects a line, fix the snippet minimally so that it matches the kernel contract, then report the change.

**Content of each guide** (the headings are required, and the prose is yours: short, plain English, present tense, describing only what exists):

- `introduction.md`, title "Introduction":
  - `## What Telos is`: a semantic-first, agent-native framework. Software is described as Loci composed from semantic extensions, verified by Archetypes and exposed through Packs. Link the terms (`../foundation/terminology/<id>.md`) and the foundation README.
  - `## What exists today`: the kernel `@telos/kernel`; the Packs `@telos/cli`, `@telos/agent` and `@telos/web`; the calculator reference implementation; `telos.ts` and `bun run telos`; this site. Link the package entry files with repository-relative links (`../../packages/kernel/src/index.ts`, …).
  - `## How to read this site`: one bullet per `NAV_SECTIONS` entry, in order (14 sections), each linking its route or document.
  - `## Maturity and evidence`: keep the meaning of the current section. Results appear only on the Verification page, the inspector, the playground and the calculator page, each with where and when it was produced.
- `first-locus.md`, title "Your first Locus":
  - `## 1. A Locus` with `ts source=apps/docs/test/guide-snippets.ts#GUIDE_FIRST_LOCUS` and `json playground=minimal` (`{"id":"demo:hello"}`). Explain that the JSON block is the smallest definition the playground accepts: an identity alone is a complete Locus.
  - `## 2. A semantic extension` with `#GUIDE_EXTENSION`
  - `## 3. Composition` with `#GUIDE_COMPOSITION` and `json playground=property-conflict`. Explain the conflict diagnostic.
  - `## 4. A capability` with `#GUIDE_CAPABILITY`
  - `## 5. The semantic model` with `#GUIDE_MODEL` and `json playground=composed`
  - `## 6. Inspect it` with `#GUIDE_INSPECT`
  - `## Next steps`: links to Examples, the playground (`/playground`) and the inspector (`/inspector`).
- `examples.md`, title "Examples" (the calculator reference implementation):
  - `## The model`: a `mermaid` flowchart. `calculator:app` contains `calculator:arithmetic`, `calculator:cli`, `calculator:web` and `calculator:agent`, and the three interfaces point to the four capabilities.
  - `## The arithmetic Locus`: `ts source=apps/calculator/src/arithmetic.ts#ARITHMETIC_LOCUS`
  - `## The application and its interfaces`: `ts source=apps/calculator/src/app.ts#CALCULATOR_APP`
  - `## Command line`: an `sh` block `bun run calculator add --a 2 --b 3` followed by `text` `{"result":5}`. Then an `sh` block `bun run calculator divide --a 1 --b 0` followed by `text` with the exact error JSON.
  - `## Web`: a link to `/calculator`.
  - `## Agent tools`: an `sh` block with `bun run calculator:mcp` and `bun run calculator:agent-demo`, and what the demo does.
  - `## Archetypes and verification`: the calculator Archetypes, and an `sh` block with `bun run telos verify`
  - `## Change impact`: an `sh` block with `bun run telos impact calculator:arithmetic#add`, and what it lists
  - `## Invalid definitions`: the playground examples `json playground=missing-target` and `json playground=cycle`, with the diagnostic each one gives
- `agent-reference.md`, title "Agent Reference":
  - `## Start here`: keep as today.
  - `## Entry points`: a table with these rows:
    - `packages/kernel/src/index.ts`
    - `packages/agent/src/introspection-tools.ts`
    - `telos.ts`
    - `scripts/telos.ts`
    - `apps/docs/scripts/content.ts`
    - `apps/docs/package.json`
    - `package.json`
    - `bunfig.toml`
    - `docs/tooling.md`
    - `.grace/`
  - `## State queries`: keep the `sh` block exactly as today.
  - `## Check commands`: keep the block, and add `bun run telos:check` after `bun run grace:lint`. Update the `bun run verify` sentence to end with the Telos check.
  - `## Repository model commands`: one `sh` block with these commands, each explained in one bullet:
    - `bun run telos list`
    - `bun run telos inspect telos:kernel`
    - `bun run telos verify`
    - `bun run telos closure`
    - `bun run telos impact calculator:arithmetic#add`
    - `bun run telos check`
    - `bun run telos report --out semantic-report.json`
  - `## Introspection tools`: one line per tool, `` - `telos_<name>`: <what it returns> ``, for the six names of `INTROSPECTION_TOOL_NAMES`. Discovery never grants invocation.
  - `## Knowledge statuses`: `declared`, `derived`, `verified`, `failed`, `not-run`, `unknown`, and the reserved `observed` and `invalidated` (no function returns them yet), as inline code with one sentence each. These are the values of the kernel type `Knowledge`.
  - `## Grant rule`: who may invoke a capability (the Locus itself, or a Locus with a relation whose type grants invocation).
  - `## Machine-readable files`: `/semantic-report.json`, `/llms.txt` and `/index.json` as inline code.
  - `## Public API of \`@telos/kernel\``: a table `| Export | What it does |` with one row per runtime export, written as `` `name` ``. Get the list with `bun -e 'console.log(Object.keys(await import("@telos/kernel")).sort().join("\n"))'` run in `apps/docs`.
  - `## Diagnostic codes`: one line per code, `` - `<code>` ``, for the 17 `DiagnosticCode` values, and a link to `(../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md)`.

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

- `tsconfig.json`, `bun.lock`, `apps/docs/package.json`, `apps/docs/test/manifest.test.ts` (WP01): remove `packages/locus` and `@telos/locus` only.
- `telos.ts` (WP15): remove `telos:legacy-locus` and the relation to it. `.grace/graph/tooling.xml` (WP15): remove legacy module dependencies only.
- `apps/docs/src/lib/content-types.ts`, `apps/docs/src/lib/prerender.ts`, `apps/docs/scripts/content.ts`, `apps/docs/e2e/machine-files.e2e.ts`, `apps/docs/e2e/navigation.e2e.ts`, `apps/docs/e2e/a11y.e2e.ts` (WP19): add the calculator page.
- `apps/docs/test/content.test.ts`, `apps/docs/test/site.test.ts` (WP16): the Calculator llms bullet and route rows only.
- `apps/docs/src/routeTree.gen.ts`, `.grace/graph/docs.xml`, `.grace/verification/docs.xml` (WP18): regenerate the route tree; add M-DOCS-CALCULATOR and V-M-DOCS-CALCULATOR; add guide-snippets.test.ts to the guides verification entry; drop legacy dependencies.
- `.grace/graph/index.xml`, `.grace/verification/index.xml` (WP01): delete the `GD-LEGACY` and `VD-LEGACY` blocks.

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

Exported types and interfaces need only the MODULE_MAP line. Test files use `ROLE: TEST` and `MAP_MODE: LOCALS`, and list their local helpers (or "none") in the map. Optional named regions use `// START_BLOCK_<NAME>` / `// END_BLOCK_<NAME>`. The guides quote these regions (contracts/docs.md).

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
- Test files use `ROLE: TEST`, `MAP_MODE: LOCALS`, and a **non-empty** map: list the local helpers, or one line `none - no local helpers`.
- Every `<File>` in a verification entry must exist. Register a module only together with its verification entry, after the test files exist.
- A module's dependency modules are empty child elements (`<M-KERNEL-DIAGNOSTIC />`) and must be registered ids.

## Branch Strategy

- **Planning base branch**: `feat/semantic-foundation-rebuild`
- **Merge target branch**: `feat/semantic-foundation-rebuild`

Execution worktrees are allocated per computed lane from `lanes.json`. Start with `spec-kitty agent action implement WP20 --agent claude`, and commit only inside the worktree it gives you.

## Subtasks

### T120 – Calculator page

1. Write `calculator-view.tsx`, `routes/calculator.tsx` and the navigation edits above.
2. Write `apps/docs/test/calculator.test.tsx` (`renderToStaticMarkup`, as in `components.test.tsx`):
   - `formModel(calculatorModel, "calculator:web")` has forms whose names, sorted, are `["add", "divide", "multiply", "subtract"]`.
   - The rendered page has:
     - one `data-form="<name>"` per form
     - `inputmode="decimal"`
     - a label `for="add-a"` with the text `A`
     - `data-ready="false"`, because effects do not run in static rendering
   - `outcomeText` of `await Effect.runPromise(addForm.submit({ a: "2", b: "3" }))` contains `"result":5`. Divide `{ a: "1", b: "0" }` contains `DivisionByZero`. Add `{ a: "x", b: "1" }` contains `InvalidInput`.
3. Write `apps/docs/e2e/calculator.e2e.ts` (use `trackPageErrors`). Go to `/calculator` and wait for `[data-slot="calculator"]` to have `data-ready="true"`. Then:
   - Fill `#add-a` = 2 and `#add-b` = 3, and click `[data-form="add"] [data-action="submit"]`. `[data-result="calculator"][data-form="add"] [data-slot="outcome"]` contains `"result":5`.
   - Divide 1 by 0 gives `DivisionByZero`.
   - Add with `a = x` and `b = 1` gives `InvalidInput`.

**Vite bundle check.** Run `bun run docs:build` as soon as the route exists. If the client bundle fails because `@telos/calculator` pulls in a Bun-only module (for example `bun:*`, `node:child_process`, or `@telos/agent/mcp`), **stop and report the exact error**. Do not work around it.

### T121 – Guides

Write `apps/docs/test/guide-snippets.ts` (above), then rewrite the four guides as specified. Run `bun run --cwd apps/docs content` until it reports no problem.

### T122 – Guide tests

**`apps/docs/test/guide-snippets.test.ts`** (new):

- `demoModel.diagnostics` equals `[]`.
- `Greeter.conflicts` equals `[]`.
- `await Effect.runPromise(inspectGreeter)` has `id` `"demo:greeter"`, `extensions.map((e) => e.id)` equal to `["telos.purpose", "demo.greeting"]`, and `capabilities.map((c) => c.name)` equal to `["greet"]`.
- `await Effect.runPromise(invoke(demoModel, greeter.capability("greet"), { name: "Ada" }, { via: "demo:greeter" }))` equals `{ ok: true, output: { text: "Hello, Ada." } }`.

**`apps/docs/test/guide-examples.test.ts`** (rewrite; no `@telos/locus`):

- Read the four guides and collect the fences with the regex ``/^```([^\n]*)\n([\s\S]*?)^```$/gm``.
- `regionOf(path, region)`:
  - Read `<repo>/<path>` and take the lines strictly between the line whose trimmed text is `// START_BLOCK_<region>` and the line whose trimmed text is `// END_BLOCK_<region>`. Throw when either line is missing.
  - Remove the smallest leading-space count of the non-blank lines from every line.
  - Trim leading and trailing blank lines, and join with `"\n"`.
- Tests:
  - "every source= block equals its region": for each `ts source=<path>#<REGION>` fence, `fence body without its final newline` equals `regionOf(path, REGION)`.
  - "every playground= name is a playground example": the names exist in `PLAYGROUND_EXAMPLES` (import from `../src/playground/examples`).
  - "every playground= block is the example JSON": each body equals the example's `json`.
  - "the guides quote ARITHMETIC_LOCUS, CALCULATOR_APP and all six GUIDE_ regions": each region appears at least once.

**`apps/docs/test/guides.test.ts`** (rewrite; no `@telos/locus`). Keep these parts of the current file unchanged:

- `GUIDE_SPECS`, `FRONT_MATTER`, `FENCE`, `loadGuide`, `GUIDES`, `AGENTS`, `sectionOf`
- the front matter and body tests, except one change: the prose check removes inline code first, `guide.body.replace(FENCE, "").replace(/`[^`]*`/g, "")`
- the table-column test and the content compile test

Then:

- `kindOf(info)`: returns `"sh"`, `"text"` or `"mermaid"` for those exact strings, `"source"` for `/^ts source=\S+#[A-Z0-9_]+$/`, `"playground"` for `/^json playground=[a-z-]+$/`, and `undefined` otherwise. Test: "every fenced block has an allowed info string".
- `commandProblem(line)`:
  - `bun run --cwd apps/docs <script>`: the script is in `apps/docs/package.json`.
  - `bun run <script> [args…]`: the **first word** after `bun run ` is a script of the root `package.json`.
  - `spec-kitty …` and `grace …` lines are in `AGENTS.md`.
  - `git status` and `git worktree list` exit 0.
  - Anything else is unknown.

  Test: "every sh line is a known command".
- Test: "text blocks show the real output of the calculator command before them". For each `text` fence, the previous fence is an `sh` fence with exactly one line starting with `bun run calculator `. Spawn `[process.execPath, "run", "--silent", "calculator", ...args]` in the repository root, where `args` are the words after `bun run calculator`. The trimmed `stdout + stderr` equals the trimmed body.
- Agent Reference tests:
  - "the public API table lists exactly the runtime exports of @telos/kernel": the `## Public API of \`@telos/kernel\`` table names, sorted, equal `Object.keys(await import("@telos/kernel")).sort()`.
  - "the introspection tools are the six names of INTROSPECTION_TOOL_NAMES": read `packages/agent/src/introspection-tools.ts` as text. Do not import it, because the docs app does not depend on `@telos/agent`. Collect the unique sorted matches of `/"(telos_[a-z_]+)"/g` and compare them with the `` - `telos_…` `` names of the `## Introspection tools` section. Also expect 6 names.
  - "the diagnostic codes are the DiagnosticCode values of the kernel": read `packages/kernel/src/diagnostic.ts`, take the text from `export type DiagnosticCode =` to the next `;`, and collect `/"([a-z]+\.[a-z-]+)"/g`. That gives 17 codes. Compare them, sorted, with the `## Diagnostic codes` list. The section contains the link `(../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md)`.

Update the module headers: `DEPENDS: M-DOCS-CONTENT, M-KERNEL-API, M-DOCS-PLAYGROUND` and a map line per local helper. Run `bun test apps/docs/test`.

### T123 – Remove `packages/locus`

1. `git rm -r packages/locus`.
2. Make these sanctioned edits:
   - root `tsconfig.json`: remove `{ "path": "packages/locus" }` and `{ "path": "packages/locus/test" }`
   - `apps/docs/package.json`: remove `"@telos/locus": "workspace:*"`
   - `apps/docs/test/manifest.test.ts`: remove the `@telos/locus` entry
   - `telos.ts`: remove the `telos:legacy-locus` Locus, its entry in the repository's `contains`, and the docs-site relation to it
3. Run `bun install`. The `bun.lock` diff must only remove the `@telos/locus` workspace entries.
4. Run `git grep -n "@telos/locus\|packages/locus" -- . ':!kitty-specs' ':!docs/research' ':!docs/decisions' ':!docs/tooling.md' ':!README.md'`. It must print nothing. WP21 handles `README.md`, `docs/tooling.md` and the decision records.

### T124 – GRACE

- Delete `.grace/graph/legacy.xml` and `.grace/verification/legacy.xml`, and remove the `GD-LEGACY` and `VD-LEGACY` blocks from the two index files.
- In `.grace/graph/tooling.xml`, remove any `<M-LOCUS-* />` child (sanctioned).
- Add `M-DOCS-CALCULATOR` to `.grace/graph/docs.xml`:
  - Summary: "The calculator page: web forms derived from the capability contracts of calculator:arithmetic, invoked in the browser."
  - Paths: `apps/docs/src/routes/calculator.tsx`, `apps/docs/src/components/calculator-view.tsx`
  - Children: `<M-PACK-WEB />`, `<M-CALC-INTERFACES />`, `<M-DOCS-SITE />`
- Add `V-M-DOCS-CALCULATOR` to `.grace/verification/docs.xml`:
  - TestFiles: `apps/docs/test/calculator.test.tsx`, `apps/docs/e2e/calculator.e2e.ts`
  - Commands: `bun test apps/docs/test/calculator.test.tsx`, `bun run test:e2e apps/docs/e2e/calculator.e2e.ts`
- Add `apps/docs/test/guide-snippets.test.ts` to the TestFiles and Command of the verification entry that lists `guides.test.ts`.
- Update the `GD-DOCS` and `VD-DOCS` `<Owns>` blocks.
- `git grep -n "M-LOCUS-" -- .grace apps packages scripts telos.ts` must print nothing.

Run `bun run grace:lint`.

### T125 – Verify

Run `bun run format`, then `bun run verify`, and report each step. Then run `bun run telos check` once more on its own. It must exit 0 after the legacy Locus is gone.

## Definition of Done

- [ ] Every subtask of this WP is done, and its tests were written first.
- [ ] Every new or changed source and test file carries GRACE markup; your modules and verification entries are registered in your own area documents and index blocks.
- [ ] `bun run format`, then `bun run verify` passes in the worktree (report each step exactly). From WP15 on, `verify` includes `telos:check`.
- [ ] `bun run grace:lint` passes.
- [ ] Only owned files and the sanctioned edits changed (`git diff --stat` against the base shows nothing else).
- [ ] Commits follow Conventional Commits with a scope, with no AI names and no author, co-author or session lines.
- [ ] Mark each subtask done with `spec-kitty agent tasks mark-status <Txxx> --status done --mission semantic-foundation-rebuild-01M5JFR0`, then move the WP to review with `spec-kitty agent tasks move-task WP20 --to for_review --mission semantic-foundation-rebuild-01M5JFR0 --note "<one line>"`.

## Risks

- **Vite bundle**: the browser bundle must not pull Bun-only modules. Stop and report if it does.
- **Command echo**: `bun run` prints the command line to stderr. The output check uses `bun run --silent`.
- **Prose check**: `verified` in prose fails the guide test unless it is inline code.
- Removing `packages/locus` while a file still imports it breaks the typecheck. Run the T123 grep before `bun install`.

## Reviewer guidance

- `/calculator` works in Chromium (`calculator.e2e.ts`). Its forms come from `formModel`, not hand-written fields.
- Every TS block in the guides is a `source=` region of real, compiled code, and every JSON block is a playground example.
- `packages/locus` and the legacy GRACE area are gone, and the removal grep is clean.
