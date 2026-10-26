# Decision Moment `01M5VKNMY3XQBD4BQ5CHTNJPC5`

- **Mission:** `m1-framework-rewrite-01M5T5BT`
- **Origin flow:** `specify`
- **Slot key:** `specify.design.rule-defect-checks`
- **Input key:** `rule_defect_checks`
- **Status:** `resolved`
- **Created:** `2026-10-26T08:01:46.435309+00:00`
- **Resolved:** `2026-10-26T08:01:48.075708+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Q10: How are the checks that a Rule catches its defect kept when Rules are the tests?

## Options

_(none)_

## Final answer

Accepted recommendation: drop the checks whose broken variant the types no longer allow; keep the rest as a calculator Rule group that builds the broken variant through the root and expects the target Rule to fail; Rules get no test files.

## Rationale

_(none)_

## Change log

- `2026-10-26T08:01:46.435309+00:00` — opened
- `2026-10-26T08:01:48.075708+00:00` — resolved (final_answer="Accepted recommendation: drop the checks whose broken variant the types no longer allow; keep the rest as a calculator Rule group that builds the broken variant through the root and expects the target Rule to fail; Rules get no test files.")
