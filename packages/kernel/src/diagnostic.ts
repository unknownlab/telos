import { deepFreeze } from "./freeze";

export type Severity = "error" | "warning";

export type DiagnosticCode =
  | "identity.malformed"
  | "identity.duplicate"
  | "ownership.multiple"
  | "composition.extension-id-conflict"
  | "composition.property-conflict"
  | "composition.relation-type-conflict"
  | "composition.archetype-id-conflict"
  | "archetype.applies-to-empty"
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

export interface Diagnostic {
  readonly code: DiagnosticCode;
  readonly severity: Severity;
  readonly subject: string;
  readonly path: string;
  readonly members: ReadonlyArray<string>;
  readonly message: string;
}

export const SEVERITY: Readonly<Record<DiagnosticCode, Severity>> = deepFreeze({
  "identity.malformed": "error",
  "identity.duplicate": "error",
  "ownership.multiple": "error",
  "composition.extension-id-conflict": "error",
  "composition.property-conflict": "error",
  "composition.relation-type-conflict": "error",
  "composition.archetype-id-conflict": "error",
  "archetype.applies-to-empty": "error",
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
