# Telos Reference

*Quick lookup for primitives, rules, symbols, normative keywords, and conformance. For full definitions see `TELOS_FRAMEWORK.md`. For term definitions see `TELOS_GLOSSARY.md`. Aligned with Framework v0.2 (2026-04-19).*

---

## Normative keywords (RFC 2119)

Used in `TELOS_FRAMEWORK.md` when written in all capitals:

| Keyword | Meaning |
|---|---|
| **MUST** / **SHALL** / **REQUIRED** | Absolute requirement |
| **MUST NOT** / **SHALL NOT** | Absolute prohibition |
| **SHOULD** / **RECOMMENDED** | Strong recommendation; deviations require documented justification |
| **SHOULD NOT** / **NOT RECOMMENDED** | Discouraged; deviations must be justified |
| **MAY** / **OPTIONAL** | Genuinely optional |

---

## The primitive catalog

### Core

| Primitive | One-line definition |
|---|---|
| **Process** | Any state-changing activity. MUST have exactly one Accountable Actor. |
| **Actor** | Participant with accountability. Five types (team, user, agent, system, process). |
| **Tool** | Capability without accountability. MUST NOT carry a Contract. |
| **State** | Belief distribution + provenance. |

### Autonomy spectrum (for AI agents)

| Level | Name | Accountable | Role of the human |
|---|---|---|---|
| L0 | Tool | Human | Invokes directly |
| L1 | Semi-agent, human-led | Human | Reviews every decision |
| L2 | Semi-agent, agent-led | Agent | Approves at checkpoints |
| L3 | Autonomous | Agent | Only on escalation |

### Specification family

| Primitive | Meaning | Negotiable? |
|---|---|---|
| Goal | Target distribution with tolerance | Yes (can be missed) |
| Requirement | Hard constraint | Only through explicit process |
| Contract | Per-process promise, ex-ante | Only through re-declaration |
| Invariant | Always true, law of the system | No — never |

Scope is a *set of Requirements* of the form "we do X / we do not do Y". Not a primitive.

### Goal subtypes

| Subtype | Horizon | Shape | Role |
|---|---|---|---|
| Vision | Indefinite | Direction | Generate goals |
| Mission | Ongoing | Purpose | Inform goals |
| Strategic | 1–3 years | Range | Company level |
| Tactical | Quarter | Range | Team level |
| Operational | Weeks | Range or point | Process level |

### Observation family

| Primitive | Definition | Checkability |
|---|---|---|
| Signal | Raw observation | Raw |
| Event | Discrete structured occurrence | Via log |
| Metric | Aggregation | Via re-aggregation |
| Fact | Persisted observation | Via history |
| Evidence | Fact + epistemic level | Varies (see grades) |
| Proof | Mechanically-checkable Evidence | Mechanical |

### Metric subtypes

| Subtype | Meaning | Example |
|---|---|---|
| Metric.Leading | Early indicator during execution | CTR at day 1 of a 7-day campaign |
| Metric.Lagging | Terminal indicator at/after completion | Retention measured at end of quarter |
| Metric.Balancing | Held ~constant; guards against collateral damage | Complaint rate while optimizing conversions |

Every Contract SHOULD declare at least one Leading or Lagging metric. Every Contract whose execution risks collateral damage SHOULD declare one or more Balancing metrics.

### Evidence grades

| Grade | Meaning | Independent check? |
|---|---|---|
| Attested | Sign-off | No |
| Signaled | Metric threshold | Re-read metric |
| Witnessed | Logged event | Re-read log (trust logger) |
| Mechanical | Proof | Yes — re-derive |

### Relations

| Relation | Definition |
|---|---|
| Dependency | X needs Y's output |
| Provenance | Fact produced by process run |
| Ownership | Actor accountable for goal/process |
| Causation | X causally influences Y (Pearl) |

### Time

| Primitive | Meaning |
|---|---|
| Moment | Point in time |
| Interval | Duration |
| Cadence | Recurring pattern |
| Deadline | Moment by which truth must hold |

### What is NOT primitive

| Concept | Reduces to |
|---|---|
| Decision | Fact + Ownership + context |
| Hypothesis | Unverified Contract |
| Experiment | Process testing a Hypothesis |
| Risk | Distribution with tail in bad outcomes |
| Knowledge | Consolidated Facts |
| Asset | State with long lifespan |
| Document | Wrapper around Goal/Requirement/Invariant |
| KPI | Metric with importance flag |
| SLA / SLO | Contract on system behavior |

---

## Contract fields (§26)

A Contract MUST declare:

| Field | Meaning |
|---|---|
| Expected output distribution | Shape of outcome in probability space |
| Tolerance | Acceptable deviation |
| Conditions | Preconditions under which the Contract holds |
| **Causal mechanism** | *Why* the Contract is expected to hold (the "because" clause) |
| Verification method | Which metrics/events/facts are consulted |
| Deadline | By when it MUST be verified |

Optional declarative form (§26.1):

> **If** [intervention], **then** [expected change], **because** [mechanism], **then** [measurable impact within tolerance].

---

## Telos-Purity — the four conditions

A workflow is Telos-pure iff ALL four hold simultaneously:

1. **Monadic (Kleisli)** — same input distribution → same output distribution.
2. **Causal (Pearl)** — effect only through declared inputs and mechanism.
3. **Contractual** — probabilistic Contract declared ex-ante.
4. **Verifiable** — Contract empirically checked ex-post.

Determinism is the Dirac case. Classical FP purity is the Dirac case of Telos-purity.

---

## Composition rules

### Process composition

- **Sequential** — B starts when A completes (via Dependency).
- **Parallel** — A and B run together (DEFAULT).
- **Nested** — A contains B (A cannot complete until B does).

### Contract composition

The parent's Contract is **not** the conjunction of children's. The parent MUST declare its own; children's outcomes feed verification.

### Evidence composition — the weakest link

If any child produced Evidence (not Proof), the parent's Evidence MUST also be Evidence, graded at the weakest child's level. **Proof MUST NOT emerge from Evidence inputs.**

---

## Process lifecycle

```
Declared ─→ Running ─→ Verified
                    ╲→ Violated
                    ╲→ Cancelled
                    ╲→ Failed
```

Each transition is a Fact, recorded.

---

## Actor vs. Tool — the distinguishing question

**Who is accountable for the outcome?**

- The entity itself → **Actor** (has Contract)
- The invoker → **Tool** (no Contract)

**Sub-actor vs. Tool:** a sub-actor has its own Contract on the invocation; a Tool does not.

---

## Methodology library (built-in, informative — §40)

| Methodology | Role |
|---|---|
| OKR | Goal hierarchy |
| Impact Mapping | Goal → actor → behavior → deliverable |
| JTBD (Jobs to be Done) | True customer goals |
| OST (Opportunity Solution Trees) | Hypothesis → experiment |
| Lean / Build-Measure-Learn | Improvement cycle |
| Kanban | Parallel execution flow |

Methodologies are composable (e.g., OKR + Impact Mapping + Kanban). Custom methodologies are declarable as Process templates.

---

## Conformance classes (Part XI)

| Class | Name | Scope |
|---|---|---|
| A | Core | Primitives + Telos-purity + Contracts + Evidence grading + Provenance |
| B | Standard | Class A + L0–L2 autonomy + ≥2 built-in methodologies + Saga failure handling |
| C | Full | Class B + L3 autonomy + all 6 built-in methodologies + custom methodology + reflexive meta-processes + full Cadence |

Class A requirements (CF-001…CF-012) are MUST. CF-101…CF-109 are SHOULD. CF-201…CF-206 are MAY. See §53–§55.

**Non-conformance:** An implementation failing any MUST clause is not Telos.

---

## Stability tiers per Part (§58)

| Part | Stability |
|---|---|
| I Foundations | Stable |
| II Primitives | Stable |
| III Telos-Purity | Stable |
| IV Process Model | Stable |
| V Contract Model | Stable |
| VI Evidence Model | Stable |
| VII Actor Model | Stable |
| VIII Methodology Layer | Beta |
| IX Execution Semantics | Alpha |
| X Reflexivity | Stable |
| XI Conformance | Beta (Class A MUST clauses are Stable) |

- **Stable** — changes require major version bump.
- **Beta** — clauses may change in minor versions with revision notes.
- **Alpha** — under active design; may change freely.

Deprecation window: at least **two minor versions** before removal.

---

## Founding goal checklist

Telos exists when it can:

- [ ] Accept a high-level company goal
- [ ] Decompose via a chosen methodology
- [ ] Assign Actors at appropriate autonomy level
- [ ] Execute in parallel with probabilistic Contracts (with causal mechanism)
- [ ] Run control processes
- [ ] Run analysis processes
- [ ] Run improvement processes
- [ ] Handle failures, cancellations, compensations
- [ ] Be fully reproducible

...for **one real goal of one real company**.

---

## Five dimensions of novelty (comparison axes, §8)

1. Unified primitive (Process)
2. Probabilistic Contracts (with causal mechanism)
3. Agent autonomy spectrum (L0–L3)
4. Reflexivity
5. Harness-first

Use these axes to compare Telos to existing tools. Avoid feature-by-feature comparison — it misses the point.

---

## Scaling pattern summary (Appendix C)

| Size | Typical Class | Methodologies | Tree depth | Parallel processes | Reflexive layer |
|---|---|---|---|---|---|
| **Small** (≤ 10) | A or B | 1 | 2–3 | < 10 | Quarterly |
| **Mid** (10–200) | B | 2–4 composed | 3–4 | 10–100 | Weekly |
| **Enterprise** (200+) | C | 3+ composed | 5–6 | 100+ | Continuous |

What grows with scale: **cardinality, depth, and the weight of the reflexive layer.** What stays constant: the primitives and rules.

See `TELOS_FRAMEWORK.md` Appendix C for worked examples at each scale.

---

*End of reference. Aligned with TELOS_FRAMEWORK.md v0.2.*
