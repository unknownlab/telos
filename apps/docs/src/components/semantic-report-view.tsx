// START_MODULE_CONTRACT
//   PURPOSE: Render the Verification page from the build-time semantic report: the Archetype findings, the Semantic Closure limits and findings, each with its provenance, or "Not run" (FR-022, FR-025, INV-013).
//   SCOPE: VERIFICATION_INTRO and SemanticReportView, a presentational component over the decoded report and its provenance. It never reads the generated files or the router state beyond links.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   VERIFICATION_INTRO - the introduction text of the Verification page, also used as its description
//   SemanticReportView - the Verification page body: the findings, the closure and how to run the checks
// END_MODULE_MAP

import { Link } from "@tanstack/react-router";
import { KnowledgeBadge } from "@/components/knowledge-badge";
import { ResultPanel } from "@/components/result-panel";
import type { SemanticReport } from "@/lib/build-data";
import { locusSlug } from "@/lib/locus-slug";
import type { BuildProvenance } from "@/lib/provenance";

export const VERIFICATION_INTRO =
  "The Archetype verification and Semantic Closure report from the build-time run, with its provenance.";

// START_CONTRACT: SemanticReportView
//   PURPOSE: Show the build-time semantic report with its provenance, or say that nothing was run, so that no result appears without a run.
//   INPUTS: { report: SemanticReport | null - the decoded report, null when none was produced; provenance: BuildProvenance | null - its provenance }
//   OUTPUTS: { JSX.Element - a main with data-page="verification"; a ResultPanel of kind semantic-report with data-result when the report exists }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: SemanticReportView
export function SemanticReportView({
  report,
  provenance,
}: {
  readonly report: SemanticReport | null;
  readonly provenance: BuildProvenance | null;
}) {
  return (
    <main
      id="content"
      data-page="verification"
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Verification</h1>
      <p className="text-muted-foreground">{VERIFICATION_INTRO}</p>
      {report === null ? (
        <p data-slot="no-report">
          <strong>Not run.</strong> No semantic report was produced for this
          build, so no result is shown.
        </p>
      ) : (
        <ResultPanel
          kind="semantic-report"
          provenance={provenance}
          title="Build-time semantic report"
        >
          <p data-slot="report-ok" data-ok={String(report.ok)}>
            {report.ok
              ? "The build-time check found no model errors, no failed rules and no closure errors."
              : "The build-time check found problems; they are listed below."}
          </p>
          <dl
            data-slot="summary"
            className="grid gap-2 sm:grid-cols-[max-content_1fr]"
          >
            <dt className="font-semibold">Passed</dt>
            <dd>{report.verification.summary.passed}</dd>
            <dt className="font-semibold">Failed</dt>
            <dd>{report.verification.summary.failed}</dd>
            <dt className="font-semibold">Error</dt>
            <dd>{report.verification.summary.error}</dd>
            <dt className="font-semibold">Closure findings</dt>
            <dd>{report.closure.findings.length}</dd>
            <dt className="font-semibold">Files checked</dt>
            <dd>{report.closure.fileCount}</dd>
          </dl>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Archetype verification</h2>
            {report.verification.findings.length === 0 ? (
              <p data-slot="no-findings">No Archetype applies to this model.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th scope="col">Locus</th>
                      <th scope="col">Archetype</th>
                      <th scope="col">Rule</th>
                      <th scope="col">Method</th>
                      <th scope="col">Outcome</th>
                      <th scope="col">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.verification.findings.map((finding) => (
                      <tr
                        key={`${finding.locus}:${finding.archetype}:${finding.rule}`}
                        data-finding-outcome={finding.outcome}
                      >
                        <td>
                          <Link
                            to="/inspector/$slug"
                            params={{ slug: locusSlug(finding.locus) }}
                            className="underline underline-offset-4"
                          >
                            {finding.locus}
                          </Link>
                        </td>
                        <td>{finding.archetype}</td>
                        <td>{finding.rule}</td>
                        <td>{finding.method}</td>
                        <td>{finding.outcome}</td>
                        <td>{finding.message ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Semantic Closure</h2>
            <h3 className="text-lg font-semibold">Limits</h3>
            <ul className="list-disc pl-6">
              {report.closure.limits.map((limit) => (
                <li key={limit} data-closure-limit>
                  {limit}
                </li>
              ))}
            </ul>
            <h3 className="text-lg font-semibold">Findings</h3>
            {report.closure.findings.length === 0 ? (
              <p data-slot="no-closure-findings">No closure findings.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th scope="col">Code</th>
                      <th scope="col">Severity</th>
                      <th scope="col">File</th>
                      <th scope="col">Loci</th>
                      <th scope="col">Knowledge</th>
                      <th scope="col">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.closure.findings.map((finding) => (
                      <tr
                        key={`${finding.code}:${finding.file ?? ""}:${finding.detail}`}
                        data-closure-code={finding.code}
                      >
                        <td>{finding.code}</td>
                        <td>{finding.severity}</td>
                        <td>{finding.file ?? "—"}</td>
                        <td>
                          {finding.loci.length === 0
                            ? "—"
                            : finding.loci.join(", ")}
                        </td>
                        <td>
                          <KnowledgeBadge knowledge={finding.knowledge} />
                        </td>
                        <td>{finding.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </ResultPanel>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Run it yourself</h2>
        <p>
          <code>bun run telos verify</code> runs the Archetype rules.{" "}
          <code>bun run telos closure</code> runs the Semantic Closure check.{" "}
          <code>bun run telos report --out &lt;path&gt;</code> writes this
          report.
        </p>
        <p>
          <Link to="/inspector" className="underline underline-offset-4">
            The inspector shows the model.
          </Link>{" "}
          <Link to="/playground" className="underline underline-offset-4">
            The playground runs the kernel in this browser.
          </Link>
        </p>
      </section>
    </main>
  );
}
