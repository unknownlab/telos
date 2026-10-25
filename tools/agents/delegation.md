# Delegation guide

The coordinator reads this before delegating. The rules themselves live in `AGENTS.md` (model routing, planning and context); this file holds the brief templates and the phase-boundary routine. Subagents do not need it.

## Every brief

Each brief states:

- the role and the single job;
- the mission slug, and for WP work the WP id, worktree path and branch;
- the inputs as exact paths: the WP file, the requirement IDs it covers (with the one-line text), and the interfaces it touches (a quoted excerpt or a file and section);
- the commands that verify the work;
- what is out of scope;
- the report: result, changed files, checks run and their outcomes, unresolved issues, links to commits or files.

Leave out session directives and scratchpad files, the whole spec or plan when the WP quotes what it needs, other WPs, and earlier chat. Set `model` and `effort` on every Agent call.

Start each Agent `description` with the role, then the one WP it works on, if any: `specify`, `plan`, `tasks outline`, `WP prompts WP01–WP04`, `clarify WP03`, `implement WP05`, `rework WP05`, `review WP05`, `mission review`, `recovery <what>`. `tools/agents/usage/ledger.py` attributes cost by these words, and to a WP only when exactly one WP id appears.

## Opus planner: specify, plan, tasks outline, design questions

`model: opus`, `effort: high`, profile `planner-priti` or `architect-alphonso`.

- Specify or plan: give the owner's request word for word (or the approved spec), the mission slug, and the phase command (`/spec-kitty.specify`, `/spec-kitty.plan`).
- Tasks outline: ask for WP boundaries, dependencies, owned files, requirement refs and every cross-WP interface. Interfaces go in `contracts/`, decisions and open questions in `plan.md`. Owner questions come back batched, each with a recommendation.
- Design question from a writer, reviewer or implementer: give the question, the artifacts it touches and the options already seen. The answer is recorded in the mission artifacts, not only in the report.

## Sonnet WP prompt writer (trial)

`model: sonnet`, `effort: high`, profile `planner-priti`. Use one writer per group of WPs that share contracts, and run the groups in parallel.

- Inputs: the WP ids, `tasks.md` (the outline; each WP's section is binding), `spec.md`, `plan.md`, `data-model.md`, `contracts/`, and the per-WP structure from `/spec-kitty.tasks-packages`.
- The audience is a Haiku implementer. Give exact files, APIs and acceptance tests. Quote only the contract text the WP needs and reference the rest by file and section.
- The writer works in the mission's checkout with dependencies installed. It may run throwaway prototypes in its scratchpad to confirm how an API or check behaves, and writes only the WP files.
- The writer does not change WP boundaries or interfaces. It returns each open question as one focused question with a recommended default. A convention that another WP relies on (a marker line, a mapping, a table column) counts as an interface: if the outline or contracts do not fix it, it is an open question. A claim about what a check accepts or rejects needs a contract quote or a prototype result.
- Before `/spec-kitty.tasks-finalize`, the coordinator sends all writers' questions in one batch to an Opus planner. The answers go into the WP files and contracts.
- This routing is experimental. E2 measured only the prompts' own cost, not a saving (`tools/agents/experiments/2026-10-e2-sonnet-wp-prompts/README.md`). It stays experimental until a whole-workflow ledger, with the clarification pass, implementation, review and rework, shows a saving at equal quality.

## Haiku implementer

`model: haiku`, `effort: medium`, profile = the WP's `agent_profile`.

- Inputs: the WP file (the prompt), the worktree path, `spec-kitty agent action implement <WP> --agent claude`, and `bun run verify` (or the subset the WP names).
- Lane chores the implementer cannot do (planning-artifact clean-up, dependency merges) stay with the coordinator.
- The report includes the check output. The coordinator passes it to the reviewer as evidence to verify, because implementers cannot write the Activity Log.

## Sonnet WP reviewer

`model: sonnet`, `effort: medium`, profile `reviewer-renata`. Never the agent that implemented the WP.

- Inputs: the WP file, the lane branch and its diff base, the requirement IDs and acceptance criteria, the interfaces touched, and the implementer's check results as claims to verify.
- The reviewer runs the checks itself. It records the verdict through Spec Kitty (`spk-run-review-wp`, `spk-run-verdict-capture`), with findings that point to a file and line.
- A design problem goes back as an escalation for Opus, not as an implementation fix.

## Opus mission reviewer

`model: opus`, `effort: high`. Give the mission slug, the merge commit and `spk-gate-mission-review`. The reviewer reads the artifacts and the merged code itself.

## Phase boundaries

The boundaries are: plan approved, tasks finalized, implementation and review done, mission merged. At each one:

1. Run `python3 tools/agents/usage/ledger.py --mission <slug>`. It rewrites `tools/agents/usage/ledgers/<slug>.md`.
2. In the phase report, ask the owner for the weekly usage % shown in Claude's usage settings, in one line. Add it to `tools/agents/usage/weekly.md` only when the owner gives it.
3. Start the next phase with fresh agents and pass state through the mission artifacts. Keep an agent only when its context still helps, for example an implementer fixing its own rejected WP.
