# Project Charter — curated companion

<!--
This file is a hand-authored, display-only companion to the authoritative
`.kittify/charter/charter.yaml`. It holds the human *rationale* behind your
project's governance and doctrine.

It is NEVER a charter-resolving input, and `charter generate` NEVER overwrites
it. Edit it freely, and keep it in sync with charter.yaml.
-->

## What Telos is

Telos is a new "everything as code" full-stack framework for next-generation software. It lives in a Bun workspaces monorepo: apps in `apps/`, library packages in `packages/`. Spec Kitty owns the change lifecycle, and the owner makes the decisions (see `AGENTS.md`).

## The failure we fear most

Wrong behavior: silent logic bugs and drift between the spec and the code. Most of the rules below exist to catch that early.

## How we work

- **Test-first.** Every behavior change starts with a failing `bun test` that encodes the acceptance criterion. Tests fail exactly when the contract breaks. No fake or always-passing tests.
- **Blocking gates.** The check suite (`bun run verify`: version guard, format check, lint, typecheck, test and the repository self-check) blocks reviews, accept and merge. The pre-commit hook runs format, lint, typecheck and tests on staged work. Nobody bypasses a gate without an owner decision.
- **Bun only.** TypeScript (strict) on Bun, at or above the minimum Bun version in `package.json`. Adding a tool or dependency is an owner decision, with supply-chain checks.
- **Small, faithful changes.** Keep diffs as small as possible, stay true to the approved spec, and record every material decision.
- **One vocabulary.** Process terms live in the Spec Kitty glossary (`.kittify/glossaries/`). There is no product terminology document until Telos is written by Telos.

## Who does what (model routing)

Strict. Roles are never swapped; only the owner may change them.

- **Root session:** OpenAI gpt-6-luna at medium effort through Codex. It reads state, delegates, relays results, and does tooling recovery and mechanical fixes itself.
- **Mission creation, specify, plan, tasks:** gpt-6.1-sol, high effort.
- **Tasks:** written by the planner model for the implementation model. Work packages are sized and written so that one implementation-model agent can finish each one from its prompt alone.
- **Implementation:** gpt-6-luna, medium effort.
- **Work package review:** gpt-6-sol, medium effort.
- **Mission review after merge:** gpt-6.1-sol, high effort.

No built-in doctrine covers model routing. This is a doctrine gap, recorded here as project policy.

## Activated doctrine

Paradigms: specification by example, behaviour-driven development, deep module design, domain-driven design.

Directives: architectural integrity (001), decision documentation (003), specification fidelity (010), locality of change (024), agent commit signing (029), test and typecheck gate (030), conceptual alignment (032), targeted staging (033), test-first development (034), bulk-edit classification (035), black-box integration testing (036), tests as scaffold (041), close defect classes by construction (043), PRs only (045), credential handling (050), supply-chain install safety (051).

## Exceptions and amendments

Every exception (a skipped gate, the missing CI, an unapproved dependency) is an explicit owner decision recorded in the mission, together with the follow-up that removes it. Current exception: there is no CI, by owner decision on the bun-monorepo-toolchain mission.

The owner amends this charter in chat. The agent updates `interview/answers.yaml`, regenerates, and commits with a `chore(charter)` message.
