// START_MODULE_CONTRACT
//   PURPOSE: Serve the inspector index at /inspector, which shows the Locus tree of the build-time semantic report.
//   SCOPE: The Route of /inspector, with its title and description, and the page component that passes the decoded report and its provenance to InspectorTree.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-INSPECTOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Route - the /inspector route with its head
// END_MODULE_MAP

import { createFileRoute } from "@tanstack/react-router";
import { InspectorTree, INSPECTOR_INTRO } from "@/components/inspector-tree";
import { BUILD_PROVENANCE, semanticReport } from "@/lib/build";
import { pageTitle } from "@/lib/site";

// START_CONTRACT: Route
//   PURPOSE: Register /inspector with its title and description.
//   INPUTS: none (route definition)
//   OUTPUTS: { Route - the TanStack file route for /inspector/ }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: Route
export const Route = createFileRoute("/inspector/")({
  head: () => ({
    meta: [
      { title: pageTitle("Inspector") },
      { name: "description", content: INSPECTOR_INTRO },
    ],
  }),
  component: InspectorPage,
});

function InspectorPage() {
  return (
    <InspectorTree report={semanticReport} provenance={BUILD_PROVENANCE} />
  );
}
