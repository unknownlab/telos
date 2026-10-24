// START_MODULE_CONTRACT
//   PURPOSE: Serve one inspector page per Locus at /inspector/<slug>, prerendered from the build-time semantic report, and the not-found page for an unknown slug.
//   SCOPE: The Route of /inspector/$slug: its loader that finds the Locus and its verification rows, its head and its page component.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-INSPECTOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Route - the /inspector/$slug route with its loader, head and component
// END_MODULE_MAP

import { createFileRoute, notFound } from "@tanstack/react-router";
import { LocusView } from "@/components/locus-view";
import { semanticReport } from "@/lib/build";
import { locusIdOf } from "@/lib/locus-slug";
import { pageTitle } from "@/lib/site";

// START_CONTRACT: Route
//   PURPOSE: Register /inspector/$slug; the loader throws notFound() for a slug with no Locus in the report.
//   INPUTS: none (route definition)
//   OUTPUTS: { Route - the TanStack file route for /inspector/$slug }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: Route
export const Route = createFileRoute("/inspector/$slug")({
  loader: ({ params }) => {
    const id = locusIdOf(params.slug);
    const locus = semanticReport?.model.loci.find(
      (candidate) => candidate.id === id,
    );
    if (locus === undefined || semanticReport === null) throw notFound();
    return { locus, verifications: semanticReport.verifications[id] ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: pageTitle(loaderData?.locus.id ?? "Page not found") },
      {
        name: "description",
        content:
          loaderData?.locus.description ??
          `The Locus ${loaderData?.locus.id ?? ""} in the repository model.`,
      },
    ],
  }),
  component: LocusPage,
});

function LocusPage() {
  const { locus, verifications } = Route.useLoaderData();
  return <LocusView locus={locus} verifications={verifications} />;
}
