# Telos — Next Steps & Open Questions

*Compiled 2026-04-18 at the close of Session Zero. Read after `SESSION_ZERO.md`.*

*This document tracks where Telos is, what is still open, and what comes next. Update it at the end of each session.*

---

## 1. Summary of Session Zero

Session Zero established the conceptual foundation of Telos. The following decisions were made:

1. **Everything is a process.** Goal formation, methodology selection, execution, control, analysis, and improvement are all processes over the same primitive set. This gives Telos its reflexivity.

2. **Telos-purity** — the four-condition definition of purity in a probabilistic world (monadic, causal, contractual, empirically verifiable). Determinism is the degenerate Dirac case.

3. **Option C proof taxonomy** — `Proof` is reserved for mechanically checkable forms; non-mechanical forms are `Evidence` with internal gradation (`Witnessed`, `Signaled`, `Attested`). Composition propagates the weakest link across the Proof / Evidence boundary.

4. **Primitive taxonomy in six families** — Core (Process, Actor, Tool, State), Autonomy (L0–L3), Specification (Goal, Requirement, Contract, Invariant, Scope), Observation (Signal → Event → Metric → Fact → Evidence → Proof), Relations (Dependency, Provenance, Ownership, Causation), Time (Moment, Interval, Cadence, Deadline).

5. **Actor / Tool distinction.** The same entity can play either role depending on accountability. A sub-actor differs from a tool by the presence of its own contract.

6. **Agent autonomy spectrum (L0–L3).** A data-driven ladder: Tool → human-led semi-agent → agent-led semi-agent → autonomous. Movement along the ladder is itself a process, with evidence of reliability justifying promotion or demotion.

7. **Methodology library.** OKR, Impact Mapping, JTBD, OST, Lean / Build-Measure-Learn, Kanban — as composable process templates. Custom methodologies are declarable.

8. **Founding goal.** The full nine-step cycle on one real company goal, not self-hosting. Autopoiesis is a consequence.

9. **Five novelty dimensions.** Unified Process primitive, probabilistic contracts, autonomy spectrum, reflexivity, harness-first. These are used for comparison against existing tools rather than feature-by-feature comparison.

The conceptual foundation is complete. Implementation can now begin.

---

## 2. Open questions

### 2.1. Flagged in Session Zero — deferred

These were identified during Session Zero but deliberately not fixed. They should be revisited when concrete cases require resolution.

1. **Evidence ordering (ladder vs. lattice).** The current ordering of `Evidence` levels (`Witnessed` / `Signaled` / `Attested`) is not a strict total order. Real epistemic strength is context-dependent. Revisit when real cases require cross-level comparisons that the current ladder cannot express.

2. **Latent variable representation.** Workflows over latent state (brand, morale, market position) are principially closed by Telos-purity, but architectural representation of hidden variables and their distributions is not yet specified.

3. **Methodologies in detail.** Concrete process templates for OKR, Impact Mapping, JTBD, OST, Lean, Kanban have not yet been designed. Each will need its own dedicated design work.

### 2.2. Technical questions for the next session

These must be resolved before meaningful implementation can proceed.

4. **Declaration format.** What is the syntax of `.telos/` — YAML, a custom DSL, an embedded DSL in a host language (Python, TypeScript, Rust)? Must support: goal hierarchies, actor declarations, contract specifications, methodology selection.

5. **Storage / persistence.** How are `State`, `Facts`, `Events`, and `Evidence` stored and retrieved? Event sourcing? Relational? Document store? Hybrid?

6. **Execution model.** How do processes actually run — actor model, BPMN-like engine, a custom orchestrator, something else? How is parallelism expressed and managed?

7. **Contract verification engine.** How does the harness mechanically check contracts at execution time? What does a contract declaration look like in the chosen language?

8. **Evidence collection pipeline.** How are `Signals`, `Events`, `Metrics`, and `Attestations` ingested, graded to the right epistemic level, and stored as `Evidence`?

9. **Composition rules between methodologies.** When multiple methodologies are combined (for example OKR + Impact Mapping), how do they interact? Who owns the goal tree? How are conflicts resolved?

10. **Operational definition of reproducibility.** What does it mean precisely for Telos's output to be "reproducible"? Deterministic replay? Probabilistic equivalence within tolerance? Audit-trail level reproducibility?

### 2.3. Strategic questions

These shape the trajectory of the project but do not block the next session.

11. **First real external user.** Who is the first non-Telos-team company to use Telos? When?

12. **Commercial model.** Self-hosted? SaaS? Open source with a managed offering? Dual-license?

13. **Relationship to adjacent products.** Other products in the user's portfolio (harnessify, transoptima, uni) — how do they relate to Telos? Are they candidates to be harnessified first?

---

## 3. Next steps

### 3.1. Immediate — Session One: technical foundation

The next session should establish the minimal technical foundation:

1. **Choose the host language / platform.** Constraints: typed workflows, strong concurrency story, ecosystem for contract verification and evidence collection.
2. **Design the `.telos/` declaration format.** Must support goal hierarchies, actor declarations, contract specifications, and methodology selection.
3. **Sketch the execution model.** How does the harness actually invoke a process? Start with the simplest model that works end-to-end.
4. **Pick the first methodology to implement.** Recommendation: **Impact Mapping**, because it maps most directly to the Process tree model and is immediately visualizable.

### 3.2. Short-term — first MVP

1. **Implement L0 and L1 autonomy first.** Tool-mode and human-led semi-agent are the simplest; L2 and L3 require trust-building that depends on data gathered at L1.
2. **Implement mechanical proofs first, then evidence.** Start with a type-check of the declaration, then add logged evidence, then metric-based evidence, then attested evidence.
3. **Pick one real small goal to run.** Recommendation: a goal from the Telos team's own operation (for example, "ship Session One"). This is autopoietic *as a side effect*, not a goal in itself.
4. **Run the nine-step cycle end-to-end**, even minimally. One cycle on one real goal is the founding goal achieved.

### 3.3. Medium-term

1. Add more methodologies one at a time (OKR next, then Kanban for execution flow).
2. Add L2 autonomy in domains where L1 evidence justifies it.
3. Build the reflexive layer — processes that analyze processes and recommend improvements.
4. Bring in the first external user.

### 3.4. Long-term

1. L3 autonomy in low-risk domains, once multi-cycle evidence justifies it.
2. Lattice replacement for the Evidence ladder when cross-level comparisons arise.
3. Explicit latent-variable modeling when the first workflow genuinely requires it.
4. Commercial readiness.

---

## 4. How to use this document

- Before starting a new session, skim §1 for where we are, §2 for what is open, §3 for what comes next.
- When a question in §2.1–§2.3 is resolved, move the decision to the relevant section of `SESSION_ZERO.md` with rationale, and mark the question closed here.
- When a next step in §3 is completed, mark it done here and reference the commit or artifact that completed it.
- This document is a living status record. It should never be allowed to go stale.

---

---

## 5. Framework v0.2 (2026-04-19) — completed items

The following were completed in the v0.2 revision of `TELOS_FRAMEWORK.md`, in response to a structural critique against methodology best practices (Scrum Guide, RFC 2119, BPMN, ITIL, DDD, Kubernetes API conventions):

- [x] **RFC 2119 normative keywords** introduced in Preface and applied throughout.
- [x] **§Scope, §Normative references, §Terms** added in ISO-style preliminaries (30+ normative terms defined in §3).
- [x] **Big Picture diagram** (§4.1, ASCII) — single canonical visual of the Goal → Contract → Process → Evidence → Fact → State flow, with the harness as enclosure.
- [x] **Worked Telos-purity examples** (§20) — 1 compliant re-engagement-campaign example + 4 failing examples, one per purity condition.
- [x] **Part XI — Conformance** — three classes (A Core, B Standard, C Full) + 12 MUST clauses (CF-001…CF-012) + 9 SHOULD clauses + 6 MAY clauses. Makes the "not Telos" claim falsifiable.
- [x] **Revision history + stability tiers + deprecation policy** (§57–§60) — per-Part stability classification, two-minor-version deprecation window, amendment rule tying major-version bumps to Class A changes.

v0.2 also absorbed best ideas from an adjacent strategic-planning methodology without naming it:

- [x] **`causal_mechanism` field added to Contract** (§26) — the "because" clause making the causal reasoning explicit and critiquable. Optional declarative form `If … then … because … then …` in §26.1.
- [x] **`Metric.Leading`, `Metric.Lagging`, `Metric.Balancing` subtypes** added (§12.1). Balancing metrics are a new concept in the Framework — held constant to detect collateral damage from optimizing other metrics.
- [x] **Class A MUST clauses** explicitly include causal purity (CF-006); SHOULD-level CF-106 requires accepting `causal_mechanism` in Contracts.

Added after the v0.2 structural hardening:

- [x] **Appendix C — Scaling examples** in `TELOS_FRAMEWORK.md`. Three worked examples at small (≤ 10 people), mid (10–200), and enterprise (200+) scale, each with full goal tree, actor mix, contract example, evidence distribution, scale mechanisms engaged, and conformance class. Closing summary table in C.4 maps scale to Class / methodology count / tree depth / parallelism / reflexive cadence. Reference doc also gets the summary table.

### Open items remaining from §2 and §3 above

None of the items in §2 (Open questions) or §3 (Next steps) are invalidated by v0.2. The technical questions (declaration format, storage, execution model, contract verification engine, evidence pipeline, methodology composition, reproducibility) remain for Session One.

---

*End of document. Telos is now ready to move from concept to construction. Framework is at v0.2.*
