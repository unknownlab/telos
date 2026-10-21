// START_MODULE_CONTRACT
//   PURPOSE: Decode the two generated build files strictly, so that a broken or lying report fails the prerender loudly instead of being shown.
//   SCOPE: The SpecReportFile and BuildInfo types, readSpecReportFile and readBuildInfo. Pure: it reads only the parsed JSON it is given, and never imports the generated files.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SpecReportFile - the spec-report.json document: the report and its bun-build provenance
//   BuildInfo - the build-info.json document: the commit the site was built from and whether the tree had changes
//   readSpecReportFile - decode spec-report.json, or null when it was not produced
//   readBuildInfo - decode build-info.json, or null when it was not produced
// END_MODULE_MAP

import type { SpecReport, SpecResult } from "@telos/locus-specs";
import type { BunBuildProvenance, PackageVersions } from "./provenance";

export interface SpecReportFile {
  readonly report: SpecReport;
  readonly provenance: BunBuildProvenance;
}

export interface BuildInfo {
  readonly commit: string;
  readonly dirty: boolean;
}

type Plain = Readonly<Record<string, unknown>>;
type Status = SpecResult["status"];

const SPEC_REPORT = "spec-report.json";
const BUILD_INFO = "build-info.json";
const STATUSES: ReadonlyArray<string> = ["pass", "fail", "error"];

function invalid(file: string, path: string): never {
  throw new Error(`${file}: ${path} is invalid`);
}

function isPlain(value: unknown): value is Plain {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectAt(value: unknown, file: string, path: string): Plain {
  if (!isPlain(value)) invalid(file, path);
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

function decodePackages(value: unknown, file: string): PackageVersions {
  const path = "provenance.packages";
  const packages = objectAt(value, file, path);
  return {
    "@telos/locus": stringAt(
      packages,
      "@telos/locus",
      file,
      `${path}.@telos/locus`,
    ),
    "@telos/locus-specs": stringAt(
      packages,
      "@telos/locus-specs",
      file,
      `${path}.@telos/locus-specs`,
    ),
  };
}

function decodeStatus(value: unknown, file: string, path: string): Status {
  if (typeof value !== "string" || !STATUSES.includes(value)) {
    invalid(file, path);
  }
  return value as Status;
}

function decodeResults(value: unknown, file: string): SpecResult[] {
  if (!Array.isArray(value)) invalid(file, "report.results");
  return value.map((item, index) => {
    const path = `report.results[${index}]`;
    const result = objectAt(item, file, path);
    return {
      id: stringAt(result, "id", file, `${path}.id`) as SpecResult["id"],
      status: decodeStatus(result.status, file, `${path}.status`),
      expected: result.expected,
      observed: result.observed,
      durationMs: numberAt(result, "durationMs", file, `${path}.durationMs`),
    };
  });
}

function countOf(results: ReadonlyArray<SpecResult>, status: Status): number {
  return results.filter((result) => result.status === status).length;
}

// START_CONTRACT: readSpecReportFile
//   PURPOSE: Decode spec-report.json, refusing any wrong shape and any summary that disagrees with its rows, so that a report can never claim more passes than it holds.
//   INPUTS: { value: unknown - the parsed spec-report.json, or null when the file does not exist }
//   OUTPUTS: { SpecReportFile | null - the decoded file, or null for null input; throws "spec-report.json: <field> is invalid" for a wrong shape or a summary that disagrees with the results }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: readSpecReportFile
export function readSpecReportFile(value: unknown): SpecReportFile | null {
  if (value === null) return null;
  const root = objectAt(value, SPEC_REPORT, "file");
  const provenance = objectAt(root.provenance, SPEC_REPORT, "provenance");
  if (provenance.origin !== "bun-build") {
    invalid(SPEC_REPORT, "provenance.origin");
  }
  const report = objectAt(root.report, SPEC_REPORT, "report");
  const results = decodeResults(report.results, SPEC_REPORT);
  const summary = objectAt(report.summary, SPEC_REPORT, "summary");
  const agrees =
    summary.total === results.length &&
    summary.passed === countOf(results, "pass") &&
    summary.failed === countOf(results, "fail") &&
    summary.errored === countOf(results, "error");
  if (!agrees) invalid(SPEC_REPORT, "summary");
  return {
    report: {
      results,
      summary: {
        total: results.length,
        passed: countOf(results, "pass"),
        failed: countOf(results, "fail"),
        errored: countOf(results, "error"),
      },
    },
    provenance: {
      origin: "bun-build",
      at: stringAt(provenance, "at", SPEC_REPORT, "provenance.at"),
      runtime: stringAt(
        provenance,
        "runtime",
        SPEC_REPORT,
        "provenance.runtime",
      ),
      packages: decodePackages(provenance.packages, SPEC_REPORT),
      commit: stringAt(provenance, "commit", SPEC_REPORT, "provenance.commit"),
      dirty: booleanAt(provenance, "dirty", SPEC_REPORT, "provenance.dirty"),
    },
  };
}

// START_CONTRACT: readBuildInfo
//   PURPOSE: Decode build-info.json, the commit the site was built from.
//   INPUTS: { value: unknown - the parsed build-info.json, or null when the file does not exist }
//   OUTPUTS: { BuildInfo | null - the decoded build info, or null for null input; throws "build-info.json: <field> is invalid" for a wrong shape }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: readBuildInfo
export function readBuildInfo(value: unknown): BuildInfo | null {
  if (value === null) return null;
  const info = objectAt(value, BUILD_INFO, "file");
  return {
    commit: stringAt(info, "commit", BUILD_INFO, "commit"),
    dirty: booleanAt(info, "dirty", BUILD_INFO, "dirty"),
  };
}
