import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/first-locus")({
  loader: () => loadDocument("/first-locus"),
  head: ({ loaderData }) => documentHead(loaderData),
  component: FirstLocusPage,
});

function FirstLocusPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
