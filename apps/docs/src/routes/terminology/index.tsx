import { createFileRoute } from "@tanstack/react-router";
import { DocumentList } from "@/components/document-list";
import { DocumentPage } from "@/components/document-page";
import { content } from "@/lib/generated";
import { documentHead, loadDocument } from "@/lib/load";
import { childDocuments } from "@/lib/site";

export const Route = createFileRoute("/terminology/")({
  loader: () => ({
    ...loadDocument("/terminology"),
    docs: childDocuments(content, "terminology"),
  }),
  head: ({ loaderData }) => documentHead(loaderData),
  component: TerminologyPage,
});

function TerminologyPage() {
  const { doc, related, docs } = Route.useLoaderData();
  return (
    <DocumentPage doc={doc} related={related}>
      <DocumentList heading="All terms" docs={docs} />
    </DocumentPage>
  );
}
