---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: semantic-foundation-rebuild-01M5JFR0
mission_id: 01M5JFR0GHYQFRQCZSGQ29Y2VX
generated_at: '2026-10-24T08:22:25.116168+00:00'
analyzer_agent: unknown
input_artifacts:
  spec.md:
    path: kitty-specs/semantic-foundation-rebuild-01M5JFR0/spec.md
    sha256: 27056826eab7f3dbf1ce30824966b86878fd67125baf6838dcd63ce44170605d
  plan.md:
    path: kitty-specs/semantic-foundation-rebuild-01M5JFR0/plan.md
    sha256: 7d7afa71fc3eaa5882b42d79b5881b7bb268f62e500082f9609dcd89b1eca1c8
  tasks.md:
    path: kitty-specs/semantic-foundation-rebuild-01M5JFR0/tasks.md
    sha256: e21e46154201e6c1d6aeb1a763fd4c51739c1075f21ef28919ab77cbd9996557
  charter:
    path: .kittify/charter/charter.yaml
    sha256: a0270792df9cee6767c37cb41fa9471bd003681bcdf3d6f8b2eb756c6bd33bd3
verdict: blocked
issue_counts:
  medium: 3
  low: 5
  critical: 0
  high: 1
  info: 1
findings:
- id: I1
  severity: high
  category: inconsistency
  summary: "scripts/telos.ts (WP15) must import effect to run kernel Effects, but the root package.json (WP01, research R9) declares no effect dependency; under Bun isolated installs the import fails (verified: Cannot find package 'effect' from scripts/)."
- id: C1
  severity: medium
  category: inconsistency
  summary: Spec US4 AC4 expects an agent client invoking an unexposed capability to get NotGranted; contracts/packs.md and contracts/calculator.md test MCP error -32602 'Tool not found' for the client and NotGranted only for in-process invoke.
- id: U1
  severity: medium
  category: underspecification
  summary: FR-012 and data-model invariant 9 require facts marked 'unknown' (closure dynamic imports), but no contract type carries knowledge 'unknown'; ClosureFinding has no knowledge field and ClosureReport.knowledge is always 'derived'.
- id: I2
  severity: medium
  category: inconsistency
  summary: "tasks.md says contracts win over prompts, but three recorded deviations are not reflected in contracts: telos:tooling packages (repository.md '—'), McpStdioClient readonly server (packs.md), PlaygroundResult kind discriminator (docs.md)."
- id: U2
  severity: low
  category: underspecification
  summary: The closure dynamic-import regex treats any template literal as static, so import(`./${x}`) is neither flagged nor resolved, against the spec edge case that non-literal dynamic imports are reported, not ignored.
- id: I3
  severity: low
  category: inconsistency
  summary: WP01 sanctioned creations (five src/index.ts files, 16 GRACE area documents) are outside its owned_files and lane-a write_scope; move-task auto-commit refuses out-of-scope uncommitted files (OWNED_DELIVERABLE_SCOPE_REFUSED).
- id: G1
  severity: low
  category: coverage
  summary: The tasks.md requirement coverage table maps only C-002 among the constraints; C-001 and C-003..C-009 have no explicit WP mapping (they are enforced through conventions.md rules).
- id: I4
  severity: low
  category: inconsistency
  summary: contracts/docs.md lets WP20 edit scripts/manifest.test.ts (owned by WP01), but the tasks.md shared-files table does not list that edit.
- id: I5
  severity: low
  category: inconsistency
  summary: plan.md names a CI provenance origin for the site; WP19 drops it (recorded deviation, no CI workflow exists) but plan.md is not updated.
---

## Specification Analysis Report

Mission `semantic-foundation-rebuild-01M5JFR0`. Artifacts analysed: spec.md, plan.md, research.md, data-model.md, contracts/ (kernel, packs, calculator, repository, docs, conventions), tasks.md and the 21 WP prompts (WP01..WP21), against `.kittify/charter/charter.md`. The analysis is read-only. No planning artifact was changed.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| I1 | Inconsistency | HIGH | tasks/WP01 T002 (root `dependencies` script and expected text), tasks/WP15 lines 257 and 496, research.md R9, contracts/repository.md "Root telos.ts" | `scripts/telos.ts` runs kernel Effects (`Effect.runPromise`), so it imports `effect`. The root manifest gets only `@telos/calculator`, `@telos/cli` and `@telos/kernel`. The repository uses Bun isolated installs (root `node_modules` holds only `@types`). A probe file under `scripts/` failed with `Cannot find package 'effect'`. WP15 rule 5 forbids `bun add`, so the WP15 implementer must stop. `bun check -b` also fails to resolve the import, because the root tsconfig includes `scripts`. | Owner decision (C-002 and the charter: dependencies are added only with the owner's approval). Recommended: WP01 adds `"effect": "4.0.4"` to the root `dependencies`. This is the same pinned version already in bun.lock, so no new package is fetched. Update WP01 T002, research R9, WP15 line 257 and repository.md together. Alternative: `@telos/kernel` exports a run helper. That is a public-contract change. |
| C1 | Conflict | MEDIUM | spec.md US4 AC4 (line 129); contracts/packs.md lines 303-307; contracts/calculator.md line 191; WP11, WP14 | The spec says the client's call is refused with `NotGranted`. The plan tests that MCP rejects with `-32602 Tool 'secret' not found`, because no tool is derived. `NotGranted` appears only through in-process `invoke(..., { via: "example:agent" })`. The principle "discovery never grants invocation" (D6) is kept, but the observable outcome differs from the AC text, and mission acceptance against the AC would not match. | Owner decision: either reword US4 AC4 to "the client has no tool to call (MCP tool not found), and the kernel refuses an in-process invocation through the agent Locus with `NotGranted`", or add an agent-facing invoke path that returns `NotGranted`. That is a scope change. |
| U1 | Underspecification | MEDIUM | spec.md FR-012 (line 280), edge cases (line 228); data-model.md invariant 9 (line 41); contracts/kernel.md ClosureFinding and ClosureReport | FR-012 requires each described fact to be marked declared, derived, verified, failed, not run or **unknown**. Data-model invariant 9 assigns `unknown` to closure dynamic imports. No contract type has `knowledge: "unknown"`. Dynamic imports are marked only by the code `closure.dynamic-import` and its message. | Owner or planner decision: add `knowledge: "derived" \| "unknown"` to `ClosureFinding` (WP08, rendered by WP19), or record that the `closure.dynamic-import` code is the `unknown` marker and adjust FR-012 and invariant 9. |
| I2 | Inconsistency | MEDIUM | tasks.md "Deviations recorded during task generation" and the precedence rule ("The files in contracts/ are authoritative"); contracts/repository.md row `telos:tooling`; contracts/packs.md `McpStdioClient`; contracts/docs.md `runDefinition` result | Three recorded deviations change contract shapes, but the contracts were not updated. A Haiku implementer who follows the precedence rule meets a conflict. WP11 and WP18 state the additions explicitly, so the risk is low there. The `telos:tooling` row depends on I1. | After I1 is decided, update the three contract passages to match the deviations. These contract edits do not affect the analysis freshness hash. |
| U2 | Underspecification | LOW | contracts/kernel.md closure step 5; WP08 | `/\bimport\s*\(\s*(?!["'`])/` excludes every template literal. `` import(`./${x}`) `` is computed, but it is not flagged, and `scanImports` does not return it. The spec edge case says non-literal dynamic imports are reported. | Exclude only template literals without `${`, or add a second pattern for `` import(`...${ ``. Add one WP08 test. |
| I3 | Inconsistency | LOW | tasks/WP01 frontmatter `owned_files` and `create_intent`; lanes.json lane-a `write_scope`; tasks.md deviations (index.ts files, 16 area documents) | The files are sanctioned in the prompt, but they are not in ownership metadata. A WP01 implementer who commits normally is unaffected. If `move-task --to for_review` auto-commits leftover files, it refuses them as out of scope. | The WP01 implementer must commit all deliverables before `move-task`. Optionally add the paths to WP01 `owned_files` and `create_intent`. |
| G1 | Coverage | LOW | tasks.md requirement coverage table | Constraints C-001 and C-003..C-009 are not mapped to WPs. In practice C-001, C-002, C-004 and C-009 are rules in conventions.md, which every WP quotes. C-003 and C-008 are respected by design. C-005 and C-006 are covered by WP15, WP19 and WP20. C-007 is covered by the GRACE sections. | Optionally add a constraints row to the table. |
| I4 | Inconsistency | LOW | contracts/docs.md "Removal (WP20)"; tasks.md shared-files table | WP20 may remove an `@telos/locus` entry from `scripts/manifest.test.ts`, which WP01 owns. WP01 creates that test for the new packages only, so the edit is probably not needed. | WP20 checks the file and edits it only if the entry exists. If so, add the edit to the shared-files table. |
| I5 | Inconsistency | LOW | plan.md (site provenance origins); tasks.md deviations; WP19 | The plan lists a CI origin, and WP19 shows `bun-build` and `browser` only. The deviation is recorded in tasks.md. | No action before implementation. Update plan.md when it is next revised. |

**Info (not a finding):** spec.md still carries the status "Draft, awaiting owner approval". Under AGENTS.md, the owner approves the spec and plan before WP01 starts.

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001..FR-011 (kernel identity, definitions, model, describe, invoke) | Yes | WP02-WP07, WP09 | |
| FR-012 knowledge status | Partial | WP06, WP08, WP19 | `unknown` never emitted (U1) |
| FR-013..FR-016 (verify, closure, impact) | Yes | WP05, WP08, WP09 | |
| FR-017..FR-021 (CLI, agent, web Packs, calculator) | Yes | WP10-WP14 | US4 AC4 outcome differs (C1) |
| FR-022..FR-024 (repository self-description, command, gate) | Yes | WP15 | Blocked by I1 at implementation time |
| FR-025..FR-031 (docs content, decisions, site, playground, guides, removal, sweep) | Yes | WP01, WP16-WP21 | |
| NFR-001..NFR-008 | Yes | per tasks.md coverage table | NFR-003 timing tests in WP15 depend on machine speed |
| C-002 | Yes | WP01 | |
| C-001, C-003..C-009 | Implicit | conventions.md rules quoted in every WP | G1 |

**Charter Alignment Issues:** No plan element conflicts with a charter MUST. Test-first, blocking gates, model routing (Opus planning, Haiku implementation, Sonnet review) and the review-gate wiring are all present. I1 touches the charter rule that no dependency is added without the owner. It is raised as an owner decision, not as a violation.

**Unmapped Tasks:** None. All 129 subtasks (T001..T129) belong to a WP whose `requirement_refs` name at least one FR, NFR or constraint.

**Metrics:**

- Total requirements: 48 (31 FR, 8 NFR, 9 C)
- Total tasks: 129 subtasks in 21 work packages
- Coverage: 100% of FR and NFR have at least one task. 1 of 9 constraints is mapped explicitly, and the other 8 are covered implicitly.
- Ambiguity count: 0 (no vague adjectives or placeholders found)
- Duplication count: 0
- Critical issues count: 0 (1 high)

### Next Actions

- Resolve I1 before WP15 starts. Because WP01 writes the root manifest, decide it before WP01. The owner chooses the root `effect` dependency (recommended) or a kernel run helper. Then update WP01 T002, research R9, WP15 and contracts/repository.md.
- Decide C1 (reword US4 AC4 or extend scope) and U1 (add `unknown` knowledge to closure findings or reword FR-012) before WP08, WP11 and WP14 start.
- Optionally fix I2 (contract text), U2 (regex), I3 (WP01 ownership metadata) and G1 (constraint mapping) with the same planning edit. Edits to spec.md, plan.md or tasks.md make this report stale. Re-run `/spec-kitty.analyze` after them.
- The owner approves spec, plan and work packages (spec status is still Draft) before `/spec-kitty.implement WP01`.
