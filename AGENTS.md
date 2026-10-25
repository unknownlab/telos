<!-- spec-kitty:orientation -->
**Spec Kitty v3.2.7** — project: unknown (healthy)

Two usage patterns:
- **Full mission** (spec → plan → tasks → implement → review → merge):
  trigger: "spec out", "create a mission", "write a spec", "plan this"
  → run `/spec-kitty.specify`
- **Lightweight dispatch** (ad-hoc fix, question, or advice — no mission created):
  trigger: "hey spec kitty", "use spec kitty to", "spec kitty <anything>"
  → **ALWAYS run `spec-kitty dispatch "<request verbatim>"` — do NOT answer directly.**
  If you know the right profile, pass it to skip routing:
  `spec-kitty dispatch "<request verbatim>" --profile <profile-id>`
  Reason: `spec-kitty dispatch` loads governance context, routes the request,
  and opens the Op. Skipping it produces ungoverned, untracked responses.
  After finishing the work, close the Op with the command printed in the capsule
  (`spec-kitty profile-invocation complete --invocation-id <id> --outcome <done|failed|abandoned>`).
<!-- /spec-kitty:orientation -->

# Agent rules

These rules apply to every coding agent in this repo. Codex reads this file, and Claude Code imports it through `CLAUDE.md`. Keep agent rules here only. The owner-facing overview is `docs/tooling.md`.

Spec Kitty generates the block above and prints the same text from its SessionStart hook. Where it disagrees with these rules, these rules win: answer questions directly and make small operations (state reads, recovery, mechanical fixes, git) directly. Run `spec-kitty dispatch` only when the owner asks for a tracked Op.

The owner directs the work in plain language and makes the decisions. You choose and run the tools, skills, and commands yourself. Never ask the owner to run a command or to name a tool, skill, or workflow phase.

## Telos foundation

Telos by UnknownLab is defined in `docs/foundation/README.md` (doctrine, principles, terminology, conceptual model), `docs/decisions/` (architecture decision records) and `docs/research/`. Read the foundation README before product work. Product terms are defined in `docs/foundation/terminology/`; use them as defined there. The documentation site in `apps/docs` is generated from these files; never edit content in the app.

## Read state before working

The coordinator (the root session) queries the native state before starting or resuming work, but not for pure questions. Subagents skip this; their brief carries the state they need. Do not keep your own notes or trackers.
- `git status` and `git worktree list`
- for each mission in `kitty-specs/`: `spec-kitty agent tasks status --mission <slug> --json` and `spec-kitty next --mission <slug> --json` (query mode does not advance)
- open Spec Kitty Ops: `spec-kitty invocations list`
- if `.grace/` exists: `grace status --path . --json`

Resume only the work that matches the owner's current request. Report any other unfinished or abandoned work, and ask before resuming, closing, or discarding it.

## Routing: one authority per concern

- **Product changes** (features, behavior, interfaces, data, dependencies, architecture) go through a Spec Kitty mission (`spk-start-here`). The phases are specify → plan → tasks → implement/review → accept → merge, advanced with `spec-kitty next` (`spk-run-next`).
- **Questions, investigation, explanation**: answer directly. When `.grace/` exists, use `grace-ask` and `grace-cli`.
- **Edits that change no behavior** (typos, comments, formatting): make them directly, then run the checks.
- **Stuck workflow**: use `spk-run-blocked-recovery`. **Broken tooling**: use `spk-admin-setup-doctor`. The coordinator handles both itself.
- **GRACE** owns architecture knowledge and its validation: contracts, the module graph, verification, and semantic markup. The skills are `grace-status`, `grace-ask`, `grace-cli`, `grace-reviewer`, `grace-verification`, `grace-refresh`, `grace-fix`, `grace-refactor`, and `grace-explainer`. When `.grace/` exists, every mission keeps `.grace/` and the code markup in sync inside its own work packages. The mission must also pass `grace lint --path . --assertions current`.
- **Spec Kitty** owns the change lifecycle. Do not use `grace-spec`, `grace-plan`, `grace-execute`, `grace-setup-subagents`, or `.grace/changes/`. The mission is the change record.
- If `.grace/` is absent, do not create it yourself. Offer `grace-init` when a mission first defines architecture. If GRACE proposes rules that conflict with this file, this file wins. Tell the owner about the conflict.

## Model routing (owner rule)

The root session is the coordinator. It runs on Sonnet at medium effort, which is the project default in `.claude/settings.json`. It reads state, delegates, and relays results. It also does tooling recovery, Spec Kitty state repair and mechanical fixes itself: formatting, a lint fix, a status repair, anything that needs no design decision. It writes no specs, plans, WP prompts, product code or reviews.

Every Agent call sets `model` and `effort`. Without them a subagent gets the coordinator's model and a default effort, and Spec Kitty regenerates the agent definitions without model fields.

| Work | Model, effort |
| --- | --- |
| Specify and plan; open design questions; WP boundaries and cross-WP interfaces in the tasks outline | Opus, high |
| WP prompt files from the settled outline (trial) | Sonnet, high |
| WP implementation, with the WP's `agent_profile` | Haiku, medium |
| WP review (`reviewer-renata`) | Sonnet, medium |
| Hard cross-WP problems: an interface conflict, a defect that spans WPs, a design question a writer or reviewer escalates | Opus, high |
| Mission review after merge | Opus, high |

- Use xhigh or max only when the owner asks for it.
- Run WPs with no dependency between them in parallel.
- Never swap these roles without the owner. If a WP is rejected twice, ask the owner before changing the model.

## Planning and context

- Opus settles design questions, WP boundaries and cross-WP interfaces before WP prompts are written. A prompt writer that meets an open question sends back one focused question; the coordinator asks Opus and passes the answer on.
- Decisions, interfaces, open questions and progress live in the mission artifacts (spec, plan, contracts, tasks, Spec Kitty status), not in chat or agent memory.
- Write WP prompts so a Haiku model can finish the WP from the prompt and the files it names: exact files, APIs and acceptance tests. Quote only the contract text the WP needs, and reference the rest by file and section.
- Give each subagent what its role needs: the WP, the requirements it covers, the interfaces it touches and how to verify them. The coordinator reads the brief templates in `tools/agents/delegation.md` before delegating.
- Every subagent ends with a short report: result, changed files, checks run and their outcomes, unresolved issues, links to commits or files.
- Start fresh agents and sessions at phase boundaries: plan approved, tasks finalized, mission merged. Reuse an agent while its context still helps, for example an implementer fixing its own rejected WP. A reviewer never implemented the WP it reviews.
- Add adversarial squads or extra review layers only when a concrete failure calls for one.

## Owner decisions

Ask the owner about the following. Ask one short question with your recommended option, and batch questions together.
- Product: scope, requirements, behavior, UX, acceptance criteria. Never fill these gaps with assumptions.
- Approval of each mission's spec and plan before implementation starts.
- Architecture: new modules or boundaries, public contracts, the data model, adding or upgrading dependencies, `grace-init`.
- Releasing and deploying.
- Destructive actions outside git: discarding uncommitted work you did not create, closing or abandoning missions.
- Gate bypasses: `--force`, `--skip-*`, `*_DISABLE` environment variables.
- Anything outside this repo: global installs or upgrades (`bun add -g`, `bun upgrade`, `uv tool`), `~/.claude`, `~/.codex`, credentials, external or paid services.
- Edits to `AGENTS.md`, `CLAUDE.md`, `.kittify/config.yaml`, or the charter.

The owner is not a git operator. Agents run all git operations themselves without asking: commit, branch, merge into `main`, push, open PRs, rebase, rewrite history, delete branches and worktrees. Merge into `main` once the owner approves the implementation. Never force-push `main`, and keep a backup branch before rewriting pushed history.

Everything else proceeds without asking: inspecting, running checks, implementing and reviewing approved work packages in their Spec Kitty worktrees, letting Spec Kitty commit, and fixing in-scope check failures.

## Verification

- Never add fake tests, placeholder scripts, or checks that verify nothing.
- Before implementing, read the work package's acceptance criteria. Run the existing checks to get a baseline.
- Run every check the repo declares (typecheck, lint, format, tests) before review, and again before accept or merge. Add `grace lint` when `.grace/` exists. Report the results exactly. If a check does not exist, say so; never claim it passed.
- The mission that introduces a toolchain also wires its checks into CI and into Spec Kitty's review gate (`review.test_command`). That wiring is part of the plan the owner approves.
- Spec Kitty blocks mission merges until reviews and dependencies are complete (`policy.merge_gates.mode: block`). Never bypass a gate on your own.

## Git and setup

- Spec Kitty owns mission branches, `.worktrees/`, and its own commits (`spk-admin-git-workflow`). Never commit mission work directly to `main`.
- Every commit message follows Conventional Commits 1.0.0 (https://www.conventionalcommits.org/en/v1.0.0/): `<type>[optional scope][!]: <description>`, then an optional body and optional footers, each after one blank line. Add a scope (a noun for the affected area, e.g. `chore(git):`) whenever one fits. Use `feat` for features and `fix` for bug fixes; other types such as `docs`, `chore`, `refactor`, `test`, `ci` and `build` are allowed. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.
- Commits and PRs carry no AI author or co-author lines, and no AI names in the message.
- The `.githooks/commit-msg` hook enforces both rules. Never bypass it with `--no-verify`.
- If `spec-kitty`, `grace`, or the project skills are missing on a machine, point the owner to the one-time setup in `docs/tooling.md` instead of installing anything globally.
