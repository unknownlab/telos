# Telos Glossary

*Alphabetical definitions of all Telos terms. For structured catalog, see `TELOS_REFERENCE.md`. For full semantic treatment, see `TELOS_FRAMEWORK.md`. Aligned with Framework v0.2.*

---

**Accountability** — the property of an Actor being the owner of an outcome. In Telos every Process has exactly one accountable Actor.

**Actor** — a participant in a Process with accountability. Five types: team member, system user, LLM agent, external system, another Process. Role as Actor is contextual: the same entity MAY be an Actor in one Process and a Tool in another.

**Agent** — in Telos, an AI agent (typically LLM-based). Agents sit on the autonomy spectrum (L0–L3). An agent MAY be a Tool (L0) or an Actor (L1–L3) depending on the Process.

**Alpha (stability tier)** — a Part under active design; clauses MAY change freely pending implementation experience.

**Amendment** — a change to the Framework. Itself a Process with a Contract and Evidence (§60).

**Asset** — composite concept: State with a long lifespan. Not primitive.

**Attestation** — the parent family of Proof and Evidence. Every Contract outcome is an Attestation.

**Attested** — Evidence grade: a responsible party signed off. The signer is the verifier; independent check is not possible.

**Autonomy level** — a Process's classification of an agent Actor along the L0–L3 spectrum. Property of the Process, not of the agent.

**Autopoiesis** — a system's property of building itself. In Telos it is a consequence of usefulness, not a goal.

**Beta (stability tier)** — a Part whose clauses MAY change in minor versions with revision-history notes.

**Cadence** — a recurring pattern (daily, weekly, quarterly). A Process MAY have a Cadence, spawning new instances each cycle.

**Causal mechanism** — the declared reason *why* a Contract is expected to hold; the "because" clause in the contract declaration. SHOULD reference the Subject's pain/desire, a documented mechanism from prior Evidence, or a testable theoretical model.

**Causation** — a Relation: X causally influences Y. Used in Telos-purity's causal purity condition (Pearl's do-calculus).

**Class A — Core (conformance)** — minimum conformance. Supports primitives, Telos-purity, Contract ex-ante/ex-post, Evidence grading, Provenance. See clauses CF-001…CF-012.

**Class B — Standard (conformance)** — Class A + L0–L2 autonomy + ≥2 built-in methodologies + Saga compensation.

**Class C — Full (conformance)** — Class B + L3 autonomy + all 6 built-in methodologies + custom methodology + reflexive meta-processes + full Cadence.

**Composite concept** — a concept that reduces to primitives. Not primitive itself. Examples: Decision, Hypothesis, Experiment, Risk, Knowledge, KPI, SLA.

**Composition** — the combination of Processes, Contracts, or Evidence. Obeys specific rules — see `TELOS_REFERENCE.md`.

**Conceptual gap** — a concept that does not reduce to primitives. MUST be flagged, not silently accommodated.

**Conformance** — the property of an implementation satisfying the Framework's normative clauses (Part XI). Declared at one of three classes: A, B, C.

**Conformance class** — one of A (Core), B (Standard), C (Full). See Part XI.

**Contract** — a per-Process promise, declared ex-ante. Includes expected distribution, tolerance, conditions, causal mechanism, verification method, deadline.

**Custom methodology** — a team-declared methodology packaged as a Process template. First-class if composable with other methodologies.

**Deadline** — a Moment by which some truth MUST hold.

**Decision** — composite concept: Fact + Ownership + context. Not primitive.

**Declared** — Process lifecycle state: Contract written, execution not begun.

**Demotion** — the movement of an agent down the autonomy spectrum. A Process in itself, triggered by Contract violations or context changes.

**Dependency** — a Relation: Process X requires the output of Process Y before it can run.

**Deprecation policy** — Framework rule (§59) that a clause downgraded or removed MUST remain normative for at least two minor versions before removal.

**Deprecation window** — the minimum interval (two minor versions) during which a downgraded or renamed clause remains valid.

**Dirac case** — the degenerate case of probability: all mass on a single outcome. Deterministic. Code type-checks, cryptography.

**Document** — composite concept: human-readable wrapper around Goal/Requirement/Invariant. Not primitive.

**Evidence** — a Fact carrying an epistemic level. Grades: Witnessed, Signaled, Attested. Mechanical-level Evidence is Proof.

**Event** — a discrete structured occurrence. An Observation primitive.

**Executing Actor** — the Actor performing the work of a Process. Distinct from the Accountable Actor, though they MAY be the same entity.

**Experiment** — composite concept: a Process that tests a Hypothesis. Not primitive.

**External system** — an Actor type: CRM, BI, SaaS, infrastructure. Acts when invoked.

**Fact** — an observation persisted in history. A point in the record.

**Failed** — Process lifecycle state: execution halted by an internal error.

**Founding goal** — Telos exists when it can run the nine-step cycle for one real goal of one real company. See `project_founding_goal.md` memory and `TELOS_FRAMEWORK.md` §51.

**Framework** — in Telos, the full methodology described in `TELOS_FRAMEWORK.md`.

**Goal** — a Specification primitive: target distribution with tolerance. Subtypes: Vision, Mission, Strategic, Tactical, Operational.

**Goal.Mission** — Goal subtype: ongoing purpose. Optional.

**Goal.Operational** — Goal subtype: weeks, process level. Leads to Contract.

**Goal.Strategic** — Goal subtype: 1–3 years, company level.

**Goal.Tactical** — Goal subtype: quarter, team level.

**Goal.Vision** — Goal subtype: decades, direction (not a point target), qualitative. Generates other goals.

**Harness** — the runtime of Telos. Responsible for execution, Contract checking, Evidence collection, failure handling. The harness is Telos itself.

**Harness-first** — a development philosophy: products built from day one to be operable by typed workflows. Third wave after code-first and spec-first.

**Hypothesis** — composite concept: an unverified Contract. Not primitive.

**Impact Mapping** — built-in methodology: Goal → actor → behavior → deliverable. Originated in product teams.

**Interval** — duration between two Moments.

**Invariant** — Specification primitive: always true across all states. System law, cannot be broken.

**JTBD (Jobs to be Done)** — built-in methodology: true customer goals.

**Kanban** — built-in methodology: parallel execution flow. Originated in Toyota manufacturing.

**Kleisli** — category-theoretic notion of composition for functions returning a monadic value. In Telos, the composition rule for probability-distribution-valued workflows.

**Knowledge** — composite concept: consolidated Facts. Not primitive.

**KPI** — composite concept: Metric flagged "important." Not primitive.

**L0 / L1 / L2 / L3** — the four levels of the autonomy spectrum for agents. See Autonomy level.

**Latent variable** — a variable not directly observable (brand, morale, market position). Telos handles latent variables via belief distributions.

**Lean** — built-in methodology: Build-Measure-Learn improvement cycle.

**LLM agent** — an Actor type: an AI agent. See Agent, Autonomy level.

**MAY / OPTIONAL** — RFC 2119 normative keyword indicating a genuinely optional feature or behaviour.

**Mechanical** — Evidence grade: mechanically checkable. Synonym for Proof.

**Meta-process** — a Process whose subject is another Process (analysis, promotion/demotion, methodology refactoring).

**Methodology** — a Process template: a prescribed way of decomposing a Goal into a Process tree. Telos ships with six built-in methodologies and SHOULD support custom ones.

**Methodology library** — Telos's collection of Process templates. Built-in + custom.

**Metric** — Observation primitive: aggregation of Signals or Events.

**Metric.Balancing** — Metric subtype: held approximately constant to guard against collateral damage from optimizing other metrics.

**Metric.Lagging** — Metric subtype: terminal indicator, measured at or after completion.

**Metric.Leading** — Metric subtype: early indicator, measurable during execution.

**Moment** — a point in time.

**Monadic purity** — Telos-purity condition (1): same input distribution → same output distribution.

**MUST / SHALL / REQUIRED** — RFC 2119 normative keyword indicating absolute requirement.

**MUST NOT / SHALL NOT** — RFC 2119 normative keyword indicating absolute prohibition.

**Non-conformance** — an implementation that fails any MUST clause is not Telos, regardless of feature richness.

**Normative reference** — an external document whose content is binding on this Framework (§2).

**OKR** — built-in methodology: Objectives & Key Results. Goal hierarchy.

**Operational** — see Goal.Operational.

**OST (Opportunity Solution Trees)** — built-in methodology: hypothesis → experiment trees. Originated by Teresa Torres.

**Ownership** — a Relation: Actor is accountable for Goal or Process.

**Pearl / do-calculus** — Judea Pearl's causal calculus. Basis for Telos-purity's causal purity condition (§17).

**Pluggable methodology** — a methodology loadable into Telos as a Process template.

**Probabilistic contract** — see Contract. Called "probabilistic" to emphasize that uncertainty is explicit.

**Process** — Core primitive: any state-changing activity. MUST have exactly one Accountable Actor, one Contract, and produce Evidence (or Proof).

**Process lifecycle** — the sequence of states a Process moves through: Declared → Running → {Verified | Violated | Cancelled | Failed}.

**Process template** — a prescription for constructing Processes. Methodologies are Process templates.

**Promotion** — the movement of an agent up the autonomy spectrum. A Process in itself, justified by reliability Evidence.

**Proof** — Evidence at the Mechanical level. Tests, type-checks, cryptographic proofs. Independently re-derivable.

**Provenance** — a Relation: Fact produced by a specific Process run. First-class; without it, reproducibility breaks.

**Reflexivity** — Telos's property of managing its own operation through the same primitives. Distinct from autopoiesis.

**Requirement** — Specification primitive: hard constraint, non-negotiable. Changes only through explicit process.

**Revision history** — the Framework's list of dated versions and principal changes (§57).

**RFC 2119** — IETF document defining normative keywords (MUST/SHOULD/MAY) used in this Framework.

**Risk** — composite concept: distribution with a tail in bad outcomes. Not primitive.

**Running** — Process lifecycle state: execution begun, Contract not yet verified.

**Saga** — failure-handling pattern: if a multi-step Process fails partway, a compensation chain reverses or substitutes for completed steps.

**Scope** — (1) a set of Requirements of the form "we do X / we do not do Y"; a composite, not a primitive. (2) §1 of the Framework, defining what the Framework covers.

**SHALL / SHALL NOT** — see MUST / MUST NOT.

**SHOULD / RECOMMENDED** — RFC 2119 normative keyword: strong recommendation; deviations require documented justification.

**SHOULD NOT / NOT RECOMMENDED** — RFC 2119 normative keyword: behaviour discouraged unless circumstances warrant and are documented.

**Signal** — Observation primitive: a raw observation.

**Signaled** — Evidence grade: a metric crossed a threshold.

**SLA / SLO** — composite concept: Contract on system behaviour. Not primitive.

**Spec** — see Document.

**Specification family** — primitive family: Goal, Requirement, Contract, Invariant.

**Stability tier** — classification of a Framework Part: Stable, Beta, or Alpha (§58).

**Stable (stability tier)** — changes require a major version bump.

**State** — Core primitive: belief distribution over values + provenance.

**Strategic** — see Goal.Strategic.

**Sub-actor** — an Actor invoked by another Actor, with its own Contract on the invocation. Distinct from Tool, which has no Contract.

**Subject** — in the informal optional Contract form (§26.1), the target population whose behavior change drives Goal achievement. Not a primitive; in Telos the Subject is an Actor (typically a "system user" or "team member").

**Substrate** — the layer beneath methodologies that makes them composable, measurable, AI-operable, self-improving. Telos is a substrate.

**System user** — an Actor type: a customer or end-user of a product the company builds.

**Tactical** — see Goal.Tactical.

**Team member** — an Actor type: an employee, contractor, or other human in the company.

**Telos** — the framework described in `TELOS_FRAMEWORK.md` and its supporting documents.

**Telos-pure** — a workflow satisfying all four Telos-purity conditions (monadic, causal, contractual, verifiable).

**Telos-purity** — the definition of function purity for a probabilistic world. Four conditions.

**Tolerance** — the acceptable deviation of a Contract's actual outcome from its declared expected distribution.

**Tool** — Core primitive: a capability invoked by an Actor, without accountability.

**Verification** — ex-post check that a Contract held within tolerance. Performed by the harness.

**Verified** — Process lifecycle state: execution completed, Contract held within tolerance.

**Violated** — Process lifecycle state: execution completed, Contract did not hold.

**Vision** — see Goal.Vision.

**Witnessed** — Evidence grade: an event was logged.

---

*End of glossary. Aligned with TELOS_FRAMEWORK.md v0.2.*
