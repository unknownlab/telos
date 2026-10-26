# Decision Moment `01M5VPFH0JS3YQVS2TN3RZGWTC`

- **Mission:** `m1-framework-rewrite-01M5T5BT`
- **Origin flow:** `specify`
- **Slot key:** `specify.design.telos-scope`
- **Input key:** `telos_scope`
- **Status:** `resolved`
- **Created:** `2026-10-26T08:50:51.538504+00:00`
- **Resolved:** `2026-10-26T08:51:04.725694+00:00`
- **Resolved by:** `owner`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

D16: What is Telos, and which framework features stay?

## Options

_(none)_

## Final answer

Owner: Telos is just the root Locus generator. Locus.root(...) starts from one Locus; makeChild() creates nested Loci to unlimited depth with two-way parent and child links. The calculator is a root Locus whose additional API (arithmetic, command line, web form model, agent tools, Rules) is added by plain functional extension inside the app. No check or verification features: no model verification, model diagnostics, closure, cycle check, digests or model diff; consistency comes from construction. No repository-level model: telos.ts, scripts/telos.ts and the bun run telos commands are removed. Rules stay as the calculator's tests and run as a check suite step.

## Rationale

_(none)_

## Change log

- `2026-10-26T08:50:51.538504+00:00` — opened
- `2026-10-26T08:51:04.725694+00:00` — resolved (final_answer="Owner: Telos is just the root Locus generator. Locus.root(...) starts from one Locus; makeChild() creates nested Loci to unlimited depth with two-way parent and child links. The calculator is a root Locus whose additional API (arithmetic, command line, web form model, agent tools, Rules) is added by plain functional extension inside the app. No check or verification features: no model verification, model diagnostics, closure, cycle check, digests or model diff; consistency comes from construction. No repository-level model: telos.ts, scripts/telos.ts and the bun run telos commands are removed. Rules stay as the calculator's tests and run as a check suite step.")
