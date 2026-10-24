// START_MODULE_CONTRACT
//   PURPOSE: Define the Diagnostic shape, the stable diagnostic codes with their severities, and the constructor, ordering and duplicate dropping that keep diagnostic output byte-stable.
//   SCOPE: Severity, DiagnosticCode, Diagnostic, SEVERITY, makeDiagnostic, compareDiagnostics and sortDiagnostics. Out: the checks that produce diagnostics (later work packages).
//   DEPENDS: M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-DIAGNOSTIC
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Severity - "error" or "warning"
//   DiagnosticCode - stable machine codes for every rule violation; adding is allowed, renaming is breaking
//   Diagnostic - one reported rule violation with code, severity, subject, path, members and message
//   SEVERITY - the severity of each DiagnosticCode
//   makeDiagnostic - builds a frozen Diagnostic whose severity comes from SEVERITY and whose members default to none
//   compareDiagnostics - orders diagnostics by subject, code, path, members, then their JSON, by UTF-16 code unit
//   sortDiagnostics - sorts diagnostics and drops exact duplicates
// END_MODULE_MAP

import { deepFreeze } from "./freeze";

// START_CONTRACT: Severity
//   PURPOSE: Name how serious a diagnostic is.
//   INPUTS: none
//   OUTPUTS: { Severity - "error" or "warning" }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: Severity
/** How serious a diagnostic is. */
export type Severity = "error" | "warning";

// START_CONTRACT: DiagnosticCode
//   PURPOSE: Name each rule violation that kernel checks can report.
//   INPUTS: none
//   OUTPUTS: { DiagnosticCode - one of the seventeen stable codes of the kernel contract }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: DiagnosticCode
/** Stable diagnostic codes. Adding a code is allowed; renaming or removing one is breaking. */
export type DiagnosticCode =
  | "identity.malformed"
  | "identity.duplicate"
  | "ownership.multiple"
  | "composition.extension-id-conflict"
  | "composition.property-conflict"
  | "composition.relation-type-conflict"
  | "composition.archetype-id-conflict"
  | "property.invalid"
  | "capability.name-malformed"
  | "relation.type-unavailable"
  | "relation.target-missing"
  | "relation.capability-missing"
  | "relation.target-kind"
  | "relation.self"
  | "relation.duplicate"
  | "relation.cycle"
  | "relation.cycle-limit";

// START_CONTRACT: Diagnostic
//   PURPOSE: Describe one rule violation with its code, severity, the subject and path concerned, and related ids.
//   INPUTS: none
//   OUTPUTS: { Diagnostic - readonly code, severity, subject, path, members (empty when none), message for people }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: Diagnostic
/** One reported rule violation. `message` is for people and is one English sentence ending with a period. */
export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: Severity;
  readonly subject: string;
  readonly path: string;
  readonly members: ReadonlyArray<string>;
  readonly message: string;
}

// START_CONTRACT: SEVERITY
//   PURPOSE: Give every diagnostic code its severity.
//   INPUTS: none
//   OUTPUTS: { Readonly<Record<DiagnosticCode, Severity>> - warning for relation.duplicate and relation.cycle-limit, error for every other code }
//   SIDE_EFFECTS: none. Frozen.
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: SEVERITY
/** The severity of each code. Only relation.duplicate and relation.cycle-limit are warnings. */
export const SEVERITY: Readonly<Record<DiagnosticCode, Severity>> = deepFreeze({
  "identity.malformed": "error",
  "identity.duplicate": "error",
  "ownership.multiple": "error",
  "composition.extension-id-conflict": "error",
  "composition.property-conflict": "error",
  "composition.relation-type-conflict": "error",
  "composition.archetype-id-conflict": "error",
  "property.invalid": "error",
  "capability.name-malformed": "error",
  "relation.type-unavailable": "error",
  "relation.target-missing": "error",
  "relation.capability-missing": "error",
  "relation.target-kind": "error",
  "relation.self": "error",
  "relation.duplicate": "warning",
  "relation.cycle": "error",
  "relation.cycle-limit": "warning",
});

// START_CONTRACT: makeDiagnostic
//   PURPOSE: Build a Diagnostic whose severity comes from SEVERITY and whose JSON form is the same for the same content.
//   INPUTS: { fields: { code, subject, path, message; members optional } - the diagnostic content }
//   OUTPUTS: { Diagnostic - deeply frozen; members is [] when not given }
//   SIDE_EFFECTS: none. The members array is copied. Never throws.
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: makeDiagnostic
/** Builds a frozen Diagnostic. Severity is taken from SEVERITY; members default to an empty list. */
export function makeDiagnostic(fields: {
  readonly code: DiagnosticCode;
  readonly subject: string;
  readonly path: string;
  readonly members?: ReadonlyArray<string>;
  readonly message: string;
}): Diagnostic {
  return deepFreeze({
    code: fields.code,
    severity: SEVERITY[fields.code],
    subject: fields.subject,
    path: fields.path,
    members: [...(fields.members ?? [])],
    message: fields.message,
  });
}

// START_CONTRACT: compareDiagnostics
//   PURPOSE: Give diagnostics one total order that depends only on their content.
//   INPUTS: { a: Diagnostic - first diagnostic; b: Diagnostic - second diagnostic }
//   OUTPUTS: { number - negative when a sorts first, positive when b sorts first, zero when equal }
//   SIDE_EFFECTS: none. Compares by UTF-16 code unit, never by locale.
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: compareDiagnostics
/** Orders by subject, code, path, then members joined with a comma; ties are broken by the JSON form. */
export function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  const keysA = sortKey(a);
  const keysB = sortKey(b);
  for (let i = 0; i < keysA.length; i += 1) {
    const x = keysA[i]!;
    const y = keysB[i]!;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  const jsonA = JSON.stringify(a);
  const jsonB = JSON.stringify(b);
  return jsonA < jsonB ? -1 : jsonA > jsonB ? 1 : 0;
}

function sortKey(d: Diagnostic): [string, string, string, string] {
  return [d.subject, d.code, d.path, d.members.join(",")];
}

// START_CONTRACT: sortDiagnostics
//   PURPOSE: Return diagnostics in the stable order with exact duplicates removed.
//   INPUTS: { list: ReadonlyArray<Diagnostic> - diagnostics in any order }
//   OUTPUTS: { ReadonlyArray<Diagnostic> - sorted with compareDiagnostics; one entry per distinct JSON form }
//   SIDE_EFFECTS: none. Does not mutate the input.
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: sortDiagnostics
/** Sorts with compareDiagnostics and keeps the first of each group with equal JSON. */
export function sortDiagnostics(
  list: ReadonlyArray<Diagnostic>,
): ReadonlyArray<Diagnostic> {
  const sorted = [...list].sort(compareDiagnostics);
  const seen = new Set<string>();
  const kept: Diagnostic[] = [];
  for (const diagnostic of sorted) {
    const json = JSON.stringify(diagnostic);
    if (seen.has(json)) continue;
    seen.add(json);
    kept.push(diagnostic);
  }
  return kept;
}
