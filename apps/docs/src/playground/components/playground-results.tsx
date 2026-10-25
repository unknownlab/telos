// START_MODULE_CONTRACT
//   PURPOSE: Show the result of one playground run with its origin and label, the decode issues or the diagnostics, the verification findings and the model description, so that no result reads without where and when it was produced (FR-021, FR-026).
//   SCOPE: PlaygroundRun, PlaygroundResults and the label of a run. Presentational: it holds no state and runs nothing.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND, V-M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PlaygroundRun - one run: the text that was run, its result and the time it ran
//   PlaygroundResults - the result panel of one run, with its label, issues, diagnostics, findings and description
// END_MODULE_MAP

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlaygroundResult } from "@/playground/run";

export interface PlaygroundRun {
  readonly text: string;
  readonly result: PlaygroundResult;
  readonly ranAt: string;
}

// START_CONTRACT: provenanceLabel
//   PURPOSE: Say where and when a run was produced, and when the input has changed since, so that a stale result is labelled historical.
//   INPUTS: { run: PlaygroundRun - the run, currentText: string - the text now in the editor }
//   OUTPUTS: { string - the label, prefixed with "Historical: " when the editor text differs from the run text }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: provenanceLabel
function provenanceLabel(run: PlaygroundRun, currentText: string): string {
  const base =
    run.result.kind === "built"
      ? `run in this browser at ${run.result.report.provenance.finishedAt} with @telos/kernel.`
      : `decoded in this browser at ${run.ranAt}; nothing was built.`;
  if (currentText === run.text) {
    return `${base.charAt(0).toUpperCase()}${base.slice(1)}`;
  }
  return `Historical: ${base} The input has changed since this run.`;
}

// START_CONTRACT: PlaygroundResults
//   PURPOSE: Render the result panel of one run in the order of the page contract, with data-provenance and data-valid on the section.
//   INPUTS: { run: PlaygroundRun - the run to show, currentText: string - the text now in the editor }
//   OUTPUTS: { JSX.Element - a section with data-result="playground", its label, and either the decode issues or the diagnostics, then the verification findings and the model description }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PlaygroundResults
export function PlaygroundResults({
  run,
  currentText,
}: {
  readonly run: PlaygroundRun;
  readonly currentText: string;
}) {
  const stale = currentText !== run.text;
  const result = run.result;
  const valid =
    result.kind === "built" &&
    result.diagnostics.every((diagnostic) => diagnostic.severity !== "error");

  return (
    <section
      data-result="playground"
      data-provenance={stale ? "historical" : "browser"}
      data-valid={valid ? "true" : "false"}
      className="flex flex-col gap-6"
    >
      <p data-slot="provenance-label" className="text-sm text-muted-foreground">
        {provenanceLabel(run, currentText)}
      </p>
      {result.kind === "decode-error" ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Decode issues</h2>
          <ul className="flex flex-col gap-2">
            {result.decodeIssues.map((issue, index) => (
              <li key={`${issue.path}-${index}`} data-decode-issue>
                <code>{issue.path === "" ? "(root)" : issue.path}</code>{" "}
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Diagnostics</h2>
            {result.diagnostics.length === 0 ? (
              <p data-slot="no-diagnostics">No diagnostics</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.diagnostics.map((diagnostic, index) => (
                    <TableRow
                      key={`${diagnostic.code}-${diagnostic.subject}-${index}`}
                      data-diagnostic-code={diagnostic.code}
                    >
                      <TableCell>
                        <code>{diagnostic.code}</code>
                      </TableCell>
                      <TableCell>{diagnostic.severity}</TableCell>
                      <TableCell>{diagnostic.subject}</TableCell>
                      <TableCell>{diagnostic.path}</TableCell>
                      <TableCell>{diagnostic.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Verification</h2>
            {result.report.findings.length === 0 ? (
              <p>No Archetype applies to this model.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locus</TableHead>
                    <TableHead>Archetype</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.report.findings.map((finding, index) => (
                    <TableRow
                      key={`${finding.locus}-${finding.rule}-${index}`}
                      data-finding-outcome={finding.outcome}
                    >
                      <TableCell>{finding.locus}</TableCell>
                      <TableCell>{finding.archetype}</TableCell>
                      <TableCell>{finding.rule}</TableCell>
                      <TableCell>{finding.method}</TableCell>
                      <TableCell>{finding.outcome}</TableCell>
                      <TableCell>{finding.message ?? ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Model description</h2>
            <pre
              data-slot="description"
              tabIndex={0}
              className="overflow-x-auto rounded-md border p-4 font-mono text-sm"
            >
              {JSON.stringify(result.description, null, 2)}
            </pre>
          </div>
        </>
      )}
    </section>
  );
}
