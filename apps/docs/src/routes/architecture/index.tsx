import { createFileRoute } from "@tanstack/react-router";
import { DocumentList } from "@/components/document-list";
import { content } from "@/lib/generated";
import { documentsInSection, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/architecture/")({
  loader: () => ({ docs: documentsInSection(content, "architecture") }),
  head: () => ({ meta: [{ title: pageTitle("Architecture") }] }),
  component: ArchitecturePage,
});

function ArchitecturePage() {
  const { docs } = Route.useLoaderData();
  return (
    <main
      id="content"
      data-page="architecture"
      className="flex flex-col gap-4 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Architecture</h1>
      <p className="text-muted-foreground">
        The conceptual model, the capability map, the technical direction, the
        open questions and the research behind them.
      </p>
      <DocumentList heading="Documents" docs={docs} />
    </main>
  );
}
