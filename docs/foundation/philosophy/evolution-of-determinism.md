---
id: evolution-of-determinism
title: Evolution of Determinism
kind: doctrine
status: provisional
maturity: vision
summary: Intelligence explores uncertainty, engineering turns discoveries into verifiable rules, and evolution makes those rules reusable.
related:
  [
    P11-no-compatibility-for-mistakes,
    P13-no-unverified-guarantees,
    P16-no-speculative-implementation,
    archetype,
    finding,
    future-semantic-evolution,
  ]
---

# Evolution of Determinism

> **Intelligence explores uncertainty. Engineering turns discoveries into verifiable rules. Evolution makes those rules reusable.**

This is the philosophical foundation of Telos. It explains what the framework is for. It is not a mechanism, and this document is not implemented by code. The mechanisms that may realise it are listed in [§8](#8-philosophy-and-mechanisms) with their maturity.

## 1. The claim

Software engineering keeps rediscovering what it already knew. A team learns that a payment must never be captured twice, that timestamps crossing a service boundary must carry a zone, that a migration must be reversible before it runs. The lesson lives in someone's memory, a chat log, a code review comment or a test nobody connects to the reason it exists. Then the team changes, the context is lost, and the lesson is learned again, often in production.

AI agents make this sharper. An agent can explore a problem quickly and find a working answer by probabilistic reasoning. If the answer disappears with the session, the next agent explores the same ground again, at the same cost and with the same risk of being wrong.

Evolution of Determinism proposes that a software system should **accumulate verifiable engineering knowledge** as it evolves. Discoveries, however they are made, should be able to become explicit, checkable, reusable rules with a known scope, and later work should build on those rules instead of rediscovering them.

The purpose is **not** to make all software behaviour deterministic, and not to remove probabilistic intelligence from engineering. Exploration under uncertainty stays essential. The purpose is to keep growing, and keep correcting, the part of engineering knowledge that is formalised, reproducible and verifiable.

## 2. Terms used here

- **Deterministic procedure**: a procedure that, given the same inputs and the same environment, produces the same result. Determinism is about **reproducibility**. It says nothing about whether the result is right.
- **Formalised knowledge**: knowledge written in a form a machine can check, such as a type, a contract, a schema, an [Archetype](../terminology/archetype.md) rule or an executable specification, together with the scope in which it is claimed to hold.
- **Verification**: running a procedure that produces a [finding](../terminology/finding.md) about whether formalised knowledge holds for a given subject, revision and environment.
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

| Stage                  | What enters                         | What happens                                                                                                          | Typical actor                     | What leaves, in Telos terms                                                                                                  |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Unknown                | A need, a failure, a question       | It is recorded as unknown, not hidden.                                                                                | Anyone                            | An explicit open question                                                                                                    |
| Exploration            | The open question                   | Search, experiment, read, prototype. Probabilistic reasoning is welcome here.                                         | Agents, humans                    | Observations, candidate approaches                                                                                           |
| Hypothesis             | Candidate approaches                | One candidate is stated precisely enough to be wrong.                                                                 | Agents, humans                    | A candidate change and a claim about it ([future semantic evolution](../future-semantic-evolution.md))                       |
| Formalization          | The claim                           | The claim becomes something checkable: a contract, an Archetype rule, a specification with stable identity and scope. | Agents, humans                    | A checkable statement with its applicability                                                                                 |
| Verification           | The checkable statement and subject | Deterministic or controlled procedures produce evidence.                                                              | Deterministic tools, reviewers    | [Findings](../terminology/finding.md) with a [knowledge status](../terminology/knowledge-status.md): passed, failed or error |
| Reusable Knowledge     | Findings and policy                 | A decision is made on the evidence. Accepted knowledge is recorded with its scope, provenance and assumptions.        | Governance, humans with authority | A decision record, and later a recorded decision in the model ([future semantic evolution](../future-semantic-evolution.md)) |
| Executable Constraints | Accepted knowledge                  | Knowledge that should keep holding is enforced automatically on future change.                                        | The framework                     | An [Archetype](../terminology/archetype.md) rule with an enforcement mechanism, or a reusable extension                      |
| New Evolution          | A system with more known structure  | The next change starts from what is known instead of from zero.                                                       | Everyone                          | A smaller unknown, and new unknowns the change reveals                                                                       |

Two things are worth noticing.

First, the cycle **separates who explores from what accepts**. An agent may produce a brilliant hypothesis; that does not make it accepted knowledge. Acceptance follows evidence and policy, under authority the explorer may not hold ([P06](../principles/P06-archetypes-specialize-verification.md), [P15](../principles/P15-no-arbitrary-agent-privileges.md)).

Second, the cycle **produces machinery, not only documents**. The end of a successful cycle is a constraint that runs on its own: a check, a type, an Archetype rule, a reusable extension. Documentation is linked to that machinery or generated from it ([P04](../principles/P04-code-is-the-source-of-truth.md)).

## 4. Assumptions

The philosophy rests on assumptions. They are stated so they can be challenged.

| #   | Assumption                                                                                                                   | If it is false                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A1  | A useful share of engineering knowledge can be formalised at a cost lower than the cost of rediscovering it.                 | Formalisation is busywork. Telos should formalise less and only where rediscovery is expensive.                              |
| A2  | Knowledge can be scoped: a rule can state where it applies, and that statement can itself be checked or reviewed.            | Rules leak beyond their validity and do harm. Scoping becomes the central research problem.                                  |
| A3  | Evidence can carry enough provenance (what, which revision, which environment, which method) to tell later what it supports. | Evidence cannot be reused across changes; every change needs full re-verification.                                           |
| A4  | Most changes touch a small part of a system, so verification can be targeted.                                                | Contextual verification ([P07](../principles/P07-no-universal-correctness.md)) saves little.                                 |
| A5  | Agents and humans can work through bounded capabilities without losing the ability to explore.                               | Capability boundaries ([P15](../principles/P15-no-arbitrary-agent-privileges.md)) would cripple exploration and be bypassed. |
| A6  | The verification procedures are themselves trustworthy enough, and can be improved by the same cycle.                        | The system accumulates confident errors. Verifiers need independent checks.                                                  |

## 5. Limitations

These limits are part of the doctrine, not footnotes to it.

1. **Reproducibility is not correctness.** A deterministic check reproduces the same answer, including the same wrong answer. A specification can encode a misunderstanding perfectly.
2. **Passing tests is not proof.** A test samples behaviour. Formal methods prove properties of models under assumptions. Neither establishes that a system is correct in the world. Telos records what evidence supports, not more.
3. **Not everything is decidable.** Many interesting properties of programs are undecidable in general (Rice's theorem). Some questions will stay outside the domain of determinism for good, and are handled by review, experiment or judgement.
4. **Knowledge expires.** A rule written for one library version, one regulation or one load profile can become false. Accepted knowledge needs a way to be revised, deprecated and retired, and the evidence behind it has validity conditions that can lapse.
5. **Rules have limited applicability.** A discovery that holds in one Locus may be false in another. Promoting a local finding to a universal rule is itself a claim that needs evidence.
6. **Not every discovery should become a rule.** Some findings are cheap to rediscover, rarely needed or too context-dependent. Over-formalisation makes systems rigid and slows legitimate change.
7. **Measures become targets.** Once a rule is enforced, work optimises to pass it. A rule can be satisfied while its intent is violated (Goodhart's law). Rules need review against their purpose, not only against their checks.
8. **New knowledge can overturn old knowledge.** Accepting a decision does not freeze the truth. The system must keep the ability to discover that it was wrong, and to say which later decisions depended on the mistaken one.

## 6. Consequences for engineering

If the philosophy is taken seriously, these follow. Each consequence is carried by one or more principles.

- **Evidence carries provenance.** A result without its subject, revision, environment and method is not reusable evidence ([P13](../principles/P13-no-unverified-guarantees.md)).
- **Unknown stays visible.** Missing evidence is shown as missing, never as passing ([P13](../principles/P13-no-unverified-guarantees.md)).
- **Knowledge has scope and lifecycle.** Archetype rules say where they apply, and they can be proposed, enforced, deprecated and retired ([P06](../principles/P06-archetypes-specialize-verification.md)).
- **Formalisation is incremental.** Narrative intent is a legitimate starting point, refined over time into contracts and checks, and no concept is built before a current use needs it ([P16](../principles/P16-no-speculative-implementation.md)).
- **Baselines are preserved.** A change proposes a future state; it does not overwrite the accepted one ([P13](../principles/P13-no-unverified-guarantees.md)).
- **Acceptance is separate from production.** Whoever builds a change does not alone decide that it is accepted ([P06](../principles/P06-archetypes-specialize-verification.md)).
- **Humans set purpose and limits.** Objectives, acceptable risk and reserved authority come from people ([P15](../principles/P15-no-arbitrary-agent-privileges.md)).
- **The framework applies the cycle to itself**, as fast as it becomes trustworthy and no faster ([P04](../principles/P04-code-is-the-source-of-truth.md), [P16](../principles/P16-no-speculative-implementation.md)).

## 7. Relationship to software evolution

Lehman's laws of software evolution observe that a system used in the real world must keep changing or become less useful, and that its complexity grows unless work is done to reduce it. Conventional practice accepts this and fights the cost with discipline and documentation that drifts.

Telos takes the observation as a design input. Change is the normal state ([P11](../principles/P11-no-compatibility-for-mistakes.md) removes the mistakes that change would otherwise keep carrying). What can be improved is what each change leaves behind. A change that only edits code leaves the next change no wiser. A change that also records why, what it assumed, what evidence it produced and which constraints it established makes the next change cheaper and safer. Evolution of Determinism names that second kind of change as the goal.

## 8. Philosophy and mechanisms

The philosophy is a commitment. Mechanisms are engineering choices that may implement it, may be replaced, and must not silently redefine it. The table lists candidate mechanisms and their maturity on this branch.

| Commitment                                | Candidate mechanism                                                                                               | Maturity                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Every artifact has a meaning and an owner | Locus identity, purpose and containment ([conceptual model](../conceptual-model/README.md))                       | `implemented` in the kernel for Loci; other artifacts not yet modelled      |
| Accepted states are preserved             | Immutable, content-addressed revisions and a baseline that advances by compare-and-set                            | `vision`; see [future semantic evolution](../future-semantic-evolution.md)  |
| Change effects are identifiable           | Impact computed from the semantic model                                                                           | `implemented` in the kernel                                                 |
| Behaviour is specified, not assumed       | Capability contracts and executable specifications with stable identity                                           | `implemented` in the kernel for contracts; specifications in the repository |
| Evidence is distinct from decision        | Findings with knowledge statuses, separate from recorded decisions                                                | `implemented` for findings; decisions `vision`                              |
| Knowledge is scoped and enforceable       | Archetype rules applied to the Loci whose extensions they name                                                    | `implemented` in the kernel for the calculator's rules                      |
| Authority is explicit and bounded         | Capabilities and grants derived from relations                                                                    | `implemented` in the kernel                                                 |
| Verification is targeted                  | Relation-based impact analysis and risk-driven check selection                                                    | Impact `implemented`; risk-driven selection `vision`                        |
| Change is governed                        | Revisions, evidence records and recorded decisions ([future semantic evolution](../future-semantic-evolution.md)) | `vision`; today approximated by Spec Kitty missions                         |

## 9. Worked examples

These examples are illustrations, not features.

**A discovery becomes a rule.** An agent fixing a billing bug finds that two services disagree about whether timestamps are local or UTC. The fix is a hypothesis: "all instants exchanged by the billing Loci are UTC". It is formalised as an Archetype rule that applies to billing Loci, with a check on every capability contract that carries a timestamp. The check passes on the fixed change; a reviewer with authority accepts. The next agent that adds a billing capability cannot introduce a local timestamp without the check failing. Nobody has to remember the incident.

**A discovery stays local.** An agent finds that one report renders faster with a particular query hint. The finding holds for one database version and one data shape. Promoting it to a general rule would be a mistake (limitation 5). It is recorded on the report's Locus with its conditions, and nothing else changes.

**Knowledge expires.** A rule written for one version of a framework says how services must be declared. The framework changes that API. The rule is still enforced and now fails on correct code. The right response is not to weaken the check quietly but to revise the rule in a governed change, record why, and re-check what depended on it (limitation 4).

**Unknown stays unknown.** A playground run cannot reach a specification because the browser lacks a capability. The result is shown as "not run", with the reason. It is never shown as passing ([P13](../principles/P13-no-unverified-guarantees.md)).

## 10. What this philosophy does not promise

- It does not promise correct software.
- It does not promise that agents can work without people.
- It does not promise that every rule can be checked automatically.
- It does not promise that accumulated knowledge stays true.

It promises a direction: each governed change should leave the system's engineering knowledge more explicit, better evidenced and more reusable than before, and honestly marked where it is not.
