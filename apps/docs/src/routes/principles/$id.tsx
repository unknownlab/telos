import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/principles/$id")({
  loader: ({ params }) => loadDocument(`/principles/${params.id}`),
  head: ({ loaderData }) => documentHead(loaderData),
  component: PrinciplesDocumentPage,
});

function PrinciplesDocumentPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
