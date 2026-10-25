# Decision Moment `01M5SQ08RWEEYCR1W3EB2FKF6J`

- **Mission:** `m0-cleanup-01M5SPZC`
- **Origin flow:** `specify`
- **Slot key:** `specify.scope.ergonomics-test`
- **Input key:** `ergonomics_test_fate`
- **Status:** `deferred`
- **Created:** `2026-10-25T14:21:31.292873+00:00`
- **Resolved:** `2026-10-25T14:21:39.989456+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

apps/calculator/test/ergonomics.test.ts enforces the old NFR-008 size and style limit on the arithmetic definition and finds it through the START_BLOCK_ARITHMETIC_LOCUS markers. Drop the test with the markers, or keep the two markers as the only exception?

## Options

- Drop the test and the markers (recommended)
- Keep the two markers and the test
- Other

## Final answer

_(none)_

## Rationale

Specify runs as a subagent without direct owner contact; the coordinator relays this question to the owner before plan.

## Change log

- `2026-10-25T14:21:31.292873+00:00` — opened
- `2026-10-25T14:21:39.989456+00:00` — deferred
