// START_MODULE_CONTRACT
//   PURPOSE: Show the results of a Fabric run as the package reports them: decode issues with their paths, the validation report, the Revision ids and the Relation table, each in a ResultPanel with its provenance (FR-019, FR-021).
//   SCOPE: DecodeIssueList, DecodeErrorView, ValidationReportView, RevisionIdsView and RelationTableView. Presentational: they render the values they are given and never recompute a rule.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DecodeIssueList - the located decode issues of a decode error, as a list
//   DecodeErrorView - the result panel of a decode error, with its issues
//   ValidationReportView - the result panel of a validation report, with its summary and diagnostics
//   RevisionIdsView - the result panel of the Revision id of each Locus
//   RelationTableView - the result panel of the Relation table, with the problems the report gives each row
// END_MODULE_MAP

import { ResultPanel } from "@/components/result-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Provenance } from "@/lib/provenance";
import type {
  DecodeIssue,
  RelationProblem,
  RelationRow,
  RevisionRow,
} from "@/playground/run-fabric";
import type { ValidationReport } from "@telos/locus";

const PROBLEM_LABELS: Readonly<Record<RelationProblem, string>> = {
  "target-missing": "Target missing",
  self: "Self",
  duplicate: "Duplicate",
  "refines-cycle": "In a refines cycle",
};

// START_CONTRACT: DecodeIssueList
//   PURPOSE: Show each decode issue with the path it is located at, so that the reader can find the text that is wrong.
//   INPUTS: { issues: ReadonlyArray<DecodeIssue> - the located issues of a decode error }
//   OUTPUTS: { JSX.Element - a ul with one li per issue, data-issue-path set to the path; the path "" is shown as (whole input) }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DecodeIssueList
/** The located decode issues, one list item each. */
export function DecodeIssueList({
  issues,
}: {
  readonly issues: ReadonlyArray<DecodeIssue>;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {issues.map((issue, index) => (
        <li key={`${issue.path}-${index}`} data-issue-path={issue.path}>
          <code>{issue.path === "" ? "(whole input)" : issue.path}</code>{" "}
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  );
}

// START_CONTRACT: DecodeErrorView
//   PURPOSE: Show that the input is not a Fabric and that nothing was validated, with the located issues, so that a malformed input never reads as a result.
//   INPUTS: { issues: ReadonlyArray<DecodeIssue> - the issues, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind decode-error with the count sentence and the DecodeIssueList }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DecodeErrorView
/** The result of a decode error: the count, that nothing was validated, and the issues. */
export function DecodeErrorView({
  issues,
  provenance,
}: {
  readonly issues: ReadonlyArray<DecodeIssue>;
  readonly provenance: Provenance | null;
}) {
  return (
    <ResultPanel
      kind="decode-error"
      provenance={provenance}
      title="Decode errors"
    >
      <h2 className="text-lg font-semibold">Decode errors</h2>
      <p>
        The input is not a Fabric: {issues.length} decode issue(s). Nothing was
        validated.
      </p>
      <DecodeIssueList issues={issues} />
    </ResultPanel>
  );
}

// START_CONTRACT: ValidationReportView
//   PURPOSE: Show the validation report: whether the Fabric is valid, and each diagnostic with its code, subject, path, detail and message.
//   INPUTS: { report: ValidationReport - the report of the package, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind validation-report with a summary p whose data-valid is "true" or "false", and a table of the diagnostics when there are any }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ValidationReportView
/** The validation report of a Fabric, with its summary and its diagnostics. */
export function ValidationReportView({
  report,
  provenance,
}: {
  readonly report: ValidationReport;
  readonly provenance: Provenance | null;
}) {
  const count = report.diagnostics.length;
  return (
    <ResultPanel
      kind="validation-report"
      provenance={provenance}
      title="Validation report"
    >
      <h2 className="text-lg font-semibold">Validation report</h2>
      <p data-valid={String(report.valid)}>
        {report.valid
          ? "Valid: no diagnostics."
          : `Invalid: ${count} diagnostic(s).`}
      </p>
      {count > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Path</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.diagnostics.map((diagnostic, index) => (
              <TableRow
                key={`${diagnostic.code}-${diagnostic.subject}-${index}`}
                data-diagnostic-code={diagnostic.code}
              >
                <TableCell>
                  <code>{diagnostic.code}</code>
                </TableCell>
                <TableCell>
                  <code>{diagnostic.subject}</code>
                </TableCell>
                <TableCell>
                  <code>{diagnostic.path}</code>
                </TableCell>
                <TableCell>
                  {diagnostic.detail ??
                    (diagnostic.members !== undefined &&
                    diagnostic.members.length > 0
                      ? diagnostic.members.join(", ")
                      : "—")}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {diagnostic.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </ResultPanel>
  );
}

// START_CONTRACT: RevisionIdsView
//   PURPOSE: Show the Revision id of each Locus, so that a reader can see which Locus changed when its definition changes.
//   INPUTS: { revisions: { ok: true, rows } | { ok: false, message } - the Revision ids or why they are unavailable, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind revision-id with one li per Locus carrying data-locus and data-revision-id, or the message }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: RevisionIdsView
/** The Revision id of each Locus, or the reason the ids are unavailable. */
export function RevisionIdsView({
  revisions,
  provenance,
}: {
  readonly revisions:
    | { readonly ok: true; readonly rows: ReadonlyArray<RevisionRow> }
    | { readonly ok: false; readonly message: string };
  readonly provenance: Provenance | null;
}) {
  return (
    <ResultPanel
      kind="revision-id"
      provenance={provenance}
      title="Revision ids"
    >
      <h2 className="text-lg font-semibold">Revision ids</h2>
      {revisions.ok ? (
        <>
          <p>Revision id of each Locus</p>
          <ul className="flex flex-col gap-2">
            {revisions.rows.map((row, index) => (
              <li
                key={`${row.locus}-${index}`}
                data-locus={row.locus}
                data-revision-id={row.id}
              >
                <code>{row.locus}</code>{" "}
                <code className="break-all">{row.id}</code>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{revisions.message}</p>
      )}
    </ResultPanel>
  );
}

// START_CONTRACT: RelationTableView
//   PURPOSE: Show every Relation with its status, so that a refines cycle and a missing target are visible in the table.
//   INPUTS: { rows: ReadonlyArray<RelationRow> - the rows read from the report, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind validation-report with a table whose rows carry data-relation and data-relation-status, or the message No Relations. }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: RelationTableView
/** The Relation table: one row per Relation, with the status the report gives it. */
export function RelationTableView({
  rows,
  provenance,
}: {
  readonly rows: ReadonlyArray<RelationRow>;
  readonly provenance: Provenance | null;
}) {
  return (
    <ResultPanel
      kind="validation-report"
      provenance={provenance}
      title="Relations"
    >
      <h2 className="text-lg font-semibold">Relations</h2>
      {rows.length === 0 ? (
        <p>No Relations.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const flagged = row.problems.length > 0;
              return (
                <TableRow
                  key={`${row.from}-${row.kind}-${row.target}-${index}`}
                  data-relation={`${row.from} ${row.kind} ${row.target}`}
                  data-relation-status={flagged ? row.problems.join(" ") : "ok"}
                >
                  <TableCell>
                    <code>{row.from}</code>
                  </TableCell>
                  <TableCell>
                    <code>{row.kind}</code>
                  </TableCell>
                  <TableCell>
                    <code>{row.target}</code>
                  </TableCell>
                  <TableCell
                    className={flagged ? "text-destructive" : undefined}
                  >
                    {flagged
                      ? row.problems
                          .map((problem) => PROBLEM_LABELS[problem])
                          .join(", ")
                      : "OK"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </ResultPanel>
  );
}
