# Contract: documentation (WP16, WP17, WP18, WP19)

Repository rule (C-006): site content is generated from `docs/`. Prose is never edited inside `apps/docs`. The app owns only pages that render data (inspector, verification, playground, calculator) and the pipeline.

## Document content (WP16 foundation, WP17 decisions)

The front matter schemas in `apps/docs/scripts/content.ts` stay **unchanged** in this mission. Terms keep `order`, `classification`, `fundamental`, `engine` and `stage0`. New terms use `engine: false` and `stage0: "in-scope"`, or `"deferred"` for future-only concepts.

### Principles (WP16, spec D2)

Delete `docs/foundation/principles/P01-*.md` … `P16-*.md`, then write these 16 files (`kind: principle`, `number`, `code`, `status: provisional`, `maturity: proposed`). Each has the sections `## Definition`, `## Motivation`, `## In practice` (how the kernel, Packs or gate apply it, naming real modules), and `## Limits`.

| File | Title |
| --- | --- |
| `P01-one-fundamental-entity.md` | One Fundamental Entity: Locus |
| `P02-composable-extensions.md` | Extensions Are Composable |
| `P03-no-code-outside-semantics.md` | No Code Outside Semantics |
| `P04-code-is-the-source-of-truth.md` | Executable Code Is the Source of Semantic Truth |
| `P05-agents-use-semantic-apis.md` | Agents Access Knowledge Through Semantic APIs |
| `P06-archetypes-specialize-verification.md` | Archetypes Provide Specialized Verification |
| `P07-no-universal-correctness.md` | No Universal Correctness Algorithm |
| `P08-no-mandatory-architecture.md` | No Mandatory Application Architecture |
| `P09-no-duplicated-frameworks.md` | No Duplication of Existing Frameworks |
| `P10-no-unnecessary-layers.md` | No Unnecessary Abstraction Layers |
| `P11-no-compatibility-for-mistakes.md` | No Compatibility for Obsolete Mistakes |
| `P12-no-duplicate-semantic-models.md` | No Manually Synchronized Duplicate Models |
| `P13-no-unverified-guarantees.md` | No Unverified Claims as Guarantees |
| `P14-no-ai-in-the-kernel.md` | No AI Dependency in the Semantic Kernel |
| `P15-no-arbitrary-agent-privileges.md` | No Arbitrary Agent Privileges |
| `P16-no-speculative-implementation.md` | No Speculative Implementation |

`docs/foundation/principles/README.md` lists them in this order. P12 states the GRACE overlap (spec D4) as a known limit.

### Terms (WP16)

- **Delete**: `fabric.md`, `facet.md`, `lens.md`, `law.md`, `act.md`, `charter.md`, `mandate.md`, `variant.md`, `witness.md`, `verdict.md`, `evolution.md`, `revision.md`.
- **Rewrite**: `locus.md` (order 1), `identity.md`, `relation.md`, `archetype.md`.
- **Add** (`order` in this sequence after locus): `semantic-extension.md`, `composition.md`, `locus-kind.md`, `containment.md`, `relation-type.md`, `capability.md`, `contract.md`, `rule.md`, `diagnostic.md`, `finding.md`, `knowledge-status.md`, `semantic-model.md`, `semantic-closure.md`, `pack.md`, `interface-locus.md`, `impact.md`, `grant.md`, `purpose.md`.
- Each term uses the spec's Domain Language definition and the "Avoid" column. `fundamental: true` only for `locus`.
- `docs/foundation/terminology/README.md` lists them.

### Other foundation documents (WP16)

| File | Action |
| --- | --- |
| `docs/foundation/README.md` | Rewrite. Telos as semantic-first, agent-native programming. Covers: the Locus and extension model, introspection, Packs, Semantic Closure, the calculator proof, what is implemented vs. future, and links to the principles, terms and ADR-0018. |
| `docs/foundation/conceptual-model/README.md` | Rewrite with Mermaid diagrams of Locus, extensions, relations, capabilities, Archetypes and the knowledge statuses. |
| `docs/foundation/architecture/capabilities.md` | Rewrite as the capability map of the kernel, Packs and calculator (what exists, with module names). |
| `docs/foundation/architecture/technical-direction.md` | Rewrite: TS + Effect + Bun, kernel browser-safe, Packs, no new dependencies. |
| `docs/foundation/roadmap/README.md` | Rewrite: done in this mission, next candidates, kept as direction only (ADR-0016). |
| `docs/foundation/open-questions.md` | Rewrite: spec D4, closure limits, revisioning, the autonomous factory being out of scope (C-008). |
| `docs/foundation/philosophy/evolution-of-determinism.md` | Update its terms to the new model. Keep its argument. |
| `docs/foundation/future-semantic-evolution.md` (new, `kind: direction`, `maturity: vision`) | Mandate, Variant, Witness, Verdict, Evolution and Revision as future concepts. For each: what it would mean as an extension of the current model, and why it is not built now. |

**Link integrity** (WP16 owns it across all of `docs/`): every `related` id and every Markdown link in `docs/**` that points to a deleted document is changed to the replacement (fabric → semantic-model, facet → semantic-extension, lens/law → archetype, act → capability, charter → purpose, the vision terms → future-semantic-evolution, old principle ids → the new principle with the closest meaning). This includes ADRs and guides, where only the `related` lists and link targets change. Their prose is WP17's and WP19's.

WP16 also updates the docs tests that name removed document ids (`apps/docs/test/content.test.ts`, `site.test.ts`, `search.test.ts`, and any e2e test that names a removed id). It also updates `.grace/context/principles.xml` and `.grace/context/requirements.xml` to the new principles.

### Decisions (WP17, spec D8)

The new ADRs use `kind: decision` and `date: 2026-10-22`. The `status` is given in the table. Each ADR has the sections Context, Decision, Alternatives and Consequences, and the `related` list names the ADRs it supersedes.

| File | Status | Supersedes |
| --- | --- | --- |
| `ADR-0018-semantic-foundation-rebuild.md`: records the owner directive | accepted | — |
| `ADR-0019-locus-with-composable-extensions.md` | proposed | ADR-0002, ADR-0006 |
| `ADR-0020-containment-is-structural-ownership.md` | proposed | ADR-0007 |
| `ADR-0021-relation-types-defined-by-extensions.md` | proposed | ADR-0008 |
| `ADR-0022-capabilities-and-governed-invocation.md` | proposed | ADR-0009 |
| `ADR-0023-archetypes-and-knowledge-status.md` | proposed | ADR-0010, ADR-0013 |
| `ADR-0024-digests-and-model-comparison.md` | proposed | ADR-0005 |
| `ADR-0025-living-docs-from-the-real-kernel.md` | proposed | ADR-0014 |
| `ADR-0026-semantic-closure-at-file-granularity.md` | proposed | — |
| `ADR-0027-packs-are-ordinary-packages.md` | proposed | — |
| `ADR-0028-repository-self-description-gate.md` | proposed | — |

- For each superseded ADR, set `status: superseded` and add, directly under the title: `> Superseded by [ADR-00NN](ADR-00NN-....md).` Do not change its other text.
- `docs/decisions/README.md` lists every ADR with its status.
- ADR-0017 stays accepted and unchanged. ADR-0018 states that the calculator is now decided by the owner directive.

## Site pipeline (WP18)

| Change | Detail |
| --- | --- |
| `apps/docs/scripts/semantic-report.ts` (new; replaces `spec-report.ts`) | Writes `src/generated/build-info.json` (`{ commit, dirty }`, same shape and git logic as the old script) first. Then it spawns `bun <repo>/scripts/telos.ts report --out <docs>/src/generated/semantic-report.json` (a subprocess, not an import) and copies the file to `public/semantic-report.json`. It exits 1 when the spawn fails. |
| `apps/docs/package.json` scripts | `"semantic-report": "bun scripts/semantic-report.ts"`, `"build": "bun run content && bun run semantic-report && bun run build:site"`. Remove `spec-report`. |
| `.gitignore` | Add `apps/docs/public/semantic-report.json`. |
| `src/lib/generated.ts` | Inline `../generated/semantic-report.json` (`semanticReportJson`) instead of `spec-report.json`. |
| `src/lib/build-data.ts` | Replace the SpecReport types and `readSpecReportFile` with `readSemanticReport(value: unknown): SemanticReport \| null`. It checks `version === 1` and the presence and type of `provenance`, `model.loci`, `verification.findings`, `verifications`, `closure.findings` and `ok`. It throws `"semantic-report.json: <field> is invalid"`. The `SemanticReport` type is imported as a type from `scripts/telos.ts`'s contract, copied as a local interface (the docs app does not import root scripts). |
| `scripts/check-verification.ts` | `RESULT_MARKER = 'data-result="semantic-report"'`. Messages say "semantic report". |
| `src/lib/content-types.ts` | WP18 adds `"inspector"` to `NavSectionId`, inserts it into `NAV_SECTIONS` after `examples`, and adds `"/inspector"` to `APP_ROUTES`. WP19 then adds `"calculator"` after `playground`, adds `"/calculator"`, and removes `"/playground/a"`…`"/playground/e"`. The final order is introduction, philosophy, principles, terminology, architecture, first-locus, examples, inspector, playground, calculator, verification, roadmap, decisions, agent-reference. |
| `src/lib/prerender.ts` | `APP_PAGES` gains `/inspector` and one `/inspector/<slug>` per Locus in the report. |
| `scripts/content.ts` `llmsText` | Inspector: "The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json." Verification: "The Archetype verification and Semantic Closure report from the build-time run, with its provenance." |

### Locus slugs

```ts
export const locusSlug = (id: string): string => id.replace(":", "--")   // "telos:kernel" -> "telos--kernel"
export const locusIdOf = (slug: string): string => slug.replace("--", ":")
```

These are safe because Locus ids never contain `--` (identity grammar).

### Pages (WP18)

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
- `/verification`: provenance, the summary counts, a table of findings (Locus, Archetype, rule, method, outcome, message), the closure limits, and the closure findings (empty state text "No closure findings."). The root element carries `data-result="semantic-report"`.
- Components:
  - new: `src/components/locus-view.tsx`, `src/components/knowledge-badge.tsx`, `src/components/semantic-report-view.tsx`
  - delete: `spec-report-table.tsx`, and `verification-view.tsx` or rewrite it as the new view

### Tests (WP18)

- `test/semantic-report.test.ts`: `readSemanticReport` accepts a valid fixture and rejects each missing field.
- `test/inspector.test.tsx`: renders a `LocusView` from a fixture description. It asserts the capability schema and the knowledge badges.
- `test/verification.test.tsx`: rewritten for the semantic report.
- e2e:
  - `navigation.e2e.ts` uses the new nav order, and the Verification page shows at least one finding row (no hard-coded count).
  - `inspector.e2e.ts` (new): `/inspector` lists `telos:kernel`, `/inspector/calculator--arithmetic` shows the `add` capability and `exposedBy` `calculator:cli`.
  - `a11y.e2e.ts` covers `/inspector`.
- Delete `scripts/spec-report.ts`, `test/spec-report.test.ts`, and the spec-report parts of `test/provenance.test.ts` and `e2e/provenance.e2e.ts`.

## Playground, calculator page, guides, removal (WP19)

### Playground (`/playground`, single page; `/playground/$scenario` is removed)

- `src/playground/registry.ts` (rewritten) exports `PLAYGROUND_REGISTRY: ExtensionRegistry`:
  - `[Purpose, Source, External, DemoLabelA, DemoLabelB, DemoFlow]` (the docs app depends only on `@telos/kernel`, `@telos/web` and `@telos/calculator`)
  - `DemoLabelA` (`"demo.label-a"`) and `DemoLabelB` (`"demo.label-b"`) both define `label: Schema.String`, so composing them shows a conflict.
  - `DemoFlow` (`"demo.flow"`) defines the RelationType `"demo.flows-to"` (target `"locus"`, `acyclic: true`) and an Archetype `"demo.flow-has-label"` with one static rule `flow.labelled`, which fails when the Locus has no `description`.
- `src/playground/examples.ts` exports `PLAYGROUND_EXAMPLES: ReadonlyArray<{ name: string; title: string; valid: boolean; json: string }>`:

  | name | valid | shows |
  | --- | --- | --- |
  | `minimal` | yes | `{"id":"demo:hello"}` |
  | `composed` | yes | Purpose and Source with properties, a contained Locus, and a `demo.flows-to` relation |
  | `property-conflict` | no | extensions `demo.label-a` and `demo.label-b` → `composition.property-conflict` |
  | `invalid-property` | no | Purpose with `purpose: 5` → `property.invalid` |
  | `missing-target` | no | relation to `demo:nowhere` → `relation.target-missing` |
  | `cycle` | no | two Loci that flow to each other → `relation.cycle` |
  | `malformed-id` | no | id `Demo Hello` → `identity.malformed` |
  | `unknown-extension` | no | `extensions: ["demo.unknown"]` → decode issue |

- `src/playground/run.ts`: `runDefinition(text: string): Effect<PlaygroundResult>`. It calls `decodeLocusText`, then `buildModel`, `verify(model, { runner: "browser", methods: ["static"] })` and `describeModel`. The result is `{ decodeIssues } | { diagnostics, report, description }`.
- UI: an example picker, a JSON editor (the existing `json-editor` component), a Run button, and result panels for decode issues, diagnostics, verification findings and the model description. The result root has `data-result="playground"`.
- Delete the old scenario files: `run-fabric.ts`, `run-revisions.ts`, `run-specs.ts`, `locus-text.ts`, the scenario components, and `routes/playground/$scenario.tsx`. `run-state.ts` and `use-run.ts` are kept if still used.

### Calculator page (`/calculator`)

- `src/routes/calculator.tsx` renders `formModel(calculatorModel, "calculator:web")`.
- There is one form per capability. Labeled inputs use `inputMode`. The Submit button shows the `InvocationOutcome` JSON in a result panel with `data-result="calculator"`.
- The page states that the forms are derived from the capability contracts.

### Guides (`docs/guides/`, `section` values unchanged)

| File | Content |
| --- | --- |
| `introduction.md` | What Telos is now and where to start |
| `first-locus.md` | `Locus.make`, then an extension, composition, a capability, `buildModel`, `Telos.resolve(...).inspect()` |
| `examples.md` | The calculator reference implementation: model diagram, the four capabilities, the three interfaces, the Archetypes, change impact, and how to run the CLI, Web and Agent Tools (`bun run calculator add --a 2 --b 3`, `bun run calculator:mcp`, `bun run calculator:agent-demo`, `/calculator`) and verification (`bun run telos verify`) |
| `agent-reference.md` | For agents: the introspection tools, `bun run telos` commands, `/semantic-report.json`, knowledge statuses, the grant rule |

**Checked examples** (`apps/docs/test/guide-examples.test.ts`, rewritten). These are fenced blocks whose info string is:

- `ts source=<repo path>#<REGION>`: the block body must equal the text between `// START_BLOCK_<REGION>` and `// END_BLOCK_<REGION>` in that file, with common leading indentation removed and outer blank lines trimmed. WP19 adds those markers to `apps/calculator/src/arithmetic.ts` (`ARITHMETIC_LOCUS`) and `app.ts` (`CALCULATOR_APP`).
- `json playground=<name>`: the body must equal `PLAYGROUND_EXAMPLES` entry `<name>`'s `json`.

### Removal

- Delete `packages/locus/` entirely.
- Move `packages/locus/test/manifest.test.ts`, the workspace manifest check (exact pins, no trusted scripts), to `scripts/manifest.test.ts`. Its paths are adapted, and its claims stay the same.
- Remove the `packages/locus` references from the root `tsconfig.json`, `apps/docs/package.json` (`@telos/locus`), `telos.ts` (`telos:legacy-locus`) and its `.grace` legacy area documents. Run `bun install` to update `bun.lock` (workspace entries only).

### e2e (WP19)

- `playground.e2e.ts` (rewritten):
  - For each example, run it and assert the expected diagnostic code text or "No diagnostics".
  - Edit the JSON to a syntax error and assert that the decode issue appears.
  - This proves the kernel runs in Chromium (NFR-001).
- `calculator.e2e.ts` (new): `add` 2 and 3 shows `"result":5`, `divide` 1 and 0 shows `DivisionByZero`, and `a = x` shows `InvalidInput`.
- `keyboard.e2e.ts`, `equality.e2e.ts`, `search.e2e.ts` and `a11y.e2e.ts`: replace the old playground selectors (`#fabric-input`, "Fabric JSON") with the new editor's.
