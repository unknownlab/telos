# Decision Moment `01M5VPGNSPKKH1F29X1ETP377M`

- **Mission:** `m1-framework-rewrite-01M5T5BT`
- **Origin flow:** `specify`
- **Slot key:** `specify.design.tooling-scope-v2`
- **Input key:** `tooling_scope_v2`
- **Status:** `resolved`
- **Created:** `2026-10-26T08:51:29.206785+00:00`
- **Resolved:** `2026-10-26T08:51:35.133097+00:00`
- **Resolved by:** `owner`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Q13 (revised by D16): Which repository scripts change, and do the M1 code rules apply to them?

## Options

_(none)_

## Final answer

Superseded by the owner's scope decision (telos_scope): telos.ts, scripts/telos.ts and scripts/telos.test.ts are removed; scripts/review-gate.ts, its test and scripts/manifest.test.ts change only to match the new check suite and package list, without applying the M1 code rules to them; scripts/check-bun-version.ts and its test stay unchanged.

## Rationale

_(none)_

## Change log

- `2026-10-26T08:51:29.206785+00:00` — opened
- `2026-10-26T08:51:35.133097+00:00` — resolved (final_answer="Superseded by the owner's scope decision (telos_scope): telos.ts, scripts/telos.ts and scripts/telos.test.ts are removed; scripts/review-gate.ts, its test and scripts/manifest.test.ts change only to match the new check suite and package list, without applying the M1 code rules to them; scripts/check-bun-version.ts and its test stay unchanged.")
