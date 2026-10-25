# Decision Moment `01M5SQ070BR65M0VX1JHQXG5XT`

- **Mission:** `m0-cleanup-01M5SPZC`
- **Origin flow:** `specify`
- **Slot key:** `specify.scope.tooling-doc`
- **Input key:** `tooling_doc_fate`
- **Status:** `resolved`
- **Created:** `2026-10-25T14:21:29.483517+00:00`
- **Resolved:** `2026-10-25T14:34:08.736529+00:00`
- **Resolved by:** `unknownhero`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

docs/tooling.md is the one-time setup and tooling guide that AGENTS.md, the pre-commit hook messages and tools/agents/settings/README.md point to. Drop it with the rest of docs/, or move a trimmed copy (no docs or GRACE content) out of docs/?

## Options

- Move a trimmed copy to tools/README.md (recommended)
- Drop it; setup knowledge lives only in AGENTS.md
- Other

## Final answer

Move a trimmed copy to tools/README.md: keep the useful content (one-time setup, hooks, Bun canary, agent tooling) without docs or GRACE content, delete docs/tooling.md, and update every pointer to it.

## Rationale

Owner, relayed by the coordinator: keep whatever useful info docs/tooling.md has (one-time setup etc.) and move/trim it to tools/README.md without docs/GRACE content; update every pointer to it.

## Change log

- `2026-10-25T14:21:29.483517+00:00` — opened
- `2026-10-25T14:34:08.736529+00:00` — resolved (final_answer="Move a trimmed copy to tools/README.md: keep the useful content (one-time setup, hooks, Bun canary, agent tooling) without docs or GRACE content, delete docs/tooling.md, and update every pointer to it.")
