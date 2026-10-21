// START_MODULE_CONTRACT
//   PURPOSE: Define the Diagnostic and ValidationReport shapes, the stable diagnostic codes, and the constructor and ordering that keep validation output byte-stable.
//   SCOPE: DiagnosticCode, Diagnostic, ValidationReport, makeDiagnostic and compareDiagnostics. Out: the checks that produce diagnostics (validate.ts) and the public export list (index.ts).
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-VALIDATION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DiagnosticCode - stable machine codes for every rule violation; adding is allowed, renaming is breaking
//   Diagnostic - one reported rule violation
//   ValidationReport - the result of validating a Fabric; valid is true exactly when there are no diagnostics
//   makeDiagnostic - builds a frozen Diagnostic with a fixed key order and omits absent optional fields
//   compareDiagnostics - orders diagnostics by subject, code, path, detail, then members, by UTF-16 code unit
// END_MODULE_MAP

import { deepFreeze } from "./freeze";
import type { Identity } from "./identity";

// START_CONTRACT: DiagnosticCode
//   PURPOSE: Name each rule violation that validation can report.
//   INPUTS: none
//   OUTPUTS: { DiagnosticCode - one of the thirteen stable codes of locus-api.md }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-VALIDATION
// END_CONTRACT: DiagnosticCode
/** Stable diagnostic codes. Adding a code is allowed; renaming or removing one is breaking. */
export type DiagnosticCode =
  | "identity.malformed"
  | "identity.duplicate"
  | "charter.purpose-blank"
  | "charter.responsibilities-empty"
  | "charter.entry-blank"
  | "charter.entry-duplicate"
  | "owner.missing"
  | "owner.self"
  | "owner.cycle"
  | "relation.target-missing"
  | "relation.self"
  | "relation.duplicate"
  | "relation.refines-cycle";

// START_CONTRACT: Diagnostic
//   PURPOSE: Describe one rule violation with its code, the identity concerned and the part concerned.
//   INPUTS: none
//   OUTPUTS: { Diagnostic - readonly code, scope ("fabric" | "locus"), subject, path; optional detail and members; message for people }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-VALIDATION
// END_CONTRACT: Diagnostic
/** One reported rule violation. `message` is for people and is not part of any contract. */
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly scope: "fabric" | "locus";
  readonly subject: string;
  readonly path: string;
  readonly detail?: string;
  readonly members?: ReadonlyArray<Identity>;
  readonly message: string;
}

// START_CONTRACT: ValidationReport
//   PURPOSE: Carry the outcome of validating one Fabric.
//   INPUTS: none
//   OUTPUTS: { ValidationReport - readonly valid: boolean; diagnostics: ReadonlyArray<Diagnostic> }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-VALIDATION
// END_CONTRACT: ValidationReport
/** The result of validating a Fabric. `valid` is true exactly when there are no diagnostics. */
export interface ValidationReport {
  readonly valid: boolean;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

// START_CONTRACT: makeDiagnostic
//   PURPOSE: Build a Diagnostic whose JSON form is the same for the same content.
//   INPUTS: { fields: { code, scope, subject, path, message; detail and members optional } - the diagnostic content }
//   OUTPUTS: { Diagnostic - deeply frozen; keys in the order code, scope, subject, path, detail, members, message; absent optional fields are omitted, never undefined }
//   SIDE_EFFECTS: none. The members array is copied. Never throws.
//   LINKS: M-LOCUS-VALIDATION
// END_CONTRACT: makeDiagnostic
/** Builds a frozen Diagnostic with a fixed key order. Omits `detail` and `members` when they are not given. */
export function makeDiagnostic(fields: {
  readonly code: DiagnosticCode;
  readonly scope: "fabric" | "locus";
  readonly subject: string;
  readonly path: string;
  readonly detail?: string;
  readonly members?: ReadonlyArray<Identity>;
  readonly message: string;
}): Diagnostic {
  return deepFreeze({
    code: fields.code,
    scope: fields.scope,
    subject: fields.subject,
    path: fields.path,
    ...(fields.detail === undefined ? {} : { detail: fields.detail }),
    ...(fields.members === undefined ? {} : { members: [...fields.members] }),
    message: fields.message,
  });
}

// START_CONTRACT: compareDiagnostics
//   PURPOSE: Give diagnostics one total order that depends only on their content.
//   INPUTS: { a: Diagnostic - first diagnostic; b: Diagnostic - second diagnostic }
//   OUTPUTS: { number - negative when a sorts first, positive when b sorts first, zero when the keys are equal }
//   SIDE_EFFECTS: none. Compares by UTF-16 code unit, never by locale.
//   LINKS: M-LOCUS-VALIDATION
// END_CONTRACT: compareDiagnostics
/** Orders by subject, code, path, detail, then members joined with a comma. A missing detail or members counts as empty. */
export function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  const keysA = sortKey(a);
  const keysB = sortKey(b);
  for (let i = 0; i < keysA.length; i += 1) {
    const x = keysA[i]!;
    const y = keysB[i]!;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  // The key order decides everything the contract names. This final fallback
  // only breaks ties between diagnostics whose key fields are all equal, so
  // the output stays byte-stable under any input order.
  const jsonA = JSON.stringify(a);
  const jsonB = JSON.stringify(b);
  return jsonA < jsonB ? -1 : jsonA > jsonB ? 1 : 0;
}

function sortKey(d: Diagnostic): [string, string, string, string, string] {
  return [
    d.subject,
    d.code,
    d.path,
    d.detail ?? "",
    (d.members ?? []).join(","),
  ];
}
