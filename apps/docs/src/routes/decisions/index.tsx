import { createFileRoute } from "@tanstack/react-router";
import { DocumentList } from "@/components/document-list";
import { DocumentPage } from "@/components/document-page";
import { content } from "@/lib/generated";
import { documentHead, loadDocument } from "@/lib/load";
import { childDocuments } from "@/lib/site";

export const Route = createFileRoute("/decisions/")({
  loader: () => ({
    ...loadDocument("/decisions"),
    docs: childDocuments(content, "decisions"),
  }),
  head: ({ loaderData }) => documentHead(loaderData),
  component: DecisionsPage,
});

function DecisionsPage() {
  const { doc, related, docs } = Route.useLoaderData();
  return (
    <DocumentPage doc={doc} related={related}>
      <DocumentList heading="All decisions" docs={docs} />
    </DocumentPage>
  );
}
