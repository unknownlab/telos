// START_MODULE_CONTRACT
//   PURPOSE: Give the one provenance model that every result on the site uses, and the one label text that says where and when a result was produced (FR-021, INV-013).
//   SCOPE: BuildProvenance, Provenance, ProvenanceOrigin, buildProvenanceOf, formatInstant, shortCommit and provenanceText. Pure TypeScript: no Bun, Node or DOM API, so it runs in the build, the tests and the browser.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BuildProvenance - a result that bun run telos report produced at build time
//   Provenance - the provenance of a result, the build provenance
//   ProvenanceOrigin - an origin, or "none" for a result slot with nothing in it
//   buildProvenanceOf - the build provenance of the semantic report and build info, or null without a report
//   formatInstant - an ISO instant as a UTC date and time
//   shortCommit - the first seven characters of a commit
//   provenanceText - the visible label text of a provenance
// END_MODULE_MAP

export interface BuildProvenance {
  readonly origin: "bun-build";
  readonly runner: string;
  readonly generatedAt: string;
  readonly commit: string | null;
  readonly dirty: boolean;
}

export type Provenance = BuildProvenance;

/** "none" marks a result slot with nothing in it. */
export type ProvenanceOrigin = Provenance["origin"] | "none";

// START_CONTRACT: buildProvenanceOf
//   PURPOSE: Name where the build-time semantic report came from, with the working-tree flag of the build info.
//   INPUTS: { report: { provenance: { runner, generatedAt, commit } } | null - the semantic report, null when it was not produced; info: { dirty: boolean } | null - the build info }
//   OUTPUTS: { BuildProvenance | null - null for a null report; otherwise origin "bun-build" with dirty from the build info, false when it is absent }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: buildProvenanceOf
export function buildProvenanceOf(
  report: {
    readonly provenance: {
      readonly runner: string;
      readonly generatedAt: string;
      readonly commit: string | null;
    };
  } | null,
  info: { readonly dirty: boolean } | null,
): BuildProvenance | null {
  if (report === null) return null;
  return {
    origin: "bun-build",
    runner: report.provenance.runner,
    generatedAt: report.provenance.generatedAt,
    commit: report.provenance.commit,
    dirty: info?.dirty ?? false,
  };
}

const ISO_INSTANT = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?Z$/;

// START_CONTRACT: formatInstant
//   PURPOSE: Show an instant in UTC from its ISO string, so that the prerendered and the hydrated text are identical (no locale formatting).
//   INPUTS: { iso: string - an ISO instant such as "2026-10-21T10:18:46.123Z" }
//   OUTPUTS: { string - "2026-10-21 10:18:46 UTC", or the input unchanged when it is not an ISO instant }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
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
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: shortCommit
export function shortCommit(commit: string): string {
  const match = FULL_SHA.exec(commit);
  if (match === null) return commit;
  return `${(match[1] ?? "").slice(0, 7)}${match[2] ?? ""}`;
}

// START_CONTRACT: provenanceText
//   PURPOSE: Give the one visible label text of a result, so that every result says where, when and from which commit it was produced, and a result that did not run says so.
//   INPUTS: { provenance: Provenance | null - the provenance of the result, null when nothing ran }
//   OUTPUTS: { string - "Not run" for null; otherwise the label with the runner, the UTC time and the commit }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: provenanceText
export function provenanceText(provenance: Provenance | null): string {
  if (provenance === null) return "Not run";
  const commit =
    provenance.commit === null ? "unknown" : shortCommit(provenance.commit);
  const dirty = provenance.dirty ? " (uncommitted changes)" : "";
  return `Run by ${provenance.runner} at build time, ${formatInstant(provenance.generatedAt)} · commit ${commit}${dirty}`;
}
