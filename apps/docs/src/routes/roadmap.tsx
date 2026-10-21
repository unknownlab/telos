import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/roadmap")({
  loader: () => loadDocument("/roadmap"),
  head: ({ loaderData }) => documentHead(loaderData),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
