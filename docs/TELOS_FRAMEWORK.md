# The Telos Framework

## A methodology for goal-oriented companies in a probabilistic world

**Version 0.2 (2026-04-19). This document is the canonical methodology of Telos. It supersedes any informal description found elsewhere and all prior versions.**

---

## Preface

### What this document is

This document defines the Telos Framework: a methodology for running companies that operate in a probabilistic world — which is every real company. It covers the framework's principles, its primitive types, its purity semantics, its process model, its contract and evidence models, its actor model, its methodology layer, its execution semantics, its reflexivity, and its conformance criteria.

This document is normative. Implementations claiming to be Telos MUST satisfy the conformance clauses of Part XI. Extensions that introduce new concepts MUST reduce to the primitive system, or be flagged as a genuine gap before being added.

### Who it is for

- Teams building Telos
- Teams implementing workflows in Telos
- Teams evaluating whether Telos fits their problem
- Future sessions on Telos

For a plain-English orientation, see `USER_GUIDE.md`. For design rationale (why these decisions were made), see `SESSION_ZERO.md`. For current status, see `NEXT_STEPS.md`. For a quick reference of primitives and rules, see `TELOS_REFERENCE.md`. For term definitions, see `TELOS_GLOSSARY.md`. For applying Telos to a real company step by step, see `TELOS_INSTRUCTIONS.md`.

### How to read it

The document is divided into eleven numbered Parts plus preliminaries and versioning:

- **§1–§3 Preliminaries** — Scope, Normative references, Terms and definitions (ISO-style).
- **Part I — Foundations** establishes the principles and presents the Big Picture.
- **Part II — The Primitive System** defines the types.
- **Part III — Telos-Purity** defines function purity in a probabilistic world (with worked examples).
- **Part IV — The Process Model** defines how processes are structured.
- **Part V — The Contract Model** defines how promises are declared and verified.
- **Part VI — The Evidence Model** defines how outcomes are recorded.
- **Part VII — The Actor Model** defines who participates and how.
- **Part VIII — The Methodology Layer** defines how methodologies plug in.
- **Part IX — Execution Semantics** defines how the harness runs processes.
- **Part X — Reflexivity** defines how Telos applies to itself.
- **Part XI — Conformance** defines what "being Telos" requires.
- **Revision history, stability tiers, and deprecation policy** close the document.

Read linearly the first time. After that, use `TELOS_REFERENCE.md` and `TELOS_GLOSSARY.md` for lookup.

### Conventions

Technical terms are **bolded** on first use. Code-like identifiers are in `monospace`. Non-normative commentary appears in blockquotes.

**Normative keywords.** The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described in IETF RFC 2119 when, and only when, they appear in all capitals. These keywords are used sparingly and carry full normative weight:

- **MUST** / **SHALL** / **REQUIRED** — absolute requirement.
- **MUST NOT** / **SHALL NOT** — absolute prohibition.
- **SHOULD** / **RECOMMENDED** — strong recommendation; deviations require documented justification.
- **SHOULD NOT** / **NOT RECOMMENDED** — behaviour discouraged unless circumstances warrant and are documented.
- **MAY** / **OPTIONAL** — a genuinely optional feature or behaviour.

---

## §1. Scope

The Telos Framework specifies a methodology for running goal-oriented companies in a probabilistic world.

It **defines**:

- A universal primitive (Process) for all state-changing activity within the host company.
- A type system: specification (Goal, Requirement, Contract, Invariant), observation (Signal → … → Proof), relations (Dependency, Provenance, Ownership, Causation), and time (Moment, Interval, Cadence, Deadline).
- A definition of function purity adapted to uncertainty (Telos-purity).
- A four-level autonomy spectrum for AI agents.
- A methodology layer for composing proven organizational practices as process templates.
- Execution semantics for a harness that hosts the framework's processes.
- Conformance criteria for implementations.

It **does not define**:

- A concrete declaration syntax for the `.telos/` directory. Implementations MAY choose YAML, JSON, a custom DSL, or an embedded DSL in a host programming language.
- A concrete storage or persistence model.
- A concrete execution runtime.
- Human-resources, legal, financial, or regulatory policies of the host company.
- Visual or user-interface conventions beyond the Big Picture diagram in §4.1.
- The internal content of any specific methodology (OKR, Impact Mapping, JTBD, OST, Lean, Kanban). These live in the methodology library; this Framework defines the layer above.

---

## §2. Normative references

The following documents are referenced in this Framework in such a way that some or all of their content constitutes requirements of this document. For dated references, only the cited edition applies.

- **IETF RFC 2119** (Bradner, 1997). *Key words for use in RFCs to Indicate Requirement Levels.*
- **Pearl, J.** (2009). *Causality: Models, Reasoning, and Inference.* 2nd ed. Cambridge University Press. — basis for causal purity (§14).

No other external document is referenced normatively.

---

## §3. Terms and definitions

For the purposes of this document, the following terms and definitions apply. Terms are listed in the order they are first used substantively. An alphabetical superset of these terms lives in `TELOS_GLOSSARY.md`; the list below is the normative subset internal to this Framework.

1. **Process** — any state-changing activity. The universal primitive of Telos.
2. **Actor** — a participant in a Process with accountability for its outcome.
3. **Tool** — a capability invoked by an Actor; has no accountability and no contract of its own.
4. **State** — a belief distribution over values together with provenance.
5. **Accountable Actor** — the single Actor owning the outcome of a Process.
6. **Executing Actor** — an Actor performing the work of a Process; may differ from the Accountable Actor.
7. **Sub-actor** — an Actor invoked by another Actor, possessing its own Contract on the invocation (distinguishing it from a Tool).
8. **Autonomy level** — a Process-local classification of an AI agent Actor on the L0–L3 spectrum.
9. **Goal** — a target distribution with tolerance; a Specification primitive.
10. **Goal.Vision / Mission / Strategic / Tactical / Operational** — Goal subtypes by horizon.
11. **Requirement** — a hard constraint, non-negotiable; a Specification primitive.
12. **Contract** — a per-Process probabilistic promise declared ex-ante; a Specification primitive.
13. **Invariant** — a statement that MUST hold across all states; a Specification primitive.
14. **Scope** — a set of Requirements of the form "we do X / we do not do Y"; a composite.
15. **Signal** — a raw observation; an Observation primitive.
16. **Event** — a discrete structured occurrence; an Observation primitive.
17. **Metric** — an aggregation of Signals or Events; an Observation primitive.
18. **Metric.Leading / Metric.Lagging / Metric.Balancing** — canonical Metric subtypes (early indicator / terminal indicator / collateral-damage guard).
19. **Fact** — an Observation persisted in history.
20. **Evidence** — a Fact carrying an epistemic level (Witnessed, Signaled, Attested, or Mechanical).
21. **Proof** — Evidence at the Mechanical level; mechanically re-derivable.
22. **Attestation** — the family comprising both Proof and Evidence.
23. **Causal mechanism** — the declared reason why a Contract is expected to hold; the "because" of the intervention.
24. **Dependency** — a Relation: Process X requires Process Y's output before it runs.
25. **Provenance** — a Relation: a Fact was produced by a specific Process run.
26. **Ownership** — a Relation: an Actor is accountable for a Goal or Process.
27. **Causation** — a Relation: X causally influences Y in the Pearl sense.
28. **Moment / Interval / Cadence / Deadline** — Time primitives.
29. **Telos-purity** — the four-condition definition of workflow purity in a probabilistic world.
30. **Harness** — the runtime of Telos; Telos itself.
31. **Methodology** — a process template (a prescribed decomposition of a Goal into a Process tree).
32. **Conformance class** — one of Class A (Core), Class B (Standard), Class C (Full).

---

## Part I: Foundations

### §4. What Telos is

**Telos is a substrate that gives proven organizational methodologies three things they do not have today: mathematical rigor for uncertainty, AI-native executability, and the ability to improve themselves.**

Telos does not invent new methodologies. It provides the layer underneath proven methodologies — OKR, Impact Mapping, JTBD, OST, Lean, Kanban, and others — that makes them:

- **Composable.** Teams do not pick one methodology; they combine.
- **Measurable with explicit uncertainty.** Every commitment is stated with probabilities and tolerances, not gut feelings.
- **AI-native.** Agents are first-class participants, not assistants.
- **Self-improving.** The framework treats improvement as a process.

Telos is an operating system in the functional sense: it hosts processes that change state. It is not an operating system in the hardware sense.

#### §4.1. The Big Picture

```
╔══════════════════════════════════ HARNESS (Telos) ═══════════════════════════════════╗
║                                                                                       ║
║   ╔══════ GOAL TREE ══════╗                                                           ║
║   ║                        ║                                                          ║
║   ║  Vision                ║                                                          ║
║   ║   └─ Mission (opt)     ║                                                          ║
║   ║      └─ Strategic      ║ ──── decomposed via ──► METHODOLOGY                      ║
║   ║         └─ Tactical    ║                         (OKR / Impact Mapping /          ║
║   ║            └─ Operational                        JTBD / OST / Lean / Kanban /     ║
║   ║               │        ║                         custom)                          ║
║   ╚═══════════════│════════╝                                                          ║
║                   ▼                                                                   ║
║             ┌─ CONTRACT ──────── guarded by ──► Requirements │ Invariants │ Scope     ║
║             │  • expected distribution                                                ║
║             │  • tolerance                                                            ║
║             │  • conditions                                                           ║
║             │  • causal mechanism   ← WHY it should hold                              ║
║             │  • verification method                                                  ║
║             │  • deadline                                                             ║
║             │                                                                         ║
║             ▼                                                                         ║
║       ┌─ PROCESS ─────── executed by ─── Actor(s) ── at Autonomy Level (L0–L3)        ║
║       │   • 1 Accountable Actor                                                       ║
║       │   • 0..n Executing Actors        Actor types: team, user, agent, system,      ║
║       │   • 0..n Tools                                 another Process                ║
║       │                                                                               ║
║       ▼                                                                               ║
║   EVIDENCE ─ graded ─ {Mechanical = Proof | Witnessed | Signaled | Attested}          ║
║       │                                                                               ║
║       ▼                                                                               ║
║   FACT (positive or negative) ── carries Provenance ──► STATE                         ║
║                                                         (belief distribution +        ║
║                                                          provenance)                  ║
║                                                                                       ║
║   ◄── ANALYSIS · IMPROVEMENT · PROMOTION / DEMOTION processes operate on the tree    ║
║       reflexively, using the same primitives.                                        ║
║                                                                                       ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

Flow: Goal → Contract (ex-ante) → Process execution → Evidence collection →
      Fact (ex-post) → State update.
```

### §5. The probabilistic world principle

**Companies do not operate in a deterministic world.**

The state of a company — its code, its team, its market, its finances, its infrastructure, its brand — is not fully observable. Even fully-observable components evolve under forces that are themselves uncertain. Any framework that models company state as a value rather than a belief distribution over values is lying about the world it operates in.

Telos rejects the deterministic framing. Implementations MUST adopt:

- **State as a distribution**, with provenance.
- **Workflows as interventions** on distributions, not functions on values.
- **Outcomes as Facts** with explicit uncertainty, not guarantees.
- **Determinism as a degenerate case** (a Dirac distribution) of probability, not a separate world.

This principle cascades into every downstream decision (see Part III).

### §6. The everything-is-process principle

**Anything that changes state is a Process.**

This includes:

- Forming a goal
- Choosing a methodology
- Executing an action
- Collecting a metric
- Running an analysis
- Improving another process
- Making a decision
- Changing scope
- Promoting an agent along the autonomy spectrum

There is no "prelude" to a Telos-managed company that is not a process, nor a "postlude." It is processes all the way down.

This principle gives Telos its reflexivity (Part X). It also simplifies the framework: there is only one kind of thing that changes state, and it has one kind of shape (Actor + Contract + Evidence).

### §7. The reflexivity principle

**Telos manages its own operation through the same primitives it manages any company's work.**

The work of building, maintaining, and evolving Telos is a set of processes. Telos has its own `.telos/` declaration. Telos's own goals are subject to the same contract and evidence system. Telos improvements are themselves managed by Telos.

Reflexivity is not the same as autopoiesis. Autopoiesis — building Telos with Telos — is an emergent consequence of reflexivity once Telos is mature enough to host its own development. Autopoiesis is NOT the goal of Telos; usefulness is.

### §8. The five dimensions of novelty

Telos is not "existing tools plus AI." Five genuine novelties distinguish it:

- **Unified primitive.** Existing tools cover subsets of company motion. Telos unifies all state-changing activity under Process.
- **Probabilistic contracts.** Ex-ante declaration of expected distributions with explicit causal mechanisms, ex-post verification. No existing B2B tool does this at company scale.
- **Agents on an autonomy spectrum.** Agents are participants whose accountability grows with proven reliability (L0–L3).
- **Reflexivity.** The framework applies to itself.
- **Harness-first.** Products built from day one to be operable by typed workflows. Third wave after code-first and spec-first.

Comparisons between Telos and existing tools SHOULD be made along these axes, not by feature enumeration.

---

## Part II: The Primitive System

Every concept in Telos reduces to the primitives defined in this Part. Composite concepts (Decision, Hypothesis, Experiment, Risk, Knowledge, KPI, SLA, Asset, Document) are built from these; they are not primitive and MUST be expressible as compositions.

The primitives are organized in six levels. Each level builds on the previous.

### §9. Core primitives

The core consists of four primitives: Process, Actor, Tool, State.

- **Process.** Any state-changing activity. Processes have a lifecycle (Part IV), MAY contain sub-processes, and produce Evidence. Every Process MUST have exactly one Accountable Actor.
- **Actor.** A participant with accountability. Actors are of five types: team member, system user (customer or end-user of a product), LLM agent, external system (CRM, SaaS, infrastructure), and another Process.
- **Tool.** A capability invoked by an Actor. A Tool has no accountability; its invocation is absorbed into the invoking Actor's Process, and its outputs belong to the invoker.
- **State.** The condition of something, modeled as a belief distribution over values, together with provenance (which Evidence formed the belief).

**The distinguishing rule: accountability separates Actor from Tool.** If the entity is accountable for the outcome, it is an Actor. If the invoker retains accountability, the entity is a Tool. The same entity — a human, an agent, a system — MAY play either role in different contexts. Role is a property of *this participation in this process*, not of the entity's identity.

A **sub-actor** differs from a tool by having its own Contract on the invocation. Tools MUST NOT carry a Contract; sub-actors MUST.

### §10. Autonomy spectrum (for AI agents)

When the Executing Actor is an AI agent, the agent sits on a four-level autonomy spectrum:

| Level | Name | Accountable | Role of the human |
|---|---|---|---|
| L0 | Tool | Human | Invokes directly |
| L1 | Semi-agent, human-led | Human | Reviews every decision |
| L2 | Semi-agent, agent-led | Agent | Approves at checkpoints |
| L3 | Autonomous | Agent | Only on escalation or failure |

**The agent's autonomy level is a property of the Process, not of the agent.** The same agent MAY be L0 in one Process and L3 in another, according to how much the Process owners trust it in that context.

**Movement along the spectrum is itself a Process** (promotion or demotion), with its own Contract and Evidence. The Evidence justifying promotion MUST be the agent's measured reliability at the current level; the Evidence justifying demotion MUST be contract violations or context change.

Trust in agents is data-driven, not political.

### §11. Specification family

Four primitives declare what should be:

- **Goal** — what the Actor wants to achieve. A target distribution with tolerance and (optionally) a deadline. Goals MAY be missed.
- **Requirement** — what MUST hold. A hard constraint, non-negotiable. Requirements MAY be changed only through an explicit process (which itself produces a new Requirement).
- **Contract** — a per-process promise, declared ex-ante. The operational form of a Goal.
- **Invariant** — always true, across all states. A system law. Invariants MUST NOT be broken; a Process whose Contract would break an Invariant MUST be rejected at Contract declaration.

**Scope** is not a primitive. It is a set of `Requirement`s of the form "we do X / we do not do Y". Changes to scope are themselves processes with their own Contracts and Evidence.

Goals decompose vertically:

```
Goal.Vision       → decades, direction (not point target)
  ↓ generates
Goal.Mission      → purpose, ongoing (optional)
  ↓ informs
Goal.Strategic    → 1–3 years, company level
  ↓ decomposes
Goal.Tactical     → quarter, team level
  ↓ decomposes
Goal.Operational  → weeks, process level
  ↓ leads to
Contract          → per-process promise
```

**Goal.Vision** is a subtype of Goal with `horizon=indefinite`, `shape=direction` (not a point target), and qualitative measurement. Its role is to generate other goals, not to be achieved in the ordinary sense.

### §12. Observation family

Six primitives observe what is:

- **Signal** — raw observation. Example: `"page loaded in 230 ms"`.
- **Event** — discrete occurrence with structure. Example: `"user_signup at T with attributes A"`.
- **Metric** — aggregation of Signals or Events. Example: `"average load this week = 240 ms"`.
- **Fact** — observation persisted in history. A point in system history.
- **Evidence** — Fact + epistemic level. Levels: `Witnessed` (logged), `Signaled` (metric threshold), `Attested` (sign-off), `Mechanical` (equivalent to Proof).
- **Proof** — Evidence at the `Mechanical` level. A test passed, a type-check accepted, a cryptographic verification.

#### §12.1. Metric subtypes

The `Metric` primitive has three canonical subtypes:

- **Metric.Leading** — an early indicator measurable during execution, correlated with the eventual outcome.
- **Metric.Lagging** — a terminal indicator measured at or after completion, reflecting the actual outcome.
- **Metric.Balancing** — a metric held approximately constant, selected to detect whether optimizing a Leading or Lagging metric has caused collateral damage elsewhere.

Every Contract SHOULD declare at least one Leading or Lagging metric for verification. Every Contract whose execution carries a material risk of collateral damage SHOULD declare one or more Balancing metrics.

The Observation hierarchy flows from raw to structured. Each level builds from the previous. Processes produce Evidence; whether positive (Contract held) or negative (Contract violated), the outcome is itself a Fact.

### §13. Relations

- **Dependency** — Process X requires the output of Process Y before it can run.
- **Provenance** — this Fact was produced by this specific Process run.
- **Ownership** — this Actor is accountable for this Goal or Process.
- **Causation** — X causally influences Y (in the Pearl sense — used for causal purity in Telos-purity).

### §14. Time

- **Moment** — a point in time.
- **Interval** — duration between two moments.
- **Cadence** — recurring pattern (daily, weekly, quarterly).
- **Deadline** — a moment by which something MUST be true.

### §15. Composite concepts (what is NOT primitive)

Things that may look like primitives but are composites. Before adding a new concept, authors MUST verify it reduces:

- **Decision** = Fact + Ownership + context.
- **Hypothesis** = unverified Contract.
- **Experiment** = Process that tests a Hypothesis.
- **Risk** = distribution with a tail in undesirable outcomes.
- **Knowledge** = consolidated Facts.
- **Asset** = State with a long lifespan.
- **Document** / **Spec** = human-readable wrapper around Goal / Requirement / Invariant.
- **KPI** = Metric flagged "important."
- **SLA** / **SLO** = Contract on system behavior.

If a new concept does not reduce to primitives, it is a **conceptual gap**. Authors MUST NOT silently extend the vocabulary. The gap MUST be flagged, analyzed, and either shown to reduce or proposed as a principled extension via the amendment process (§56).

---

## Part III: Telos-Purity

### §16. Purity in a probabilistic world

Classical functional programming defines a pure function as one that, given the same input, returns the same output, with no side effects and no hidden dependencies. This definition assumes a deterministic world.

Telos operates in a probabilistic world. A workflow's output is not a value but a distribution. Same input → same distribution (same expected value, same variance, same higher moments). Purity must be redefined.

**A workflow is Telos-pure if and only if all four of the following conditions hold simultaneously.**

### §17. The four conditions

**(1) Monadic purity (Kleisli).** Given the same input distribution, the workflow MUST produce the same output distribution. Randomness lives in the output, not in the function. Composition is monadic bind over a probability monad.

> *Formally: a workflow `f` is monadically pure if, for any two runs with identical input distribution `D`, the two output distributions `f(D)` are identical in the metric of interest (total variation, KL, Wasserstein — application-specific).*

**(2) Causal purity (Pearl).** The workflow's effect MUST pass only through its declared inputs and its declared mechanism. There MUST be no hidden causal side channels. The workflow is an *intervention* (`do`-operator in Pearl's causal calculus), not an observation.

> *A workflow that reads from a global cache, mutates an unlisted service, or depends on ambient process state is not causally pure. A workflow that declares all its inputs, all its outputs, and the mechanism of transformation is.*

**(3) Contractual declaration.** The workflow MUST declare its probabilistic Contract before execution: expected output distribution, tolerances, conditions under which the Contract holds, causal mechanism, and verification method.

> *A Contract inferred from past runs without explicit declaration does not count. Ex-ante declaration is required.*

**(4) Empirical verifiability.** The declared Contract MUST be checked at execution time. Either it holds within tolerance (positive Fact) or it is violated (negative Fact). Either outcome MUST be recorded.

> *A workflow whose Contract cannot be checked empirically — producing only untestable outputs, or whose tolerance is so wide as to be trivially satisfied — is not verifiable.*

**All four conditions MUST hold simultaneously.** Missing any one means the workflow is not Telos-pure.

### §18. Composition rules

Composition of Telos-pure workflows obeys:

- **Monadic composition.** If `f` and `g` are monadically pure, their Kleisli composition `g ∘ f` is monadically pure.
- **Causal composition.** Composition preserves causal purity only if the declared mechanisms compose cleanly; no new hidden channels MUST emerge.
- **Contract composition.** The composite's Contract is NOT simply the conjunction of child Contracts. The composite MUST declare its own Contract, with its own tolerance; child Contracts feed verification of that Contract.
- **Evidence composition — the weakest link.** If any child produced Evidence (rather than Proof), the composite's evidence MUST also be Evidence, graded at the weakest child's level. Proof MUST NOT emerge from Evidence inputs.

### §19. The Dirac case

Deterministic workflows are Telos-pure: they correspond to Dirac distributions, where all probability mass is on a single outcome. Classical FP purity is the Dirac case of Telos-purity.

The Dirac case applies to:

- Code type-checks
- Cryptographic operations
- Pure mathematical computation
- Idempotent API calls with well-defined semantics

Outside these domains, workflows MUST be modelled as probabilistic. If the domain genuinely is Dirac, the four conditions reduce to the classical FP formulation.

### §20. Worked examples

The following five examples illustrate Telos-purity. The first is compliant; the next four each fail exactly one of the four conditions.

#### §20.1. Compliant example — weekly re-engagement campaign

**Process:** "Send a re-engagement email to dormant customers, aiming to restore engagement."

**Declaration (ex-ante):**
- **Inputs:** snapshot of the dormant-customer list (list `L`, taken at Monday 00:00 UTC); approved email template `T`.
- **Actor:** marketing agent at L2; human approves template before send.
- **Contract:**
  - **Expected output distribution:** click-through rate (CTR) rises 5 percentage points (±2 pp) over the 7-day window after send.
  - **Conditions:** `|L| ≥ 10,000`; template `T` previously approved.
  - **Causal mechanism:** dormant users receiving a personalized reminder are more likely to return; this is documented in customer research ("trial users forgot the product after trial lapsed").
  - **Verification method:** CTR metric from the mailing platform, aggregated over 7 days after send.
  - **Deadline:** day 8 after send.

All four conditions hold:
1. **Monadic.** Same `L` and `T` → same expected CTR distribution (LLM subject-line generation uses a fixed seed; variance is part of the declared output).
2. **Causal.** The campaign's effect passes only through `L` + `T` → sent email → user click → CTR. No paid ads or Slack nudges to the same segment during the window.
3. **Contractual.** Contract declared before send.
4. **Verifiable.** CTR is measurable via the mailing platform by anyone with access.

**This workflow is Telos-pure.**

#### §20.2. Failing (1) — monadic violation

Same campaign, but the agent calls an LLM without a fixed seed and does not fold the seed variance into the declared distribution. Two runs on the same `L` produce materially different subject lines, different CTRs, different post-state distributions.

Condition 1 fails: same input distribution → different output distributions.

**Remedy.** Fix the seed, or model the seed-induced variance in the declared output distribution (expanding tolerance accordingly).

#### §20.3. Failing (2) — causal violation

Same campaign, compliant in declaration — but mid-week the team also runs a paid ad campaign to the same customer segment, without declaring it as an input. Part of the CTR uplift now comes through the ads, not the email.

Condition 2 fails: the effect passes through an undeclared channel.

**Remedy.** Declare the paid ads as a parallel Process with its own Contract, OR isolate a control segment receiving only email, OR defer one of the interventions.

#### §20.4. Failing (3) — contractual violation

The team runs the campaign, observes the CTR, and writes afterwards: "we expected CTR to rise and it did." No numbers, no tolerance, no pre-declaration.

Condition 3 fails: this is a retrospective description, not a Contract.

**Remedy.** Declare the expected distribution, tolerance, conditions, causal mechanism, verification method, and deadline — before execution.

#### §20.5. Failing (4) — verifiability violation

The Contract says "engagement will improve." No metric is named, no threshold specified, no window defined.

Condition 4 fails: no empirical check is possible.

**Remedy.** Name the metric (`CTR`), the threshold (`+5 pp`), the tolerance (`±2 pp`), and the window (`7 days post-send`).

---

## Part IV: The Process Model

### §21. Process lifecycle

A Process MUST be in exactly one of the following states:

- **Declared.** Contract is written but execution has not begun.
- **Running.** Execution has begun; Contract not yet verified.
- **Verified.** Execution completed; Contract held within tolerance.
- **Violated.** Execution completed; Contract did not hold.
- **Cancelled.** Execution halted from above (by a parent Process or external signal).
- **Failed.** Execution halted by an internal error.

Transitions between states are themselves Facts and MUST be recorded.

### §22. Process composition

Processes compose in three ways:

- **Sequential.** Process B starts when Process A completes. Expressed via Dependency.
- **Parallel.** Processes A and B run simultaneously, without dependency.
- **Nested.** Process A contains Process B as a sub-process. A cannot complete until B completes (or is cancelled).

Composition rules:

- A Process's lifecycle MUST be independent of its siblings', except through declared Dependencies.
- A parent's termination (cancellation, failure) MUST gracefully handle its children. The default is to cancel them; a compensating process MAY be invoked.

### §23. Parallelism

Parallelism SHALL be the default. Processes MUST NOT wait for siblings unless a Dependency is declared.

This matches reality: in a company, multiple initiatives run concurrently. Telos models this natively rather than forcing sequential ceremony.

### §24. Failure, cancellation, compensation

A Process MAY terminate in three non-success ways: Violated, Cancelled, Failed. Each MAY trigger a **compensation process** — a Process that undoes, alters, or redirects the effects of the failed parent. Compensations are themselves processes with their own Contracts and Evidence.

The **Saga pattern** applies: if a multi-step Process is partially completed when a step fails, a compensation chain SHOULD reverse or substitute for the completed steps.

### §25. Dependencies

Dependencies MUST be explicit. A Dependency of B on A means:

- B's declaration MUST include A as a required input.
- B MUST NOT run until A is Verified.
- If A is Violated, Cancelled, or Failed, B's behavior MUST be defined by its fallback declaration.

Implicit dependencies MUST NOT be used; they violate causal purity.

---

## Part V: The Contract Model

### §26. Contract declaration

A Contract MUST declare:

- **Expected output distribution.** The shape of the outcome in probability space.
- **Tolerance.** How much deviation from expected is acceptable.
- **Conditions.** The preconditions under which the Contract holds.
- **Causal mechanism.** The declared reason *why* the Contract is expected to hold — the "because" clause. It SHOULD reference the subject's pain/desire, a documented mechanism from prior Evidence, or a testable theoretical model. A Contract lacking a causal mechanism is insufficiently declared; while it MAY still be accepted by the harness in transitional conditions, the harness SHOULD warn.
- **Verification method.** How the Contract is checked (which metrics, events, facts).
- **Duration / deadline.** By when the Contract MUST be verified.

Contracts MUST be declared ex-ante. A Contract written after execution is a retrospective description, not a Contract.

#### §26.1. Optional contract-declaration form

Contracts MAY be written in the following structured form to make the causal mechanism explicit:

> **If** [intervention declared as inputs + action], **then** [expected change], **because** [causal mechanism grounded in observation or theory], **then** [measurable impact on the verification metrics, within tolerance].

This form is a presentation convenience; it does not alter the normative Contract fields.

### §27. Tolerance and probability

A Contract expresses uncertainty in two ways:

- **Tolerance around the expected value.** "Engagement rises 5% ±2%."
- **Probability of achievement.** "This Contract holds with probability ≥ 80%."

Both are first-class. A Contract with no tolerance is Dirac (deterministic) — legitimate only in Dirac domains. A Contract with 100% probability of achievement in a non-Dirac domain is overclaiming and SHOULD be rejected by the harness.

### §28. Ex-ante vs. ex-post

Contracts are declared ex-ante. Verification happens ex-post. The gap between is where honesty lives.

A team that routinely declares wide-tolerance Contracts that "always hold" is gaming the framework. A team that declares tight-tolerance Contracts that routinely violate is not calibrated. **Calibration** — matching declared confidence to actual frequency of holding — is a form of reflexive improvement.

### §29. Contract violation

A violated Contract is a Fact, not a failure in the blame sense. It is learning signal.

A violated child Contract MUST NOT automatically stop the parent. The parent's declared failure policy governs:

- **Continue** if the parent's Contract tolerates the shortfall.
- **Compensate** via a pre-declared compensation process (Saga).
- **Re-negotiate** the Contract and retry.
- **Cancel** upward.

---

## Part VI: The Evidence Model

### §30. Proof and Evidence

Proof and Evidence are both Attestations that a Contract held (or did not). They differ in epistemic strength:

- **Proof** is mechanically checkable. Anyone MAY re-derive the verdict from the artifact without trusting the verifier. Tests, type-checks, cryptographic verifications.
- **Evidence** is not mechanically checkable. It is graded: `Witnessed` (logged), `Signaled` (metric threshold), `Attested` (sign-off).

Treating a sign-off as equivalent to a type-check collapses the epistemic hierarchy and produces false rigor. Implementations MUST distinguish Proof from Evidence.

### §31. Epistemic grading

Evidence grades, from weakest to strongest:

- **Attested.** A responsible party signed off. The signer is the verifier; no independent check.
- **Signaled.** A metric crossed a threshold. Independent check possible (re-read the metric), but the metric MAY be noisy or gameable.
- **Witnessed.** An event was logged. Independent check possible (read the log), assuming the logger is trusted.
- **Mechanical.** A test passed, a type-check accepted, a proof verified. Independently re-derivable. This is Proof.

The ordering is not a strict total order; in some contexts a large corpus of customer surveys (Signaled) outweighs a single CEO sign-off (Attested). The current ordering is a ladder; a future version MAY replace it with a lattice.

### §32. Composition — the weakest link rule

When Evidence is composed (for example, when a parent Contract is verified from child Contracts' Evidence), the composite's epistemic level MUST be the weakest child's.

If any child produced Evidence (rather than Proof), the parent's Attestation MUST also be Evidence, at the weakest child's level. Proof MUST NOT emerge from Evidence inputs. Mechanical rigor does not arise from non-mechanical sources.

### §33. Provenance

Every Fact, every piece of Evidence, every Proof MUST carry **Provenance**: the Process run that produced it. Provenance is a first-class relation. Without it, Evidence cannot be replayed or verified, and the framework's reproducibility property breaks.

---

## Part VII: The Actor Model

### §34. Actor types

Five Actor types:

- **Team member.** Employee, contractor, or other human inside the company.
- **System user.** Customer or end-user of a product the company builds. System users are Actors; they MAY participate in processes that affect them (providing feedback, approving interactions).
- **LLM agent.** An AI agent. Sits on the autonomy spectrum (L0–L3).
- **External system.** CRM, BI, SaaS, infrastructure service. Acts when invoked.
- **Process.** A Process MAY act as the Actor of a sub-process.

### §35. Accountability

Every Process MUST have exactly one Accountable Actor. Accountability means: this Actor owns the outcome. Bad outcomes are attributed to this Actor (for learning, not blame). Good outcomes are credited to this Actor.

Accountability is not the same as executing. The Accountable Actor MAY or MAY NOT do the work. Others (Executing Actors, Tools) MAY do the work, but the Accountable Actor retains ownership.

### §36. Actor vs. Tool

The distinguishing question: *who is accountable?* The accountable entity is the Actor; everything else used during execution is a Tool.

An LLM agent invoked for a single capability call is a Tool. An LLM agent with its own Contract for a sub-process is a sub-actor.

### §37. The autonomy spectrum in practice

The L0–L3 ladder (§10) is the default evolution of AI agents in a company:

- **L0** is starting. Agents are used to do specific tasks the human orders.
- **L1** emerges when humans use agents repeatedly with review. The agent participates but does not own.
- **L2** emerges when the agent has proven reliable at L1. The agent owns the process; humans approve checkpoints.
- **L3** emerges when the agent has proven reliable at L2. Humans step in only on failure.

Companies SHOULD have agents at different levels for different Processes. High-stakes processes SHOULD stay lower; routine processes MAY move higher as Evidence justifies.

### §38. Promotion and demotion

**Promotion** (L1 → L2, L2 → L3) MUST be a Process with its own Contract: "The agent achieved reliability R ≥ X over interval T, therefore promotion is warranted." Verification MUST be empirical.

**Demotion** (L3 → L2, L2 → L1) MUST be triggered automatically when the agent's Contract violation rate exceeds a declared threshold. It MAY be triggered manually when context changes (new domain, new risks).

Both are first-class in the framework. Trust is explicit, measurable, and revisable.

---

## Part VIII: The Methodology Layer

### §39. Methodologies as process templates

A **methodology** in Telos is a process template: a prescribed way of constructing a tree of Processes from a Goal.

When a team adopts OKR, Impact Mapping, or any other methodology, what they adopt is a template: given a Goal, apply this decomposition, assign Actors according to these patterns, declare Contracts in these shapes.

Methodologies are first-class. They live in a library, not in the framework core.

### §40. Built-in methodologies

Telos SHOULD ship with the following proven methodologies as templates. The list is informative, not normative: implementations MAY include more or fewer, provided at least one is supported (see §50).

| Methodology | Where proven | Role |
|---|---|---|
| OKR (Objectives & Key Results) | Intel → Google → startups | Goal hierarchy |
| Impact Mapping | Product teams of any size | Goal → actor → behavior → deliverable |
| JTBD (Jobs to be Done) | Christensen; enterprise + startups | True customer goals |
| OST (Opportunity Solution Trees) | Torres; product teams | Hypothesis → experiment |
| Lean / Build-Measure-Learn | Startups + innovation labs | Improvement cycle |
| Kanban | Toyota → software → enterprise | Parallel execution flows |

Each methodology SHOULD be documented as a Process template with its own semantics and its own conformance to the Contract requirements (§26, including causal_mechanism).

### §41. Composition of methodologies

Methodologies are composable. A team MAY adopt OKR for the goal hierarchy, Impact Mapping for product decomposition, and Kanban for execution flow. The resulting Process tree is a hybrid; each methodology contributes nodes at its own level.

Composition rules:

- Methodologies MUST agree at their boundaries. OKR produces Objectives that become inputs to Impact Mapping; Impact Mapping produces Deliverables that become inputs to Kanban.
- Composition is a declaration: the team MUST declare which methodology applies where.
- Conflicts (two methodologies wanting to own the same node) MUST be resolved in the declaration.

### §42. Custom methodologies

Teams MAY declare custom methodologies as process templates. A custom methodology MUST:

- Specify the decomposition rule (from Goal to Process tree).
- Specify the actor-assignment pattern.
- Specify the Contract shape for each node.
- Declare its compatibility with other methodologies.

Custom methodologies are not second-class. If a methodology has been proven in practice, it is a valid substrate citizen.

### §43. Conflict resolution

When two methodologies disagree at a boundary, the team MUST declare precedence. Precedence is itself a Process (with its own Contract: "this declaration covers cases X, Y, Z").

---

## Part IX: Execution Semantics

### §44. The harness

The **harness** is the runtime of Telos. Its responsibilities:

- Load `.telos/` declarations.
- Instantiate Processes from templates.
- Schedule Process execution (parallel by default).
- Invoke Actors.
- Collect Evidence.
- Check Contracts.
- Record Facts.
- Handle failures and compensations.
- Expose history for reproducibility.

The harness is Telos itself. It is not a runtime on top of Telos.

### §45. Execution model

Default execution SHALL be concurrent. Processes are dispatched to Actors; Actors execute; Evidence is returned; Contracts are checked.

The harness maintains a Process graph (nodes = Processes, edges = Dependencies). Execution is a traversal of the graph, respecting Dependencies, parallelizing where possible.

### §46. State propagation

State flows along provenance edges. When a Process produces a new Fact, downstream Processes MAY consult it; their Contracts MAY reference it.

State MUST NOT be global. State is scoped to the Processes that reference it. Processes that do not reference a Fact MUST be unaffected by it.

### §47. Evidence collection

Evidence is collected by the harness at execution time. Four pathways:

- **Mechanical (Proof).** The harness runs the check (test, type-check) directly.
- **Witnessed.** The harness subscribes to the declared event stream.
- **Signaled.** The harness reads the declared metric and compares to threshold.
- **Attested.** The harness requests sign-off from the declared Actor and records the signature.

Evidence MUST be graded as it is collected and stored with its grade.

### §48. Scheduling and cadence

Processes MAY be one-shot or recurring (Cadence). Recurring Processes MUST spawn new instances on their Cadence, each with its own Contract and Evidence, each a new Fact.

Deadlines MUST be enforced. A Process past its Deadline MUST be marked as Failed or Cancelled, depending on declaration.

---

## Part X: Reflexivity

### §49. Telos on itself

The Telos framework applies to Telos-the-project. The team building Telos declares Goals, chooses methodologies (for itself), runs Processes, verifies Contracts, records Evidence.

This is reflexivity, not autopoiesis. The Telos team uses Telos. Over time, as Telos matures, more of Telos's own work runs on Telos. This is an emergent consequence of usefulness, not a target.

### §50. Meta-processes

A Process MAY operate on other Processes. Examples:

- A Process that analyzes the reliability of another Process.
- A Process that promotes or demotes an agent.
- A Process that refactors a methodology template based on outcomes.
- A Process that adds a new methodology to the library.

Meta-processes are not special; they obey the same primitives. Their distinguishing feature is their subject matter.

### §51. Autopoiesis as consequence

When enough of Telos's own operation runs on Telos, Telos builds Telos. This is autopoiesis. It is a maturity marker, not a goal.

The founding goal of Telos is: run the full nine-step cycle for one real goal of one real company. When Telos can do this, Telos exists. Autopoiesis follows if Telos is useful enough to be used on itself.

---

## Part XI: Conformance

### §52. Conformance classes

An implementation claiming Telos compliance MUST declare itself as one of three classes:

- **Class A — Core.** The minimum. Supports the core primitives, Telos-purity, Contract declaration/verification, Evidence grading, Provenance. Does not require the methodology library or autonomy beyond L0.
- **Class B — Standard.** Class A + L0–L2 autonomy + at least two built-in methodologies + Saga-style failure handling.
- **Class C — Full.** Class B + L3 autonomy + all six built-in methodologies + custom-methodology declaration + reflexive meta-processes + full Cadence support.

A higher class includes all requirements of lower classes.

### §53. Normative clauses — MUST (Class A)

A Class A conforming implementation MUST satisfy the following (clause IDs are stable across versions):

- **CF-001** Treat all state-changing activity as Process.
- **CF-002** Require every Process to have exactly one Accountable Actor.
- **CF-003** Require a Contract declared ex-ante for every Process.
- **CF-004** Verify the Contract ex-post and record the outcome as a Fact.
- **CF-005** Attach Provenance to every Fact.
- **CF-006** Enforce the four Telos-purity conditions on every workflow (Monadic, Causal, Contractual, Verifiable).
- **CF-007** Grade every outcome as Proof (Mechanical) or Evidence (Witnessed / Signaled / Attested).
- **CF-008** Enforce the weakest-link rule when composing Evidence.
- **CF-009** Prohibit Proof emerging from Evidence-only inputs.
- **CF-010** Reject any Process whose Contract would violate an Invariant.
- **CF-011** Treat Requirements as hard boundaries on Process acceptance.
- **CF-012** Expose the history record such that an external party MAY reproduce verification of any Fact.

### §54. Normative clauses — SHOULD

A conforming implementation SHOULD satisfy:

- **CF-101** Support the full autonomy spectrum L0–L3 for agent Actors.
- **CF-102** Support parallel execution by default; sequential only by explicit Dependency.
- **CF-103** Support Saga-style compensation for failed multi-step processes.
- **CF-104** Ship at least one methodology from the built-in library (§40).
- **CF-105** Support `Metric.Leading`, `Metric.Lagging`, and `Metric.Balancing` subtypes.
- **CF-106** Accept `causal_mechanism` as part of every Contract and warn on Contracts that omit it.
- **CF-107** Support Cadence scheduling and Deadline enforcement.
- **CF-108** Support promotion and demotion of agents as first-class Processes with their own Contracts.
- **CF-109** Distinguish Accountable Actors from Executing Actors and expose both in the history record.

### §55. Normative clauses — MAY

A conforming implementation MAY satisfy:

- **CF-201** Support custom methodology declaration (REQUIRED for Class C).
- **CF-202** Support reflexive meta-processes operating on Process history.
- **CF-203** Expose a visualization of the Process graph.
- **CF-204** Integrate with specific third-party tools (metrics systems, event logs, sign-off platforms).
- **CF-205** Extend the Evidence grade ladder to a lattice, provided the weakest-link rule is preserved.
- **CF-206** Support latent-variable representation for Goals whose State is not directly observable.

### §56. Non-conformance

An implementation that claims to be Telos but does not satisfy all Class A MUST clauses is not Telos, regardless of feature richness. The framework is immutable in this respect: partial adherence is not adherence.

---

## Revision history, stability, and deprecation

### §57. Revision history

| Version | Date | Principal changes |
|---|---|---|
| 0.1 | 2026-04-18 | Initial release. Session Zero conceptual foundation. Ten-part structure. |
| 0.2 | 2026-04-19 | Added RFC 2119 normative keywords and tagged every normative clause. Added §1 Scope, §2 Normative references, §3 Terms. Added Big Picture diagram (§4.1). Added `Metric.Leading`, `Metric.Lagging`, `Metric.Balancing` subtypes (§12.1). Added `causal_mechanism` field to Contract (§26). Added §26.1 optional if/then/because/then declaration form. Added worked Telos-purity examples (§20). Added Part XI Conformance with Class A/B/C and clauses CF-001…CF-206. Added this Revision history, §58 stability tiers, §59 deprecation policy, §60 amendment rule. |

### §58. Stability tiers

Each Part carries a stability classification. The tiers are `Stable`, `Beta`, and `Alpha`:

- `Stable` — changes require a major version bump (0.x → 1.0).
- `Beta` — clauses MAY change in minor versions with revision-history notes.
- `Alpha` — under active design; clauses MAY change freely pending implementation experience.

| Part | Stability | Notes |
|---|---|---|
| I — Foundations | Stable | Principles settled in Session Zero. |
| II — Primitives | Stable | Core primitives frozen; composite list may expand. |
| III — Telos-Purity | Stable | Four conditions normative; worked examples may expand. |
| IV — Process Model | Stable | Lifecycle states frozen. |
| V — Contract Model | Stable | Fields frozen as of v0.2 (includes `causal_mechanism`). |
| VI — Evidence Model | Stable | Grades frozen; lattice replacement is flagged OPTIONAL (CF-205). |
| VII — Actor Model | Stable | Five types + L0–L3 spectrum frozen. |
| VIII — Methodology Layer | Beta | Built-in list (§40) may expand; template shape is Stable. |
| IX — Execution Semantics | Alpha | Responsibilities listed; state-transition table deferred pending implementation. |
| X — Reflexivity | Stable | Meta-process pattern frozen. |
| XI — Conformance | Beta | Class structure may extend; Class A MUST clauses (CF-001…CF-012) are Stable. |

### §59. Deprecation policy

When a clause is downgraded (MUST → SHOULD, SHOULD → MAY) or removed:

- The change MUST be recorded in §57 Revision history.
- The previous level MUST remain normative for at least **two minor versions** (deprecation window).
- After the window, the clause MAY be removed entirely.

When a primitive, clause identifier, or concept is renamed, both names MUST remain valid for the same deprecation window, with the old name annotated as deprecated in the Terms and references.

### §60. Amendments

Changes to the Framework are themselves Processes, with Contracts declaring the scope of change and Evidence recorded in §57. A change that would break Class A conformance (CF-001…CF-012) requires a major version bump (0.x → 1.0, 1.x → 2.0).

---

## Appendix A: Relationship to other documents

- `SESSION_ZERO.md` — design rationale. Why each decision in this document was made.
- `NEXT_STEPS.md` — open questions, roadmap, current status.
- `USER_GUIDE.md` — plain-English introduction.
- `TELOS_REFERENCE.md` — quick reference of primitives, rules, symbols.
- `TELOS_GLOSSARY.md` — term definitions, alphabetical (superset of §3).
- `TELOS_INSTRUCTIONS.md` — how to apply Telos to a real company, step by step.

## Appendix B: Compatibility

Telos is compatible with the methodologies it absorbs. Using Telos does not require abandoning OKR, Impact Mapping, JTBD, OST, Lean, or Kanban. It does add:

- Probabilistic Contracts on every node (where the methodology was silent).
- Explicit `causal_mechanism` on every Contract (where the methodology was implicit).
- `Metric.Balancing` to guard against collateral damage from optimization.
- Evidence collection and grading (where the methodology was informal).
- Explicit Actor accountability.
- Agent integration (where the methodology predated AI).

Teams transitioning from a pure methodology to a Telos-based one should expect these additions. They should not expect the core methodology to change.

---

## Appendix C: Scaling examples

*Informative, not normative. These examples show how the Framework applies at different company sizes. They are illustrative; real deployments will differ in details while preserving the primitives and rules.*

### C.1. Small scale — solo founder and early team (≤ 10 people)

**Context.** A solo founder has just shipped an MVP and has 9 employees. One strategic goal, short time horizon, minimal overhead tolerance.

**Goal.**
- `Goal.Strategic`: *"Reach $50K MRR with 100 paying customers by end of Q2, with probability ≥ 60%."*

**Methodology choice.** **Impact Mapping** alone. No composition needed — the team is small enough that one decomposition rule suffices.

**Process tree (sketch):**

```
[Strategic] $50K MRR + 100 customers by Q2 (p ≥ 60%)
  │
  ├── [Tactical] Acquire new customers
  │     ├── [Operational] Cold outbound (2 SDRs)
  │     ├── [Operational] Content marketing (founder + agent L1)
  │     └── [Operational] Product Hunt launch (founder)
  │
  ├── [Tactical] Convert trials to paid
  │     └── [Operational] Onboarding email sequence (agent L2)
  │
  └── [Tactical] Retain early customers
        └── [Operational] Weekly customer calls (founder)
```

**Actor mix.** Founder Accountable on Strategic and most Tactical. 2 human SDRs on outbound. 1 agent at L2 for onboarding emails (already proven at L1 over a month). 1 agent at L1 for content drafts (founder reviews every piece).

**Contract example — onboarding email sequence.**

> If we send a 5-email onboarding sequence, then trial-to-paid conversion rises from 8% to 12% (±2pp), because new users need a habit-forming reminder in the first week (documented in 15 customer interviews), then the conversion metric over trials started this month reflects the uplift within 14 days.

- `causal_mechanism` explicit.
- `Metric.Leading` = day-7 feature usage.
- `Metric.Lagging` = trial-to-paid conversion.
- `Metric.Balancing` = unsubscribe rate (catch annoyance before it scales).

**Evidence mix.** Mostly `Signaled` (Stripe, funnel metrics) + `Witnessed` (CRM events). `Proof` for code ships. `Attested` for founder sign-offs.

**Scale mechanisms engaged.** Composition (nested processes) only. Parallelism trivial (3–5 operational processes). No reflexive layer yet — founder reviews manually at quarter end.

**Conformance class.** Class A is sufficient. Class B if the team wants L2 agents tracked explicitly.

**Nine-step cycle.** Runs end-to-end in roughly a day: accept goal, decompose on a whiteboard, assign, launch, check weekly, analyze at quarter end, improve for Q3.

---

### C.2. Mid scale — product company with multiple teams (50–200 people)

**Context.** A B2B SaaS with 120 employees across Engineering, Product, Growth, Customer Success, Ops. A half-dozen initiatives run in parallel each quarter.

**Goal.**
- `Goal.Strategic`: *"Triple ARR from $2M to $6M over 2026 with probability ≥ 65%, while keeping NPS ≥ 45."*
- The `NPS ≥ 45` term is a `Metric.Balancing` constraint — do not grow by degrading the product.

**Methodology composition.** **OKR** at the top (company Objective → team KRs) + **JTBD** inside Product (customer goals) + **Impact Mapping** inside Growth (behavior change per segment) + **Kanban** across Engineering (parallel execution).

**Process tree (top two levels):**

```
[Strategic] 3× ARR in 2026, NPS ≥ 45 (p ≥ 65%)
  │ ── decomposed via OKR ──
  │
  ├── [Tactical: Product Q1 KR] Ship 3 enterprise features
  │     │ ── JTBD + Kanban ──
  │     ├── [Operational] SSO implementation
  │     ├── [Operational] Audit log viewer
  │     └── [Operational] Role-based access control
  │
  ├── [Tactical: Growth Q1 KR] Pipeline from $400K to $800K/quarter
  │     │ ── Impact Mapping ──
  │     ├── [Operational] Enterprise outbound (SDR team)
  │     ├── [Operational] Partner channel (BD)
  │     └── [Operational] Content + SEO (agent L2 + human editor)
  │
  ├── [Tactical: Customer Success KR] Keep monthly churn < 1.5%
  │     └── [Operational] Churn risk scoring + proactive outreach
  │
  └── [Tactical: Ops KR] Hire 15 engineers by end of Q2
        └── [Operational] Sourcing, interviewing, offers
```

**Actor mix.** Team leads Accountable for Tactical goals; ICs Executing on Operational. ~10 agents in use: 2 at L2 (content, churn scoring), 6 at L1 (code review suggestions, draft emails, document summaries), 2 at L0 (one-off queries). External systems — CRM, billing, observability — declared as inputs.

**Contract example — enterprise outbound.**

> If we send 500 personalized outbound emails per week to Tier-1 prospects, then qualified pipeline rises by $50K/week (±$15K), because enterprise buyers who receive a thesis-first cold email respond at 3× the rate of templated outreach (per A/B test from Q4 2025), then the weekly pipeline metric reflects the uplift within 4 weeks.

Churn-risk contract includes `Metric.Balancing` = false-positive rate — flagging customers who are not actually at risk would over-reach CSM bandwidth and degrade the signal.

**Evidence mix.** Full spectrum. `Proof` for code ships and SSO integration tests. `Signaled` for MRR, NPS, churn. `Witnessed` for CRM and GitHub events. `Attested` for security reviews and enterprise contract signatures.

**Scale mechanisms engaged.**
- **Horizontal scale.** ~25 operational processes running in parallel across teams at any time.
- **Vertical scale.** Three levels deep (Strategic → Tactical → Operational → Contract).
- **Composition.** Four methodologies at their own layers (OKR / JTBD / Impact Mapping / Kanban).
- **Templates.** Each team reuses its methodology template quarter over quarter.
- **Reflexive processes.** Weekly analysis processes — "reliability of each L2 agent over 30 days," "leading-vs-lagging metric drift per KR," "violated contracts by team." Feed quarterly improvement.

**Conformance class.** Class B recommended.

**Nine-step cycle.** Strategic annual. Tactical KRs quarterly per team. Operational contracts bi-weekly. Verification and analysis weekly. Improvement at quarter end — promote/demote agents, swap methodology boundaries, adjust tolerances based on calibration.

---

### C.3. Enterprise scale — multi-business-unit organization (1000+ people)

**Context.** A public company with four business units (Cloud, Mobile, Enterprise SaaS, Research Labs), ~1500 employees, multi-year planning horizon, regulatory constraints.

**Goal cascade.**
- `Goal.Vision`: *"Every company runs on probabilistic, AI-native contracts by 2035."* (indefinite, direction, qualitative)
- `Goal.Mission`: *"Provide the substrate under those contracts, at every scale."* (ongoing)
- `Goal.Strategic (3-year)`: *"$500M ARR across BUs by end of 2028, NPS ≥ 50, employee-engagement score ≥ 75."*
- Multiple `Goal.Strategic (1-year)` per business unit.

**Methodology composition.** **OKR** company-wide + **JTBD + OST** in product BUs + **Lean/BML** in Research Labs + **Impact Mapping** in GTM functions + **Kanban** across all Engineering.

**Process tree (high level — actual tree has roughly 300 nodes):**

```
[Vision] Every company on probabilistic, AI-native contracts by 2035
  │
  └── [Mission] Provide the substrate at every scale
       │
       └── [Strategic 3yr] $500M ARR by 2028, NPS ≥ 50, ENG ≥ 75
            │ ── OKR ──
            │
            ├── [Strategic 1yr] Cloud BU: $200M ARR, +40% YoY
            │     │ ── JTBD + OST + Kanban ──
            │     ├── [Tactical] Discovery: 3 new segments validated
            │     ├── [Tactical] Platform: multi-region support shipped
            │     └── [Tactical] GTM: enterprise motion at $1M+ ACVs proven
            │           └── ~30 operational processes
            │
            ├── [Strategic 1yr] Mobile BU: $80M ARR, retain ≥ 85%
            │     └── ~20 tactical, ~80 operational
            │
            ├── [Strategic 1yr] Enterprise SaaS BU: $180M ARR, close 5 whale accounts
            │     └── ~15 tactical, ~60 operational
            │
            ├── [Strategic 1yr] Research Labs: 2 hypotheses validated, 1 productized
            │     │ ── Lean BML ──
            │     └── ~40 experiments per year
            │
            └── [Strategic 1yr] Functions (HR / Finance / Legal / Ops)
                  └── ~50 operational processes supporting the BUs
```

**Actor mix.** CEO Accountable on Strategic-3yr. GMs and VPs Accountable on Strategic-1yr per BU. Team leads on Tactical; ICs and agents Executing. ~500 agents total: ~60 at L3 (routine automation — ETL, deployment, on-call triage), ~200 at L2 (content, customer support triage, code review), ~200 at L1 (IC assistance), ~40 at L0 (infrequent queries). External systems declared end-to-end (CRM, data warehouse, observability, HRIS, billing, CI/CD, feature flags, compliance tooling).

**Contract example — multi-region platform ship.**

> If we deploy our platform in 3 additional regions (EU, APAC, LATAM) with full data residency, then annualized contract value in those markets grows from $5M to $25M (±$8M) over 12 months, because enterprise procurement teams in those regions require local data residency as a hard prerequisite (documented in 50+ lost-deal post-mortems over 2025), then the region-ACV metric reflects growth trailing 12 months after each region ships.

Research Labs hypotheses are first-class `Hypothesis` composites (unverified Contracts) with intentionally wide tolerance; the Lean BML loop drives weekly experiments until a hypothesis is either verified, disconfirmed, or parked.

**Evidence mix.** Every grade used heavily. Compliance requires many `Attested` sign-offs per quarter. Product telemetry is `Signaled` and `Witnessed` at volume. CI/CD gives `Proof` for every ship. Customer research produces mixed `Attested` + `Witnessed` evidence.

**Scale mechanisms engaged.**
- **Horizontal scale.** Hundreds to low thousands of operational processes in parallel across BUs.
- **Vertical scale.** Full six-level cascade: Vision → Mission → Strategic-3yr → Strategic-1yr → Tactical → Operational → Contract.
- **Composition.** Five methodologies composed at different layers. Boundary declarations are themselves documented Processes (§43).
- **Templates.** Each BU maintains a Process template library for its recurring work.
- **Reflexive processes at scale.**
  - Weekly: per-BU contract-violation dashboards (analysis processes).
  - Monthly: cross-BU portfolio reviews; agent autonomy re-evaluation.
  - Quarterly: methodology template refactoring based on template performance.
  - Annually: conformance audit — does each BU's deployment meet its declared Conformance Class?
- **Latent-variable modelling becomes material.** Brand health, employee engagement, market position are tracked as belief distributions with explicit uncertainty rather than point estimates. (This is the scale at which the open question §2.1 about latent variables stops being theoretical.)

**Conformance class.** Class C required (custom methodologies are declared per BU; reflexive meta-processes run continuously; all six built-in methodologies in use across the org).

**Nine-step cycle at every level, each on its own Cadence.**
- Vision / Mission: reviewed triennially.
- Strategic 3-year: annual review, quarterly calibration.
- Strategic 1-year: quarterly off-sites.
- Tactical: weekly.
- Operational: daily standups or async checkpoints.
- Agent promotion / demotion: continuous, data-triggered.

---

### C.4. Choosing a scale

| Size | Typical Class | Methodologies | Tree depth | Parallel processes | Reflexive layer |
|---|---|---|---|---|---|
| **Small** (≤ 10) | A or B | 1 | 2–3 | < 10 | Quarterly |
| **Mid** (10–200) | B | 2–4 composed | 3–4 | 10–100 | Weekly |
| **Enterprise** (200+) | C | 3+ composed | 5–6 | 100+ | Continuous |

The Framework scales because the primitive is the same. What grows with scale is **cardinality, depth, and the weight of the reflexive layer** — not the shape of the work.

At every scale:
- A Process still has exactly one Accountable Actor.
- Every Contract is still declared ex-ante with a causal mechanism.
- Evidence is still graded, and the weakest link still crosses the boundary.
- Autonomy is still data-driven.
- Reflexivity is still recursive: processes improving processes.

---

*End of the Telos Framework, Version 0.2. Revisions are themselves Processes, with their own Contracts and Evidence.*
