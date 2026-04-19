# Telos — Session Zero Foundation

*Document compiled 2026-04-18 at the close of Session Zero. This is the canonical technical foundation for all future sessions on Telos.*

*At the start of any new session, read this document in full before proposing technical decisions or writing code. For a plain-language introduction, see `USER_GUIDE.md`. For current status and open work, see `NEXT_STEPS.md`.*

---

## 0. What Telos is — one sentence

> **Telos is a substrate that gives proven organizational methodologies three things they do not have today: mathematical rigor for uncertainty, AI-native executability, and the ability to improve themselves.**

We are not inventing new methodologies. We are building the layer beneath them that makes them:

1. **Composable** — not "pick one," but "combine OKR + Impact Mapping + Kanban"
2. **Measurable with explicit uncertainty** — probabilistic contracts, not gut feelings
3. **AI-native** — agents are participants on an autonomy spectrum, not just assistants
4. **Self-improving** — processes that improve other processes

---

## 1. Core thesis

Telos is an *agent-first, spec-first, proof-first* operating system for goal-oriented companies, designed for a **probabilistic world** rather than a deterministic one.

A company is modeled as a collection of **processes** that change state. Every process has:

- An **actor** (who is accountable)
- A **contract** (what is promised, expressed as a probability distribution)
- **Evidence** (an ex-post witness of whether the contract held)

Telos is the **harness** in which these processes run. The harness is not a runtime on top of something else — it is Telos itself.

---

## 2. What is genuinely new in Telos — five dimensions

Telos is not "existing tools plus AI." Five genuine novelties:

### 2.1. A single primitive: Process

Existing tools cover subsets of company motion: Jira tracks tasks, Lattice tracks OKRs, Camunda runs BPM flows, Grafana collects metrics. No existing tool unifies **goal formation + execution + measurement + analysis + improvement** under one primitive. Telos does.

### 2.2. Probabilistic contracts

Ex-ante declaration + ex-post verification with explicit uncertainty. **No existing B2B tool does this at company scale.** See §3.2 (Telos-purity).

### 2.3. AI agents on an autonomy spectrum (L0–L3)

Agents are neither assistants nor plugins. They are **participants** whose accountability grows as they prove reliable. The spectrum is explicit and data-driven.

### 2.4. Reflexivity

Telos manages its own development through the same primitives it uses to manage any company's work. Existing tools do not use themselves.

### 2.5. Harness-first

Every new product is built to be operable by typed workflows from day one. This is the third wave after code-first and spec-first development.

---

## 3. Decisions taken in Session Zero

### 3.1. Everything is a process

**Process = actor + contract + state change.**

Anything that changes state is a process:

- Forming a goal is a process
- A goal that generates other goals or products is a process
- Choosing a methodology is a process
- Executing an action is a process
- Control (verifying that a process is proceeding as declared) is a process
- Collecting metrics is a process
- Analysis is a process
- Improving another process is a process

This recursion gives Telos **reflexivity**: it manages its own operation through the same primitives.

---

### 3.2. Telos-purity — purity for a probabilistic world

The classical functional-programming framing `(state, goal) → new_state` was **rejected** as a legacy of deterministic systems. Telos operates in a probabilistic world.

A workflow is **Telos-pure** if and only if all four conditions hold simultaneously:

1. **Monadic purity (Kleisli).** Given the same input distribution, the workflow produces the same output distribution. Randomness lives in the output, not in the function. Composition is monadic bind over a probability monad.

2. **Causal purity (Pearl).** The workflow's effect passes only through declared inputs and its declared mechanism. There are no hidden causal side channels. The workflow is an *intervention* (do-operator), not an observation.

3. **Contractual declaration.** The workflow declares its probabilistic contract — expected output distribution, tolerances, and the conditions under which the contract holds — before execution.

4. **Empirical verifiability.** The contract is either empirically held (within tolerance) or violated, and the outcome is recorded as a first-class fact.

Together, these conditions give **full transparency of uncertainty**: not its absence, but its declared, structured, and verifiable presence.

**Caveat for code-like domains:** tests, type-checks, and cryptography have Dirac distributions — all probability mass on a single outcome. Determinism is therefore the degenerate case of probability, not a separate world.

**Cascade changes to the primitives:**

- `State` is not a value. `State` = *belief distribution over values + provenance* (which evidence shaped the belief).
- `Workflow` = *probabilistic contract + intervention + belief-update rule*.
- `Goal` = *target distribution* (with tolerance or minimum achievement probability).
- `Proof` / `Evidence` = *ex-ante justification that the contract should hold* + *ex-post witness that it did*.
- `Harness` = the executor that mechanically checks each contract at execution time.

---

### 3.3. Proof taxonomy — Option C (hybrid)

The original proof taxonomy grouped epistemically different things (a test passing, a sign-off, a metric crossing a threshold) under one word, producing false rigor. Resolution:

- **`Proof`** is reserved for **mechanically checkable** forms only (tests, type-checks, cryptography). The word keeps its strict type-theoretic meaning.
- **`Evidence`** covers all non-mechanical forms, with internal gradation:
  - `Witnessed` — event logged
  - `Signaled` — metric crossed a threshold
  - `Attested` — a responsible party signed off
- Both are variants of a shared `Attestation` family. Composition rules are unified.

**Composition rule — the weakest link crosses the boundary.**

If any input to a workflow is `Evidence`, its output is `Evidence`. A `Proof` cannot emerge from `Evidence` inputs. Mechanical rigor does not arise from non-mechanical sources.

**Flagged for the future:** the internal ordering inside `Evidence` (`Witnessed` / `Signaled` / `Attested`) is not a strict total order. Real epistemic strength is context-dependent — 1000 customer surveys may be stronger than one CEO sign-off. Long-term this may need to become a **lattice** rather than a **ladder**.

---

### 3.4. The primitive taxonomy

All concepts in Telos reduce to the primitives below, organized by family. Composite concepts (Decision, Hypothesis, Experiment, Risk, Knowledge, KPI, SLA, Asset, Document) are built from these.

#### Level 0: Core

- **Process** — any state-changing activity.
- **Actor** — a participant with accountability. Five types: team member, system user (customer), LLM agent, external system, another process.
- **Tool** — a capability invoked by an actor. No accountability, no contract.
- **State** — belief distribution over values + provenance.

**Actor vs. Tool:** the distinguishing question is *who is accountable for the outcome?*

- The entity itself → **Actor** (has its own contract).
- The invoker → **Tool** (no contract; function-call semantics).

The same entity can play either role in different contexts. A **sub-actor** differs from a **tool** by having its own contract on the invocation.

#### Level 1: Agent autonomy spectrum

For processes with an AI agent as executing actor, the agent's role sits on a spectrum:

| Level | Name | Accountable | Human role |
|---|---|---|---|
| **L0** | Tool | Human | Invokes directly |
| **L1** | Semi-agent, human-led | Human | Reviews every decision |
| **L2** | Semi-agent, agent-led | Agent | Approves at checkpoints |
| **L3** | Autonomous | Agent | Only on escalation or failure |

**Movement along the spectrum is itself a process** (promotion / demotion), with its own contract and evidence based on the agent's measured reliability at the current level. Trust-building is data-driven, not political.

#### Level 2: Specification family

| Primitive | Meaning | Example |
|---|---|---|
| **Goal** | Wants to achieve. Target distribution with tolerance. | "Retention ≥ 80% by Q4, probability ≥ 70%" |
| **Requirement** | Must hold. Hard constraint, non-negotiable. | "GDPR compliance" |
| **Contract** | Per-process promise, declared ex-ante. | "Email campaign raises engagement 5% ±2 for 30% of customers" |
| **Invariant** | Always true across all states. System law. | "Customer data never leaves the EU" |

**Goal hierarchy:**

```
Goal.Vision       — attractor, decades, direction / gradient
  ↓ generates
Goal.Mission      — purpose, ongoing (optional)
  ↓ informs
Goal.Strategic    — 1–3 years, company level
  ↓ decomposes
Goal.Tactical     — quarter, team level
  ↓ decomposes
Goal.Operational  — weeks, process level
  ↓ leads to
Contract          — per-process promise
```

**Vision** is a Goal subtype with `horizon=indefinite`, `shape=direction` (not a point target), and qualitative measurement. Vision's role is to *generate* other goals, not to be achieved in the ordinary sense.

**Scope** is a set of `Requirement`s of the form "we do X / we do not do Y". Changes to scope are themselves processes with contracts and evidence.

#### Level 3: Observation family

From raw to structured:

| Primitive | Meaning | Example |
|---|---|---|
| **Signal** | Raw observation | "page loaded in 230 ms" |
| **Event** | Discrete occurrence with structure | "user_signup at T with attributes A" |
| **Metric** | Aggregation of signals / events | "average load this week = 240 ms" |
| **Fact** | Observation persisted in history | A point in system history |
| **Evidence** | Fact + epistemic level | `Attested` / `Signaled` / `Witnessed` / `Mechanical` |
| **Proof** | Mechanically-checkable Evidence (top level) | Test passed, type-check accepted, crypto verified |

Processes have a `Contract` (declarative side) and produce `Evidence` (observational side). The contract either holds in tolerance or is violated — and the outcome is itself a `Fact`.

#### Level 4: Relations

- **Dependency** — process X needs the output of process Y.
- **Provenance** — this fact was produced by this specific process run.
- **Ownership** — this actor is accountable for this goal or process.
- **Causation** — X causally influences Y (for Pearl-style causal semantics in Telos-purity).

#### Level 5: Time

- **Moment** — a point in time.
- **Interval** — duration between two moments.
- **Cadence** — recurring pattern (daily, weekly, quarterly).
- **Deadline** — a moment by which something must be true.

#### What is NOT primitive

Things that may look like primitives but are composites. Before adding a new concept, check whether it reduces to the primitives above:

- **Decision** = Fact + Ownership + context
- **Hypothesis** = unverified Contract
- **Experiment** = Process that tests a Hypothesis
- **Risk** = distribution with a tail in bad outcomes
- **Knowledge** = consolidated Facts
- **Asset** = State with a long lifespan
- **Document / Spec** = human-readable wrapper around Goal / Requirement / Invariant
- **KPI** = Metric marked as "important"
- **SLA / SLO** = Contract on system behavior

---

### 3.5. Methodology library

Telos ships with proven methodologies as **process templates**. Each has been proven at both enterprise and small successful companies:

| Methodology | Where proven | Role |
|---|---|---|
| **OKR** (Objectives & Key Results) | Intel → Google → startups | Goal hierarchy |
| **Impact Mapping** | Product teams of any size | Goal → actor → behavior → deliverable |
| **JTBD** (Jobs to be Done) | Christensen; enterprise + startups | True customer goals |
| **OST** (Opportunity Solution Trees) | Teresa Torres; product teams | Hypothesis → experiment |
| **Lean / Build-Measure-Learn** | Startups + innovation labs | Improvement cycle |
| **Kanban** | Toyota → software → enterprise | Parallel execution flows |

Methodologies are **composable**. Example: OKR for goals + Impact Mapping for product decomposition + Kanban for execution. Teams may also declare custom methodologies as process templates.

---

### 3.6. Scale mechanisms

Telos is designed to work from small teams (10 people) to enterprise (1000+):

- **Composition** — processes contain sub-processes, nestable to any depth.
- **Templates** — proven patterns are reusable.
- **Horizontal scale** — many parallel flows.
- **Vertical scale** — deep goal hierarchies.
- **Reflexive processes** — processes that improve other processes.

---

## 4. Founding goal

**Telos exists** when it can complete the full company-management cycle for *one real goal of one real company*:

1. **Accept** a high-level company goal.
2. **Decompose** the goal through a chosen methodology (or combination) into a tree of sub-goals.
3. **Assign actors** to nodes — agents, humans, external systems, system users, or other processes — at appropriate autonomy levels.
4. **Execute** nodes in parallel, each with its own probabilistic contract (Telos-purity).
5. **Control** — run verification processes in parallel with execution, checking contracts.
6. **Analyze** — run processes that collect metrics and surface unreliable links.
7. **Improve** — run processes that recommend changes (reassignment, re-negotiation, autonomy promotion or demotion).
8. **Handle failures** — errors, cancellations, and compensations (sagas, retries, reassignment) are handled gracefully.
9. **Reproducibility** — an external party can clone, replay, and verify.

### What is NOT the founding goal

- **Not** "Telos builds Telos." Autopoiesis is a *consequence* of Telos being useful, not the goal. The first company using Telos will be the team building it — but that is a maturity marker, not a success criterion.
- **Not** "Telos passes its own type-check." Declaration closure is trivial without demonstrating usefulness.
- **Not** "Telos supports every methodology." One useful methodology per cycle is sufficient for the founding goal.

### First achievable milestone

Run the full nine-step cycle for **one real goal of one real company**, with at least:

- One methodology for decomposition
- One AI agent as executing actor at L1 or higher
- At least one human actor
- At least one contract that empirically holds (or fails, with the failure recorded as a `Fact`)
- Full reproducibility

### External validation

An outside observer can verify without trust:

1. Pick a company with a real goal.
2. Run Telos on it.
3. Observe: did Telos accept the goal, decompose it, run the cycle, survive failures, produce recommendations, record everything reproducibly?
4. Yes → Telos exists. No → identify which step failed and fix it.

---

## 5. How to apply this document

### At the start of a new Telos session

1. Read this document in full.
2. Read related memory files if available:
   - `telos_thesis.md` — the thesis
   - `project_telos_primitives.md` — primitives in detail
   - `project_telos_purity.md` — purity in detail
   - `project_founding_goal.md` — founding goal in detail
3. Only after that, move to technical discussions.

### When discussing a new concept or feature

1. Check whether it reduces to the primitives (Core / Spec / Observation / Relation / Time).
2. If it reduces — use the primitives, do not add a new concept.
3. If it does not reduce — this is a **conceptual gap**. Flag it before extending the vocabulary.

### When discussing a workflow

1. Default to Telos-purity (all four conditions).
2. The only exception is pure code domains (Dirac case).

### When discussing an agent in a process

1. Specify the autonomy level (L0–L3).
2. Identify the accountable actor and the executing actors.
3. Distinguish a sub-actor from a tool by the presence or absence of its own contract.

### When comparing Telos to existing tools

Use the five novelty dimensions (§2), not feature-by-feature comparison.

---

## 6. Glossary

- **Actor** — a first-class process participant with accountability and a contract.
- **Attestation** — parent family of Proof and Evidence.
- **Attested** — evidence in the form of a responsible party's sign-off.
- **Autopoiesis** — a system's property of building itself. In Telos, it is a *consequence* of being useful, not a *goal*.
- **Autonomy level (L0–L3)** — an agent's position on the spectrum from tool to autonomous.
- **Contract** — a probabilistic promise for a specific process, declared ex-ante and verified ex-post.
- **Dirac case** — the deterministic special case of probability: all probability mass on a single outcome.
- **Evidence** — a witness with an epistemic level (Witnessed / Signaled / Attested / Mechanical).
- **Fact** — a persisted observation in system history.
- **Harness** — the runtime in which Telos processes run. Telos itself is the harness.
- **Harness-first** — the third wave of development, after code-first and spec-first.
- **Invariant** — an always-true constraint of the system.
- **Kleisli** — the category-theoretic notion of composition for functions returning a monadic value (here, a probability distribution).
- **Latent** — a variable not directly observable (brand, morale, reputation).
- **Mechanical** — the top Evidence level — mechanically checkable (equivalent to Proof).
- **Pearl / do-calculus** — Judea Pearl's causal calculus for distinguishing observation from intervention.
- **Pluggable methodology** — a methodology packaged as a process template, loadable into Telos.
- **Process** — any state-changing activity. The universal primitive of Telos.
- **Proof** — mechanically-checkable Evidence (test, type-check, cryptography).
- **Provenance** — the origin of a fact (which process produced it).
- **Reflexivity** — Telos's property of managing its own operation through the same primitives.
- **Requirement** — a hard, non-negotiable constraint.
- **Scope** — a set of Requirements defining what the company does and does not do.
- **Signaled** — evidence in the form of a metric crossing a threshold.
- **State** — belief distribution over values + provenance.
- **Substrate** — the layer beneath methodologies that makes them composable, measurable, AI-operable, and self-improving.
- **Telos-purity** — the four-condition definition of function purity for a probabilistic world.
- **Tool** — a capability invoked by an actor, without accountability.
- **Witnessed** — evidence in the form of a logged event.

---

*End of document. In a new session, start by reading this file in full before any technical proposals.*
