// START_MODULE_CONTRACT
//   PURPOSE: Reduce a LocusDefinition to its canonical semantic form, version 1, so that equal meaning gives equal text.
//   SCOPE: canonicalDefinition (internal) and canonicalForm (public). Out: hashing (revision.ts), validation (WP03).
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-REVISION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   canonicalDefinition - the canonical definition: sets sorted and de-duplicated, metadata dropped, deeply frozen
//   canonicalForm - canonical JSON, version 1, of a definition
// END_MODULE_MAP

import { deepFreeze } from "./freeze";
import type { LocusDefinition } from "./locus";
import type { Relation } from "./relation";

// START_CONTRACT: sortedSet
//   PURPOSE: Return the distinct values of a string list in UTF-16 code-unit order.
//   INPUTS: { values: ReadonlyArray<string> - any list, possibly with duplicates }
//   OUTPUTS: { string[] - a new array, de-duplicated and sorted by the default comparison }
//   SIDE_EFFECTS: none. The input is not mutated.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: sortedSet
/** Distinct values in code-unit order. Strings are not trimmed or normalised. */
function sortedSet(values: ReadonlyArray<string>): string[] {
  return [...new Set(values)].sort();
}

// START_CONTRACT: canonicalRelations
//   PURPOSE: Return the Relations de-duplicated by kind and target and sorted by kind, then target.
//   INPUTS: { relations: ReadonlyArray<Relation> - any list, possibly with duplicates }
//   OUTPUTS: { Relation[] - new objects holding only kind and target, in canonical order }
//   SIDE_EFFECTS: none. The input is not mutated.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: canonicalRelations
/** Relations de-duplicated by `kind target` and sorted by kind, then target. Code-unit order. */
function canonicalRelations(relations: ReadonlyArray<Relation>): Relation[] {
  const distinct = new Map<string, Relation>();
  for (const relation of relations) {
    const key = `${relation.kind} ${relation.target}`;
    if (!distinct.has(key)) {
      distinct.set(key, { kind: relation.kind, target: relation.target });
    }
  }
  return [...distinct.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
    if (a.target !== b.target) return a.target < b.target ? -1 : 1;
    return 0;
  });
}

// START_CONTRACT: canonicalDefinition
//   PURPOSE: Build the canonical semantic definition of a Locus: sets sorted, Relations canonical, metadata removed.
//   INPUTS: { definition: LocusDefinition - any definition, including an invalid one }
//   OUTPUTS: { LocusDefinition - { id, charter: { purpose, responsibilities, excluded, successConditions }, owner only when present, relations }, deeply frozen }
//   SIDE_EFFECTS: none. The input is not mutated. Internal to @telos/locus; not exported from index.ts.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: canonicalDefinition
/** The canonical semantic definition. Metadata is dropped; the owner is kept only when present. */
export function canonicalDefinition(
  definition: LocusDefinition,
): LocusDefinition {
  return deepFreeze({
    id: definition.id,
    charter: {
      purpose: definition.charter.purpose,
      responsibilities: sortedSet(definition.charter.responsibilities),
      excluded: sortedSet(definition.charter.excluded),
      successConditions: sortedSet(definition.charter.successConditions),
    },
    ...(definition.owner === undefined ? {} : { owner: definition.owner }),
    relations: canonicalRelations(definition.relations),
  });
}

// START_CONTRACT: canonicalForm
//   PURPOSE: Serialise a definition to the canonical JSON text of version 1.
//   INPUTS: { definition: LocusDefinition - any definition, including an invalid one }
//   OUTPUTS: { string - JSON.stringify of {v, id, charter, owner or null, relations} with keys in this order and no whitespace }
//   SIDE_EFFECTS: none. Pure.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: canonicalForm
/** Canonical JSON, version 1. Pure. Equal meaning gives equal text; any semantic change gives different text. */
export function canonicalForm(definition: LocusDefinition): string {
  const canonical = canonicalDefinition(definition);
  return JSON.stringify({
    v: 1,
    id: canonical.id,
    charter: {
      purpose: canonical.charter.purpose,
      responsibilities: canonical.charter.responsibilities,
      excluded: canonical.charter.excluded,
      successConditions: canonical.charter.successConditions,
    },
    owner: canonical.owner ?? null,
    relations: canonical.relations.map(({ kind, target }) => ({
      kind,
      target,
    })),
  });
}
