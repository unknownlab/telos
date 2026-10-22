---
id: examples
title: Examples
kind: guide
order: 3
section: examples
status: provisional
maturity: implemented
summary: Worked examples of valid and invalid Fabrics, malformed input, and two Loci with the same meaning, with what the package reports for each.
related: [first-locus, locus, relation, revision]
---

# Examples

Each example below gives an input, what the package reports for it, and the playground scenario that runs it. The terms are defined in the [terminology](../foundation/terminology/README.md). The [first Locus](first-locus.md) tutorial explains the fields.

## A valid Fabric

This is the example Fabric of the API contract. Every Locus has an identity and a Charter. The package reports no diagnostics for it.

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

[Scenario A](/playground/a) runs this input.

## Charter problems

In this Fabric, the Charter of `shop:checkout` has a blank purpose, and it lists one responsibility twice. Both problems are rules about Charters, which the [invariants](../foundation/conceptual-model/README.md#5-invariants) state as INV-004.

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

[Scenario B](/playground/b) runs this input.

## Ownership problems

Ownership must form a tree. A Locus has at most one owner, the owner must exist in the Fabric, no Locus may own itself, and the owner chain must end. This Fabric breaks each rule:

- `shop:a` is owned by `shop:b`, and `shop:b` is owned by `shop:a`. This is a cycle. It is reported once, on `shop:a`, the smallest member.
- `shop:c` is owned by itself.
- `shop:d` is owned by `shop:nowhere`, which is not in the Fabric.

```json fabric invalid
{
  "id": "shop:org",
  "loci": [
    {
      "id": "shop:a",
      "owner": "shop:b",
      "charter": { "purpose": "Do A.", "responsibilities": ["Do A"] }
    },
    {
      "id": "shop:b",
      "owner": "shop:a",
      "charter": { "purpose": "Do B.", "responsibilities": ["Do B"] }
    },
    {
      "id": "shop:c",
      "owner": "shop:c",
      "charter": { "purpose": "Do C.", "responsibilities": ["Do C"] }
    },
    {
      "id": "shop:d",
      "owner": "shop:nowhere",
      "charter": { "purpose": "Do D.", "responsibilities": ["Do D"] }
    }
  ]
}
```

```json diagnostics
[
  {
    "code": "owner.cycle",
    "scope": "locus",
    "subject": "shop:a",
    "path": "owner",
    "members": ["shop:a", "shop:b"]
  },
  {
    "code": "owner.self",
    "scope": "locus",
    "subject": "shop:c",
    "path": "owner"
  },
  {
    "code": "owner.missing",
    "scope": "locus",
    "subject": "shop:d",
    "path": "owner",
    "detail": "shop:nowhere"
  }
]
```

[Scenario B](/playground/b) runs inputs of this kind.

## Relation problems

This Fabric has a `refines` cycle between `shop:checkout` and `shop:payment`, and a `depends-on` relation to a Locus that does not exist. The package reports the cycle once, with its members, and the missing target. A `depends-on` cycle would not be reported, because that kind of cycle is allowed.

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

[Scenario C](/playground/c) runs this input.

## Input that is not a Fabric

A decode error and a diagnostic are different things. A decode error means the text is not a Fabric: a key is unknown, a value has the wrong type, or a relation kind is not one of the four kinds. The package stops at decoding and reports where the text is wrong. It does not check the rules.

The Relation kind `owns` below is not one of the four kinds, so the input fails to decode:

```json fabric decode-error
{
  "id": "shop:system",
  "loci": [
    {
      "id": "shop:a",
      "charter": { "purpose": "A.", "responsibilities": ["Do A"] },
      "relations": [{ "kind": "owns", "target": "shop:b" }]
    }
  ]
}
```

```json decode-issues
[
  {
    "path": "loci[0].relations[0].kind",
    "message": "Expected \"depends-on\" | \"refines\" | \"satisfies\" | \"verifies\""
  }
]
```

A diagnostic is different. The text is a Fabric, and the model breaks a rule, as in the examples above. Identity grammar, blank strings and duplicates are not decode errors. The package reports them as diagnostics.

[Scenario B](/playground/b) shows both kinds of result for your own input.

## Same meaning, same id

The order of a set, metadata, and empty optional lists do not change what a Locus means, so they do not change its Revision id. These two definitions differ in the order of their responsibilities, in their metadata, and in empty optional lists. They have the same id, and the change set between them is empty.

```json locus a
{
  "id": "shop:catalogue",
  "charter": {
    "purpose": "Present products.",
    "responsibilities": ["Show prices", "List products"],
    "excluded": ["Take payments"]
  },
  "metadata": { "team": "web" }
}
```

```json locus b
{
  "id": "shop:catalogue",
  "charter": {
    "purpose": "Present products.",
    "responsibilities": ["List products", "Show prices"],
    "excluded": ["Take payments"],
    "successConditions": []
  },
  "relations": []
}
```

```json revisions
{
  "a": "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "b": "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75"
}
```

```json changes
[]
```

[Scenario D](/playground/d) compares Revisions like these.
