# Decision Moment `01M5VKMWAEV7RQNF7BYWQZ4ANJ`

- **Mission:** `m1-framework-rewrite-01M5T5BT`
- **Origin flow:** `specify`
- **Slot key:** `specify.design.error-explanation`
- **Input key:** `error_explanation`
- **Status:** `resolved`
- **Created:** `2026-10-26T08:01:21.230533+00:00`
- **Resolved:** `2026-10-26T08:01:22.770944+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Q2: How should an error carry its human explanation (owner note: message is too general a name)?

## Options

_(none)_

## Final answer

Accepted recommendation: each error kind defines its own explanation as part of its definition; no generic message field in developer-facing types; external output still prints it as message.

## Rationale

_(none)_

## Change log

- `2026-10-26T08:01:21.230533+00:00` — opened
- `2026-10-26T08:01:22.770944+00:00` — resolved (final_answer="Accepted recommendation: each error kind defines its own explanation as part of its definition; no generic message field in developer-facing types; external output still prints it as message.")
