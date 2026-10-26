# Decision Moment `01M5VPGQPZK2SGP7KCE6S4MPT6`

- **Mission:** `m1-framework-rewrite-01M5T5BT`
- **Origin flow:** `specify`
- **Slot key:** `specify.design.state-machine-flows-v2`
- **Input key:** `state_machine_flows_v2`
- **Status:** `resolved`
- **Created:** `2026-10-26T08:51:31.167676+00:00`
- **Resolved:** `2026-10-26T08:51:37.088077+00:00`
- **Resolved by:** `owner`
- **Opened by:** `cli`
- **Other answer:** `false`

## Question

Q4 (revised by D16): Which flows are finite state machines, and where do they live?

## Options

_(none)_

## Final answer

The capability invocation lifecycle (decode, run, encode, then done or failed) and the Rule run lifecycle (pending, running, then passed, failed or error) are finite state machines with effect-machine, in the calculator; the command-line run uses the invocation machine; arithmetic stays pure functions; machines hold only states, events and transitions. The resolve and authorize steps of the first answer are gone, and the machines live in the calculator, not the kernel.

## Rationale

_(none)_

## Change log

- `2026-10-26T08:51:31.167676+00:00` — opened
- `2026-10-26T08:51:37.088077+00:00` — resolved (final_answer="The capability invocation lifecycle (decode, run, encode, then done or failed) and the Rule run lifecycle (pending, running, then passed, failed or error) are finite state machines with effect-machine, in the calculator; the command-line run uses the invocation machine; arithmetic stays pure functions; machines hold only states, events and transitions. The resolve and authorize steps of the first answer are gone, and the machines live in the calculator, not the kernel.")
