<!-- Agent call: description 'E2 writer B: WP16, WP21', subagent_type planner-priti, model sonnet, effort high -->

You are writing Spec Kitty work package (WP) prompt files for an experiment. Write two files: WP16 and WP21 of mission semantic-foundation-rebuild-01M5JFR0.

Let S = /private/tmp/claude-501/-Users-unknownhero-projects-unknownlab-telos/48f2abba-47cc-4641-91d5-0369d350dc60/scratchpad/e2

Ground rules
- Work only inside S. It holds a snapshot of the repository at the end of planning (S/repo), the owner's directive (S/source/), and the WP format (S/instructions/).
- Do not read, list or search anything outside S: not /Users/unknownhero/projects/unknownlab/telos, not git history, not ~/.claude. Do not run git, spec-kitty, grace or bun. Read, Write, Grep and Glob inside S are enough.
- Ignore what the snapshot's AGENTS.md says about reading state, model routing or committing. Your only job is writing two files.

Inputs (under S/repo/kitty-specs/semantic-foundation-rebuild-01M5JFR0/ unless noted)
- tasks.md: the settled outline. The section for each assigned WP is binding: id, title, dependencies, subtasks, requirement refs, owned files. Other WPs' sections tell you what neighbours own and provide.
- spec.md, plan.md, data-model.md, research.md, research/, quickstart.md, contracts/: requirements, design decisions and cross-WP interfaces.
- S/repo: the code and docs as they stood before implementation. Check paths, existing APIs and scripts there before you cite them.
- S/source/init-prompt.md and S/source/resume-prompt.md: the owner's directive behind the mission.
- S/instructions/wp-prompt-format.md: the required frontmatter and body sections. S/instructions/task-prompt-template.md is the Spec Kitty template it derives from.

Audience
The implementer is a Haiku model that must finish the WP from the prompt plus the files it can open. Give exact file paths, APIs and signatures, the acceptance tests, and the commands that verify the work. Quote the contract text the WP needs; for longer material, reference it precisely (file and section heading) instead of pasting whole contracts. Do not invent APIs, files or requirements the sources do not support.

Open decisions
If the outline or sources leave a design decision open or contradict each other, do not decide silently. Write it as a focused question with your recommended default, and say in the WP what the implementer should do until it is answered. These questions would go to an Opus planner.

Frontmatter: choose agent_profile from curator-carla, scribe-sally, implementer-ivan, lexical-larry (or a profile the sources name); role "implementer"; agent "claude"; model "".

Output
- Write S/out/WP16-foundation-documents.md and S/out/WP21-coherence-sweep.md.
- Final report, at most 40 lines: files written with line counts; for each WP the requirement IDs it covers; open questions with your recommended defaults; assumptions you made; anything in the outline you found inconsistent.
