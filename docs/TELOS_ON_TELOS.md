# Telos on Telos — Live Declaration

*The Telos project declared in Telos Framework v0.2.1 terms.*

*This document closes gap G-8 from stress test §6.3. It is reflexivity in practice, not theory. If the Framework cannot describe the Telos project itself, the Framework is not ready.*

*Status: **live**. Updated as goals advance.*

---

## 0. Context

The Telos project builds the Telos Framework and its harness. As of 2026-04-19, the Framework is at v0.2.1; no harness exists yet. This declaration captures the current operational goal ("ship Session One") using the Framework's own primitives: Goal, Actor, Tool, Contract, Evidence, Metric.Leading/Lagging/Balancing, Requirement, Invariant, Scope, causal_mechanism.

---

## 1. Vision

**Goal.Vision.** *Every goal-oriented company operates on a probabilistic, AI-native, self-improving substrate. The fragmented tooling of today — Jira, OKR platforms, BPMN engines, observability stacks — collapses into one primitive: Process.*

Horizon: indefinite. Shape: direction (not point target). Qualitative. Role: generate other goals.

## 2. Mission

**Goal.Mission.** *Build and give away the open substrate for probabilistic, AI-native, self-improving company management, and prove it by running it on real companies of every size.*

Horizon: ongoing.

## 3. Strategic (2026)

**Goal.Strategic.** *Ship Telos v1.0 as a usable Framework + harness + methodology library, demonstrated end-to-end on the Telos team itself and at least one external adopter, by 2026-12-31, probability ≥ 60%.*

Horizon: 8 months. Shape: range.

Metrics:
- `Metric.Lagging` — harness runs the 9-step cycle on one real external goal by 2026-12-31.
- `Metric.Leading` — Session One (technical foundation) shipped by 2026-05-17.
- `Metric.Balancing` — Framework MUST clauses (CF-001…CF-012) remain unbroken across the year (no silent Class A regressions).

---

## 4. Active Tactical Goal — Ship Session One (next 4 weeks)

**Goal.Tactical.** *Ship Session One by 2026-05-17 (4 weeks from 2026-04-19): host language chosen with documented rationale; `.telos/` declaration format v0.1 drafted; execution model sketched; Impact Mapping process template designed. Probability ≥ 70%.*

Horizon: 4 weeks. Shape: range (4 deliverables; 3/4 counts as partial success, 2/4 as failure).

**Methodology:** Impact Mapping.

- **Why** (Goal): unblock technical work on Telos; paper-only Framework cannot be validated without a runnable harness.
- **Who** (Actors): Telos team (user) as Accountable; Claude-as-agent at L1–L2 as Executing; external reference materials (existing methodology docs, language ecosystems) as Tools.
- **How** (behavior change): team transitions from theory-only to theory-plus-implementation; ambient uncertainty ("which language? which format?") becomes declared commitments with contracts.
- **What** (deliverables): four Operational Goals — one per Session One deliverable (§5.1–§5.4).

---

## 5. Operational Goals (leaf Processes)

Each is a Process with a full Contract per Framework §26.

### 5.1. Choose host language

**Accountable Actor:** user (human).
**Executing Actors:** user; Claude-as-agent at L1 for research, trade-off compilation, candidate comparison.
**Tools:** language ecosystem docs, existing benchmarks, community forums.
**Autonomy level (for Claude):** L1 — user reviews every recommendation.

**Contract.**
> **If** we evaluate three candidate languages (Python, TypeScript, Rust) against Telos requirements (typed workflows; strong concurrency; AI-agent ecosystem; Claude's familiarity; community strength), **then** a language is chosen with documented rationale in `docs/SESSION_ONE.md`, with probability ≥ 90%, **because** three candidates is enough variety to expose trade-offs, the criteria are finite and decidable, and the user has strong opinions in the relevant domain — convergence is fast when the tradeoff matrix is written out. **Then** a decision is recorded by the deadline.

- `Metric.Leading`: number of candidates evaluated to depth (target: 3).
- `Metric.Lagging`: decision committed in `docs/SESSION_ONE.md` by the deadline.
- `Metric.Balancing`: hours spent on decision (target band: 2–5 hours — guard against bikeshedding).
- **Evidence:** `Attested` (user signs off on rationale doc) + `Witnessed` (commit is the log event).
- **Deadline:** 2026-04-26 (end of week 1).
- **Failure policy:** if no decision by the deadline, cancel downstream Processes and re-negotiate Tactical timeline with user.

### 5.2. Design `.telos/` declaration format v0.1

**Accountable Actor:** user.
**Executing Actors:** user; Claude-as-agent at L2 for format drafting and iteration.
**Tools:** this `TELOS_ON_TELOS.md` file (as canonical declaration target), schema validation tools in the chosen language.
**Autonomy level (for Claude):** L2 — user approves at draft-level checkpoints.
**Dependency:** requires §5.1 (language choice).

**Contract.**
> **If** Claude drafts a declaration format (schema + examples) and iterates with the user, **then** the format can encode this `TELOS_ON_TELOS.md` declaration with zero manual translation, round-tripping text → parsed → tree → text with semantic equivalence, probability ≥ 65%, **because** having a concrete test case (this file) constrains the format design away from over-abstraction; Claude can generate candidates at speed; the user can critique against a real artifact. **Then** a format draft exists and passes the round-trip check on this document.

- `Metric.Leading`: format covers Goal, Contract, Actor, Methodology, Evidence.
- `Metric.Lagging`: round-trip test passes on this TELOS_ON_TELOS declaration.
- `Metric.Balancing`: verbosity — average lines per Process in the declaration (target: ≤ 30 lines; avoid XML-like bloat).
- **Evidence:** `Proof` (round-trip script exits zero) + `Attested` (user approves format).
- **Deadline:** 2026-05-10 (end of week 3).
- **Failure policy:** compensate by adopting an existing schema (YAML with JSON Schema validation) and publishing as v0 rather than v0.1; Session One ships with lesser format but unblocks downstream work.

### 5.3. Sketch execution model

**Accountable Actor:** user.
**Executing Actors:** user; Claude-as-agent at L1 for drafting, pseudocode, diagrams.
**Tools:** existing execution engines as reference (BPMN, Temporal, Airflow) — read for patterns, not copied.
**Autonomy level (for Claude):** L1.

**Contract.**
> **If** we draft an execution-model document covering (1) Process graph traversal, (2) scheduling with parallelism-by-default, (3) Evidence collection pipeline, (4) Contract verification, (5) failure-handling and Saga, **then** the document is specific enough for an engineer to begin implementation without ambiguity, probability ≥ 70%, **because** each of the five areas already has a paragraph in the Framework (§40–§48) that needs only concrete operationalization; prior art (Temporal, BPMN) provides known-good patterns to adapt; the user has strong architectural instincts to prune over-engineering. **Then** `docs/EXECUTION_MODEL_SKETCH.md` exists, 3–6 pages, and an engineer reading it can start coding.

- `Metric.Leading`: all five sub-areas have a section.
- `Metric.Lagging`: implementable-by-others check — Claude-as-external-reviewer rates the sketch "ready to code" at threshold.
- `Metric.Balancing`: page count (3–6 pages; over-engineering tripwire).
- **Evidence:** `Attested` (user + reviewer sign-off) + `Witnessed` (commit log).
- **Deadline:** 2026-05-10 (end of week 3).
- **Failure policy:** continue; narrow the sketch to (1) graph traversal + (2) scheduling only; defer (3)–(5) to Session Two.

### 5.4. Design Impact Mapping process template

**Accountable Actor:** user.
**Executing Actors:** Claude-as-agent at L2 (drafting template), user (reviewing).
**Tools:** Adzic's Impact Mapping book (reference); this TELOS_ON_TELOS declaration (test case).
**Autonomy level (for Claude):** L2.
**Dependency:** requires §5.2 (declaration format) for concrete encoding.

**Contract.**
> **If** Claude drafts an Impact Mapping process template encoding `Why → Who → How → What → Contract`, **then** the template instantiates into a valid process tree that reproduces this TELOS_ON_TELOS decomposition (§4 → §5.1–§5.4) without manual editing, probability ≥ 75%, **because** Impact Mapping's four layers map cleanly onto Telos primitives (Why=Goal, Who=Actor, How=behavior change, What=Deliverable/Contract); the test case is already fully written in §4–§5 above; iteration converges when the target artifact is fixed. **Then** the template is committed to `docs/METHODOLOGY_IMPACT_MAPPING.md` and passes the reproduction test.

- `Metric.Leading`: template covers all four Impact Mapping layers.
- `Metric.Lagging`: template reproduces §4→§5 decomposition.
- `Metric.Balancing`: template verbosity (target ≤ 150 lines).
- **Evidence:** `Proof` (reproduction script passes) + `Attested` (user approves).
- **Deadline:** 2026-05-17 (end of week 4).
- **Failure policy:** continue without this deliverable; Session Two starts with Impact Mapping as its first task.

---

## 6. Requirements

*Hard constraints for Session One:*

- **R-1.** Declaration format MUST support the `if/then/because/then` Contract form (§26.1).
- **R-2.** Harness MUST be runnable on a developer laptop within one command once Session One ships through to a first implementation phase.
- **R-3.** All Session One artifacts MUST live in git (no external dependencies for the founding goal).
- **R-4.** Every Process in any future Telos declaration MUST declare `causal_mechanism`.

## 7. Invariants

*Always true across all states of the Telos project:*

- **I-1.** No commit lands on `main` without explicit user review.
- **I-2.** No `Co-Authored-By` trailer or "Generated with …" footer appears in commit messages (cross-project user preference).
- **I-3.** No breaking change to Framework v0.2.1 Class A MUST clauses (CF-001…CF-012) without a major version bump.
- **I-4.** Autopoiesis is never elevated to a Goal. It remains a consequence of usefulness.

## 8. Scope

**In:**
- Framework specification, versioning, refinement.
- Minimal harness for executing one Contract end-to-end.
- `.telos/` declaration format v0.1.
- At least one methodology (Impact Mapping) as a working template.
- Dog-fooding on the Telos team's own goals.

**Out (at least for Session One):**
- Production-grade persistence / durability.
- Multi-tenant harness.
- Web UI.
- Integrations with external systems beyond git.
- External adopters (deferred to post-Session-One).
- Other methodologies (OKR, JTBD, OST, Lean, Kanban) — templates deferred.

Changes to Scope are themselves Processes per Framework §11.

---

## 9. Reproducibility

This declaration, all commits advancing it, and all Evidence produced in executing §5.1–§5.4 live in a single git repository. Any external observer can:

1. Clone `unknownlab/telos`.
2. Read `docs/TELOS_ON_TELOS.md` (this file).
3. Trace each Contract through git log to its Evidence commit (the `SESSION_ONE.md`, the format draft, the execution-model sketch, the Impact Mapping template).
4. Verify Deadlines, Metrics, and `causal_mechanism` claims against the artifacts and the calendar.

Reproducibility is `Witnessed` (commit history) + `Attested` (user sign-off recorded in the `Evidence` section of each artifact).

---

## 10. Dog-food observations (what writing this revealed about the Framework)

*Honest notes. If the Framework fails here, we need to fix it before Session One.*

1. **`causal_mechanism` earns its place immediately.** Writing four Contracts forced me to state the "because" for each. Each time, my first draft was mushy; the field pressured me to sharpen. Framework §26 pays off.

2. **`Metric.Balancing` on non-quality axes is natural.** "Time spent on decision" (§5.1), "verbosity" (§5.2, §5.4), "page count" (§5.3) are all valid Balancing metrics — they catch over-investment without requiring a separate concept. Framework §12.1 handles them cleanly, confirming the G-10 fix.

3. **Accountable Actor = user on every leaf.** For a one-person-plus-agent team, the user is always the Accountable. Claude is L1/L2 Executing. This fits §35 without contortion.

4. **Dependencies are natural.** §5.2 depends on §5.1 (language choice); §5.4 depends on §5.2 (format exists). Framework §25 handles explicit Dependencies with no awkwardness.

5. **Subject of §26.1 optional form.** The `If … then … because … then …` form felt useful for §5.2 and §5.4 where the "because" is load-bearing. It felt overkill for §5.1 where the rationale is simple. The form is correctly OPTIONAL (§26.1). Good.

6. **Failure policies force realism.** Writing the fallback ("what if we don't hit the deadline?") for each leaf surfaced the real question: "how does this initiative survive a missed deadline?" §29 handles this directly. One of the Framework's strongest clauses.

7. **Latent variable didn't bite at this scope.** The goal is concrete enough that every metric is observable. Confirms the stress-test reading that G-3 is deferrable for operational goals and bites at strategic/brand goals.

8. **Parent Contract aggregation (G-5) bit immediately.** What is the Tactical-Goal Contract's tolerance in §4? Each leaf has its own probability and tolerance. The Tactical says "3/4 deliverables counts as partial success." That aggregation is by-hand and not derived from children. G-5 is real; declared-by-vibe works for now but will scale poorly.

9. **The declaration is readable.** A new reader could probably pick up this file and understand the current Telos project status in ten minutes. That alone is a better artifact than most OKR tracker dashboards. Encouraging.

---

## 11. Review cadence

- **Weekly:** review progress on each of §5.1–§5.4 against Contract; record Evidence; update `Status` header.
- **At each Process completion:** record `Verified` or `Violated` in this document with a dated note.
- **At end of Tactical deadline (2026-05-17):** write retrospective section; update §4 status; decompose next Tactical from the Strategic.

---

*End of TELOS_ON_TELOS live declaration. Last updated 2026-04-19.*
