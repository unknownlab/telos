// START_MODULE_CONTRACT
//   PURPOSE: Show the results of scenario E, the browser run and the build-time report side by side with their own provenance, the comparison of their statuses and the golden Revision ids, so that a result is never shown without where and when it was produced (FR-019, FR-021).
//   SCOPE: BrowserReportView, BuildReportView, ComparisonView and GoldenView. Presentational: they render the values they are given and never recompute a status or an id.
//   DEPENDS: M-DOCS-PLAYGROUND, M-DOCS-SITE, M-LOCUS-SPECS
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BrowserReportView - the browser run of the catalogue, with its browser provenance
//   BuildReportView - the build-time report, with its bun-build provenance, or Not run
//   ComparisonView - the statuses that differ between the browser run and the build report
//   GoldenView - the golden Revision ids against the ids the browser computed
// END_MODULE_MAP

import type { Specification, SpecReport } from "@telos/locus-specs";
import { ResultPanel } from "@/components/result-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SpecReportTable } from "@/components/spec-report-table";
import type { SpecReportFile } from "@/lib/build-data";
import type { Provenance } from "@/lib/provenance";
import { cn } from "@/lib/utils";
import type { GoldenRow, StatusDifference } from "@/playground/run-specs";

// START_CONTRACT: BrowserReportView
//   PURPOSE: Show the report of the browser run, with one row per specification, so that the reader sees what this browser computed.
//   INPUTS: { report: SpecReport - the browser run, specs: ReadonlyArray<Specification> - the catalogue, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind spec-report with the title In this browser and the SpecReportTable }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: BrowserReportView
/** The browser run of the catalogue. */
export function BrowserReportView({
  report,
  specs,
  provenance,
}: {
  readonly report: SpecReport;
  readonly specs: ReadonlyArray<Specification>;
  readonly provenance: Provenance | null;
}) {
  return (
    <ResultPanel
      kind="spec-report"
      provenance={provenance}
      title="Specifications run in this browser"
    >
      <h2 className="text-lg font-semibold">In this browser</h2>
      <SpecReportTable report={report} specs={specs} />
    </ResultPanel>
  );
}

// START_CONTRACT: BuildReportView
//   PURPOSE: Show the report that the build recorded, with its commit and time, or say that no build report exists.
//   INPUTS: { file: SpecReportFile | null - the build-time report, specs: ReadonlyArray<Specification> - the catalogue }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind spec-report; with a report, the SpecReportTable and the bun-build provenance; without one, Not run and provenance none }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: BuildReportView
/** The build-time report of the site, or the statement that it was not run. */
export function BuildReportView({
  file,
  specs,
}: {
  readonly file: SpecReportFile | null;
  readonly specs: ReadonlyArray<Specification>;
}) {
  if (file === null) {
    return (
      <ResultPanel kind="spec-report" provenance={null} title="At build time">
        <h2 className="text-lg font-semibold">At build time</h2>
        <p>Not run: there is no build-time report in this build.</p>
      </ResultPanel>
    );
  }
  return (
    <ResultPanel
      kind="spec-report"
      provenance={file.provenance}
      title="At build time"
    >
      <h2 className="text-lg font-semibold">At build time</h2>
      <SpecReportTable report={file.report} specs={specs} />
    </ResultPanel>
  );
}

// START_CONTRACT: ComparisonView
//   PURPOSE: Say whether the browser run and the build report give each specification the same status, and list each id that does not.
//   INPUTS: { differences: ReadonlyArray<StatusDifference> - the differing ids, buildAvailable: boolean - whether a build report exists, total: number - the number of specifications compared, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind spec-report with a p data-compare set to same or different, and one row per differing id with data-compare-id }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ComparisonView
/** The comparison of the browser statuses with the build statuses. */
export function ComparisonView({
  differences,
  buildAvailable,
  total,
  provenance,
}: {
  readonly differences: ReadonlyArray<StatusDifference>;
  readonly buildAvailable: boolean;
  readonly total: number;
  readonly provenance: Provenance | null;
}) {
  return (
    <ResultPanel
      kind="spec-report"
      provenance={provenance}
      title="Comparison with the build report"
    >
      <h2 className="text-lg font-semibold">
        Comparison with the build report
      </h2>
      {!buildAvailable ? (
        <p>Nothing to compare: there is no build-time report.</p>
      ) : differences.length === 0 ? (
        <p data-compare="same">
          {`Same results as the build report for all ${total} specifications.`}
        </p>
      ) : (
        <p data-compare="different">
          {`${differences.length} specification(s) differ from the build report.`}
        </p>
      )}
      {buildAvailable && differences.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Specification</TableHead>
              <TableHead>In this browser</TableHead>
              <TableHead>At build time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {differences.map((difference) => (
              <TableRow key={difference.id} data-compare-id={difference.id}>
                <TableCell className="font-mono">{difference.id}</TableCell>
                <TableCell>{difference.browser}</TableCell>
                <TableCell>{difference.build}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </ResultPanel>
  );
}

// START_CONTRACT: GoldenView
//   PURPOSE: Show each golden Revision id against the id this browser computed, and count the matches, so that a changed fixture is a visible mismatch.
//   INPUTS: { rows: ReadonlyArray<GoldenRow> - the golden rows, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind revision-id with the count of matches and a table whose rows carry data-golden-key and data-golden-match; the computed id is in a code with data-revision-id }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: GoldenView
/** The golden Revision ids against the ids computed in this browser. */
export function GoldenView({
  rows,
  provenance,
}: {
  readonly rows: ReadonlyArray<GoldenRow>;
  readonly provenance: Provenance | null;
}) {
  const matches = rows.filter((row) => row.match).length;
  return (
    <ResultPanel
      kind="revision-id"
      provenance={provenance}
      title="Golden Revision ids"
    >
      <h2 className="text-lg font-semibold">Golden Revision ids</h2>
      <p>Revision ids of the revision fixtures, against the golden values</p>
      <p>{`${matches} of ${rows.length} match.`}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fixture</TableHead>
            <TableHead>Golden</TableHead>
            <TableHead>In this browser</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.key}
              data-golden-key={row.key}
              data-golden-match={String(row.match)}
            >
              <TableCell className="font-mono">{row.key}</TableCell>
              <TableCell className="break-all">
                <code>{row.expected}</code>
              </TableCell>
              <TableCell
                className={cn(
                  "break-all",
                  !row.match && "text-destructive font-semibold",
                )}
              >
                {row.observed === null ? (
                  "Not computed"
                ) : (
                  <code data-revision-id>{row.observed}</code>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResultPanel>
  );
}
