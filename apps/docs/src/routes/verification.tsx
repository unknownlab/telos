// START_MODULE_CONTRACT
//   PURPOSE: Serve the Verification page at /verification, which shows the build-time semantic report or "Not run".
//   SCOPE: The Route of /verification, with its title and description, and the page component that passes the decoded report and its provenance to SemanticReportView.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Route - the /verification route with its head
// END_MODULE_MAP

import { createFileRoute } from "@tanstack/react-router";
import {
  SemanticReportView,
  VERIFICATION_INTRO,
} from "@/components/semantic-report-view";
import { BUILD_PROVENANCE, semanticReport } from "@/lib/build";
import { pageTitle } from "@/lib/site";

// START_CONTRACT: Route
//   PURPOSE: Register /verification with its title and description; the page reads the build-time semantic report.
//   INPUTS: none (route definition)
//   OUTPUTS: { Route - the TanStack file route for /verification }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: Route
export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: pageTitle("Verification") },
      { name: "description", content: VERIFICATION_INTRO },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  return (
    <SemanticReportView report={semanticReport} provenance={BUILD_PROVENANCE} />
  );
}
