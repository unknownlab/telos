// START_MODULE_CONTRACT
//   PURPOSE: Run the real @telos/locus package on Fabric JSON text the reader edited, and turn the package results into the outcome the playground shows (FR-019, FR-020, C-002).
//   SCOPE: FabricOutcome, DecodeIssue, RevisionRow, RelationRow, runFabric and relationRows. Input is parsed only by decodeFabricJson; nothing in the text is executed. Out: the views (fabric-results.tsx) and the run state (run-state.ts).
//   DEPENDS: M-DOCS-PLAYGROUND, M-LOCUS-DECODE, M-LOCUS-VALIDATION, M-LOCUS-REVISION
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DecodeIssue - one located decode problem, with the path and the message
//   RevisionRow - the Revision id of one Locus
//   RelationProblem - a problem that a Relation row can carry
//   RelationRow - one Relation of the Fabric with the problems the validation report gives it
//   FabricOutcome - a decode error, or a validated Fabric with its report, Revision ids and Relation rows
//   runFabric - decode, validate and compute the Revision ids of a Fabric text
//   relationRows - one row per Relation, with its problems read from the report
// END_MODULE_MAP

import {
  createRevision,
  decodeFabricJson,
  type Fabric,
  type RelationKind,
  type RevisionId,
  validateFabric,
  type ValidationReport,
} from "@telos/locus";
import { Effect, Result } from "effect";

export interface DecodeIssue {
  readonly path: string;
  readonly message: string;
}

export interface RevisionRow {
  readonly locus: string;
  readonly id: RevisionId;
}

export type RelationProblem =
  "target-missing" | "self" | "duplicate" | "refines-cycle";

export interface RelationRow {
  readonly from: string;
  readonly kind: RelationKind;
  readonly target: string;
  readonly problems: ReadonlyArray<RelationProblem>;
}

export type FabricOutcome =
  | {
      readonly kind: "decode-error";
      readonly issues: ReadonlyArray<DecodeIssue>;
    }
  | {
      readonly kind: "validated";
      readonly report: ValidationReport;
      readonly revisions:
        | { readonly ok: true; readonly rows: ReadonlyArray<RevisionRow> }
        | { readonly ok: false; readonly message: string };
      readonly relations: ReadonlyArray<RelationRow>;
    };

// START_CONTRACT: runFabric
//   PURPOSE: Decode, validate and identify a Fabric text, so that the playground shows exactly what the package reports.
//   INPUTS: { text: string - the Fabric JSON the reader edited }
//   OUTPUTS: { Promise<FabricOutcome> - a decode-error with the located issues, or a validated outcome; resolves, and rejects only for an unexpected throw }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle to compute the Revision ids. Parses the text with decodeFabricJson only.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: runFabric
/** Runs the package on one Fabric text. Decode failures are results; they never reject. */
export async function runFabric(text: string): Promise<FabricOutcome> {
  const decoded = await Effect.runPromise(
    Effect.result(decodeFabricJson(text)),
  );
  if (Result.isFailure(decoded)) {
    return { kind: "decode-error", issues: decoded.failure.issues };
  }
  const fabric = decoded.success;
  const report = validateFabric(fabric);
  const revisions = await Effect.runPromise(
    Effect.result(
      Effect.forEach(fabric.loci, (locus) => createRevision(locus)),
    ),
  );
  return {
    kind: "validated",
    report,
    revisions: Result.isFailure(revisions)
      ? {
          ok: false,
          message: "Revision ids are unavailable: Web Crypto failed.",
        }
      : {
          ok: true,
          rows: revisions.success.map((revision) => ({
            locus: revision.locus,
            id: revision.id,
          })),
        },
    relations: relationRows(fabric, report),
  };
}

// The problems of a Relation of one Locus, read from the report and never recomputed.
// A refines cycle is reported on its members, so a refines Relation is in a cycle
// when both its Locus and its target are members of one reported cycle.
function problemsOf(
  report: ValidationReport,
  locusId: string,
  kind: RelationKind,
  target: string,
): RelationProblem[] {
  const detail = `${kind} ${target}`;
  const own = report.diagnostics.filter((d) => d.subject === locusId);
  const problems: RelationProblem[] = [];
  if (
    own.some((d) => d.code === "relation.target-missing" && d.detail === detail)
  ) {
    problems.push("target-missing");
  }
  if (own.some((d) => d.code === "relation.self" && d.detail === detail)) {
    problems.push("self");
  }
  if (own.some((d) => d.code === "relation.duplicate" && d.detail === detail)) {
    problems.push("duplicate");
  }
  if (
    kind === "refines" &&
    report.diagnostics.some(
      (d) =>
        d.code === "relation.refines-cycle" &&
        d.members !== undefined &&
        d.members.includes(locusId) &&
        d.members.includes(target),
    )
  ) {
    problems.push("refines-cycle");
  }
  return problems;
}

// START_CONTRACT: relationRows
//   PURPOSE: List every Relation of the Fabric with the problems that the validation report gives it, so that the table shows the package's verdict and does not re-derive it.
//   INPUTS: { fabric: Fabric - the validated Fabric, report: ValidationReport - its report }
//   OUTPUTS: { RelationRow[] - one row per Relation, Loci in Fabric order and Relations in entry order; problems in the order of RelationProblem }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: relationRows
/** One row per Relation, with the problems read from the report. */
export function relationRows(
  fabric: Fabric,
  report: ValidationReport,
): RelationRow[] {
  return fabric.loci.flatMap((locus) =>
    locus.relations.map((relation) => ({
      from: locus.id,
      kind: relation.kind,
      target: relation.target,
      problems: problemsOf(report, locus.id, relation.kind, relation.target),
    })),
  );
}
