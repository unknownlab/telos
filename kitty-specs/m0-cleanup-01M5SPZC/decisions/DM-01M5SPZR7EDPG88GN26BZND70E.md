# Decision Moment `01M5SPZR7EDPG88GN26BZND70E`

- **Mission:** `m0-cleanup-01M5SPZC`
- **Origin flow:** `specify`
- **Slot key:** `specify.scope.docs-removal`
- **Input key:** `docs_removal_scope`
- **Status:** `resolved`
- **Created:** `2026-10-25T14:21:14.350944+00:00`
- **Resolved:** `2026-10-25T14:21:26.050910+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

What documentation and documentation-only checks does M0 remove?

## Options

- All docs: apps/docs, docs/, .grace/, docs:build, test:e2e, grace:lint, doc-only tests
- Only apps/docs
- Other

## Final answer

All docs: apps/docs, the docs/ folder (foundation, decisions, research, guides), .grace/ and grace:lint, docs:build and test:e2e in verify and the review gate, and tests that exist only to check docs or markup. Owner, relayed by the coordinator: 'we can drop everything about docs; when Telos is written by Telos we will build new docs'.

## Rationale

_(none)_

## Change log

- `2026-10-25T14:21:14.350944+00:00` — opened
- `2026-10-25T14:21:26.050910+00:00` — resolved (final_answer="All docs: apps/docs, the docs/ folder (foundation, decisions, research, guides), .grace/ and grace:lint, docs:build and test:e2e in verify and the review gate, and tests that exist only to check docs or markup. Owner, relayed by the coordinator: 'we can drop everything about docs; when Telos is written by Telos we will build new docs'.")
