---
id: first-locus
title: Your first Locus
kind: guide
order: 2
section: first-locus
status: provisional
maturity: implemented
summary: A five-step tutorial in which you define, validate, break, relate and revise a Locus with the Telos package.
related: [locus, charter, fabric, relation, revision, examples]
---

# Your first Locus

This tutorial takes about fifteen minutes. You do not need to read the source code. Each step gives an input, shows what the package reports for it, and links to the playground scenario that runs the same input. The terms are defined in the [terminology](../foundation/terminology/README.md).

## 1. Define a Fabric

A [Locus](../foundation/terminology/locus.md) is an identifiable unit with one purpose. Four parts describe it:

- Its [Identity](../foundation/terminology/identity.md) is a name of the form `namespace:name`, such as `shop:checkout`. Each part starts with a letter and holds lowercase letters, digits and single hyphens.
- Its [Charter](../foundation/terminology/charter.md) states the purpose and lists at least one responsibility.
- An optional `owner` names the Locus that contains it.
- Optional [Relations](../foundation/terminology/relation.md) link it to other Loci.

A [Fabric](../foundation/terminology/fabric.md) is a named set of Loci. The package checks a Fabric as a whole. The Fabric has an identity of the same form.

The JSON below is a Fabric named `shop:system` with three Loci. The Locus `shop:checkout` is owned by `shop:storefront`, and it depends on `shop:payment`.

```json fabric valid example=valid
{
  "id": "shop:system",
  "loci": [
    {
      "id": "shop:storefront",
      "charter": {
        "purpose": "Sell products online.",
        "responsibilities": ["Present the catalogue", "Take orders"]
      }
    },
    {
      "id": "shop:checkout",
      "owner": "shop:storefront",
      "charter": {
        "purpose": "Turn a basket into an order.",
        "responsibilities": ["Collect payment details"]
      },
      "relations": [{ "kind": "depends-on", "target": "shop:payment" }]
    },
    {
      "id": "shop:payment",
      "owner": "shop:storefront",
      "charter": {
        "purpose": "Authorise payments.",
        "responsibilities": ["Call the payment provider"]
      }
    }
  ]
}
```

Each field has one meaning:

- `id` of the Fabric names the set of Loci.
- `loci` lists the Loci. Their order has no meaning.
- `id` of a Locus is its Identity.
- `charter.purpose` says why the Locus exists.
- `charter.responsibilities` lists what the Locus is accountable for. Each item is one responsibility.
- `owner` names the containing Locus. Ownership is a property of the Locus, not a Relation.
- `relations` lists typed links. Here `shop:checkout` has one link, of the kind `depends-on`.

The fields `excluded`, `successConditions`, `owner`, `relations` and `metadata` may be left out. Metadata is a map of text values, such as a team name. It is not part of a Locus's meaning.

The package reports this Fabric as valid, with no diagnostics.

Try it: [Scenario A in the playground](/playground/a).

## 2. See validation fail

Now break the model. In the Fabric below, the Charter of `shop:checkout` has a blank purpose, and it lists the same responsibility twice. Everything else is the same as in step 1.

```json fabric invalid example=invalid
{
  "id": "shop:system",
  "loci": [
    {
      "id": "shop:storefront",
      "charter": {
        "purpose": "Sell products online.",
        "responsibilities": ["Present the catalogue", "Take orders"]
      }
    },
    {
      "id": "shop:checkout",
      "owner": "shop:storefront",
      "charter": {
        "purpose": "",
        "responsibilities": [
          "Collect payment details",
          "Collect payment details"
        ]
      },
      "relations": [{ "kind": "depends-on", "target": "shop:payment" }]
    },
    {
      "id": "shop:payment",
      "owner": "shop:storefront",
      "charter": {
        "purpose": "Authorise payments.",
        "responsibilities": ["Call the payment provider"]
      }
    }
  ]
}
```

The package reports two diagnostics:

```json diagnostics
[
  {
    "code": "charter.entry-duplicate",
    "scope": "locus",
    "subject": "shop:checkout",
    "path": "charter.responsibilities",
    "detail": "Collect payment details"
  },
  {
    "code": "charter.purpose-blank",
    "scope": "locus",
    "subject": "shop:checkout",
    "path": "charter.purpose"
  }
]
```

Each diagnostic has these fields:

- `code` is the stable name of the rule that failed.
- `scope` is `locus` when the diagnostic concerns one Locus, and `fabric` when it concerns the whole Fabric.
- `subject` is the Locus or Fabric that the rule concerns.
- `path` is the part that is wrong, such as `charter.purpose`.
- `detail` is the offending value, when there is one. Here it is the duplicated responsibility.

The package does not stop at the first problem. It reports every violation in one pass. The diagnostics are sorted by subject, then code, then path, then detail. So the same input always gives the same list, whatever order the Loci were written in.

Each diagnostic also has a `message` for people. The text of the message is not part of the contract, so this guide leaves it out.

Malformed input is a different case. If the text is not a Fabric at all, the package reports a decode error instead, with the location of the problem. [Examples](examples.md) shows one.

Try it: [Scenario B in the playground](/playground/b).

## 3. Relate Loci

A [Relation](../foundation/terminology/relation.md) is a typed, directed link from one Locus to another. The kinds are fixed:

- `depends-on`: the source cannot do its job without the target.
- `refines`: the source is a more specific form of the target's responsibility.
- `satisfies`: the source fulfils obligations that the target states.
- `verifies`: the source produces evidence about the target.

A `refines` cycle is an error. If `A` refines `B` and `B` refines `A`, neither is a more specific form of the other, so the meaning of the link breaks. A `depends-on` cycle is allowed. Two Loci can each depend on the other. The [conceptual model](../foundation/conceptual-model/README.md#6-key-questions) gives the reasons, and the [invariants](../foundation/conceptual-model/README.md#5-invariants) list the rule as INV-008.

The Fabric below breaks two rules. The Locus `shop:checkout` refines `shop:payment`, and `shop:payment` refines `shop:checkout`. The Locus `shop:storefront` depends on `shop:ghost`, which is not in the Fabric.

```json fabric invalid example=relations
{
  "id": "shop:system",
  "loci": [
    {
      "id": "shop:storefront",
      "charter": {
        "purpose": "Sell products online.",
        "responsibilities": ["Present the catalogue", "Take orders"]
      },
      "relations": [{ "kind": "depends-on", "target": "shop:ghost" }]
    },
    {
      "id": "shop:checkout",
      "owner": "shop:storefront",
      "charter": {
        "purpose": "Turn a basket into an order.",
        "responsibilities": ["Collect payment details"]
      },
      "relations": [{ "kind": "refines", "target": "shop:payment" }]
    },
    {
      "id": "shop:payment",
      "owner": "shop:storefront",
      "charter": {
        "purpose": "Authorise payments.",
        "responsibilities": ["Call the payment provider"]
      },
      "relations": [{ "kind": "refines", "target": "shop:checkout" }]
    }
  ]
}
```

The package reports two diagnostics:

```json diagnostics
[
  {
    "code": "relation.refines-cycle",
    "scope": "locus",
    "subject": "shop:checkout",
    "path": "relations",
    "members": ["shop:checkout", "shop:payment"]
  },
  {
    "code": "relation.target-missing",
    "scope": "locus",
    "subject": "shop:storefront",
    "path": "relations",
    "detail": "depends-on shop:ghost"
  }
]
```

The `members` field lists the Loci of a cycle, starting from the smallest identity. Each cycle is reported once.

Try it: [Scenario C in the playground](/playground/c).

## 4. Revise a Locus

A [Revision](../foundation/terminology/revision.md) is a frozen snapshot of one Locus definition. Its id is `sha256:` followed by the SHA-256 digest of the canonical form of the definition. The canonical form is JSON with a fixed key order, sorted sets and no metadata. Two definitions with the same meaning therefore have the same id.

The two Locus definitions below are two versions of `shop:checkout`. Version B changes one responsibility.

```json locus a example=history.a
{
  "id": "shop:checkout",
  "owner": "shop:storefront",
  "charter": {
    "purpose": "Turn a basket into an order.",
    "responsibilities": ["Collect payment details"]
  },
  "relations": [{ "kind": "depends-on", "target": "shop:payment" }]
}
```

```json locus b example=history.b
{
  "id": "shop:checkout",
  "owner": "shop:storefront",
  "charter": {
    "purpose": "Turn a basket into an order.",
    "responsibilities": ["Collect payment and delivery details"]
  },
  "relations": [{ "kind": "depends-on", "target": "shop:payment" }]
}
```

The two Revisions have these ids:

```json revisions
{
  "a": "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "b": "sha256:6c5a7162f418e32b09814af51e749845bab69c0170b4a9cd008af8514b36a315"
}
```

The change set from A to B lists each changed part. A part that loses an entry gives a `removed` change, and a part that gains one gives an `added` change:

```json changes
[
  {
    "part": "charter.responsibilities",
    "kind": "removed",
    "value": "Collect payment details"
  },
  {
    "part": "charter.responsibilities",
    "kind": "added",
    "value": "Collect payment and delivery details"
  }
]
```

A [history](../foundation/terminology/revision.md) is an ordered list of Revision ids for one Locus. The last id is the head, which is the current baseline. An append names the head that its author expects. If that is not the current head, the package refuses the append with `StaleBaselineError`, and the history does not change. This is compare-and-set. It stops one change from silently overwriting another, which is the rule of [P08](../foundation/principles/P08-preserve-the-baseline.md).

The history below runs four steps, one after another. Each step names the Revision to append (`a` or `b`), the head it expects (`null` for an empty history), and the outcome the package gives:

```json history-steps
[
  {
    "append": "a",
    "expectedHead": null,
    "result": { "appended": true, "head": "a" }
  },
  {
    "append": "b",
    "expectedHead": "a",
    "result": { "appended": true, "head": "b" }
  },
  {
    "append": "a",
    "expectedHead": "a",
    "result": { "error": "StaleBaselineError", "actual": "b" }
  },
  {
    "append": "b",
    "expectedHead": "b",
    "result": { "appended": false, "head": "b" }
  }
]
```

The first step appends A to an empty history. The second appends B after A. The third expects A, but the head is B, so it is refused. The fourth appends B when B is already the head, so nothing changes, and the package reports `appended: false`.

Try it: [Scenario D in the playground](/playground/d).

## 5. Run the specifications

The executable specifications are records that check the invariants of the model, INV-001 to INV-014. They are meant to run in the same way under Bun and in the browser, so that the two results can be compared. From the repository root, the Bun run is:

```sh
bun run test
```

The playground runs the same records in the browser. [Scenario E](/playground/e) runs them with one button. The [Verification](/verification) page shows the report of the build-time run, with where and when it was produced, or it says that no report exists.

Try it: [Scenario E in the playground](/playground/e), and then [Verification](/verification).

## Next steps

- [Examples](examples.md) shows more inputs, including malformed input and two Loci with the same meaning.
- The [terminology index](../foundation/terminology/README.md) defines each term used here.
- The [decisions index](../decisions/README.md) lists the architecture decisions behind the model.
