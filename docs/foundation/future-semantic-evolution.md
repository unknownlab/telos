---
id: future-semantic-evolution
title: Future semantic evolution
kind: direction
status: provisional
maturity: vision
summary: The concepts that Telos may add later for governed change, namely Mandate, Variant, Witness, Verdict, Evolution and Revision, what each would mean as an extension of the current model and why none is built now.
related: [foundation, knowledge-status, archetype]
---

# Future semantic evolution

This document describes concepts that are **not built** in the current semantic model. Each is direction only. It states what the concept would mean as an extension of the model that exists, and why it is not built now ([principle P16](principles/P16-no-speculative-implementation.md)). None of these terms is a term of the current vocabulary, and none has code, placeholder types or modules in the kernel.

The current model is Loci, identity, containment, relations, capabilities, contracts, semantic extensions, composition, Archetype rules, findings and knowledge statuses. The concepts below would build on that model and not replace it.

## Revision

**What it would mean.** An immutable, content-addressed version of a Locus's definition. A revision would be created when a definition changes, would never change after creation, and would let two states of one Locus be compared. A baseline would name the accepted revision, and a change would propose a new one.

**As an extension.** A revision is a digest of the canonical form of a Locus, as the kernel already computes for contracts, together with a pointer to the revision it replaces. A semantic diff would list the changed properties, relations and capabilities.

**Why not now.** No current use needs to compare two states of a Locus. Open questions about what a revision records besides its definition, and how it is identified, are unresolved ([OQ-009](open-questions.md#oq-009), [OQ-023](open-questions.md#oq-023)). Building revisions before those are settled would fix answers too early.

## Variant

**What it would mean.** An isolated candidate future state derived from a baseline revision, in which a change can be made and checked without touching the accepted state.

**As an extension.** A variant would be a set of Loci that differ from a baseline, with the impact of the difference computed by the existing [impact](terminology/impact.md) query. Its checks would be the same findings, produced for the variant's Loci.

**Why not now.** It depends on revisions, which are not built. The workspace isolation that a variant would need is an engine question, and it is left to the change lifecycle that Spec Kitty provides for now ([ADR-0011](../decisions/ADR-0011-temporary-engineering-tools.md)).

## Witness

**What it would mean.** An identifiable record of evidence about a revision, with its provenance: which subject, revision, environment and method produced the result.

**As an extension.** A witness would extend the current [finding](terminology/finding.md). A finding already records a rule, a Locus and an outcome with a [knowledge status](terminology/knowledge-status.md). A witness would add the revision it is about, the environment, the method and the time, so that evidence could be reused across changes.

**Why not now.** The minimum provenance a witness must carry is an open question ([OQ-015](open-questions.md#oq-015)). The current findings are enough for the rules that exist, and a second record for the same result would duplicate them ([P12](principles/P12-no-duplicate-semantic-models.md)).

## Verdict

**What it would mean.** An explicit decision made from evidence and policy about a claim or a transition, for example whether a variant is accepted as the next baseline.

**As an extension.** A verdict would reference the witnesses it weighed and the policy it applied. Its outcome would advance a baseline revision by compare-and-set, so that a decision cannot overwrite a newer one.

**Why not now.** A verdict needs witnesses and revisions, and acceptance policies are not defined. Without them a verdict would be a label typed by a person, which the current model does not treat as evidence ([P06](principles/P06-archetypes-specialize-verification.md), [P13](principles/P13-no-unverified-guarantees.md)).

## Evolution

**What it would mean.** The governed process of proposing, building, verifying, evaluating and possibly accepting a change to a semantic model. An evolution would connect variants, witnesses and verdicts into one record.

**As an extension.** An evolution would be a record that refers to a baseline, one or more variants and the verdict that concluded it. It would not be a new kind of Locus; it would describe a change to Loci.

**Why not now.** It is the composition of the four concepts above, and it cannot be designed well before they exist. Today the change lifecycle is handled by Spec Kitty missions, which approximate evolutions without being one ([open questions](open-questions.md), [OQ-018](open-questions.md#oq-018)).

## Mandate

**What it would mean.** A bounded, verifiable delegation of authority to an agent: which capabilities it may invoke, for which scope, for how long, and how it is revoked.

**As an extension.** A mandate would extend the current [grant](terminology/grant.md). A grant already comes from an invocation relation in the model. A mandate would add scope, validity and revocation to that grant, so that a delegation is more than a yes or no.

**Why not now.** Enforcing a mandate needs an isolation substrate that the kernel does not provide. A grant without isolation is already a convention, and the candidate substrates are unresolved ([OQ-016](open-questions.md#oq-016)). A mandate built on that convention would overstate what is enforced ([P15](principles/P15-no-arbitrary-agent-privileges.md)).

## What would change the decision

These concepts move from direction to code when a current use needs them. The triggers are named in the [roadmap](roadmap/README.md): a second use of revisions, a verification record that a team needs to reuse, or an agent that needs a delegation with a scope. Until then, each stays in this document.
