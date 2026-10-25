// START_MODULE_CONTRACT
//   PURPOSE: Decode the two generated build files strictly, so that a broken or lying semantic report fails the prerender loudly instead of being shown.
//   SCOPE: The SemanticReport, ClosureFinding and BuildInfo types, readSemanticReport and readBuildInfo. Pure: it reads only the parsed JSON it is given, and never imports the generated files or the root scripts.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ClosureFinding - one Semantic Closure finding as the report writes it
//   SemanticReport - the semantic-report.json document written by bun run telos report
//   BuildInfo - the build-info.json document: the commit the site was built from and whether the tree had changes
//   readSemanticReport - decode semantic-report.json, or null when it was not produced
//   readBuildInfo - decode build-info.json, or null when it was not produced
// END_MODULE_MAP

import type {
  ModelDescription,
  VerificationDescription,
  VerificationReport,
} from "@telos/kernel";

// The closure types live in a Bun-only kernel module, so the app copies the shape.
export interface ClosureFinding {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly file: string | null;
  readonly loci: ReadonlyArray<string>;
  readonly detail: string;
  readonly message: string;
  readonly knowledge: "derived" | "unknown";
}

export interface SemanticReport {
  readonly version: 1;
  readonly provenance: {
    readonly runner: string;
    readonly generatedAt: string;
    readonly commit: string | null;
  };
  readonly model: ModelDescription;
  readonly verification: VerificationReport;
  readonly verifications: Readonly<
    Record<string, ReadonlyArray<VerificationDescription>>
  >;
  readonly closure: {
    readonly limits: ReadonlyArray<string>;
    readonly scope: {
      readonly include: ReadonlyArray<string>;
      readonly exclude: ReadonlyArray<string>;
    };
    readonly fileCount: number;
    readonly findings: ReadonlyArray<ClosureFinding>;
  };
  readonly ok: boolean;
}

export interface BuildInfo {
  readonly commit: string;
  readonly dirty: boolean;
}

type Plain = Readonly<Record<string, unknown>>;

const SEMANTIC_REPORT = "semantic-report.json";
const BUILD_INFO = "build-info.json";

function invalid(file: string, path: string, reason?: string): never {
  const detail = reason === undefined ? "" : ` (${reason})`;
  throw new Error(`${file}: ${path} is invalid${detail}`);
}

function isPlain(value: unknown): value is Plain {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectAt(value: unknown, file: string, path: string): Plain {
  if (!isPlain(value)) invalid(file, path);
  return value;
}

function arrayAt(
  value: unknown,
  file: string,
  path: string,
): ReadonlyArray<unknown> {
  if (!Array.isArray(value)) invalid(file, path);
  return value;
}

function stringAt(
  record: Plain,
  key: string,
  file: string,
  path: string,
): string {
  const value = record[key];
  if (typeof value !== "string") invalid(file, path);
  return value;
}

function booleanAt(
  record: Plain,
  key: string,
  file: string,
  path: string,
): boolean {
  const value = record[key];
  if (typeof value !== "boolean") invalid(file, path);
  return value;
}

function numberAt(
  record: Plain,
  key: string,
  file: string,
  path: string,
): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) invalid(file, path);
  return value;
}

// START_CONTRACT: readSemanticReport
//   PURPOSE: Decode semantic-report.json, refusing any wrong shape with the name of the first wrong field, so that a report the site cannot show is never rendered.
//   INPUTS: { value: unknown - the parsed semantic-report.json, or null when the file does not exist }
//   OUTPUTS: { SemanticReport | null - the report, or null for null input; throws "semantic-report.json: <field> is invalid" for the first wrong field }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: readSemanticReport
export function readSemanticReport(value: unknown): SemanticReport | null {
  if (value === null) return null;
  const file = SEMANTIC_REPORT;
  const root = objectAt(value, file, "document");
  if (root.version !== 1) invalid(file, "version");
  const provenance = objectAt(root.provenance, file, "provenance");
  stringAt(provenance, "runner", file, "provenance.runner");
  stringAt(provenance, "generatedAt", file, "provenance.generatedAt");
  if (provenance.commit !== null && typeof provenance.commit !== "string") {
    invalid(file, "provenance.commit");
  }
  const model = objectAt(root.model, file, "model");
  arrayAt(model.loci, file, "model.loci");
  const verification = objectAt(root.verification, file, "verification");
  arrayAt(verification.findings, file, "verification.findings");
  objectAt(verification.summary, file, "verification.summary");
  objectAt(root.verifications, file, "verifications");
  const closure = objectAt(root.closure, file, "closure");
  arrayAt(closure.limits, file, "closure.limits");
  numberAt(closure, "fileCount", file, "closure.fileCount");
  arrayAt(closure.findings, file, "closure.findings");
  booleanAt(root, "ok", file, "ok");
  return root as unknown as SemanticReport;
}

// START_CONTRACT: readBuildInfo
//   PURPOSE: Decode build-info.json, the commit the site was built from.
//   INPUTS: { value: unknown - the parsed build-info.json, or null when the file does not exist }
//   OUTPUTS: { BuildInfo | null - the decoded build info, or null for null input; throws "build-info.json: <field> is invalid" for a wrong shape }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: readBuildInfo
export function readBuildInfo(value: unknown): BuildInfo | null {
  if (value === null) return null;
  const info = objectAt(value, BUILD_INFO, "file");
  return {
    commit: stringAt(info, "commit", BUILD_INFO, "commit"),
    dirty: booleanAt(info, "dirty", BUILD_INFO, "dirty"),
  };
}
