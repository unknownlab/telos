// START_MODULE_CONTRACT
//   PURPOSE: Give the one provenance model that every result on the site uses, and the one label text that says where and when a result was produced (FR-021, INV-013).
//   SCOPE: The provenance types, PACKAGE_VERSIONS, CI_PROVENANCE, browserProvenance, toHistorical, formatInstant, shortCommit, siteCommitOf and provenanceText. Pure TypeScript: no Bun, Node or DOM API, so it runs in the build, the tests and the browser.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PackageVersions - the versions of the two workspace packages that produced a result
//   BrowserProvenance - a result run in the browser, with the instant and the site commit
//   BunBuildProvenance - a result run by Bun at build time, with the runtime and the commit
//   CiProvenance - the CI origin, which Stage 0 never produces
//   HistoricalProvenance - a browser result whose input was edited afterwards
//   Provenance - the union of the four origins
//   ProvenanceOrigin - an origin, or "none" for a result slot with nothing in it
//   PACKAGE_VERSIONS - the versions of @telos/locus and @telos/locus-specs
//   CI_PROVENANCE - the CI provenance value
//   browserProvenance - the provenance of a browser run
//   toHistorical - the same run, marked stale
//   formatInstant - an ISO instant as a UTC date and time
//   shortCommit - the first seven characters of a commit
//   siteCommitOf - the commit the site was built from, for browser provenance
//   provenanceText - the visible label text of a provenance
// END_MODULE_MAP

import locusPackage from "@telos/locus/package.json";
import specsPackage from "@telos/locus-specs/package.json";

export interface PackageVersions {
  readonly "@telos/locus": string;
  readonly "@telos/locus-specs": string;
}

export interface BrowserProvenance {
  readonly origin: "browser";
  readonly at: string;
  readonly packages: PackageVersions;
  readonly siteCommit: string;
}

export interface BunBuildProvenance {
  readonly origin: "bun-build";
  readonly at: string;
  readonly runtime: string;
  readonly packages: PackageVersions;
  readonly commit: string;
  readonly dirty: boolean;
}

export interface CiProvenance {
  readonly origin: "ci";
}

export interface HistoricalProvenance {
  readonly origin: "historical";
  readonly at: string;
  readonly packages: PackageVersions;
  readonly siteCommit: string;
}

export type Provenance =
  BrowserProvenance | BunBuildProvenance | CiProvenance | HistoricalProvenance;

/** "none" marks a result slot with nothing in it (NS-018). */
export type ProvenanceOrigin = Provenance["origin"] | "none";

// START_CONTRACT: PACKAGE_VERSIONS
//   PURPOSE: Record which versions of the two packages produced a result, read from their package.json files at build time.
//   INPUTS: none (build-time constant)
//   OUTPUTS: { PackageVersions - the version of @telos/locus and of @telos/locus-specs }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: PACKAGE_VERSIONS
export const PACKAGE_VERSIONS: PackageVersions = {
  "@telos/locus": locusPackage.version,
  "@telos/locus-specs": specsPackage.version,
};

// START_CONTRACT: CI_PROVENANCE
//   PURPOSE: Mark a result that a CI service produced. Stage 0 has no CI service, so the site shows "CI: not available".
//   INPUTS: none (constant)
//   OUTPUTS: { CiProvenance - the origin "ci" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: CI_PROVENANCE
export const CI_PROVENANCE: CiProvenance = { origin: "ci" };

// START_CONTRACT: browserProvenance
//   PURPOSE: Record a result that ran in the browser, with the instant it ran and the commit the site was built from.
//   INPUTS: { at: Date - the instant of the run, siteCommit: string - the site commit, packages: PackageVersions - the package versions }
//   OUTPUTS: { BrowserProvenance - origin "browser" with the instant as an ISO string }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: browserProvenance
export function browserProvenance(
  at: Date,
  siteCommit: string,
  packages: PackageVersions = PACKAGE_VERSIONS,
): BrowserProvenance {
  return { origin: "browser", at: at.toISOString(), packages, siteCommit };
}

// START_CONTRACT: toHistorical
//   PURPOSE: Mark a browser run as stale because its input was edited after the run, without recomputing it (INV-013).
//   INPUTS: { provenance: BrowserProvenance | HistoricalProvenance - the run }
//   OUTPUTS: { HistoricalProvenance - the same instant, packages and site commit with origin "historical" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: toHistorical
export function toHistorical(
  provenance: BrowserProvenance | HistoricalProvenance,
): HistoricalProvenance {
  return {
    origin: "historical",
    at: provenance.at,
    packages: provenance.packages,
    siteCommit: provenance.siteCommit,
  };
}

const ISO_INSTANT = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/;

// START_CONTRACT: formatInstant
//   PURPOSE: Show an instant in UTC from its ISO string, so that the prerendered and the hydrated text are identical (no locale formatting).
//   INPUTS: { iso: string - an ISO instant such as "2026-10-21T10:18:46.123Z" }
//   OUTPUTS: { string - "2026-10-21 10:18:46 UTC", or the input unchanged when it is not an ISO instant }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: formatInstant
export function formatInstant(iso: string): string {
  const match = ISO_INSTANT.exec(iso);
  if (match === null || Number.isNaN(Date.parse(iso))) return iso;
  return `${match[1]} ${match[2]} UTC`;
}

const FULL_SHA = /^([0-9a-f]{40})(-dirty)?$/;

// START_CONTRACT: shortCommit
//   PURPOSE: Shorten a commit to the 7 characters that the labels show, keeping a -dirty marker.
//   INPUTS: { commit: string - a 40-character lower-case hex sha, optionally followed by -dirty }
//   OUTPUTS: { string - the first 7 characters with the -dirty suffix kept; any other input unchanged }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: shortCommit
export function shortCommit(commit: string): string {
  const match = FULL_SHA.exec(commit);
  if (match === null) return commit;
  return `${(match[1] ?? "").slice(0, 7)}${match[2] ?? ""}`;
}

// START_CONTRACT: siteCommitOf
//   PURPOSE: Name the commit the site was built from, for browser provenance, using "unknown" when the build did not record one.
//   INPUTS: { info: { commit: string, dirty: boolean } | null - the build info, null when spec-report.ts did not run }
//   OUTPUTS: { string - "unknown" for null; the commit, with "-dirty" appended when the tree had changes }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: siteCommitOf
export function siteCommitOf(
  info: { readonly commit: string; readonly dirty: boolean } | null,
): string {
  if (info === null) return "unknown";
  return info.dirty ? `${info.commit}-dirty` : info.commit;
}

function packagesText(packages: PackageVersions): string {
  return `@telos/locus ${packages["@telos/locus"]} · @telos/locus-specs ${packages["@telos/locus-specs"]}`;
}

// START_CONTRACT: provenanceText
//   PURPOSE: Give the one visible label text of a result, so that every result says where, when and from which commit it was produced, and a result that did not run says so.
//   INPUTS: { provenance: Provenance | null - the provenance of the result, null when nothing ran }
//   OUTPUTS: { string - "Not run" for null; otherwise the origin's label text with the times in UTC and the package versions }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: provenanceText
export function provenanceText(provenance: Provenance | null): string {
  if (provenance === null) return "Not run";
  switch (provenance.origin) {
    case "browser":
      return `Run in this browser at ${formatInstant(provenance.at)} · ${packagesText(provenance.packages)} · site commit ${shortCommit(provenance.siteCommit)}`;
    case "bun-build":
      return `Run by ${provenance.runtime} at build time, ${formatInstant(provenance.at)} · commit ${shortCommit(provenance.commit)}${provenance.dirty ? " (uncommitted changes)" : ""} · ${packagesText(provenance.packages)}`;
    case "ci":
      return "CI: not available";
    case "historical":
      return `Historical: run in this browser at ${formatInstant(provenance.at)} · ${packagesText(provenance.packages)} · site commit ${shortCommit(provenance.siteCommit)}. The input has changed since this run.`;
  }
}
