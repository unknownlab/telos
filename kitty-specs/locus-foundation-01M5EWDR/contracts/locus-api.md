# Contract: `@telos/locus` public API

Package: `packages/locus`, name `@telos/locus`, version `0.1.0`, `"type": "module"`, `"private": true`. Its only dependency is `effect` (4.0.4, exact). Its entry point is `src/index.ts`; nothing else is imported by consumers.

Every exported symbol has a TSDoc comment and a GRACE `START_CONTRACT` block (NFR-006).

## Types

```ts
export type Identity = string // grammar in data-model.md; checked by validation, not by the type

export interface Charter {
  readonly purpose: string
  readonly responsibilities: ReadonlyArray<string>
  readonly excluded: ReadonlyArray<string>
  readonly successConditions: ReadonlyArray<string>
}

export type RelationKind = "depends-on" | "refines" | "satisfies" | "verifies"
export const RELATION_KINDS: ReadonlyArray<RelationKind> // in this order

export interface Relation {
  readonly kind: RelationKind
  readonly target: Identity
}

export interface LocusDefinition {
  readonly id: Identity
  readonly charter: Charter
  readonly owner?: Identity
  readonly relations: ReadonlyArray<Relation>
  readonly metadata?: Readonly<Record<string, string>>
}

export interface LocusInput {
  readonly id: Identity
  readonly charter: {
    readonly purpose: string
    readonly responsibilities: ReadonlyArray<string>
    readonly excluded?: ReadonlyArray<string>
    readonly successConditions?: ReadonlyArray<string>
  }
  readonly owner?: Identity
  readonly relations?: ReadonlyArray<Relation>
  readonly metadata?: Readonly<Record<string, string>>
}

export interface Fabric {
  readonly id: Identity
  readonly loci: ReadonlyArray<LocusDefinition>
}

export type RevisionId = `sha256:${string}`

export interface Revision {
  readonly id: RevisionId
  readonly locus: Identity
  readonly definition: LocusDefinition
}
```

## Functions

| Export | Signature | Contract |
| --- | --- | --- |
| `isIdentity` | `(value: string) => boolean` | True exactly for the grammar in data-model.md |
| `defineLocus` | `(input: LocusInput) => LocusDefinition` | Copies input; defaults missing optional sets to `[]`; keeps entry order and duplicates as given; returns a deeply frozen value. Never throws. |
| `defineFabric` | `(input: { id: Identity; loci: ReadonlyArray<LocusDefinition> }) => Fabric` | Copies and deeply freezes. Never throws. |
| `validateFabric` | `(fabric: Fabric) => ValidationReport` | Pure and total. Reports every violation of INV-001 to INV-008 as diagnostics, ordered as in data-model.md. Same input gives a byte-identical `JSON.stringify` of the result. |
| `canonicalForm` | `(definition: LocusDefinition) => string` | Canonical JSON (below). Pure. |
| `createRevision` | `(definition: LocusDefinition) => Effect<Revision, DigestError>` | Id is `sha256:` + lowercase hex of SHA-256 (via `globalThis.crypto.subtle.digest`) over the UTF-8 bytes of `canonicalForm`. `definition` is the canonical definition (sorted, de-duplicated, no metadata), deeply frozen. Works on invalid definitions too. |
| `diffRevisions` | `(from: Revision, to: Revision) => Effect<ChangeSet, LocusMismatchError>` | Fails when `from.locus !== to.locus`. Otherwise returns the ordered change list from data-model.md, empty exactly when the ids are equal. |
| `decodeFabric` | `(input: unknown) => Effect<Fabric, DecodeError>` | Decodes the wire format below and builds the value with `defineLocus`/`defineFabric`. |
| `decodeFabricJson` | `(text: string) => Effect<Fabric, DecodeError>` | Rejects text over 1,048,576 UTF-16 code units with an error at path `""`; parses JSON (a syntax error gives an issue at path `""` with the parser message); then `decodeFabric`. |
| `decodeLocus` | `(input: unknown) => Effect<LocusDefinition, DecodeError>` | Same for one Locus. |

## History service

```ts
export class RevisionHistory extends Context.Service<RevisionHistory, {
  readonly head: (locus: Identity) => Effect<RevisionId | null>
  readonly entries: (locus: Identity) => Effect<ReadonlyArray<RevisionId>>
  readonly get: (id: RevisionId) => Effect<Revision, RevisionNotFoundError>
  readonly append: (
    revision: Revision,
    expectedHead: RevisionId | null
  ) => Effect<{ readonly appended: boolean; readonly head: RevisionId }, StaleBaselineError>
}>()("@telos/locus/RevisionHistory") {}

export const RevisionHistoryInMemory: Layer<RevisionHistory> // fresh, empty state each time the layer is built
```

Append rules (stale check first, then no-op on equal head) are in data-model.md.

## Errors

All errors are `Data.TaggedError` classes, exported:

| Tag | Fields | Raised by |
| --- | --- | --- |
| `DigestError` | `cause: unknown` | `createRevision` when Web Crypto is unavailable or fails |
| `LocusMismatchError` | `from: Identity; to: Identity` | `diffRevisions` |
| `StaleBaselineError` | `locus: Identity; expected: RevisionId \| null; actual: RevisionId \| null` | `RevisionHistory.append` |
| `RevisionNotFoundError` | `id: RevisionId` | `RevisionHistory.get` |
| `DecodeError` | `issues: ReadonlyArray<{ path: string; message: string }>` | decoders; paths are dot/bracket form such as `loci[2].relations[0].kind`; at least one issue |

## Diagnostic codes

Stable. Adding a code is allowed; renaming or removing one is a breaking change.

| Code | Scope | Path | Detail / members | Invariant |
| --- | --- | --- | --- | --- |
| `identity.malformed` | fabric or locus | `id` | — | INV-001 |
| `identity.duplicate` | locus | `id` | number of occurrences as decimal string | INV-002 |
| `charter.purpose-blank` | locus | `charter.purpose` | — | INV-004 |
| `charter.responsibilities-empty` | locus | `charter.responsibilities` | — | INV-004 |
| `charter.entry-blank` | locus | `charter.<field>` | — (one per field) | INV-004 |
| `charter.entry-duplicate` | locus | `charter.<field>` | the duplicated value (one per value) | INV-004 |
| `owner.missing` | locus | `owner` | the owner identity | INV-005 |
| `owner.self` | locus | `owner` | — | INV-005 |
| `owner.cycle` | locus (smallest member) | `owner` | members | INV-006 |
| `relation.target-missing` | locus | `relations` | `<kind> <target>` | INV-007 |
| `relation.self` | locus | `relations` | `<kind> <target>` | INV-007 |
| `relation.duplicate` | locus | `relations` | `<kind> <target>` | INV-007 |
| `relation.refines-cycle` | locus (smallest member) | `relations` | members | INV-008 |

Rules:

- A duplicated identity is reported once, on that identity. For reference checks, an identity exists if at least one Locus has it.
- A malformed identity is reported on the raw string. A malformed `owner` or `target` that exists nowhere is reported as missing, not as malformed.
- A self-owner gives `owner.self` only, not also `owner.cycle`.
- A self-`refines` gives `relation.self` only, not also a cycle.
- Each cycle is reported exactly once. Loci that lead into a cycle without being in it are not reported.
- Ownership chains of any depth are checked without recursion.

## Canonical form (version 1)

`canonicalForm(definition)` returns `JSON.stringify` of this object, with keys in this order and no whitespace:

```json
{"v":1,"id":"<id>","charter":{"purpose":"<purpose>","responsibilities":[…],"excluded":[…],"successConditions":[…]},"owner":"<id>"|null,"relations":[{"kind":"…","target":"…"},…]}
```

- String sets are de-duplicated and sorted ascending by UTF-16 code unit (`Array.prototype.sort` default comparison).
- Relations are de-duplicated by `(kind, target)` and sorted by `kind`, then `target`.
- Strings are used exactly as given: no trimming and no Unicode normalisation.
- `metadata` is excluded. An absent owner is `null`.
- Changing anything in this section changes every Revision id. It needs a decision record (OQ-011).

## Wire format (JSON)

The JSON shapes mirror `LocusInput` and `{ id, loci: LocusInput[] }`:

- `relations`, `excluded`, `successConditions` and `metadata` are optional.
- Unknown keys are rejected (`onExcessProperty: "error"`).
- Strings must be strings, arrays must be arrays, and `kind` must be one of the four kinds.
- Identity grammar, blank strings and duplicates are **not** decode errors. They are left to validation, so a reader sees them as diagnostics.

Example:

```json
{
  "id": "shop:system",
  "loci": [
    { "id": "shop:storefront", "charter": { "purpose": "Sell products online.", "responsibilities": ["Present the catalogue", "Take orders"] } },
    { "id": "shop:checkout", "owner": "shop:storefront",
      "charter": { "purpose": "Turn a basket into an order.", "responsibilities": ["Collect payment details"] },
      "relations": [{ "kind": "depends-on", "target": "shop:payment" }] },
    { "id": "shop:payment", "owner": "shop:storefront",
      "charter": { "purpose": "Authorise payments.", "responsibilities": ["Call the payment provider"] } }
  ]
}
```

## Portability

The package source may use only ECMAScript built-ins, `globalThis.crypto.subtle`, `TextEncoder` and `effect`. Imports of `bun`, `bun:*`, `node:*` or Node globals (`process`, `Buffer`) are forbidden. This is checked by `packages/locus-specs/test/portability.test.ts`.
