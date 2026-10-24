---
schema_version: 1
artifact_type: spec-kitty.analysis-report
command: /spec-kitty.analyze
mission_slug: semantic-foundation-rebuild-01M5JFR0
mission_id: 01M5JFR0GHYQFRQCZSGQ29Y2VX
generated_at: '2026-10-24T20:49:33.818857+00:00'
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
    sha256: ad0f48f48b47fd9e568800cd08ba83f0defdfec469997821320a4920d4f75553
  charter:
    path: .kittify/charter/charter.yaml
    sha256: a0270792df9cee6767c37cb41fa9471bd003681bcdf3d6f8b2eb756c6bd33bd3
verdict: ready
issue_counts:
  high: 0
  low: 0
  medium: 0
  critical: 0
  info: 2
findings: []
---

## Specification Analysis Report

Mission `semantic-foundation-rebuild-01M5JFR0`, sixth run (2026-10-24). This run checks the fix for the asynchronous form model, found while WP20 was being implemented, and the sweep items moved to WP21. Artifacts analysed: contracts/docs.md, tasks.md, the WP20 and WP21 prompts and lanes.json, checked against `.kittify/charter/charter.md`. spec.md and plan.md did not change. The fifth run's results still hold for every other artifact.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| — | — | — | — | No open findings. | — |

**What was checked for the asynchronous form model**

| Check | Result |
|----|----|
| Defect is real | `formModel` computes contract digests with Web Crypto (`crypto.subtle`), which is asynchronous. The prompt's module-level `Effect.runSync(formModel(...))` therefore throws `AsyncFiberError`. WP20 reported it and stopped. The defect was in contracts/docs.md, not in the kernel or the web Pack. |
| Options | A loader cannot hold the forms: loader data is serialized, and each form's `submit` is a function. Client-only rendering would drop the derived forms from the prerendered HTML. A synchronous digest would change the kernel. Chosen: top-level `await Effect.runPromise(formModel(...))` at module scope. This keeps one model, needs no kernel change and keeps the prerendered forms. |
| Contract first | contracts/docs.md (calculator page) now prescribes the top-level await and says why `runSync` and a loader cannot be used. The WP20 prompt quotes the same text. |
| Fix proven | A scratch copy of lane-t (lane-t itself was not touched) had all remaining WP20 steps applied. `docs:build` passed, and the top-level await landed in the lazily loaded route chunk. The prerendered `/calculator` HTML holds all four forms, with `inputMode="decimal"`, labelled inputs (`for="add-a"`) and `data-ready="false"`. The three calculator browser tests passed. The full `bun run verify` passed: 844 unit tests, 102 browser tests, `grace lint` with 0 errors, and `telos check` ok with 0 closure errors. |
| Further WP20 prompt defects found by the dry run (all fixed) | `bun run format` reflows JSON fences in Markdown (short arrays go on one line), so "every playground= block is the example JSON" now compares parsed JSON. contracts/docs.md and the prompt state the rule. React static markup keeps `inputMode` in camel case. The minimal example is pretty-printed over three lines. A `text` block may hold JSON (the calculator output), so the old "text is not JSON" rule is gone. machine-files.e2e.ts must say four llms bullets. The `V-M-DOCS-CONTENT` Scenario and TraceAssertion still named `@telos/locus` and "the fourteen codes". `calculator.test.tsx` needs a module map line for `FORMS`, because grace lint reads every top-level local. The introduction's maturity text now says the calculator page shows invocation outcomes, not check results. |
| Haiku self-sufficiency | The WP20 prompt's Resume section (R1 to R13) does four things. It tells the implementer to keep the uncommitted lane-t work: 51 staged deletions, five edited files and three untracked files. It gives the exact route and test fixes, the navigation edits with anchors, and five files verbatim from the passing scratch copy: calculator.e2e.ts, guides.test.ts, guide-examples.test.ts, guide-snippets.test.ts and guide-snippets.ts. It provides a fence-printing helper, so no quoted block is typed by hand, with the measured command outputs. Finally, it covers the exact GRACE XML, the gate through the lock wrapper, four Conventional Commits with sanctioned edits named, the kitty-specs clean-up and move-task. |
| Ownership | WP20's sanctioned edits are unchanged in kind. One line was added: the machine-files map and comment wording. `docs/tooling.md` stays WP21's. No `owned_files` or dependency changed, so lanes.json is unchanged and no finalize was needed. |

**What was checked for the WP21 additions (S1 to S9)**

| Check | Result |
|----|----|
| Items | S1: the `/kernel` llms wording in three files. S2: ADR-0023 lists `not-run` and `unknown`. S3: three references to the missing `packages/kernel/src/status.ts`. S4: P14 names the real check, the Semantic Closure of `telos:kernel`, which declares only `effect`, confirmed with `telos inspect`. S5: the agent and web Packs use their exported extension id constants. S6: the keyboard test includes `select`. S7: a component test for the stale-result label. S8: two unused imports. S9: checks only, because WP19 already removed the `ci` origin and every `revision-id` selector and kind on lane-t. |
| Probed | All applied on the scratch copy. Typecheck passed. The Pack tests and the calculator tests (70) passed. The new test passed (2). The S5 after-grep is empty, the lint warnings went from 33 to 31, and grace lint reported 0 errors. |
| Ownership | Every S file is a sanctioned edit in the tasks.md Shared files table and in the WP21 prompt. The prompt tells the implementer to commit those files before `move-task`, because the auto-commit refuses files outside `owned_files`. |
| tasks.md | The WP08 independent test said "seven closure codes". It now says eight, because WP22 added `closure.unparsable`. A deviation note records the WP20 decision and the WP21 additions. |

**Info (not findings):**

- The WP20 contract text for the calculator page changed after WP20 started. This is the same situation as the WP15 closure resolver: the WP implemented its prompt exactly, and the contract wins over prompts.
- The S9 checks are expected to print nothing once WP19 and WP20 are merged. feat and the coordination branch still show `revision-id` in the old playground tests until then.

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|
| FR-001..FR-016 | Yes | WP02-WP09, WP22 | unchanged |
| FR-017, FR-019 | Yes | WP10, WP12, WP20 | the calculator page builds the web forms with top-level await |
| FR-018 agent pack | Yes | WP11, WP14 | unchanged |
| FR-020, FR-021 | Yes | WP13, WP14, WP18, WP21 | WP21 S7 adds a component test for the FR-021 stale label |
| FR-022..FR-024 | Yes | WP15 | unchanged |
| FR-025..FR-031 | Yes | WP01, WP16-WP21 | FR-031: the playground-block comparison is on parsed JSON |
| NFR-001..NFR-008 | Yes | per tasks.md coverage table | |
| C-001..C-009 | Yes | per tasks.md coverage table | |

**Charter Alignment Issues:** None.

- The fix adds no dependency and changes no kernel code.
- The guide tests are written before the guides.
- No check is bypassed.
- The Resume keeps the full gate and the review routing.
- The work is written for Haiku and reviewed by `reviewer-renata`.

**Unmapped Tasks:** None.

**Metrics:**

- Total requirements: 48 (31 FR, 8 NFR, 9 C)
- Total tasks: 136 subtasks in 22 work packages, 22 lanes (unchanged)
- Coverage: 100% (48 of 48)
- Ambiguity count: 0
- Duplication count: 0
- Critical issues count: 0

### Next Actions

- Resume WP20 in lane-t with R1 to R13 of its prompt (Haiku, the WP's `agent_profile`), then review it with `reviewer-renata` (Sonnet).
- WP21 runs after WP20 and WP17, with S1 to S9 included.
