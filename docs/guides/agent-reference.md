---
id: agent-reference
title: Agent Reference
kind: guide
order: 4
section: agent-reference
status: provisional
maturity: implemented
summary: The entry points, state queries, check and model commands, introspection tools, public API and diagnostic codes an agent needs to reconstruct the project state from the repository.
related: [foundation, decisions, knowledge-status, grant, capability]
---

# Agent Reference

An agent can reconstruct the state of this project from the repository alone. This page lists where to look, what to run, and what the code exposes.

## Start here

[`AGENTS.md`](../../AGENTS.md) holds the rules that every coding agent follows in this repository. Read it first.

Then read the [foundation README](../foundation/README.md), which sets the reading order and the maturity vocabulary. The [decision register](../decisions/README.md) lists the architecture decisions, and the [open questions](../foundation/open-questions.md) list what is still unresolved. Missions, which are the units of change, are under [`kitty-specs/`](../../kitty-specs/).

## Entry points

| Path                                                                                           | What it is                                                                                     |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`packages/kernel/src/index.ts`](../../packages/kernel/src/index.ts)                           | The public entry point of `@telos/kernel`. The API table below lists its runtime exports.      |
| [`packages/agent/src/introspection-tools.ts`](../../packages/agent/src/introspection-tools.ts) | The introspection tools that an agent uses to read the model. The list below names them.       |
| [`telos.ts`](../../telos.ts)                                                                   | The repository described as a semantic model: its Loci, sources, packages and relations.       |
| [`scripts/telos.ts`](../../scripts/telos.ts)                                                   | The `telos` command: `list`, `inspect`, `verify`, `closure`, `impact`, `check` and `report`.   |
| [`apps/docs/scripts/content.ts`](../../apps/docs/scripts/content.ts)                           | The content compiler. It turns `docs/` into the site files and reports every invalid document. |
| [`apps/docs/package.json`](../../apps/docs/package.json)                                       | The scripts and dependencies of the documentation site.                                        |
| [`package.json`](../../package.json)                                                           | The root scripts, including the check commands below.                                          |
| [`bunfig.toml`](../../bunfig.toml)                                                             | The Bun settings of the repository, including the lint and format ignore lists.                |
| [`docs/tooling.md`](../tooling.md)                                                             | The owner's overview of the tools, what they enforce, and how to set them up.                  |
| [`.grace/`](../../.grace/)                                                                     | The GRACE records of the code: the module graph, the contracts and the verification map.       |

## State queries

Run these before you start or resume work. They match the rules in [`AGENTS.md`](../../AGENTS.md), which is the authority.

```sh
git status
git worktree list
spec-kitty agent tasks status --mission <slug> --json
spec-kitty next --mission <slug> --json
spec-kitty invocations list
grace status --path . --json
```

Replace `<slug>` with the name of a mission directory under `kitty-specs/`. The query mode of `spec-kitty next` does not advance a mission. It only reports the next step.

## Check commands

Run these from the repository root, unless a line says `--cwd apps/docs`.

```sh
bun run verify
bun run test
bun run typecheck
bun run lint
bun run format:check
bun run grace:lint
bun run telos:check
bun run --cwd apps/docs content
bun run --cwd apps/docs build
bun run --cwd apps/docs test:e2e
```

- `bun run verify` runs the Bun version check, the format check, the lint, the typecheck, the tests, the docs build with its check of the built Verification page, the browser tests, the GRACE lint and the Telos check, in that order. It stops at the first failure. The browser tests need Chromium, installed once as described in [the tooling guide](../tooling.md).
- `bun run test` runs the test suite.
- `bun run typecheck` type checks the workspace.
- `bun run lint` lints the workspace.
- `bun run format:check` reports files that are not formatted, without changing them.
- `bun run grace:lint` checks the GRACE records and the code markup.
- `bun run telos:check` checks the repository model: its verification rules, its semantic closure and its diagnostics.
- `bun run --cwd apps/docs content` compiles `docs/` and lists every content problem.
- `bun run --cwd apps/docs build` builds the documentation site.
- `bun run --cwd apps/docs test:e2e` runs the browser tests with Playwright.

## Repository model commands

These commands read the repository model in `telos.ts`.

```sh
bun run telos list
bun run telos inspect telos:kernel
bun run telos verify
bun run telos closure
bun run telos impact calculator:arithmetic#add
bun run telos check
bun run telos report --out semantic-report.json
```

- `bun run telos list` lists the ids of the Loci of the model.
- `bun run telos inspect telos:kernel` describes one Locus.
- `bun run telos verify` runs the Archetype rules of the model and reports each outcome. It exits with a failure status when a rule fails.
- `bun run telos closure` checks the semantic closure of the model and reports its findings.
- `bun run telos impact calculator:arithmetic#add` lists the Loci affected by a capability and the checks that apply to them.
- `bun run telos check` runs the verification and the closure, and reports the result as JSON.
- `bun run telos report --out semantic-report.json` writes the semantic report of the model to the given file.

## Introspection tools

The agent Pack exposes these tools. Each one reads the model. Discovery never grants invocation.

- `telos_list_loci`: the ids of every Locus in the model.
- `telos_inspect`: the purpose, relations, capabilities, archetypes and diagnostics of one Locus.
- `telos_capabilities`: the capabilities of a Locus with their contracts.
- `telos_relations`: the outgoing and incoming relations of a Locus.
- `telos_impact`: the Loci and checks affected by a change to a Locus or capability.
- `telos_verifications`: the verification state of every rule that applies to a Locus.

## Knowledge statuses

A knowledge status says how a fact about the model was obtained. The kernel type `Knowledge` has these values.

- `declared`: the fact is written in a definition and nothing has checked it yet.
- `derived`: the fact is computed from the model, for example the impact of a change.
- `verified`: a rule ran and held.
- `failed`: a rule ran and did not hold.
- `not-run`: a rule exists but no run has produced an outcome for it.
- `observed`: reserved for a fact seen while the system runs. No function returns it yet.
- `invalidated`: reserved for a fact that a later change has made stale. No function returns it yet.
- `unknown`: the status cannot be decided, for example for a file that the closure check cannot parse.

## Grant rule

A capability may be invoked by the Locus that owns it, through its own identity. Another Locus may invoke it only through a valid relation whose relation type grants invocation. The kernel decides this with `isGranted`.

## Machine-readable files

The built site publishes these files for agents:

- `/semantic-report.json`: the semantic report of the repository model, with its verification and closure results.
- `/llms.txt`: the list of the pages of the site, with a short description of each.
- `/index.json`: the documents of the site, with their identities, kinds, statuses and routes.

## Public API of `@telos/kernel`

The runtime exports of the kernel are listed below. Types, interfaces and type aliases are not runtime values, so they are not in this table.

| Export                    | What it does                                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `ancestors`               | The containers of a Locus, nearest first.                                                           |
| `applicableArchetypes`    | The archetypes that apply to a Locus.                                                               |
| `Archetype`               | A named set of rules that applies to Loci of given extensions.                                      |
| `buildModel`              | Checks a root Locus tree and returns its frozen semantic model.                                     |
| `canonicalJson`           | The canonical JSON text of a value.                                                                 |
| `Capability`              | A named typed operation with optional handler.                                                      |
| `CAPABILITY_NAME_PATTERN` | The pattern of a valid capability name.                                                             |
| `capabilityKey`           | The key `<locus>#<capability>` of a capability.                                                     |
| `CapabilityNotFound`      | The typed failure for a capability that the named Locus does not have.                              |
| `CapabilityRef`           | A typed reference to one capability of one Locus.                                                   |
| `coerceInput`             | Turns the raw text of each field into its input value.                                              |
| `compareDiagnostics`      | Orders two diagnostics deterministically.                                                           |
| `decodeLocus`             | Decodes JSON into a Locus definition.                                                               |
| `decodeLocusText`         | Decodes JSON text into a Locus definition.                                                          |
| `describeCapability`      | Describes one capability of one Locus.                                                              |
| `describeLocus`           | Describes one Locus of the model.                                                                   |
| `describeModel`           | Describes every Locus of the model in model order.                                                  |
| `describeVerifications`   | The verification state of a Locus.                                                                  |
| `diffModels`              | The changes between two models.                                                                     |
| `digestOf`                | The SHA-256 digest of the canonical JSON of a value.                                                |
| `errorTag`                | The tag of an error schema.                                                                         |
| `Extension`               | A named set of properties, relation types and archetypes.                                           |
| `EXTENSION_ID_PATTERN`    | The pattern of a valid extension id.                                                                |
| `External`                | The extension that marks a Locus as external.                                                       |
| `hasErrors`               | True when the model has at least one error diagnostic.                                              |
| `impact`                  | The Loci affected by a target and the checks that apply to them.                                    |
| `incoming`                | The valid relations whose target is the given Locus or capability owner.                            |
| `inputFields`             | The input fields of a capability description, in property order.                                    |
| `invoke`                  | Runs a capability through the nine ordered checks and returns the outcome as a value.               |
| `isCapabilityName`        | True when a string is a well-formed capability name of at most 64 characters.                       |
| `isExtensionId`           | True when a string is a well-formed extension id of at most 128 characters.                         |
| `isGranted`               | True when a Locus may invoke a capability.                                                          |
| `isLocusId`               | True when a string is a well-formed Locus id of at most 128 characters.                             |
| `jsonEqual`               | True when two values have the same canonical JSON.                                                  |
| `Locus`                   | The universal Locus kind with no extensions.                                                        |
| `LOCUS_ID_PATTERN`        | The pattern of a valid Locus id.                                                                    |
| `LocusJsonSchema`         | The schema of the JSON shape of a Locus.                                                            |
| `LocusNotFound`           | The typed failure for a Locus id that is not in the model.                                          |
| `outgoing`                | Every relation that starts at a Locus.                                                              |
| `parseCapabilityKey`      | Splits a capability key at its last hash, or returns null.                                          |
| `Purpose`                 | The extension that gives a Locus a purpose.                                                         |
| `relationTargetKey`       | The single string key of a relation target.                                                         |
| `RelationType`            | A named relation type that a Locus can use.                                                         |
| `Rule`                    | One rule of an archetype.                                                                           |
| `RuleViolation`           | The typed failure of a rule that does not hold.                                                     |
| `Source`                  | The extension that describes the sources of a Locus.                                                |
| `SourceDependsOn`         | The relation type from a source to what it depends on.                                              |
| `Telos`                   | The Effect service that builds the model of a root Locus and serves the kernel to agents and tools. |
| `toJsonSchema`            | The JSON Schema document of a schema.                                                               |
| `verify`                  | Runs the selected rules of the selected Loci and returns the frozen report.                         |
| `violation`               | Fails a rule with a message.                                                                        |

## Diagnostic codes

The kernel reports each rule violation with one of the stable codes below. The [kernel contract](../../kitty-specs/semantic-foundation-rebuild-01M5JFR0/contracts/kernel.md) gives each code's scope, path, detail and invariant.

- `identity.malformed`
- `identity.duplicate`
- `ownership.multiple`
- `composition.extension-id-conflict`
- `composition.property-conflict`
- `composition.relation-type-conflict`
- `composition.archetype-id-conflict`
- `archetype.applies-to-empty`
- `property.invalid`
- `capability.name-malformed`
- `relation.type-unavailable`
- `relation.target-missing`
- `relation.capability-missing`
- `relation.target-kind`
- `relation.self`
- `relation.duplicate`
- `relation.cycle`
- `relation.cycle-limit`
