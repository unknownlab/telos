import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/architecture/$id")({
  loader: ({ params }) => loadDocument(`/architecture/${params.id}`),
  head: ({ loaderData }) => documentHead(loaderData),
  component: ArchitectureDocumentPage,
});

function ArchitectureDocumentPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
