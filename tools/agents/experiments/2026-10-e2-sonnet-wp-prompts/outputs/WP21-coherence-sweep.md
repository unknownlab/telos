---
work_package_id: "WP21"
title: "Final coherence sweep"
dependencies: ["WP20", "WP17"]
requirement_refs: ["FR-029", "FR-030", "NFR-006"]
subtasks: ["T126", "T127", "T128", "T129"]
owned_files:
  - "README.md"
authoritative_surface: "README.md"
execution_mode: "code_change"
agent_profile: "curator-carla"
role: "implementer"
agent: "claude"
model: ""
---

# Work Package Prompt: WP21 – Final coherence sweep

## ⚡ Do This First: Load Agent Profile

Use the `/ad-hoc-profile-load` skill to load the agent profile specified in the frontmatter, and behave according to its guidance before parsing the rest of this prompt.

- **Profile**: `curator-carla`
- **Role**: `implementer`
- **Agent/tool**: `claude`

If no profile is specified, run `spec-kitty agent profile list` and select the best match for this work package's `task_type` and `authoritative_surface`.

---

## Objective

Leave one coherent repository: no stale reference to the removed model outside the allowed history paths, documents that match the code that now exists, GRACE and the Telos repository model in step with the files on disk, a written root `README.md`, and a green gate. Record the SC-006 evidence.

## Context

- **Why this WP exists**: spec success criterion **SC-006**: "The removed package and its public names appear in no file outside superseded ADRs, research history and earlier mission records." FR-029 (removal of the old model, no aliases), FR-030 (`.grace/` in sync, `grace lint --path . --assertions current` passes) and NFR-006 (`bun run verify` green) are checked here once, after all other work packages. You run last. Nothing depends on you.
- **What the earlier WPs left for you** (by design, from `tasks.md` "Deviations"):
  - WP16 wrote every term with `maturity: proposed` and one line `Planned module: …` per term, because the code was not on its branch. **You raise the terms whose code exists to `implemented` and replace the line by `Module: …`** (T127).
  - WP16 wrote every "Enforced today" cell of `docs/foundation/principles/README.md` as `No`. **You update the column** to the enforcement that exists now (T127).
  - WP16 changed only link *targets* in kept ADRs, guides and research notes. Link *labels* such as `[P15]` may now name the wrong principle. **You fix the stale labels and sentences outside the allowed history paths** (T127).
  - Two sentences of the accepted ADR-0015 name `@telos/locus` and the Charter. SC-006 allows removed names only in superseded ADRs, so **you edit those two sentences**.
  - `README.md` is empty. **You write it.**
- **Your authority is narrow.** `tasks.md` "Shared files" gives you exactly these edits, and nothing else:

| File area | Owner | What you may change |
| --- | --- | --- |
| `README.md` | you | write it |
| `docs/foundation/**` | WP16 | term `maturity` lines, the `Planned module` lines, "Enforced today" cells, and sentences that call an existing module planned |
| `docs/decisions/**` | WP17 | two sentences of ADR-0015 (T127 step 1) and the stale sentences listed in T127 step 5 |
| any other file that names a removed concept | its owner | **the stale sentence only** (prose, a comment, a document label), outside research history, mission records, superseded ADRs and owner-only files |

  Never edit: `kitty-specs/**`, `docs/research/**`, any ADR with `status: superseded`, `AGENTS.md`, `CLAUDE.md`, `.kittify/**` (config, charter, glossaries are owner-only), `bun.lock` by hand, `apps/docs/test/fixtures/**`. A stale name in **code, a test, a config, a `package.json`, `telos.ts` or a `.grace` module/path** is a defect of another WP: do not fix it by hand; list it (file, line, owner WP) and stop at the end of T126 triage with a report to the orchestrator (see open question 3).
- **Authoritative inputs**: `kitty-specs/semantic-foundation-rebuild-01M5JFR0/spec.md` ("Audit outcome", "Success Criteria"), `tasks.md` ("Shared files", WP21), `contracts/docs.md` ("Removal"), `contracts/conventions.md` (commands, GRACE layout), `contracts/repository.md` (Loci, `telos` commands), `contracts/calculator.md` ("Binaries", "Root scripts").
- Run all commands from the repository root, with `bash`. Commit with Conventional Commits (for example `docs(foundation): mark implemented terms`, `docs: write the root README`), no AI names, no author or co-author lines, never `--no-verify`. The `move-task` auto-commit takes only `owned_files` (`README.md`): commit every sanctioned edit to other files yourself first and name the sanctioned scope in the commit body.

### Open questions (a planner will answer; apply the default until then)

1. **Which paths may keep removed names?** SC-006 lists superseded ADRs, research history and earlier mission records. The new ADR-0018 to ADR-0028 must name the old concepts to explain what they replace, `future-semantic-evolution.md` names Mandate, Variant, Witness, Verdict, Evolution and Revision as future concepts, and the terms' `## Avoid` sections name Fabric, Facet and the others. *Default:* allow concept words (set B below) in the new ADRs, in `docs/foundation/future-semantic-evolution.md`, in `## Avoid` sections and "Words to avoid" tables, and in `open-questions.md` entries marked `Closed by the semantic foundation rebuild`. Never allow code names (sets A1 and A2) outside the history paths.
2. **Where is the SC-006 evidence recorded?** No source names a file. *Default:* in the body of the final commit and in your final report (T129); no new file in the repository.
3. **May you fix code, tests, GRACE or `telos.ts`?** *Default:* only descriptive text (a comment, a `<Summary>`, a `purpose` sentence) that names a removed concept. Never change a module, a path, a relation, a test or behaviour. Anything else: stop and report to the orchestrator.
4. **`docs/tooling.md`.** It names `packages/locus` in "Layout" and its `verify` step list is stale. *Default:* fix stale statements only; do not add new sections. List missing commands in the report.
5. **No source enumerates "the removed public names".** *Default:* the lists in T126 are derived from `packages/locus/src/index.ts` as it stood before WP20 deleted the package, minus the names the new kernel exports again (`Relation`, `Diagnostic`, `DiagnosticCode`, `decodeLocus`, `LocusDefinition`, `LocusJson`).
6. **Kept ADRs with stale text.** ADR-0003 (kept by the audit) still names Fabric, Revision and INV-002 (lines about uniqueness "per Fabric" and "Revision digest"); no WP rewrites it. *Default:* fix those sentences minimally in T127 step 5 and keep the decision itself unchanged.

---

### Subtask T126: Run the stale-reference grep sweep

**Purpose**: find every remaining reference to the removed model and classify it.

**Steps**

1. Preconditions: `test ! -d packages/locus` and `git grep -c "@telos/locus" -- bun.lock` prints nothing. If either fails, WP20 is incomplete: stop and report.
2. Define the exclusions once (bash):

```bash
cd "$(git rev-parse --show-toplevel)"
BASE_EXCL=(':!kitty-specs' ':!docs/research' ':!AGENTS.md' ':!CLAUDE.md' ':!.kittify' ':!apps/docs/test/fixtures')
for f in $(git grep -l '^status: superseded' -- docs/decisions); do BASE_EXCL+=(":!$f"); done
CONCEPT_EXCL=("${BASE_EXCL[@]}" ':!docs/foundation/future-semantic-evolution.md' ':!docs/decisions/ADR-001[89]*' ':!docs/decisions/ADR-002[0-8]*')
git grep -l '^status: superseded' -- docs/decisions
```

   The last command must list ADR-0002, 0005, 0006, 0007, 0008, 0009, 0010, 0013 and 0014 (nine files). If not, WP17 is incomplete: stop and report.
3. Run these four sets. Each prints `file:line:text`.

```bash
A1='@telos/locus|packages/locus|telos:legacy-locus|M-LOCUS-|M-DOCS-SPEC-REPORT|locus-foundation'
A2='defineFabric|defineLocus|validateFabric|decodeFabric|decodeFabricJson|createRevision|diffRevisions|RevisionHistory|RevisionHistoryInMemory|RevisionId|LocusInput|FabricJson|ValidationReport|RELATION_KINDS|RelationKind|canonicalForm|isIdentity|DigestError|LocusMismatchError|StaleBaselineError|RevisionNotFoundError|DecodeError|SetPart|ChangeSet'
B='Fabric|Fabrics|Facet|Facets|Lens|Lenses|Law|Laws|Charter|Charters|Mandate|Variant|Witness|Verdict|Revision|Revisions'
C='Scenario [A-E]|playground/[a-e]|Fabric JSON|fabric-input|equality\.e2e|INV-0[0-9][0-9]|LOC-0[0-9][0-9]'
git grep -nI  -E "$A1"      -- . "${BASE_EXCL[@]}"
git grep -nIw -E "$A2"      -- . "${BASE_EXCL[@]}"
git grep -nIw -E "$B"       -- . "${CONCEPT_EXCL[@]}"
git grep -nI  -E "$C"       -- . "${BASE_EXCL[@]}"
git grep -nIi -E 'spec[ -]report|specification report' -- . "${BASE_EXCL[@]}"
```

4. Principle codes: `git grep -nIw -E 'P(0[1-9]|1[0-6])' -- docs README.md apps/docs/src apps/docs/test apps/docs/e2e "${BASE_EXCL[@]}" ':!docs/foundation/principles' ':!docs/foundation/terminology'`. Each hit (a link label `[P15]` or a mention) must name the principle its context means, under the **new** numbering (list below). Old to new, from WP16: P01 to P04, P02 to P01, P03 to P03, P04 to P02, P05 to P05, P06 to P15, P07 to P16, P08 to P11, P09 to P13, P10 to P13, P11 to P06, P12 to P15, P13 to P15, P14 to P08, P15 to P09, P16 to P03. New titles: P01 One Fundamental Entity, P02 Composable Extensions, P03 No Code Outside Semantics, P04 Code Is the Source of Truth, P05 Agents Use Semantic APIs, P06 Archetypes Specialize Verification, P07 No Universal Correctness, P08 No Mandatory Architecture, P09 No Duplicated Frameworks, P10 No Unnecessary Layers, P11 No Compatibility for Mistakes, P12 No Duplicate Semantic Models, P13 No Unverified Guarantees, P14 No AI in the Kernel, P15 No Arbitrary Agent Privileges, P16 No Speculative Implementation.
5. Build a triage list. Put every hit in one class:
   - **ALLOWED-CONTEXT**: inside a term's `## Avoid` section, a "Words to avoid" table, a `Closed by the semantic foundation rebuild` entry, or ordinary English that is not the removed concept (for example the lower-case "charter" of Spec Kitty's *project charter*, a sentence-initial "Variant" meaning a changed copy in a test comment). Leave it.
   - **STALE-TEXT**: prose, a comment, a document label or a link label that presents a removed concept or a wrong principle code as current. Fix in T127.
   - **DEFECT**: code, test, config, manifest, `telos.ts`, `.grace` module or path, `bun.lock`. Do not fix. Report it (open question 3).
   Known expected STALE-TEXT hits from the pre-implementation snapshot (verify each still exists): `.gitignore` comment `# docs app build output (locus-foundation)`; `docs/tooling.md` "Layout" lines 63 to 65 and the `verify` row; ADR-0015 lines 22 and 23; ADR-0003 lines 8, 23, 33 and 35; ADR-0004 line 36 (`[P15]`); ADR-0011 lines 17 and 29 (`[P16]`, `[P15]`); ADR-0017 line 16 (`[P16]`).

**Files**: none changed in this subtask. Keep the triage list; T129 repeats the commands.

**Validation**: the five commands ran; the triage list has no unclassified hit.

---

### Subtask T127: Fix stale references

**Purpose**: apply the sanctioned edits. Re-read each file before editing; change only the sentence named.

**Steps**

1. **ADR-0015** (`docs/decisions/ADR-0015-product-naming.md`, accepted, two sentences). Replace exactly:
   - `- Workspace packages use the \`@telos/\` scope (\`@telos/locus\`, \`@telos/docs\`). The root package stays \`telos\`.` with `- Workspace packages use the \`@telos/\` scope (\`@telos/kernel\`, \`@telos/docs\`). The root package stays \`telos\`.`
   - `- "Telos" is Greek for purpose or end, matching the role of the Charter. This is a note, not a constraint.` with `- "Telos" is Greek for purpose or end, matching the role of the Purpose extension. This is a note, not a constraint.`
   Change nothing else in the file (front matter, status, date stay).
2. **Terms to `implemented`.** For each of the 25 files in `docs/foundation/terminology/` (except `README.md`), the line `Planned module: …` names its module(s). Run this check; a term is raised only when **every** line for it prints `ok`:

```bash
chk() { test -f "$1" && grep -v '^[[:space:]]*//' "$1" | grep -q "$2" && echo "ok   $1 $2" || echo "MISSING $1 $2"; }
K=packages/kernel/src
chk $K/locus.ts "Locus"; chk $K/identity.ts "isLocusId"; chk $K/extension.ts "Extension"
chk $K/locus.ts "CompositionConflict"; chk $K/locus.ts "LocusKind"; chk $K/model.ts "ownership.multiple"
chk $K/relation.ts "RelationType"; chk $K/relation.ts "Relation"; chk $K/capability.ts "Capability"
chk $K/describe.ts "contractDigest"; chk $K/archetype.ts "Archetype"; chk $K/archetype.ts "Rule"
chk $K/diagnostic.ts "makeDiagnostic"; chk $K/verify.ts "Finding"; chk $K/describe.ts "Knowledge"
chk $K/model.ts "buildModel"; chk $K/closure.ts "checkClosure"; chk $K/impact.ts "impact"
chk $K/invoke.ts "isGranted"; chk $K/extensions/purpose.ts "Purpose"; chk $K/introspection.ts "Telos"
chk packages/cli/src/semantics.ts "CliSemantics"; chk packages/agent/src/semantics.ts "AgentSemantics"; chk packages/web/src/semantics.ts "WebSemantics"
chk packages/agent/src/mcp.ts "serveMcp"; chk packages/agent/src/client.ts "McpStdioClient"; chk apps/calculator/src/app.ts "calculatorModel"
for p in cli agent web; do grep -qE '^export (const|function|class|type|interface|\*|\{ )' packages/$p/src/index.ts && echo "ok   packages/$p/src/index.ts" || echo "MISSING packages/$p/src/index.ts"; done
```

   Term to checks: `locus` (locus.ts Locus); `identity` (isLocusId); `semantic-extension` (Extension); `composition` (CompositionConflict); `locus-kind` (LocusKind); `containment` (ownership.multiple); `relation-type`, `relation`; `capability`; `contract` (contractDigest); `archetype`, `rule`; `diagnostic`; `finding`; `knowledge-status` (Knowledge); `semantic-model` (buildModel); `semantic-closure`; `impact`; `grant` (isGranted); `purpose`; `interface-locus` (the three Semantics); `pack` (the three `index.ts` lines); `semantic-first-programming` (locus.ts Locus, app.ts calculatorModel); `agent-native-development` (serveMcp, McpStdioClient); `executable-introspection` (Telos).
   For a raised term: set `maturity: implemented` (front matter) and replace `Planned module:` by `Module:` (and `Planned modules:` by `Modules:`). Leave `status: provisional`. A term with any `MISSING` stays `proposed`; list it in the report. Do not touch principle files' `maturity`.
3. **Sentences that call an existing module planned.** `git grep -nE "Planned|planned|will be (added|built|implemented)|not yet|no code (exists|is)|code is not" -- docs/foundation ':!docs/foundation/future-semantic-evolution.md'`. For each hit about a module or feature that now exists, rewrite the sentence in the present tense. In `docs/foundation/architecture/capabilities.md` set the Maturity cell of every CAP row whose modules exist to `implemented`; in the section 8 table of `philosophy/evolution-of-determinism.md` do the same for the mechanisms this mission built (Locus identity, Purpose and containment; digests and model comparison; Archetype verification with knowledge status; impact analysis). Rows about Mandate, Variant, Witness, Verdict and Evolution stay `vision`. Never write `verified` in a Status or Maturity cell.
4. **"Enforced today"** in `docs/foundation/principles/README.md`. Rule: write `Yes`, `Partly` or `No`, then `, by <check> (<file>)`. `Yes` only if a check that runs inside `bun run verify` fails when the principle is violated; `Partly` if it covers only part; `No` otherwise. Candidates; confirm that each named file exists and runs in verify before using it, otherwise write `No`: P02 and P06: `bun run telos check` (model diagnostics and failed rules, `scripts/telos.ts`); P03: the closure part of `telos check` (`packages/kernel/src/closure.ts`); P01: Partly, `packages/kernel/test/api.test.ts` (exact export list); P13: Partly, the content build rejects claim words (`apps/docs/scripts/content.ts`); P14: Yes, `packages/kernel/test/api.test.ts` (no platform imports in the main entry); P15: Partly, `packages/kernel/test/invoke.test.ts` (`NotGranted`); P12 stays `No` (spec D4). Keep the sentence that the column changes only with the enforcement.
5. **Stale labels and sentences in other files** (from the T126 triage; edit only the sentence or label):
   - ADR-0004 line 36, ADR-0011 lines 17 and 29, ADR-0017 line 16: the visible label `[P15]` becomes `[P09]` (ADR-0004, ADR-0011 line 29), `[P16]` becomes `[P03]` (ADR-0011 line 17, ADR-0017 line 16). Keep the link target WP16 already set.
   - ADR-0003 lines 8, 23, 33 and 35 (open question 6): replace "Revision digest" by "digest", "per Fabric (INV-002)" by "within one semantic model (diagnostic `identity.duplicate`)", "the same Revision id, which the Stage 0 specifications check" by "the same identity, which the kernel model tests check"; drop the `INV-003` link label text to "identity does not depend on the source location". Do not change the decision.
   - `.gitignore` comment: `# docs app build output (locus-foundation)` becomes `# documentation site build output`.
   - `docs/tooling.md` (open question 4): replace the "Layout" bullets for `packages/locus` with bullets for `packages/kernel` (`@telos/kernel`; `@telos/kernel/closure` is the Bun-only Semantic Closure check), `packages/cli`, `packages/agent`, `packages/web` (the Packs), `apps/calculator` (`@telos/calculator`, the reference implementation) and `telos.ts` with `scripts/telos.ts` (repository model and the `bun run telos` command); add the `telos:check` step to the `bun run verify` row ("…`grace lint`, Telos check"). Grep first: WP20 may already have done part of it.
   - Every other STALE-TEXT hit: rewrite using this map: Fabric to "semantic model" or "root Locus"; Charter to "Purpose extension"; Facet to "semantic extension"; Lens and Law to "Archetype rule"; Act to "capability"; Revision to "digest" or "model comparison"; Witness to "finding"; Verdict, Mandate, Variant and Evolution to a pointer to `docs/foundation/future-semantic-evolution.md`.
6. **Write `README.md`** (currently empty). Use this structure; keep every sentence true for the repository as it is, and run each command in the table once (T128):

```markdown
# Telos

Telos by UnknownLab is a semantic-first programming system for agent-native software engineering. Software built with Telos exposes its own meaning, structure, relationships, operations and verification through executable TypeScript interfaces, so people and agents do not have to rebuild the architecture from source files.

## What is here

- A semantic kernel (`packages/kernel`): one fundamental entity, the Locus, composed from semantic extensions; typed relations; capabilities with contracts; Archetype verification; introspection; governed invocation; change impact; a Semantic Closure check.
- Three Packs built on the kernel: `packages/cli`, `packages/agent` (MCP server and a deterministic client) and `packages/web` (form model).
- A calculator (`apps/calculator`): one arithmetic implementation exposed through a CLI, a web page and agent tools.
- A documentation site (`apps/docs`), built from `docs/`.
- A description of this repository as a Telos model (`telos.ts`, `scripts/telos.ts`).

## Workspace

(table: Path | Package | Role, for packages/kernel, packages/cli, packages/agent, packages/web, apps/calculator, apps/docs, scripts/, docs/, kitty-specs/, .grace/)

## Commands

(table: Command | What it does — `bun install`; `bun run verify`; `bun run typecheck`; `bun run test`; `bun run telos check`; `bun run telos list`; `bun run calculator add --a 2 --b 3`; `bun run calculator:mcp`; `bun run calculator:agent-demo`; `bun run docs:build` and `bun run docs:preview`; `bun run test:e2e`; `bun run grace:lint`)

## Documentation

Links (relative): `docs/foundation/README.md` (doctrine), `docs/foundation/principles/README.md`, `docs/foundation/terminology/README.md`, `docs/decisions/README.md`, `docs/guides/introduction.md`, `docs/tooling.md` (development tooling).

## Working with agents

One short paragraph: the owner directs in plain language; the agent rules are in `AGENTS.md`; the tooling is described in `docs/tooling.md`.
```

   Fill the two tables completely. Required toolchain statement: Bun `1.4.4-canary.1` or later (`engines.bun` in `package.json`). Do not claim a CI (there is none), published packages, or "verified" results.

**Files**: `README.md` (about 60 lines); sanctioned edits as listed (each a few lines).

**Validation**: re-run the T126 commands: no unclassified STALE-TEXT remains. `bun run format` then `bun run format:check` pass (the formatter rewrites Markdown tables and `README.md`).

---

### Subtask T128: Cross-check docs, GRACE and the telos model for consistency

**Purpose**: prove that what the documents, `.grace/` and `telos.ts` say matches the files on disk. Fix text-only discrepancies; report every other one (open question 3).

**Steps** (all from the repository root, `bash`)

1. **Paths named in documents exist.**

```bash
for f in $(git ls-files docs/foundation docs/guides | grep '\.md$') README.md docs/tooling.md; do
  grep -oE '`(packages|apps|scripts|docs|\.grace)/[A-Za-z0-9_./-]+`' "$f" | tr -d '`' | sort -u | while read -r p; do
    test -e "$p" || echo "$f: missing path $p"
  done
  grep -oE '`[a-z][a-z0-9-]*\.tsx?`' "$f" | tr -d '`' | sort -u | while read -r n; do
    test -n "$(git ls-files "*/$n")" || echo "$f: no file named $n"
  done
done
```

   Prints nothing when consistent. A backticked path that is a *future* or *example* path in prose is not a defect only if the sentence says so.
2. **GRACE matches the files.**

```bash
grep -ho '<Path>[^<]*</Path>' .grace/graph/*.xml | sed 's/<[^>]*>//g' | sort -u | while read -r p; do test -e "$p" || echo "missing path $p"; done
git grep -nE 'M-LOCUS|SPEC-REPORT|GD-LEGACY|GD-MAIN|VD-LEGACY|VD-MAIN' -- .grace
ls .grace/graph .grace/verification
bun run grace:lint
```

   Expect: no missing path, no hit, no `main.xml`, no `legacy.xml`; in each of `graph/` and `verification/` the 15 area documents of `contracts/conventions.md` ("GRACE graph and verification layout" lists 16 areas, the 16th is `legacy`) plus `index.xml`; and `grace:lint` passing. Every module id of `.grace/graph/index.xml` appears in exactly one `<Owns>` block (`grep -o '<M-[A-Z-]* />' .grace/graph/index.xml | sort | uniq -d` prints nothing).
3. **The Telos model matches the layout.**

```bash
bun run --silent telos list | bun -e 'const ids = JSON.parse(await Bun.stdin.text()).loci; const want = ["telos:repository","telos:kernel","telos:cli-pack","telos:agent-pack","telos:web-pack","telos:calculator","telos:tooling","telos:docs-site","calculator:app","calculator:arithmetic","calculator:cli","calculator:web","calculator:agent"]; const missing = want.filter((i) => !ids.includes(i)); const legacy = ids.filter((i) => i.includes("legacy")); console.log(JSON.stringify({ missing, legacy })); process.exit(missing.length + legacy.length === 0 ? 0 : 1)'
ls packages apps
bun run --silent telos closure | bun -e 'const r = JSON.parse(await Bun.stdin.text()); console.log(JSON.stringify(r.findings.filter((f) => f.severity === "error"))); process.exit(r.findings.some((f) => f.severity === "error") ? 1 : 0)'
```

   `ls` shows exactly `agent cli kernel web` under `packages` and `calculator docs` under `apps`; every one is claimed by a Locus above. If `bun -e` does not read stdin in your Bun, run the first two commands and compare by eye.
4. **Decision register matches the records.**

```bash
for f in docs/decisions/ADR-*.md; do id=$(sed -n 's/^id: //p' "$f" | head -1); st=$(sed -n 's/^status: //p' "$f" | head -1); grep -qE "\[$id\][^|]*\|[^|]*\|[[:space:]]*$st[[:space:]]*\|" docs/decisions/README.md || echo "README row mismatch: $id $st"; done
grep -L '^> Superseded by' $(git grep -l '^status: superseded' -- docs/decisions)
grep -c 'ADR-0018' docs/foundation/README.md
```

   First two print nothing; the third prints at least 1 (WP17 added the sentence). ADR-0017 stays `accepted`.
5. **Generated site text.** After `bun run docs:build`: `grep -nE 'Scenarios A to E|specification report|@telos/locus' apps/docs/public/llms.txt` prints nothing; `grep -n '^## ' apps/docs/public/llms.txt` lists, in order, Introduction, Philosophy, Principles, Terminology, Architecture, First Locus, Examples, Inspector, Playground, Calculator, Verification, Roadmap, Decisions, Agent Reference.
6. **README commands run.** Run once: `bun run --silent telos list` (exit 0), `bun run --silent calculator add --a 2 --b 3` (prints `{"result":5}`), `bun run calculator:agent-demo` (last stdout line `{"ok":true}`), `bun run typecheck`. Do not start `calculator:mcp` (it waits on stdio); confirm its script exists with `grep calculator:mcp package.json`.
7. Write the result of each check (command, output, or "nothing printed") into your notes for T129.

**Validation**: every check above is clean, or each remaining finding is a reported DEFECT with file, line and owner WP.

---

### Subtask T129: Run the full gate, grace lint and telos check; record SC-006 evidence

**Steps**

1. `bun run format`, then run the whole gate once, in this order, stopping at the first failure and fixing only what is in your scope (README, sanctioned sentences):
   - `bun run verify` (this runs `check:bun`, `format:check`, `lint`, `typecheck`, `test`, `docs:build`, `test:e2e`, `grace:lint`, `telos:check`)
   - `grace lint --path . --assertions current`
   - `bun run telos check` (expect exit 0 and `"ok": true`)
2. Repeat the T126 commands (redefine `BASE_EXCL`, `CONCEPT_EXCL` and `A1`, `A2`, `B`, `C` in the new shell). Expected output of every command in step 3 of T126 and of the principle-code command: **nothing** except hits you classified ALLOWED-CONTEXT. Also run: `git grep -c -E "$A1|$A2" -- kitty-specs docs/research` and `git grep -l '^status: superseded' -- docs/decisions` to show where the removed names remain (history paths only).
3. Commit your sanctioned edits (T127 steps 1 to 5 and the T128 text fixes) with `docs: align remaining text with the semantic model`, body naming the shared-file rows used. Then `spec-kitty agent tasks mark-status T126 --status done`, `T127`, `T128`, `T129`, and move the WP to review. The body of your last commit carries the SC-006 evidence block (open question 2).
4. **Evidence block** (also your final report). For each of the five T126 commands: the command, its exit status and output ("no output" is the required result), the number of ALLOWED-CONTEXT hits you left and where. Then: the nine superseded ADR ids; confirmation that `packages/locus` does not exist; the list of terms raised to `implemented` and the list left at `proposed` with the missing file; the exact result of each `verify` step (passed, failed, not run); every reported DEFECT; and any conflict between this prompt and the contracts.

Implementation command: `spec-kitty agent action implement WP21 --agent claude`

## Definition of Done

- [ ] T126: the five sweep commands and the principle-code command ran; every hit is classified ALLOWED-CONTEXT, STALE-TEXT or DEFECT; preconditions (no `packages/locus`, nine superseded ADRs) hold.
- [ ] T127: ADR-0015 has exactly the two new sentences; every raised term has `maturity: implemented` and a `Module:` line, every other term is still `proposed` with a reported reason; "Enforced today" cites real checks; no sentence in `docs/foundation` calls an existing module planned; the listed stale labels and sentences are fixed; `README.md` is written and true.
- [ ] T128: checks 1 to 6 are clean, or each remaining finding is a reported DEFECT with file, line and owner WP; no `main.xml` or legacy area remains in `.grace/`.
- [ ] T129: `bun run verify`, `grace lint --path . --assertions current` and `bun run telos check` pass with results reported exactly; the final sweep prints nothing outside ALLOWED-CONTEXT; the evidence block is in the final commit body and the report.
- [ ] Per-subtask completion is recorded with `spec-kitty agent tasks mark-status <Txxx> --status done`.
- [ ] No edit outside the sanctioned scope: `git diff --stat` shows only `README.md`, sentence-level edits in the files named above, and `docs/foundation/**` maturity, module, enforcement and planned-sentence edits.

## Risks

| Risk | Mitigation |
| --- | --- |
| A blunt grep rewrites history or a legitimate use (Spec Kitty "project charter", ordinary English "variant"). | Classify first (T126 step 5); edit only STALE-TEXT; never touch the excluded paths. |
| Raising a term to `implemented` when the module is only a stub (`export {};`). | The check in T127 step 2 requires the file and its main symbol; a stub fails it. |
| Editing code or GRACE to make the sweep pass. | Open question 3: text only; everything else is reported as a DEFECT. |
| Claiming enforcement that does not exist ("Enforced today"). | Cite a file that runs in `bun run verify`; otherwise `No`. |
| README formatting fails `format:check`. | Run `bun run format` before `bun run verify`. |
| `docs:build` or `test:e2e` fails after text edits (broken link, forbidden word `verified`/`passing` in a front matter field or a Status/Maturity cell). | Run `bun run --cwd apps/docs content` after each docs edit; it names the file. |
| Editing an accepted ADR beyond the named sentences. | Change only the sentences listed; ADR-0017 stays accepted and its decision text unchanged. |

## Reviewer Guidance

- Re-run the five sweep commands and the principle-code command; every hit must be explainable as ALLOWED-CONTEXT (in the evidence block) or absent.
- Read `git diff` for `docs/decisions`: ADR-0015 has exactly two changed sentences, the other ADR changes are labels or the named ADR-0003 sentences, and no superseded ADR changed.
- For each term at `implemented`, open its `Module:` file and confirm the symbol exists and is not a stub; for each term left `proposed`, confirm the reported reason.
- Check each "Enforced today" cell names a real file that runs in `bun run verify`.
- Confirm `README.md` commands exist in `package.json` and that nothing in it claims a CI, a release or a result no run produced.
- Confirm no code, test, config, `telos.ts`, `.grace` module or `bun.lock` line was edited by hand, and that every DEFECT is reported with an owner.
- Confirm the final `bun run verify` output is quoted exactly, including `telos:check`.
