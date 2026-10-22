---
id: evolution-of-determinism
title: Evolution of Determinism
kind: doctrine
status: provisional
maturity: vision
summary: Intelligence explores uncertainty, engineering turns discoveries into verifiable rules, and evolution makes those rules reusable.
related:
  [
    P07-evolution-is-fundamental,
    P09-evidence-before-acceptance,
    P10-uncertainty-must-be-explicit,
    P14-incremental-formalization,
    witness,
    verdict,
    law,
    evolution,
  ]
---

# Evolution of Determinism

> **Intelligence explores uncertainty. Engineering turns discoveries into verifiable rules. Evolution makes those rules reusable.**

This is the philosophical foundation of Telos. It explains what the framework is for. It is not a mechanism, and nothing in this document is implemented by code. The mechanisms that may realise it are listed in [§8](#8-philosophy-and-mechanisms) with their maturity.

## 1. The claim

Software engineering keeps rediscovering what it already knew. A team learns that a payment must never be captured twice, that timestamps crossing a service boundary must carry a zone, that a migration must be reversible before it runs. The lesson lives in someone's memory, a chat log, a code review comment or a test nobody connects to the reason it exists. Then the team changes, the context is lost, and the lesson is learned again, often in production.

AI agents make this sharper. An agent can explore a problem quickly and find a working answer by probabilistic reasoning. If the answer disappears with the session, the next agent explores the same ground again, at the same cost and with the same risk of being wrong.

Evolution of Determinism proposes that a software system should **accumulate verifiable engineering knowledge** as it evolves. Discoveries, however they are made, should be able to become explicit, checkable, reusable rules with a known scope, and later work should build on those rules instead of rediscovering them.

The purpose is **not** to make all software behaviour deterministic, and not to remove probabilistic intelligence from engineering. Exploration under uncertainty stays essential. The purpose is to keep growing, and keep correcting, the part of engineering knowledge that is formalised, reproducible and verifiable.

## 2. Terms used here

- **Deterministic procedure**: a procedure that, given the same inputs and the same environment, produces the same result. Determinism is about **reproducibility**. It says nothing about whether the result is right.
- **Formalised knowledge**: knowledge written in a form a machine can check, such as a type, a contract, a schema, a [Law](../terminology/law.md) or an executable specification, together with the scope in which it is claimed to hold.
- **Verification**: running a procedure that produces evidence ([Witness](../terminology/witness.md)) about whether formalised knowledge holds for a given subject, revision and environment.
- **Domain of determinism**: the set of engineering questions about a system that can currently be answered by a deterministic procedure whose validity conditions are known. "Does this Locus have an owner?" is inside it once ownership is modelled and checked. "Is this design good?" is mostly outside it.

The philosophy is about moving the boundary of that domain outward, and also moving it back when something inside turns out to be wrong.

## 3. The cycle

```text
Unknown
   ↓
Exploration
   ↓
Hypothesis
   ↓
Formalization
   ↓
Verification
   ↓
Reusable Knowledge
   ↓
Executable Constraints
   ↓
New Evolution ──→ (back to Unknown, with a larger known domain)
```

The arrows show the usual direction, not a mandatory sequence. Any step can fail and send work back, and accepted knowledge can later be invalidated (see [§5](#5-limitations)).

| Stage                  | What enters                         | What happens                                                                                                   | Typical actor                     | What leaves, in Telos terms                                                                   |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| Unknown                | A need, a failure, a question       | It is recorded as unknown, not hidden.                                                                         | Anyone                            | An explicit open question                                                                     |
| Exploration            | The open question                   | Search, experiment, read, prototype. Probabilistic reasoning is welcome here.                                  | Agents, humans                    | Observations, candidate approaches                                                            |
| Hypothesis             | Candidate approaches                | One candidate is stated precisely enough to be wrong.                                                          | Agents, humans                    | A [Variant](../terminology/variant.md) and a claim about it                                   |
| Formalization          | The claim                           | The claim becomes something checkable: a contract, a Law, a specification with stable identity and scope.      | Agents, humans                    | A checkable statement with its applicability                                                  |
| Verification           | The checkable statement and subject | Deterministic or controlled procedures produce evidence.                                                       | Deterministic tools, reviewers    | [Witnesses](../terminology/witness.md): pass, fail, inconclusive                              |
| Reusable Knowledge     | Witnesses and policy                | A decision is made on the evidence. Accepted knowledge is recorded with its scope, provenance and assumptions. | Governance, humans with authority | A [Verdict](../terminology/verdict.md); a new accepted [Revision](../terminology/revision.md) |
| Executable Constraints | Accepted knowledge                  | Knowledge that should keep holding is enforced automatically on future change.                                 | The framework                     | A [Law](../terminology/law.md) with an enforcement mechanism, a reusable Locus or Archetype   |
| New Evolution          | A system with more known structure  | The next change starts from what is known instead of from zero.                                                | Everyone                          | A smaller unknown, and new unknowns the change reveals                                        |

Two things are worth noticing.

First, the cycle **separates who explores from what accepts**. An agent may produce a brilliant hypothesis; that does not make it accepted knowledge. Acceptance follows evidence and policy, under authority the explorer may not hold ([P12](../principles/P12-independent-governance.md)).

Second, the cycle **produces machinery, not only documents**. The end of a successful cycle is a constraint that runs on its own: a check, a type, a Law with enforcement, a reusable component. Documentation is linked to that machinery or generated from it ([P01](../principles/P01-everything-is-code.md)).

## 4. Assumptions

The philosophy rests on assumptions. They are stated so they can be challenged.

| #   | Assumption                                                                                                                   | If it is false                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | A useful share of engineering knowledge can be formalised at a cost lower than the cost of rediscovering it.                 | Formalisation is busywork. Telos should formalise less and only where rediscovery is expensive.                                        |
| A2  | Knowledge can be scoped: a rule can state where it applies, and that statement can itself be checked or reviewed.            | Rules leak beyond their validity and do harm. Scoping becomes the central research problem.                                            |
| A3  | Evidence can carry enough provenance (what, which revision, which environment, which method) to tell later what it supports. | Evidence cannot be reused across changes; every change needs full re-verification.                                                     |
| A4  | Most changes touch a small part of a system, so verification can be targeted.                                                | Contextual verification ([P11](../principles/P11-verification-is-contextual.md)) saves little.                                         |
| A5  | Agents and humans can work through bounded capabilities without losing the ability to explore.                               | Capability boundaries ([P05](../principles/P05-capabilities-instead-of-arbitrary-tools.md)) would cripple exploration and be bypassed. |
| A6  | The verification procedures are themselves trustworthy enough, and can be improved by the same cycle.                        | The system accumulates confident errors. Verifiers need independent checks.                                                            |

## 5. Limitations

These limits are part of the doctrine, not footnotes to it.

1. **Reproducibility is not correctness.** A deterministic check reproduces the same answer, including the same wrong answer. A specification can encode a misunderstanding perfectly.
2. **Passing tests is not proof.** A test samples behaviour. Formal methods prove properties of models under assumptions. Neither establishes that a system is correct in the world. Telos records what evidence supports, not more.
3. **Not everything is decidable.** Many interesting properties of programs are undecidable in general (Rice's theorem). Some questions will stay outside the domain of determinism for good, and are handled by review, experiment or judgement.
4. **Knowledge expires.** A rule written for one library version, one regulation or one load profile can become false. Accepted knowledge needs a way to be revised, deprecated and retired, and the evidence behind it has validity conditions that can lapse.
5. **Rules have limited applicability.** A discovery that holds in one Locus may be false in another. Promoting a local finding to a universal Law is itself a claim that needs evidence.
6. **Not every discovery should become a rule.** Some findings are cheap to rediscover, rarely needed or too context-dependent. Over-formalisation makes systems rigid and slows legitimate change.
7. **Measures become targets.** Once a rule is enforced, work optimises to pass it. A rule can be satisfied while its intent is violated (Goodhart's law). Rules need review against their purpose, not only against their checks.
8. **New knowledge can overturn old knowledge.** Accepting a Verdict does not freeze the truth. The system must keep the ability to discover that it was wrong, and to say which later decisions depended on the mistaken one.

## 6. Consequences for engineering

If the philosophy is taken seriously, these follow. Each consequence is carried by one or more principles.

- **Evidence carries provenance.** A result without its subject, revision, environment and method is not reusable evidence ([P09](../principles/P09-evidence-before-acceptance.md)).
- **Unknown stays visible.** Missing evidence is shown as missing, never as passing ([P10](../principles/P10-uncertainty-must-be-explicit.md)).
- **Knowledge has scope and lifecycle.** Laws and accepted facts say where they apply, and they can be proposed, enforced, deprecated and retired.
- **Formalisation is incremental.** Narrative intent is a legitimate starting point, refined over time into contracts and checks ([P14](../principles/P14-incremental-formalization.md)).
- **Baselines are preserved.** A change proposes a future state; it does not overwrite the accepted one ([P08](../principles/P08-preserve-the-baseline.md)).
- **Acceptance is separate from production.** Whoever builds a change does not alone decide that it is accepted ([P12](../principles/P12-independent-governance.md)).
- **Humans set purpose and limits.** Objectives, acceptable risk and reserved authority come from people ([P13](../principles/P13-human-as-strategic-authority.md)).
- **The framework applies the cycle to itself**, as fast as it becomes trustworthy and no faster ([P16](../principles/P16-self-application.md)).

## 7. Relationship to software evolution

Lehman's laws of software evolution observe that a system used in the real world must keep changing or become less useful, and that its complexity grows unless work is done to reduce it. Conventional practice accepts this and fights the cost with discipline and documentation that drifts.

Telos takes the observation as a design input. Change is the normal state ([P07](../principles/P07-evolution-is-fundamental.md)). What can be improved is what each change leaves behind. A change that only edits code leaves the next change no wiser. A change that also records why, what it assumed, what evidence it produced and which constraints it established makes the next change cheaper and safer. Evolution of Determinism names that second kind of change as the goal.

## 8. Philosophy and mechanisms

The philosophy is a commitment. Mechanisms are engineering choices that may implement it, may be replaced, and must not silently redefine it. The table lists candidate mechanisms and their maturity on this branch.

| Commitment                                | Candidate mechanism                                                                       | Maturity                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Every artifact has a meaning and an owner | Locus identity, Charter, single owner ([conceptual model](../conceptual-model/README.md)) | `proposed`; first implementation is the Stage 0 mission |
| Accepted states are preserved             | Immutable, content-addressed Revisions; baseline advances by compare-and-set              | `implemented`; Stage 0 mission                          |
| Change effects are identifiable           | Semantic diff between Revisions                                                           | `implemented`; Stage 0 mission                          |
| Behaviour is specified, not assumed       | Executable specifications with stable IDs                                                 | `implemented`; Stage 0 mission (temporary form)         |
| Evidence is distinct from decision        | Witness and Verdict as separate records                                                   | `vision`                                                |
| Knowledge is scoped and enforceable       | Laws with applicability and enforcement                                                   | `vision`                                                |
| Authority is explicit and bounded         | Acts and Mandates                                                                         | `vision`                                                |
| Verification is targeted                  | Relation-based impact analysis and risk-driven check selection                            | `vision`                                                |
| Change is governed                        | Evolution: Variant → Witnesses → Verdict → Revision                                       | `vision`; today approximated by Spec Kitty missions     |

## 9. Worked examples

These examples are illustrations, not features.

**A discovery becomes a Law.** An agent fixing a billing bug finds that two services disagree about whether timestamps are local or UTC. The fix is a hypothesis: "all instants exchanged by the billing Fabric are UTC". It is formalised as a Law scoped to that Fabric, with a check on every Act contract that carries a timestamp. The check passes on the fixed Variant; a reviewer with authority accepts. The next agent that adds a billing Act cannot introduce a local timestamp without the check failing. Nobody has to remember the incident.

**A discovery stays local.** An agent finds that one report renders faster with a particular query hint. The finding holds for one database version and one data shape. Promoting it to a general rule would be a mistake (limitation 5). It is recorded on the report's Locus with its conditions, and nothing else changes.

**Knowledge expires.** A Law written while Telos used Effect 3 says how services must be declared. Effect 4 changes that API. The Law is still enforced and now fails on correct code. The right response is not to weaken the check quietly but to revise the Law in a governed change, record why, and re-check what depended on it (limitation 4).

**Unknown stays unknown.** A playground run cannot reach a specification because the browser lacks a capability. The result is shown as "not run", with the reason. It is never shown as passing (P10).

## 10. What this philosophy does not promise

- It does not promise correct software.
- It does not promise that agents can work without people.
- It does not promise that every rule can be checked automatically.
- It does not promise that accumulated knowledge stays true.

It promises a direction: each governed change should leave the system's engineering knowledge more explicit, better evidenced and more reusable than before, and honestly marked where it is not.
