// START_MODULE_CONTRACT
//   PURPOSE: Show every row of a specification report with its title, invariants, polarity, result and expected and observed values, so that no failing record is hidden (FR-022, NS-018, INV-013).
//   SCOPE: SpecReportTable, a presentational component. Its summary is computed from the report's summary and its rows are the report's results; it never filters a row out.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SpecReportTable - the summary line and the table of specification results
// END_MODULE_MAP

import type { Specification, SpecReport, SpecResult } from "@telos/locus/specs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const RESULT_TEXT: Readonly<Record<SpecResult["status"], string>> = {
  pass: "Pass",
  fail: "Fail",
  error: "Error",
};

function jsonOf(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "undefined";
}

function detailsOf(result: SpecResult): string {
  return `Expected:\n${jsonOf(result.expected)}\n\nObserved:\n${jsonOf(result.observed)}`;
}

// START_CONTRACT: SpecReportTable
//   PURPOSE: Show the summary and one row per result, in report order. A result whose id is not in the catalogue keeps its row and says so.
//   INPUTS: { report: SpecReport - the run, specs: ReadonlyArray<Specification> - the catalogue, matched by id }
//   OUTPUTS: { JSX.Element - a summary p with data-slot="spec-summary", and a table whose rows carry data-spec-id and data-spec-status }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SpecReportTable
export function SpecReportTable({
  report,
  specs,
}: {
  readonly report: SpecReport;
  readonly specs: ReadonlyArray<Specification>;
}) {
  const byId = new Map(specs.map((spec) => [spec.id as string, spec]));
  const { total, passed, failed, errored } = report.summary;
  return (
    <>
      <p data-slot="spec-summary" className="text-sm">
        {`${total} specifications: ${passed} passed, `}
        <strong
          data-count="failed"
          className={cn(failed > 0 && "text-destructive", "font-semibold")}
        >
          {failed}
        </strong>
        {" failed, "}
        <strong
          data-count="errored"
          className={cn(errored > 0 && "text-destructive", "font-semibold")}
        >
          {errored}
        </strong>
        {" errored."}
      </p>
      <Table>
        <TableCaption>Specification results</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Specification</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Invariants</TableHead>
            <TableHead>Polarity</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.results.map((result, index) => {
            const spec = byId.get(result.id);
            const invariants =
              spec !== undefined && spec.invariants.length > 0
                ? spec.invariants.join(", ")
                : "—";
            return (
              <TableRow
                key={`${index}-${result.id}`}
                data-spec-id={result.id}
                data-spec-status={result.status}
              >
                <TableCell className="font-mono">{result.id}</TableCell>
                <TableCell className="whitespace-normal">
                  {spec?.title ?? "(not in this catalogue)"}
                </TableCell>
                <TableCell>{invariants}</TableCell>
                <TableCell>{spec?.polarity ?? "—"}</TableCell>
                <TableCell
                  className={cn(
                    result.status !== "pass" &&
                      "text-destructive font-semibold",
                  )}
                >
                  {RESULT_TEXT[result.status]}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <details>
                    <summary>Expected and observed</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                      {detailsOf(result)}
                    </pre>
                  </details>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
