# Telos Instructions

## How to apply the Telos framework to your company

*Read after `TELOS_FRAMEWORK.md`. This document is prescriptive: it tells you what to do and in what order. For the theory underneath, consult the Framework. For plain-English orientation, see `USER_GUIDE.md`. For lookup, see `TELOS_REFERENCE.md` and `TELOS_GLOSSARY.md`.*

---

## Preface

These instructions assume you have read the Framework and understand the primitives. They tell you how to put the framework to use in a real company, whether large or small.

The steps below can be performed by a single person declaring Telos for a small team, by a leadership group rolling out Telos to an enterprise, or by the Telos team itself declaring Telos on Telos.

The steps are sequential but the work is iterative. Expect to return to earlier steps as you learn.

---

## Step 1 — Pick one real goal

Do not start with "adopt Telos company-wide." Start with one goal. The goal should be:

- **Real.** Something the company actually wants. Not a demo.
- **Concrete.** Has a number: "reduce churn from 5% to 3%," not "improve customer experience."
- **Time-bounded.** Has a deadline.
- **Uncertain.** Worth using Telos for. If you already know how to achieve it deterministically, use a simpler tool.

Write the goal as a target distribution:

> *Retention ≥ 80% by end of Q4, with probability ≥ 70%.*

Or, for a Vision-level goal:

> *A company where every employee can see how their work connects to business outcomes.*

## Step 2 — Pick a methodology

Choose from the built-in library:

- **OKR** — for a goal hierarchy across many teams.
- **Impact Mapping** — to decompose a goal by who-changes-how.
- **JTBD** — if the goal is about understanding real customer needs.
- **OST** — if the goal is full of uncertain hypotheses that need experiments.
- **Lean** — for continuous improvement of an existing process.
- **Kanban** — for execution flow across parallel work.

You can combine methodologies. A common pattern:

- **OKR** at the top: company Objective → team Key Results.
- **Impact Mapping** in the middle: Key Result → actor → behavior → deliverable.
- **Kanban** at the bottom: deliverables flow through parallel execution lanes.

If none of the built-in methodologies fits, declare a custom one (see Framework §38). A custom methodology is a Process template; document it as such.

## Step 3 — Decompose the goal into a tree

Apply the chosen methodology. The output is a tree:

- **Root**: the goal.
- **Internal nodes**: sub-goals.
- **Leaves**: processes ready to run.

Every node is itself a Process. Even the decomposition is a Process — "form the goal tree" — with its own contract ("produce a tree of depth N covering actors A, B, C by date D") and evidence ("here is the tree").

## Step 4 — Assign actors

For every process in the tree, assign:

- **Accountable Actor.** Exactly one. Who owns the outcome.
- **Executing Actors.** Zero or more. Who does the work.
- **Tools.** Zero or more. Capabilities used during execution.
- **If an agent is an executing actor: the Autonomy Level.** L0, L1, L2, or L3, based on proven reliability in this kind of work.

Default the autonomy level low (L0 or L1) when in doubt. Promotion comes later, based on evidence.

## Step 5 — Declare contracts

For every process, declare its Contract:

- **Expected output distribution.** "Engagement rises 5% on average, with standard deviation 2%."
- **Tolerance.** "We accept results within ±2% of expected."
- **Conditions.** "Contract holds if list size ≥ 10,000 customers."
- **Deadline.** "By day 30."
- **Verification method.** "Check via metric M over the last 7 days."

A contract without numbers is not a contract. A contract that cannot be checked empirically is not a contract. A contract written after execution is not a contract.

## Step 6 — Declare requirements, invariants, and scope

Separate from per-process contracts, declare what must hold across the whole tree:

- **Requirements.** Hard constraints for this particular initiative. "Must be GDPR compliant."
- **Invariants.** Laws of the system. "Customer data never leaves the EU."
- **Scope.** What is in, what is out. "We do B2B SaaS. We do not go B2C."

Any process whose contract would violate a Requirement or Invariant is rejected at declaration time.

## Step 7 — Execute in parallel

Run the processes. In parallel. Do not force sequential execution unless a Dependency demands it.

Processes run under their actors:

- **Agents** execute per their autonomy level (L0 = tool calls, L1 = suggestions for human review, L2 = checkpoint approvals, L3 = autonomous).
- **Humans** execute their assigned work.
- **External systems** are invoked per their declared interfaces.

## Step 8 — Collect evidence

As processes complete, the harness collects evidence of the declared kinds:

- **Mechanical (Proof)** — tests, type-checks.
- **Witnessed** — event logs.
- **Signaled** — metric thresholds.
- **Attested** — sign-offs.

Evidence is stored with its grade and provenance.

## Step 9 — Verify contracts

For every completed process, check:

- Did the outcome match the expected distribution within tolerance?
- If yes → **Verified.** Record a positive Fact.
- If no → **Violated.** Record a negative Fact.

Violation is not failure in the blame sense. It is learning signal.

## Step 10 — Handle failures

When a contract is Violated, a process is Cancelled, or a process Fails, act according to the parent's failure policy:

- **Continue** if the parent's own contract tolerates the shortfall.
- **Compensate** via a pre-declared compensation process (saga).
- **Re-negotiate** the contract and retry.
- **Cancel** upward.

## Step 11 — Analyze

Analysis is itself a Process, with its own contract. Examples:

- "Compute the reliability of each leaf process over the past 90 days."
- "Identify the weakest link in the goal tree."
- "Compare actor performance across similar processes."

Analysis produces Facts that feed improvement.

## Step 12 — Improve

Improvement is itself a Process. Examples:

- "Refactor the goal tree based on analysis."
- "Reassign an underperforming actor."
- "Promote agent A from L1 to L2, based on 95% reliability over 3 months."
- "Demote agent B from L3 to L2 after 3 consecutive violations."
- "Swap methodology from OKR + Impact Mapping to OKR + OST because hypothesis density is too high."

Improvements themselves have contracts: "After this change, we expect X with tolerance Y." Improvements that do not hold their contracts are themselves violations — recorded, analyzed, and potentially reversed.

## Step 13 — Record and expose

Everything is recorded. Every Fact, every Evidence, every contract, every violation, every improvement. With provenance.

An external observer must be able to:

- Clone the record.
- Replay or audit any step.
- Verify any Fact.
- Reconstruct the causal chain from Vision to Contract.

Reproducibility distinguishes Telos from wishful-thinking frameworks. If the record is not reproducible, Telos has not been applied correctly.

---

## Common pitfalls

- **Writing contracts ex-post.** A contract is a commitment made before execution. If written after, it is a retrospective description, not a contract.
- **Skipping tolerances.** A point-value promise in a non-Dirac domain is overclaiming. Include tolerance.
- **Promoting agents without data.** Promotion must be justified by measured reliability, not enthusiasm.
- **Treating Attestations as Proofs.** A sign-off is not a type-check. Use the right epistemic grade.
- **Sequential thinking.** Parallelism is the default. Two processes should run concurrently unless a Dependency is declared.
- **Adding new primitives silently.** If a concept does not reduce to existing primitives, flag it as a gap before extending.
- **Treating autopoiesis as the goal.** It is a consequence. The goal is usefulness.
- **Confusing Actor with Executing Actor.** Accountable Actor owns the outcome; Executing Actors do the work. They may be the same entity or different.

---

## Pre-execution checklist

Before starting execution, verify:

- [ ] One real goal is picked
- [ ] One methodology is chosen (or a combination is declared)
- [ ] Every process has exactly one accountable actor
- [ ] Every process has a contract with numbers
- [ ] Requirements, Invariants, and Scope are explicit
- [ ] Agent autonomy levels are set and justified
- [ ] Evidence collection methods are declared per process
- [ ] Failure policies are declared per process
- [ ] A record store exists for reproducibility

If any box is unchecked, the application is incomplete. Fix before execution.

---

## When to come back

Return to these instructions:

- At the start of every new initiative.
- When outcomes surprise you.
- When a methodology feels wrong.
- When evidence does not match the promises.
- When trust with an agent needs to shift.
- When scope is changing.

These instructions are not a one-time checklist. They are a recurring cycle.

---

*End of instructions.*
