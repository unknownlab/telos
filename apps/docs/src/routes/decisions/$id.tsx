import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/decisions/$id")({
  loader: ({ params }) => loadDocument(`/decisions/${params.id}`),
  head: ({ loaderData }) => documentHead(loaderData),
  component: DecisionsDocumentPage,
});

function DecisionsDocumentPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
