// START_MODULE_CONTRACT
//   PURPOSE: Serve the Verification page at /verification, which shows the build-time specification report or "Not run".
//   SCOPE: The Route of /verification, with its title and description, and the page component that passes the decoded report and the catalogue to VerificationView.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Route - the /verification route with its head
// END_MODULE_MAP

import { createFileRoute } from "@tanstack/react-router";
import { catalogue } from "@telos/locus/specs";
import { VerificationView } from "@/components/verification-view";
import { specReportFile } from "@/lib/build";
import { pageTitle } from "@/lib/site";

// START_CONTRACT: Route
//   PURPOSE: Register /verification with its title and description; the page reads the build-time report and the catalogue.
//   INPUTS: none (route definition)
//   OUTPUTS: { Route - the TanStack file route for /verification }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: Route
export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: pageTitle("Verification") },
      {
        name: "description",
        content:
          "The specification report from the build-time Bun run, with its provenance.",
      },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  return <VerificationView file={specReportFile} specs={catalogue} />;
}
