// START_MODULE_CONTRACT
//   PURPOSE: Compare two Revisions of the same Locus and report the ordered list of changes between their canonical definitions.
//   SCOPE: Change, ChangeSet, SetPart and diffRevisions. Out: revision ids (revision.ts), history (WP05), rendering.
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-REVISION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SetPart - the four set-valued parts of a definition that produce added and removed changes
//   Change - one changed, added or removed part of a definition
//   ChangeSet - the ordered changes between two Revisions of one Locus
//   diffRevisions - fails for different Loci; otherwise returns the ordered change set
// END_MODULE_MAP

import { Effect } from "effect";
import { LocusMismatchError } from "./errors";
import { deepFreeze } from "./freeze";
import type { Identity } from "./identity";
import type { Revision, RevisionId } from "./revision";

// START_CONTRACT: SetPart
//   PURPOSE: Name the set-valued parts of a definition that can gain or lose values.
//   INPUTS: none
//   OUTPUTS: { SetPart - "charter.responsibilities" | "charter.excluded" | "charter.successConditions" | "relations" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: SetPart
/** A set-valued part of a definition. */
export type SetPart =
  | "charter.responsibilities"
  | "charter.excluded"
  | "charter.successConditions"
  | "relations";

// START_CONTRACT: Change
//   PURPOSE: Describe one change between two definitions.
//   INPUTS: none
//   OUTPUTS: { Change - purpose or owner changed with old and new value; or a set value added or removed }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: Change
/** One change. Object keys are in the order part, kind, then from and to or value. */
export type Change =
  | {
      readonly part: "charter.purpose";
      readonly kind: "changed";
      readonly from: string;
      readonly to: string;
    }
  | {
      readonly part: "owner";
      readonly kind: "changed";
      readonly from: Identity | null;
      readonly to: Identity | null;
    }
  | {
      readonly part: SetPart;
      readonly kind: "added" | "removed";
      readonly value: string;
    };

// START_CONTRACT: ChangeSet
//   PURPOSE: Hold the ordered changes from one Revision of a Locus to another.
//   INPUTS: none
//   OUTPUTS: { ChangeSet - readonly locus: Identity; from: RevisionId; to: RevisionId; changes: ReadonlyArray<Change> }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: ChangeSet
/** The structured difference between two Revisions of one Locus. */
export interface ChangeSet {
  readonly locus: Identity;
  readonly from: RevisionId;
  readonly to: RevisionId;
  readonly changes: ReadonlyArray<Change>;
}

// START_CONTRACT: setChanges
//   PURPOSE: Report the values removed and added in one set-valued part.
//   INPUTS: { part: SetPart; from: ReadonlyArray<string>; to: ReadonlyArray<string> - the values of each side }
//   OUTPUTS: { Change[] - every removed value in code-unit order, then every added value in code-unit order }
//   SIDE_EFFECTS: none. Inputs are not mutated.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: setChanges
/** Removed values first, then added values; each group in code-unit order. */
function setChanges(
  part: SetPart,
  from: ReadonlyArray<string>,
  to: ReadonlyArray<string>,
): Change[] {
  const fromValues = new Set(from);
  const toValues = new Set(to);
  const removed = [...fromValues].filter((v) => !toValues.has(v)).sort();
  const added = [...toValues].filter((v) => !fromValues.has(v)).sort();
  return [
    ...removed.map((value) => ({ part, kind: "removed" as const, value })),
    ...added.map((value) => ({ part, kind: "added" as const, value })),
  ];
}

// START_CONTRACT: relationValues
//   PURPOSE: Render each Relation of a definition as the value "<kind> <target>".
//   INPUTS: { relations: ReadonlyArray<{ kind: string; target: string }> }
//   OUTPUTS: { string[] - one value per Relation, in input order }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: relationValues
/** The Relations as "<kind> <target>" values. */
function relationValues(
  relations: ReadonlyArray<{ readonly kind: string; readonly target: string }>,
): string[] {
  return relations.map((r) => `${r.kind} ${r.target}`);
}

/**
 * Builds the ordered change list. Compares the canonical definitions stored in the Revisions.
 * Order: purpose, owner, responsibilities, excluded, successConditions, relations.
 */
function buildChangeSet(from: Revision, to: Revision): ChangeSet {
  const a = from.definition;
  const b = to.definition;
  const changes: Change[] = [];

  if (a.charter.purpose !== b.charter.purpose) {
    changes.push({
      part: "charter.purpose",
      kind: "changed",
      from: a.charter.purpose,
      to: b.charter.purpose,
    });
  }

  const fromOwner = a.owner ?? null;
  const toOwner = b.owner ?? null;
  if (fromOwner !== toOwner) {
    changes.push({
      part: "owner",
      kind: "changed",
      from: fromOwner,
      to: toOwner,
    });
  }

  changes.push(
    ...setChanges(
      "charter.responsibilities",
      a.charter.responsibilities,
      b.charter.responsibilities,
    ),
    ...setChanges("charter.excluded", a.charter.excluded, b.charter.excluded),
    ...setChanges(
      "charter.successConditions",
      a.charter.successConditions,
      b.charter.successConditions,
    ),
    ...setChanges(
      "relations",
      relationValues(a.relations),
      relationValues(b.relations),
    ),
  );

  return deepFreeze({ locus: from.locus, from: from.id, to: to.id, changes });
}

// START_CONTRACT: diffRevisions
//   PURPOSE: Compare two Revisions of the same Locus.
//   INPUTS: { from: Revision - the earlier Revision; to: Revision - the later Revision }
//   OUTPUTS: { Effect<ChangeSet, LocusMismatchError> - fails when the loci differ; otherwise the ordered change set, empty exactly when from.id equals to.id }
//   SIDE_EFFECTS: none. Pure once run.
//   LINKS: M-LOCUS-REVISION
// END_CONTRACT: diffRevisions
/** Ordered change set between two Revisions. Fails with LocusMismatchError for different Loci. */
export const diffRevisions = (
  from: Revision,
  to: Revision,
): Effect.Effect<ChangeSet, LocusMismatchError> => {
  if (from.locus !== to.locus) {
    return Effect.fail(
      new LocusMismatchError({ from: from.locus, to: to.locus }),
    );
  }
  return Effect.sync(() => buildChangeSet(from, to));
};
