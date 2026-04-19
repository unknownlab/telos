# Telos

A framework for goal-oriented companies operating in a probabilistic world.

---

## One-sentence summary

Telos is a substrate that gives proven organizational methodologies three things they do not have today: **mathematical rigor for uncertainty, AI-native executability, and the ability to improve themselves.**

---

## Documents

### Theory — the methodology itself

- **[TELOS_FRAMEWORK.md](TELOS_FRAMEWORK.md)** — the complete methodology. The theory. Ten parts, from foundations to reflexivity. **Start here for the theory.**
- **[TELOS_REFERENCE.md](TELOS_REFERENCE.md)** — the quick reference. Primitive catalog, rules, composition tables.
- **[TELOS_GLOSSARY.md](TELOS_GLOSSARY.md)** — every term defined, alphabetical.
- **[TELOS_INSTRUCTIONS.md](TELOS_INSTRUCTIONS.md)** — the how-to. Thirteen steps for applying Telos to a real company.

### Orientation

- **[USER_GUIDE.md](USER_GUIDE.md)** — plain-English introduction for anyone, technical or not.

### Design history and status

- **[SESSION_ZERO.md](SESSION_ZERO.md)** — the design rationale. Why each decision was made, with quotes from the founding discussion.
- **[NEXT_STEPS.md](NEXT_STEPS.md)** — summary, open questions, roadmap, current work.

### Dog-food — live declaration

- **[TELOS_ON_TELOS.md](TELOS_ON_TELOS.md)** — the Telos project declared in Telos Framework v0.2.1 terms. Current Tactical goal ("ship Session One") fully decomposed with Contracts, actors, metrics, deadlines. Reflexivity in practice.

---

## Quick orientation

| If you are... | Read |
|---|---|
| First time hearing about Telos | `USER_GUIDE.md` |
| Learning the theory | `TELOS_FRAMEWORK.md` |
| Applying Telos to a company | `TELOS_FRAMEWORK.md` → `TELOS_INSTRUCTIONS.md` |
| Implementing the Telos harness | All theory documents + `SESSION_ZERO.md` + `NEXT_STEPS.md` |
| Looking up a term | `TELOS_GLOSSARY.md` |
| Looking up a rule or primitive | `TELOS_REFERENCE.md` |
| Asking "why this decision?" | `SESSION_ZERO.md` |
| Asking "what's next?" | `NEXT_STEPS.md` |

---

## Versioning

Telos is an active project. Documents in this repository are versioned:

- **Version 0.1** (2026-04-18) — established at the close of Session Zero. Conceptual foundation complete. Implementation has not begun.
- **Version 0.2** (2026-04-19) — Framework hardened against methodology-spec best practices. Added: RFC 2119 normative keywords + tagged clauses; §Scope / §Normative references / §Terms (ISO-style); Big Picture diagram; `Metric.Leading / Lagging / Balancing` subtypes; `causal_mechanism` field in Contract (optional if/then/because/then declaration form); worked Telos-purity examples (1 compliant + 4 failing); Part XI Conformance with Class A/B/C and clause IDs (CF-001…CF-206); Revision history, stability tiers per Part, deprecation policy. See `TELOS_FRAMEWORK.md` §57 for the full change log.
- **Version 0.2.1** (2026-04-19) — stress-test finalization after four paper scenarios + five cross-cutting tests. Four blocking gaps closed; eleven non-blocking gaps tracked in `NEXT_STEPS.md §6`. Framework is now **Ready with caveats** for Session One.

Subsequent versions will be recorded here with dates and principal changes.

---

*Any session working on Telos must read the four theory documents (`TELOS_FRAMEWORK.md`, `TELOS_REFERENCE.md`, `TELOS_GLOSSARY.md`, `TELOS_INSTRUCTIONS.md`) before proposing technical decisions or writing code. If deeper rationale is needed, also read `SESSION_ZERO.md`.*
