# E2: Sonnet writes WP prompts from a settled outline

Date: 2026-10-25. Mission: `semantic-foundation-rebuild-01M5JFR0`. Status: done, one run, four WPs.

## Question

Can Sonnet (high effort) write work package prompts of the same quality as the Opus prompts the mission used, once Opus has settled the outline, the contracts and the WP boundaries? The answer decides the "(trial)" row in `AGENTS.md` "Model routing".

## Method

- **Input.** A copy of the repository at `5a05e9d`, the commit before the WP prompt files were written (`git archive`). The copy had `tasks/WP*.md`, `status.events.jsonl`, `status.json`, `lanes.json`, `acceptance-matrix.json` and `analysis-report.md` removed. With it: the owner's directive (`init-prompt.md`, `resume-prompt.md`, written before the tasks phase), the Spec Kitty WP template, and the format section of `/spec-kitty.tasks-packages`. The copy has no `node_modules`.
- **Isolation.** Writers worked only in that copy. They could not see git history, the active mission, the Opus prompts, review cycles or any later outcome. `audit_writers.py` checks every tool call of each writer: none read, wrote or ran anything outside the copy, and none ran git.
- **Writers.** Two `planner-priti` subagents, `model: sonnet`, `effort: high`, run in parallel. Writer A wrote WP10 and WP12, which share the Packs contract. Writer B wrote WP16 and WP21, which are documentation WPs. The briefs are in `briefs/`.
- **Choice of WPs.** WP10 and WP21 were each rejected once in the real run. WP12 and WP16 passed review the first time.
- **Baseline.** The Opus prompts at `5a05e9d`: `git show 5a05e9d:kitty-specs/semantic-foundation-rebuild-01M5JFR0/tasks/<WP>.md`. One Opus `planner-priti` agent wrote all 21 prompts plus the outline in one context: 636 requests, 15 compactions, $46.82 API-equivalent. The cost of one WP prompt cannot be separated from that.
- **Comparison.** The coordinator compared each pair on a fixed checklist. For WP10 and WP21 it also checked, privately, whether the Sonnet prompt would have avoided the defect behind the real rejection. The writers never saw those reasons.

Checklist:

1. Requirements coverage: requirement refs, subtasks, and the behaviours the spec and contracts require.
2. Interface consistency: names, signatures, ids and messages that match the contracts and neighbouring WPs.
3. Actionable implementation guidance: what a Haiku implementer can do without guessing.
4. Verification criteria: acceptance tests, commands and the definition of done.
5. Unsupported assumptions: claims the sources do not back.
6. Unresolved decisions: open questions left to someone else.

## Results

The Sonnet prompts are in `outputs/`. They were not used to implement anything.

### Usage (measured, `audit_writers.py`)

| Writer | WPs        | Model, effort (observed) | Requests | Wall time | Output tokens | API-equivalent $ |
| ------ | ---------- | ------------------------ | -------: | --------: | ------------: | ---------------: |
| A      | WP10, WP12 | sonnet-5-5, high         |       15 |   6.3 min |        59,100 |             1.45 |
| B      | WP16, WP21 | sonnet-5-5, high         |       44 |  13.3 min |       114,857 |             3.76 |
| Total  | 4 WPs      |                          |       59 |           |       173,957 |             5.21 |

No writer compacted. For comparison, the Opus tasks agent spent $46.82 on the outline and 21 prompts, so at most $2.23 per WP on average with the outline included.

### WP10 (CLI Pack; rejected once in the real run)

| Checklist item          | Verdict                                               | Notes                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements coverage   | about equal                                           | Both cover FR-017 and T054–T059. Sonnet adds tests for Defect, NotImplemented, NFR-004 equality with kernel `invoke` and the export list. Opus adds whitespace coercion (`" 2.5 "`) and an unknown flag (`--zzz`).                                                                                                            |
| Interface consistency   | about equal                                           | Both match the contract names, signatures and export list. Each set uses its own violation messages, consistently across its two Packs (the contract fixes only one example). Sonnet adds non-contract exports inside modules (`invalidInputExitViolation`, `exposedTargets`, `isCliLocus`) and keeps them out of `index.ts`. |
| Actionable guidance     | Opus better on API facts, Sonnet better on sequencing | Opus quotes the contracts and a prototype it ran while planning, which pins the `effect/cli` calls and how they behave. Sonnet could not run code, so it tells the implementer to look the APIs up. Sonnet gives a write order, the steps of each subtask, the `Option` cast and the validation command of each subtask.      |
| Verification criteria   | about equal                                           | Both give exact test tables, messages and a definition of done. Sonnet tests `runMain` in a subprocess, as the conventions ask.                                                                                                                                                                                               |
| Unsupported assumptions | Opus better                                           | Sonnet states that no real model can fail `cli.invalid-input-exit`. Opus shows one that does: a fake extension whose `cli.command` relation does not grant invocation.                                                                                                                                                        |
| Unresolved decisions    | Opus better                                           | Sonnet leaves three open questions with defaults. The default for Q1 replaces a real failing test with a stub runner. Opus leaves none.                                                                                                                                                                                       |

Rejection check: the reviewer rejected WP10 because the extension id `"telos.cli"` was written as four separate literals. Neither prompt prevents this. Sonnet's adds a `CLI_EXTENSION_ID` constant for `derive.ts`, but still writes the literal in `semantics.ts` and `archetype.ts`, so three copies remain. The Opus prompt leads to four.

### WP12 (Web Pack; approved first time in the real run)

| Checklist item          | Verdict                | Notes                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements coverage   | Sonnet slightly better | Both cover FR-019 and T068–T071. Sonnet also tests the integer, boolean and string field mapping, an unsupported field, a capability that is discoverable but not exposed, NFR-004 equality, the export list and browser-safe imports. |
| Interface consistency   | about equal            | Both match the contract. Without seeing it, Sonnet chose the same `LocusNotFound` message as Opus.                                                                                                                                     |
| Actionable guidance     | about equal            | Same pattern as WP10. Sonnet's notes on strict compiler options are useful.                                                                                                                                                            |
| Verification criteria   | about equal            | The Sonnet test list is broader. The Opus failing test for the execution rule uses a real model.                                                                                                                                       |
| Unsupported assumptions | Opus better            | The same false claim about `web.invalid-input-error`.                                                                                                                                                                                  |
| Unresolved decisions    | Opus better            | Sonnet leaves three open questions, Opus none.                                                                                                                                                                                         |

### WP16 (foundation documents; approved first time in the real run)

| Checklist item          | Verdict                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements coverage   | about equal            | Both cover FR-027 and T090–T096. Sonnet gives the content of each principle (definition, modules, limits, related) and the planned module of each term, adds a test that every principle has its four sections, and gives the exact GRACE lines. Opus asks for nine GRACE goals, one per user story; Sonnet for two.                                                                                                                                                                                                                                       |
| Interface consistency   | mixed                  | Opus keeps the headings that other documents link to (`CAP-01` to `CAP-14`, `5-invariants`, `semantic-intermediate-representation`), which it found in the repository. Sonnet renames them and retargets the links instead (its open question 2), which means more edits in ADRs and research notes. Both follow the outline on ADR-0018: WP17 adds it. Sonnet introduces conventions its own WP21 relies on (a `Planned module:` line per term, the `Enforced today` column set to `No`, an old-to-new principle mapping). The outline does not fix them. |
| Actionable guidance     | Sonnet better          | Sonnet gives a content table for the principles and for the terms, the definitions of terms with no spec row, both diagrams, the test code, the exact XML lines and a check per subtask. Opus quotes the contract and gives the front matter shapes and a few "In practice" examples.                                                                                                                                                                                                                                                                      |
| Verification criteria   | Sonnet slightly better | Sonnet adds structure tests and per-subtask checks. Its term count test compares the compiled count with the files on disk, which is weaker than the fixed 25 in the Opus prompt; its definition of done checks for 26 files. Opus requires a baseline `verify` run before any change.                                                                                                                                                                                                                                                                     |
| Unsupported assumptions | about equal            | Module paths in both come from the contracts. Sonnet's P14 names a check that is planned (`packages/kernel/test/api.test.ts`, WP09 T052). The real review's one note on WP16 was that P14 claimed a gate check that was not planned. Sonnet's `principles.xml` change differs from the contract text ("update to the new principles"), and it says so.                                                                                                                                                                                                     |
| Unresolved decisions    | Opus better            | Sonnet leaves five open questions with sound defaults; its default for the open-question anchors is what Opus decided. Opus leaves none, but says nothing about labels such as `[P09]` that point at the wrong principle after renumbering. Sonnet's question 5 covers them.                                                                                                                                                                                                                                                                               |

### WP21 (final coherence sweep; rejected once in the real run)

| Checklist item          | Verdict                      | Notes                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requirements coverage   | about equal                  | Both cover FR-029, FR-030, NFR-006 and T126–T129. Sonnet adds a rule for the `Enforced today` column and checks of `llms.txt`, the decision register and the README commands. Opus checks the `telos list`, `closure` and `verify` output.                                                                            |
| Interface consistency   | Sonnet closer to the outline | The outline lets WP21 change "the term `maturity` lines and sentences that call an existing module planned" in `docs/foundation/**`. Sonnet keeps that; Opus narrowed the term files to "the `maturity` line only". Sonnet relies on the conventions of its own WP16 prompt; with the Opus WP16 they would not exist. |
| Actionable guidance     | about equal                  | Both give exact grep sets and fix rules. Sonnet scripts more of it: a per-term module check and an enforcement rule with candidates to confirm.                                                                                                                                                                       |
| Verification criteria   | Sonnet slightly better       | Six cross-checks and an evidence block, against four.                                                                                                                                                                                                                                                                 |
| Unsupported assumptions | about equal                  | The Opus prompt says 24 terms where its table has 23 (a non-blocking review note). Sonnet derives the removed public names from `packages/locus` and states it as an assumption.                                                                                                                                      |
| Unresolved decisions    | Opus better                  | Sonnet leaves six open questions, Opus none.                                                                                                                                                                                                                                                                          |

Rejection check: the reviewer rejected WP21 because three passages still called built things future: the roadmap's "Next candidates" item 1 (a drift check, which Semantic Closure already is), "Not built in this mission: … import-graph extractors" in `capabilities.md`, and "part of the repository gate that WP15 adds" in `semantic-closure.md`. The Opus prompt allowed only the `maturity` line in term files, so the third fix was outside the implementer's edits. The Sonnet prompt allows it. Its detection is a grep, though, and run against the rejected text (`git grep` at `3f75c4c^`) the pattern matches none of the three passages. Neither prompt asks the implementer to check each "future" claim against the code. With Sonnet's WP16 the documents would also have been different; that path is untested.

## Result

- **Cost (measured).** $5.21 API-equivalent for four prompts, $0.7–1.9 per WP. The Opus average was at most $2.23 per WP including the outline, so on this evidence the saving per prompt is at most about 40%, before an Opus pass answers Sonnet's questions.
- **Quality (judged).** The Sonnet prompts are complete and more prescriptive, and on WP21 they follow the outline more closely than Opus. They leave 17 open questions where Opus left none. They twice claim that no real model can fail a rule (WP10, WP12), where Opus had a prototype showing one. And they invent cross-WP conventions between WP16 and WP21 that the outline did not settle. Neither model's prompts would have prevented the two real rejections.
- **Decision.** Keep the "(trial)" row in `AGENTS.md`. `tools/agents/delegation.md` now adds the conditions this run points to: the writer works in a real checkout and may run throwaway prototypes; a convention another WP relies on is an open question; a claim about what a check can catch needs a contract quote or a prototype; all questions go to one Opus pass before tasks are finalized.
- **Next measurement.** On the next mission: rejections per WP, the cost of the Opus question pass, and whether Haiku passes review with Sonnet prompts.

## Limitations

- One run, four WPs, one mission, compared by one reviewer (the coordinator). The comparison is a judgement, not a measurement.
- The Sonnet prompts were not implemented. Whether Haiku would pass review with them is untested.
- The copy had no `node_modules`, so Sonnet could not run prototypes. In the real run Opus could, and that is where its most useful API facts came from. A writer working in a real worktree could run them as well.
- The Opus baseline was written in the same context as the outline, so it carried knowledge that never reached `tasks.md`. A Sonnet writer only gets what the artifacts hold. This is the real setting for the trial, but it does not separate model ability from context.
- The cost of one Opus WP prompt is unknown, so there is no cost-per-prompt comparison, only the Sonnet cost measured here.
