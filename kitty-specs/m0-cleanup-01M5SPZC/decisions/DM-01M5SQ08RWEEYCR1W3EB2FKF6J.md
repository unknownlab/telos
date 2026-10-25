# Decision Moment `01M5SQ08RWEEYCR1W3EB2FKF6J`

- **Mission:** `m0-cleanup-01M5SPZC`
- **Origin flow:** `specify`
- **Slot key:** `specify.scope.ergonomics-test`
- **Input key:** `ergonomics_test_fate`
- **Status:** `resolved`
- **Created:** `2026-10-25T14:21:31.292873+00:00`
- **Resolved:** `2026-10-25T14:34:10.004066+00:00`
- **Resolved by:** `unknownhero`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

apps/calculator/test/ergonomics.test.ts enforces the old NFR-008 size and style limit on the arithmetic definition and finds it through the START_BLOCK_ARITHMETIC_LOCUS markers. Drop the test with the markers, or keep the two markers as the only exception?

## Options

- Drop the test and the markers (recommended)
- Keep the two markers and the test
- Other

## Final answer

Drop the test and the markers: delete apps/calculator/test/ergonomics.test.ts together with the START_BLOCK_ARITHMETIC_LOCUS / END_BLOCK_ARITHMETIC_LOCUS markers; no replacement test.

## Rationale

Owner, relayed by the coordinator: all tests must be part of the App, not outside. From M1 tests become rules inside the app, so M0 adds no replacement.

## Change log

- `2026-10-25T14:21:31.292873+00:00` — opened
- `2026-10-25T14:34:10.004066+00:00` — resolved (final_answer="Drop the test and the markers: delete apps/calculator/test/ergonomics.test.ts together with the START_BLOCK_ARITHMETIC_LOCUS / END_BLOCK_ARITHMETIC_LOCUS markers; no replacement test.")
