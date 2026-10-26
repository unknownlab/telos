# Decision Moment `01M5VKMS91ES0D71Y5X0X91TGK`

- **Mission:** `m1-framework-rewrite-01M5T5BT`
- **Origin flow:** `specify`
- **Slot key:** `specify.design.external-format`
- **Input key:** `external_format`
- **Status:** `resolved`
- **Created:** `2026-10-26T08:01:18.113666+00:00`
- **Resolved:** `2026-10-26T08:01:19.689373+00:00`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Q1: Should the calculator's external output (JSON on stdout/stderr, exit codes 0/1/2, flags --a/--b, MCP structuredContent, Locus names, server name) stay as it is?

## Options

_(none)_

## Final answer

Accepted recommendation: keep the external format byte-identical; a codec maps internal symbols and full names to the current external names. Renaming external names is a later, separate mission.

## Rationale

_(none)_

## Change log

- `2026-10-26T08:01:18.113666+00:00` — opened
- `2026-10-26T08:01:19.689373+00:00` — resolved (final_answer="Accepted recommendation: keep the external format byte-identical; a codec maps internal symbols and full names to the current external names. Renaming external names is a later, separate mission.")
