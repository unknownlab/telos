import { createFileRoute, notFound } from "@tanstack/react-router";
import { SITE_COMMIT, specReportFile } from "@/lib/build";
import { pageTitle } from "@/lib/site";
import { ScenarioShell } from "@/playground/components/scenario-shell";
import { scenarioById } from "@/playground/registry";

export const Route = createFileRoute("/playground/$scenario")({
  loader: ({ params }) => {
    const scenario = scenarioById(params.scenario);
    if (scenario === undefined) throw notFound();
    return { id: scenario.id };
  },
  head: ({ loaderData }) => {
    const scenario = loaderData ? scenarioById(loaderData.id) : undefined;
    return {
      meta: [
        {
          title: pageTitle(
            scenario
              ? `Scenario ${scenario.letter}: ${scenario.title}`
              : "Page not found",
          ),
        },
        ...(scenario
          ? [{ name: "description", content: scenario.summary }]
          : []),
      ],
    };
  },
  component: ScenarioPage,
});

function ScenarioPage() {
  const { id } = Route.useLoaderData();
  const scenario = scenarioById(id);
  if (scenario === undefined) return null; // unreachable: the loader threw notFound()
  return (
    <ScenarioShell
      scenario={scenario}
      siteCommit={SITE_COMMIT}
      buildReport={specReportFile}
    />
  );
}
