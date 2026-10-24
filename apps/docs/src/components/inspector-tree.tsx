// START_MODULE_CONTRACT
//   PURPOSE: Show the Locus tree of the real repository model on /inspector, each Locus linking to its own page (FR-012).
//   SCOPE: INSPECTOR_INTRO and InspectorTree, a presentational component over the decoded report and build provenance. It never reads the generated files.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-INSPECTOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   INSPECTOR_INTRO - the introduction text of the inspector page, also used as its description
//   InspectorTree - the inspector page body: the model summary and the containment tree of the Loci
// END_MODULE_MAP

import { Link } from "@tanstack/react-router";
import { ProvenanceLabel } from "@/components/provenance-label";
import type { SemanticReport } from "@/lib/build-data";
import { locusSlug } from "@/lib/locus-slug";
import type { BuildProvenance } from "@/lib/provenance";

export const INSPECTOR_INTRO =
  "The real repository model, built at site build time from telos.ts: Loci, extensions, relations, capability contracts and verification results. Machine-readable: /semantic-report.json.";

// START_CONTRACT: InspectorTree
//   PURPOSE: Render the inspector page: the model summary, the provenance and the containment tree of the Loci, each Locus linked to its page.
//   INPUTS: { report: SemanticReport | null - the decoded report, provenance: BuildProvenance | null - its provenance }
//   OUTPUTS: { JSX.Element - a main with data-page="inspector"; "Not run" when the report is null }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: InspectorTree
export function InspectorTree({
  report,
  provenance,
}: {
  readonly report: SemanticReport | null;
  readonly provenance: BuildProvenance | null;
}) {
  return (
    <main
      id="content"
      data-page="inspector"
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Inspector</h1>
      <p className="text-muted-foreground">{INSPECTOR_INTRO}</p>
      {report === null ? (
        <p data-slot="no-report">
          <strong>Not run.</strong> No semantic report was produced for this
          build.
        </p>
      ) : (
        <>
          <ProvenanceLabel provenance={provenance} />
          <dl className="grid gap-2 sm:grid-cols-[max-content_1fr]">
            <dt className="font-semibold">Root</dt>
            <dd>
              <code>{report.model.root}</code>
            </dd>
            <dt className="font-semibold">Loci</dt>
            <dd>{report.model.loci.length}</dd>
            <dt className="font-semibold">Model digest</dt>
            <dd>
              <code data-slot="model-digest">{report.model.digest}</code>
            </dd>
          </dl>
          <p>
            <a
              href="/semantic-report.json"
              className="underline underline-offset-4"
            >
              semantic-report.json
            </a>
          </p>
          <ul data-slot="locus-tree" className="flex flex-col gap-3 pl-0">
            <LocusNode report={report} id={report.model.root} />
          </ul>
        </>
      )}
    </main>
  );
}

// START_CONTRACT: LocusNode
//   PURPOSE: Render one Locus of the tree as a list item, with its children nested in a list below it.
//   INPUTS: { report: SemanticReport - the decoded report, id: string - the Locus to render }
//   OUTPUTS: { JSX.Element - a li with data-locus-id, or null when the id is not in the model }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: LocusNode
function LocusNode({
  report,
  id,
}: {
  readonly report: SemanticReport;
  readonly id: string;
}) {
  const locus = report.model.loci.find((candidate) => candidate.id === id);
  if (locus === undefined) return null;
  const rows = report.verifications[id] ?? [];
  const passed = rows.filter((row) => row.outcome === "passed").length;
  const failed = rows.filter(
    (row) => row.outcome === "failed" || row.outcome === "error",
  ).length;
  const notRun = rows.filter((row) => row.outcome === "not-run").length;
  const children = locus.contains.filter((childId) =>
    report.model.loci.some((candidate) => candidate.id === childId),
  );
  return (
    <li data-locus-id={id} className="flex flex-col gap-1">
      <Link
        to="/inspector/$slug"
        params={{ slug: locusSlug(id) }}
        className="font-medium underline underline-offset-4"
      >
        {id}
      </Link>
      <span className="text-sm text-muted-foreground">
        {locus.extensions.map((extension) => (
          <code key={extension.id} className="mr-2">
            {extension.id}
          </code>
        ))}
        <span data-slot="capability-count">
          {locus.capabilities.length} capabilities
        </span>
        {" · "}
        <span data-slot="verification-counts">
          {passed} passed · {failed} failed · {notRun} not run
        </span>
      </span>
      {children.length > 0 ? (
        <ul className="flex flex-col gap-3 border-l pl-4">
          {children.map((childId) => (
            <LocusNode key={childId} report={report} id={childId} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
