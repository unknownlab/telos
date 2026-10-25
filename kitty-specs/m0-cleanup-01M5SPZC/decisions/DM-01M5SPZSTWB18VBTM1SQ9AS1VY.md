# Decision Moment `01M5SPZSTWB18VBTM1SQ9AS1VY`

- **Mission:** `m0-cleanup-01M5SPZC`
- **Origin flow:** `specify`
- **Slot key:** `specify.scope.code-comments`
- **Input key:** `code_comment_policy`
- **Status:** `resolved`
- **Created:** `2026-10-25T14:21:15.996671+00:00`
- **Resolved:** `2026-10-25T14:21:27.726312+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Which in-code comments does M0 remove?

## Options

- All comments and GRACE markup except //@unknownhero review notes and functional directives
- Only GRACE markup
- Other

## Final answer

Remove all in-code comments and GRACE markup (START_/END_ blocks, contract and module-map comments). Keep every //@unknownhero review note intact until M1 consumes it. Owner note in apps/calculator/src/app.ts:1: 'just remove comments everywhere'.

## Rationale

_(none)_

## Change log

- `2026-10-25T14:21:15.996671+00:00` — opened
- `2026-10-25T14:21:27.726312+00:00` — resolved (final_answer="Remove all in-code comments and GRACE markup (START_/END_ blocks, contract and module-map comments). Keep every //@unknownhero review note intact until M1 consumes it. Owner note in apps/calculator/src/app.ts:1: 'just remove comments everywhere'.")
