---
id: prior-art
title: Prior art
kind: research
status: provisional
maturity: proposed
summary: Established ideas and tools that overlap with Telos concepts, classified as reuse, adapt, hypothesis or gap, without claims of novelty.
related:
  [conceptual-model, terminology, open-questions, evolution-of-determinism]
---

# Prior art

Almost every Telos idea has a precedent. This note records the precedents so Telos borrows deliberately and does not claim novelty it lacks. Descriptions are summaries from general knowledge of these fields; before a decision relies on a detail, check the primary source.

Each entry is classified:

- **reuse**: take the idea as it is.
- **adapt**: take the idea, changed for Telos's needs; the change is stated.
- **hypothesis**: Telos believes a combination or extension works; it is unproven.
- **gap**: no adequate precedent found yet; open research.

## Summary

| Field or tool                                                            | Telos concepts                    | Class      |
| ------------------------------------------------------------------------ | --------------------------------- | ---------- |
| Domain-driven design: bounded contexts, ubiquitous language              | Locus boundary, terminology       | adapt      |
| Object-capability security                                               | Act, Mandate                      | reuse      |
| Effect systems and typed effects                                         | Act contracts, Effect usage       | reuse      |
| Systems modelling (SysML v2, KerML)                                      | Locus, Relation, requirements     | adapt      |
| Requirements traceability                                                | `satisfies`, `verifies`           | reuse      |
| Assurance cases (GSN, SACM)                                              | Witness, Verdict                  | adapt      |
| Self-adaptive systems (MAPE-K)                                           | Evolution cycle                   | adapt      |
| Statecharts                                                              | Process Facets                    | reuse      |
| Incremental computation and build systems                                | Contextual verification           | adapt      |
| Supply-chain provenance (SLSA, in-toto)                                  | Witness provenance                | adapt      |
| Content-addressed code (Unison, Nix, git)                                | Revision                          | reuse      |
| Architecture-as-code (C4/Structurizr, ArchUnit, Backstage)               | Fabric, Law, Archetype, ownership | adapt      |
| Single semantic unit spanning code, process, infra and agents            | Locus as universal unit           | hypothesis |
| Governed AI agents with enforced capabilities in a development lifecycle | CAP-06, CAP-07                    | gap        |

## Domain-driven design

Evans's bounded contexts give a linguistic criterion for a boundary: one model and one vocabulary inside it. Context maps describe how contexts relate.

**Adapt.** A Locus is usually smaller than a bounded context. Telos takes the discipline of an explicit vocabulary ([terminology](../foundation/terminology/README.md)) and the idea that boundaries are design decisions ([OQ-001](../foundation/open-questions.md#oq-001)). Context-map relationship patterns are candidates for future Relation kinds ([OQ-013](../foundation/open-questions.md#oq-013)).

## Object-capability security

In the object-capability model (Mark Miller's work, the E language, later capability-safe JavaScript efforts), authority is conveyed only by holding a reference; there is no ambient authority. Principle of least authority follows from passing narrow references.

**Reuse.** [P05](../foundation/principles/P15-no-arbitrary-agent-privileges.md) and [P06](../foundation/principles/P15-no-arbitrary-agent-privileges.md) are this model applied to agents. Acts are the narrow references, Mandates the grant. Enforcement needs a capability-safe substrate, which is [OQ-016](../foundation/open-questions.md#oq-016).

## Effect systems

Typed effects make what a computation may do (fail, need a service, perform I/O) part of its type. Effect-TS brings this to TypeScript with an error channel, a requirements channel, layers, scopes and fibers.

**Reuse.** Telos uses Effect directly ([ADR-0004](../decisions/ADR-0004-typescript-and-effect.md)). An Act's declared effects can be checked against the requirements channel of its implementation: a direction, not a Stage 0 feature.

## Systems modelling: SysML v2 and KerML

SysML v2 defines parts, ports, connections, requirements, verification cases and a textual and API form, on the KerML kernel. It already has satisfy and verify relationships between requirements and the elements that fulfil or check them.

**Adapt.** Telos's Relation kinds `satisfies` and `verifies` mirror those relationships. Telos differs in authoring medium (ordinary TypeScript values) and in treating running code, agents and infrastructure as first-class subjects. A mapping to SysML v2 is a candidate for the Requirements capability ([CAP-03](../foundation/architecture/capabilities.md#cap-03-requirements)).

## Requirements traceability

Traceability links requirements forward to design, code and tests and backward to their sources. Safety standards demand it; tools usually maintain it as a separate matrix that drifts.

**Reuse.** The links are Relations in the same model as the units they connect, so they are validated with everything else (target must exist).

## Assurance cases: GSN and SACM

Goal Structuring Notation and the OMG Structured Assurance Case Metamodel structure an argument that a system is acceptable: claims, arguments, evidence, context and assumptions.

**Adapt.** Witnesses are the evidence nodes; Verdicts are acceptance decisions that should be explainable as an argument over Witnesses. Telos adds the requirement that evidence be tied to a content-addressed Revision. An assurance-case view is a research question for [CAP-05](../foundation/architecture/capabilities.md#cap-05-verification-and-assurance).

## Self-adaptive systems: MAPE-K

IBM's autonomic computing reference loop: Monitor, Analyse, Plan, Execute over shared Knowledge.

**Adapt.** The [Evolution of Determinism](../foundation/philosophy/evolution-of-determinism.md) cycle resembles MAPE-K applied to the development of a system rather than its runtime behaviour, with Verification and Acceptance as explicit steps and humans holding strategic authority ([P13](../foundation/principles/P15-no-arbitrary-agent-privileges.md)).

## Statecharts

Harel's statecharts add hierarchy, concurrency and history to state machines; SCXML and libraries such as XState implement them.

**Reuse.** A future process Facet ([CAP-08](../foundation/architecture/capabilities.md#cap-08-processes)) should express statecharts rather than invent a formalism.

## Incremental computation and build systems

"Build Systems à la Carte" (Mokhov, Mitchell, Peyton Jones) classifies build systems by scheduler and rebuilder. Salsa and similar frameworks recompute only queries whose inputs changed. Bazel uses content hashes to skip work.

**Adapt.** Contextual verification ([P11](../foundation/principles/P07-no-universal-correctness.md)) is incremental computation over Relations: when a Revision changes, re-run checks of what is affected. Telos must decide what "affected" means semantically, not only by file dependency.

## Supply-chain provenance: SLSA and in-toto

SLSA defines levels of build integrity and provenance; in-toto defines signed attestations about steps in a supply chain.

**Adapt.** A Witness is a kind of attestation about a check run against a Revision. Stage 0 records provenance unsigned in the docs site; using in-toto attestation formats is an option for [OQ-015](../foundation/open-questions.md#oq-015).

## Content-addressed code

Git addresses objects by hash; Nix addresses build outputs by the hash of their inputs; Unison addresses definitions by the hash of their syntax tree, separating names from identity.

**Reuse.** Revisions are content-addressed ([ADR-0005](../decisions/ADR-0005-immutable-content-addressed-revisions.md)). Telos keeps declared names as identity and uses hashes for revisions, which is the reverse of Unison's choice: Unison's hash is the identity and names are labels. The trade-off is that a Telos Locus keeps its identity when its meaning changes.

## Architecture as code

- **C4 and Structurizr**: architecture models as code at four levels.
- **ArchUnit** and similar tools: architecture rules as tests over the import graph.
- **Backstage**: a software catalogue with owners, kinds and relations described in YAML next to code.

**Adapt.** Backstage's catalogue is the closest precedent for Loci with owners and relations; Telos differs by making ownership semantic and structural rather than organisational, and by validating the graph. ArchUnit is the precedent for Laws and for drift detection ([OQ-012](../foundation/open-questions.md#oq-012)). C4 levels are a candidate Lens.

## Hypotheses and gaps

- **One unit for everything (hypothesis).** No surveyed approach uses one semantic unit across application code, processes, infrastructure, requirements and agents. The [conceptual model](../foundation/conceptual-model/README.md#3-the-minimal-model-hypothesis) argues it is sufficient for identity, purpose, ownership and structure; operational sufficiency is unproven.
- **Governed agents in the development lifecycle (gap).** Capability security, provenance and assurance cases exist separately. A development process in which AI agents act only through typed, mandated operations, with evidence tied to semantic revisions, has no adequate precedent known to this survey.
