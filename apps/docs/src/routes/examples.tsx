import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "@/components/document-page";
import { documentHead, loadDocument } from "@/lib/load";

export const Route = createFileRoute("/examples")({
  loader: () => loadDocument("/examples"),
  head: ({ loaderData }) => documentHead(loaderData),
  component: ExamplesPage,
});

function ExamplesPage() {
  const { doc, related } = Route.useLoaderData();
  return <DocumentPage doc={doc} related={related} />;
}
