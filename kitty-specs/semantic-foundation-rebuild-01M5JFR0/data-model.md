# Data Model: Semantic Foundation Rebuild

The exact TypeScript shapes are in [contracts/kernel.md](contracts/kernel.md). This document states the entities, invariants and codes that the implementation must enforce.

## Entities

| Entity | Fields | Notes |
| --- | --- | --- |
| Extension | `id`, `description`, `properties` (Schema fields), `relationTypes`, `archetypes` | Its id matches `EXTENSION_ID_PATTERN`. Two extensions are the same only if they are the same object. |
| RelationType | `id`, `description`, `target` (`"locus"` \| `"capability"`), `acyclic`, `grantsInvocation` | Declared by exactly one extension. Its id matches `EXTENSION_ID_PATTERN`. |
| Relation | `type` (RelationType), `target` (`{ locus, capability }`, where `capability` is `null` for a Locus target) | Owned by its source Locus. |
| Capability | `description`, `input`, `output`, `errors` (TaggedError schemas), `effect` (`"pure"` \| `"read"` \| `"write"`), `handler` (or `null` for JSON-declared capabilities) | Keyed by name on its Locus. The name matches `CAPABILITY_NAME_PATTERN`. |
| CapabilityRef | `locus`, `capability` | Its string form is `"<locus id>#<capability>"`. |
| Archetype | `id`, `description`, `appliesTo` (extension ids, non-empty), `rules` | Applies to a Locus when every id in `appliesTo` is among the Locus kind's extension ids. An empty `appliesTo` would apply to every Locus, so `buildModel` reports it (`archetype.applies-to-empty`). |
| Rule | `id`, `description`, `method` (`"static"` \| `"execution"`), `check(ctx)` | `check` succeeds (passed), fails with `RuleViolation` (failed), or dies (error). |
| LocusKind | `extensions`, `conflicts`, `properties` (merged fields) | `Locus` is the kind with zero extensions. |
| LocusDefinition | `id`, `kind`, `description` \| `null`, `contains`, `relations`, `capabilities`, `properties`, `propertyIssues` | Immutable (deep-frozen data; schemas and handlers are not frozen). |
| SemanticModel | `root`, `loci` (id → ModelLocus), `ids` (sorted), `relations` (sorted), `extensions`, `archetypes`, `diagnostics` | Built by `buildModel`, which never throws for definitions produced by a LocusKind's `make` (behaviour for other objects is undefined). Frozen; `loci`, `extensions` and `archetypes` are read-only maps at runtime (`set`, `delete` and `clear` throw). |
| Diagnostic | `code`, `severity`, `subject`, `path`, `members`, `message` | Sorted by `compareDiagnostics`. |
| Finding | `archetype`, `rule`, `locus`, `method`, `outcome`, `message` | One per (applicable rule, Locus) pair that was run. |
| VerificationReport | `provenance`, `findings`, `summary` | Findings sorted by locus, archetype, rule. |
| Description types | see contracts | Every one carries `knowledge`. |
| ImpactReport | `target`, `affected`, `checks` | Derived only from the model. |
| ModelChange | `kind`, `locus`, `capability`, `patch` | Output of `diffModels`. |
| ClosureReport | `scope`, `files`, `findings`, `limits` | From `checkClosure`. |

## Invariants

1. **Minimality**: a Locus needs only `id`. Every other field defaults to empty, or `null` for `description`.
2. **Unique identity**: every Locus reachable from the root has a distinct id (`identity.duplicate`), and the id matches the grammar (`identity.malformed`).
3. **Single container**: a Locus object reachable through two containers is reported (`ownership.multiple`). The first container in traversal order is recorded as its container. The root has no container (`null`): the message writes it as `(root)`, and `null` is left out of `members`.
4. **Composition integrity**: within one kind, a property name, relation type id, extension id or archetype id defined by two different objects is a conflict. The first definition wins for schema purposes, and the conflict is reported for every Locus made from that kind. An Archetype of the kind with an empty `appliesTo` is reported the same way (`archetype.applies-to-empty`).
5. **Relation validity**: a relation's type must be declared by one of the source Locus kind's extensions, its target must exist, its target kind must match, and a Locus must not relate to itself. Equal (type, target) pairs on one Locus are reported as a warning.
6. **Acyclicity**: for relation types with `acyclic: true`, every elementary cycle among the Locus targets is reported, at most 100, followed by one `relation.cycle-limit` warning.
7. **Grant**: `invoke(..., { via })` succeeds past authorization only when `via` is the capability's own Locus, or `via` has a valid relation whose type has `grantsInvocation: true` targeting exactly that capability.
8. **Total invocation**: `invoke` never fails in its error channel. Every outcome is `{ ok: true, output }` or `{ ok: false, error }`.
9. **Knowledge**:
   - Definitions are `declared`.
   - Facts computed from the model (incoming relations, `exposedBy`, impact) are `derived`.
   - Rule results are `verified` only when passed in a real run, `failed` when failed or errored, and `not-run` otherwise.
   - `unknown` marks facts the analysis cannot determine: every `closure.dynamic-import` finding has `knowledge: "unknown"`. Every other closure finding, including `closure.unparsable`, has `knowledge: "derived"`.
   - `observed` is reserved for runtime observations, and `invalidated` for facts that a later change or run contradicts. Nothing produces either yet.
10. **Determinism**: diagnostics, descriptions, relation lists, findings, impact and closure reports are sorted by their documented keys. Digests are taken over canonical JSON.

## Diagnostic codes

There are eighteen codes (`archetype.applies-to-empty` was added by WP22).

| Code | Severity | Subject | Raised when |
| --- | --- | --- | --- |
| `identity.malformed` | error | the id | a Locus id fails `isLocusId` |
| `identity.duplicate` | error | the id | two different Locus objects have the same id |
| `ownership.multiple` | error | the contained Locus id | the same Locus object is contained by more than one container |
| `composition.extension-id-conflict` | error | Locus id | two different extension objects with the same id in a kind |
| `composition.property-conflict` | error | Locus id | two different extensions define the same property name |
| `composition.relation-type-conflict` | error | Locus id | two different RelationType objects with the same id in a kind |
| `composition.archetype-id-conflict` | error | Locus id | two different Archetype objects with the same id in a kind |
| `archetype.applies-to-empty` | error | Locus id | an Archetype of the Locus kind's extensions has an empty `appliesTo` list |
| `property.invalid` | error | Locus id | properties do not decode against the merged schema |
| `capability.name-malformed` | error | Locus id | a capability name fails `isCapabilityName` |
| `relation.type-unavailable` | error | Locus id | the relation type is not declared by the Locus kind's extensions |
| `relation.target-missing` | error | Locus id | the target Locus id is not in the model |
| `relation.capability-missing` | error | Locus id | the target Locus has no such capability |
| `relation.target-kind` | error | Locus id | a capability target for a `"locus"` type, or the reverse |
| `relation.self` | error | Locus id | the target Locus is the source Locus |
| `relation.duplicate` | warning | Locus id | the same type and target appear twice on one Locus |
| `relation.cycle` | error | the smallest member id | a cycle in an acyclic relation type |
| `relation.cycle-limit` | warning | root id | more than 100 cycles exist |

## Invocation error tags

| Tag | Raised by | Meaning |
| --- | --- | --- |
| `LocusNotFound` | kernel | the ref's Locus is not in the model |
| `CapabilityNotFound` | kernel | the Locus has no such capability |
| `NotGranted` | kernel | `via` has no granting relation to the capability |
| `InvalidInput` | kernel | raw input does not decode. `issues` lists `{ path, message }`. |
| `NotImplemented` | kernel | the capability has no handler (JSON-declared) |
| `InvalidOutput` | kernel | the handler's output does not encode against the output contract |
| `Defect` | kernel | the handler died or failed with an undeclared value |
| any declared tag | the handler | a declared TaggedError, for example `DivisionByZero` or `NonFiniteResult` |

## Closure finding codes

There are eight codes (`closure.unparsable` was added by WP22).

| Code | Severity | Meaning |
| --- | --- | --- |
| `closure.unowned` | error | an in-scope file matches no `Source` glob |
| `closure.ambiguous` | error | the file matches Loci where neither contains the other |
| `closure.empty-claim` | warning | a `Source` glob matches no file in scope |
| `closure.undeclared-dependency` | error | a file of Locus A imports a file owned by Locus B, where B is not A, an ancestor or descendant of A, or a target of a relation from A or its ancestors |
| `closure.unknown-external` | error | a bare package import that no `External` declaration on the owner or its ancestors lists |
| `closure.unresolved-import` | error | a relative import whose target file does not exist |
| `closure.dynamic-import` | warning | a computed `import(...)` (a non-literal argument, or a template literal with `${...}`), so the dependency is unknown; the finding has `knowledge: "unknown"` |
| `closure.unparsable` | error | an owned file could not be read or parsed (`scanImports` threw), so its imports were not checked; `detail` is `"parse"` and the check continues with the next file |
