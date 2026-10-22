import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/agent-reference")({
  loader: () => loadDocument("/agent-reference"),
  head: ({ loaderData }) => documentHead(loaderData),
  component: AgentReferencePage,
});

function AgentReferencePage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
