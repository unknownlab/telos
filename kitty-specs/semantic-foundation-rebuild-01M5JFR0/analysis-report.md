---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: semantic-foundation-rebuild-01M5JFR0
mission_id: 01M5JFR0GHYQFRQCZSGQ29Y2VX
generated_at: '2026-10-24T14:36:22.182968+00:00'
analyzer_agent: claude
input_artifacts:
  spec.md:
    path: kitty-specs/semantic-foundation-rebuild-01M5JFR0/spec.md
    sha256: bd36c901b64e173fef1f71ca9c61c1937c183089e8bcd2a889abb50a67c9ae6f
  plan.md:
    path: kitty-specs/semantic-foundation-rebuild-01M5JFR0/plan.md
    sha256: 5c6ba8dd3c1ccb28affe1c031707c44e01b26de99dec2450913f562487c54578
  tasks.md:
    path: kitty-specs/semantic-foundation-rebuild-01M5JFR0/tasks.md
    sha256: c65728b76930f95bc2105d30a16881f1e6c59bc1a707039880361dd4864607c8
  charter:
    path: .kittify/charter/charter.yaml
    sha256: a0270792df9cee6767c37cb41fa9471bd003681bcdf3d6f8b2eb756c6bd33bd3
verdict: unknown
issue_counts:
  critical:
  high:
  medium:
  info:
  low:
findings: []
---

## Specification Analysis Report

Mission `semantic-foundation-rebuild-01M5JFR0`, fourth run (2026-10-24). This run checks the MCP startup-order change, which was found while WP14 was being implemented. Artifacts analysed: contracts/packs.md, research.md R6, tasks.md, the WP14 prompt and lanes.json, against `.kittify/charter/charter.md`. spec.md and plan.md did not change. The third run's results still hold for every other artifact.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| — | — | — | — | No open findings. | — |

**What was checked for the MCP startup-order change**

| Check | Result |
|----|----|
| Defect is real | Reproduced read-only. A fresh `apps/calculator/bin/mcp.ts` (lane-n), sent `initialize` and then `tools/list`, listed 0 tools in 17 of 20 starts. The WP11 fixture server listed 0 tools in 18 of 20 starts when the requests were already waiting on stdin. Cause: `McpServer.layerStdio` forks the server and its stdin reader when it is built, and `registerTools` is built after it and crosses an async boundary (`deriveTools`). |
| Contract first | contracts/packs.md now states the startup order ("every tool is registered before the server reads its first request") and gives the gated composition and the startup-order test. research.md R6 records the follow-up. The WP14 prompt quotes the same code. |
| Fix proven | A scratch copy of lane-n with the fix listed all 10 calculator tools in 30 of 30 starts. It passed `packages/agent/test/mcp.test.ts`, `apps/calculator/test/mcp.test.ts` and `agent-demo.test.ts` 8 times in a row, and `typecheck`, `lint`, `format:check` and `grace lint` were clean. The new test failed on the old code. |
| Workflow | WP14 applies the fix as a sanctioned edit. WP11 is not reopened: it implemented the contract exactly, lane-n already contains lane-k, and the fix is one file and one test. The reasons are recorded in the tasks.md deviation "MCP startup race". |
| Ownership | `packages/agent/src/mcp.ts`, `packages/agent/test/mcp.test.ts` and `.grace/verification/pack-agent.xml` stay owned by WP11. WP14's edits are listed in the tasks.md Shared files table and in the prompt's sanctioned-edits list. No `owned_files` or dependency changed, so lanes.json is unchanged and no finalize was needed. |
| Haiku self-sufficiency | The WP14 prompt gives the exact test code, the exact patch with old and new lines, the exact GRACE XML, the module maps, the commit commands, the kitty-specs clean-up and the move-task step. It also tells the implementer to keep the uncommitted work in lane-n. |
| GRACE | `M-PACK-AGENT-MCP` is unchanged. Only the `V-M-PACK-AGENT-MCP` scenario and trace sentences change. `M-CALC-INTERFACES` and `V-M-CALC-INTERFACES` are given in full. `bin/agent-demo.ts` becomes `ROLE: SCRIPT` / `MAP_MODE: LOCALS`, because grace requires `EXPORTS` for `RUNTIME`. |
| NFR-002, NFR-005, NFR-007 | The fix adds no randomness and no network use. The regression test is a real subprocess test that fails before the fix and passes after it, and it uses no credentials. |

**Info (not findings):**

- The approved WP11 prompt still quotes the old composition. It is history: WP14 changes the code, and contracts/packs.md wins over prompts.
- The startup-order test is probabilistic on the old code: it failed in 18 of 20 runs of a single start, and it starts the server 10 times. On the fixed code it is deterministic, because the gate guarantees the order.

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001..FR-016 | Yes | WP02-WP09, WP22 | unchanged |
| FR-017, FR-019 | Yes | WP10, WP12 | unchanged |
| FR-018 agent pack | Yes | WP11, WP14 | WP14 applies the MCP startup-order fix as a sanctioned edit |
| FR-020, FR-021 | Yes | WP13, WP14 | |
| FR-022..FR-031 | Yes | WP01, WP15-WP21 | unchanged |
| NFR-001..NFR-008 | Yes | per tasks.md coverage table | NFR-007: WP11, WP14 |
| C-001..C-009 | Yes | per tasks.md coverage table | |

**Charter Alignment Issues:** None. The change adds no dependency, writes the test first, keeps the gate and the review routing, and is written for Haiku and reviewed by `reviewer-renata`.

**Unmapped Tasks:** None.

**Metrics:**

- Total requirements: 48 (31 FR, 8 NFR, 9 C)
- Total tasks: 136 subtasks in 22 work packages, 22 lanes (unchanged)
- Coverage: 100% (48 of 48)
- Ambiguity count: 0
- Duplication count: 0
- Critical issues count: 0

### Next Actions

- Resume WP14 in lane-n with R1 to R7 of its prompt (Haiku, `implementer-ivan`), then review it with `reviewer-renata` (Sonnet). The review covers the `@telos/agent` fix.
