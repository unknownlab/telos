// START_MODULE_CONTRACT
//   PURPOSE: Render the Verification page, which shows the build-time specification report or "Not run", and the CI row that always reads "CI: not available" (FR-022, NS-018).
//   SCOPE: VerificationView, a presentational component. It takes the decoded report file and the catalogue as props and never reads the generated files or the router.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   VerificationView - the page: the build-time report or Not run, the CI row and how to run the records yourself
// END_MODULE_MAP

import type { Specification } from "@telos/locus/specs";
import { ResultPanel } from "@/components/result-panel";
import { SpecReportTable } from "@/components/spec-report-table";
import type { SpecReportFile } from "@/lib/build-data";
import { CI_PROVENANCE } from "@/lib/provenance";

// START_CONTRACT: VerificationView
//   PURPOSE: Show the build-time report with its provenance, or say that nothing was run, so that no pass count appears without a run.
//   INPUTS: { file: SpecReportFile | null - the decoded build report, null when none was produced, specs: ReadonlyArray<Specification> - the catalogue }
//   OUTPUTS: { JSX.Element - a main element with data-page="verification", the build-time report panel and the CI panel }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: VerificationView
export function VerificationView({
  file,
  specs,
}: {
  readonly file: SpecReportFile | null;
  readonly specs: ReadonlyArray<Specification>;
}) {
  return (
    <main
      id="content"
      data-page="verification"
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Verification</h1>
      <p className="text-muted-foreground">
        The executable specifications LOC-001 to LOC-044 are data records in{" "}
        <code>@telos/locus/specs</code>. <code>bun test</code> runs them on
        every repository check. The site build runs them once more with Bun and
        records the report below, with the commit and time of that run.
      </p>
      <section
        aria-labelledby="build-report-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="build-report-heading" className="text-xl font-semibold">
          Build-time report
        </h2>
        {file !== null ? (
          <ResultPanel
            kind="spec-report"
            provenance={file.provenance}
            title="Build-time specification report"
          >
            <SpecReportTable report={file.report} specs={specs} />
          </ResultPanel>
        ) : (
          <ResultPanel
            kind="spec-report"
            provenance={null}
            title="Build-time specification report"
          >
            <p>
              <strong>Not run.</strong> No specification report was produced for
              this build, so nothing here is shown as passing.
            </p>
          </ResultPanel>
        )}
      </section>
      <section aria-labelledby="ci-heading" className="flex flex-col gap-4">
        <h2 id="ci-heading" className="text-xl font-semibold">
          Continuous integration
        </h2>
        <ResultPanel
          kind="spec-report"
          provenance={CI_PROVENANCE}
          title="CI specification report"
        >
          <p>Stage 0 has no CI service, so there is no CI result.</p>
        </ResultPanel>
      </section>
      <section aria-labelledby="run-heading" className="flex flex-col gap-4">
        <h2 id="run-heading" className="text-xl font-semibold">
          Run them yourself
        </h2>
        <p>
          <code>bun test packages/locus/test/specs</code> runs every record
          locally.{" "}
          <a href="/playground" className="underline underline-offset-4">
            The playground
          </a>{" "}
          runs the kernel in this browser.
        </p>
      </section>
    </main>
  );
}
