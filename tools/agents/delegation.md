# Delegation guide

The coordinator reads this before delegating. The rules themselves live in `AGENTS.md` (model routing, planning and context); this file holds the brief templates, what to do at phase boundaries and how to measure usage on demand. Subagents do not need it.

## Every brief

Each brief states:

- the role and the single job;
- the mission slug, and for WP work the WP id, worktree path and branch;
- the inputs as exact paths: the WP file, the requirement IDs it covers (with the one-line text), and the interfaces it touches (a quoted excerpt or a file and section);
- the commands that verify the work;
- what is out of scope;
- the report: result, changed files, checks run and their outcomes, unresolved issues, links to commits or files.

Leave out session directives and scratchpad files, the whole spec or plan when the WP quotes what it needs, other WPs, and earlier chat. Run every delegation as `codex exec -m <model> -c model_reasoning_effort=<effort> -C <path> "<brief>"`, with the model and effort from the table in `AGENTS.md`.

Start the first line of each brief with the role, then the one WP it works on, if any: `specify`, `plan`, `tasks outline`, `WP prompts WP01–WP04`, `clarify WP03`, `implement WP05`, `rework WP05`, `review WP05`, `mission review`, `recovery <what>`. Name only one WP id per brief, so usage can be attributed to it.

## Planner: specify, plan, tasks, design questions

Model and effort for planning in `AGENTS.md`; profile `planner-priti` or `architect-alphonso`.

- Specify or plan: give the owner's request word for word (or the approved spec), the mission slug, and the phase command (`/spec-kitty.specify`, `/spec-kitty.plan`).
- Tasks outline: ask for WP boundaries, dependencies, owned files, requirement refs and every cross-WP interface. Interfaces go in `contracts/`, decisions and open questions in `plan.md`. Owner questions come back batched, each with a recommendation.
- WP prompt files: by default the same planner writes them in the tasks phase, for the implementation model: exact files, APIs and acceptance tests.
- Design question from a writer, reviewer or implementer: give the question, the artifacts it touches and the options already seen. The answer is recorded in the mission artifacts, not only in the report.

## Implementer

Model and effort for implementation in `AGENTS.md`; profile = the WP's `agent_profile`.

- Inputs: the WP file (the prompt), the worktree path, `spec-kitty agent action implement <WP> --agent codex`, and `bun run verify` (or the subset the WP names).
- Lane chores the implementer cannot do (planning-artifact clean-up, dependency merges) stay with the coordinator.
- The report includes the check output. The coordinator passes it to the reviewer as evidence to verify, because implementers cannot write the Activity Log.

## WP reviewer

Model and effort for review in `AGENTS.md`; profile `reviewer-renata`. Never the agent that implemented the WP.

- Inputs: the WP file, the lane branch and its diff base, the requirement IDs and acceptance criteria, the interfaces touched, and the implementer's check results as claims to verify.
- The reviewer runs the checks itself. It records the verdict through Spec Kitty (`spk-run-review-wp`, `spk-run-verdict-capture`), with findings that point to a file and line.
- A design problem goes back as an escalation for the planner model, not as an implementation fix.

## Mission reviewer

Model and effort for mission review in `AGENTS.md`. Give the mission slug, the merge commit and `spk-gate-mission-review`. The reviewer reads the artifacts and the merged code itself.

## Phase boundaries

The boundaries are: plan approved, tasks finalized, implementation and review done, mission merged. At each one, start the next phase with fresh agents and pass state through the mission artifacts. Keep an agent only when its context still helps, for example an implementer fixing its own rejected WP.

## Measuring usage on demand

`tools/agents/usage/ledger.py` reads Claude Code transcripts only, so it does not cover Codex runs. Until it is adapted, the owner reads usage from the OpenAI side. Do not ask the owner for figures.
