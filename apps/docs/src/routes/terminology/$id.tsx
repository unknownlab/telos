import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/terminology/$id")({
  loader: ({ params }) => loadDocument(`/terminology/${params.id}`),
  head: ({ loaderData }) => documentHead(loaderData),
  component: TerminologyDocumentPage,
});

function TerminologyDocumentPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
