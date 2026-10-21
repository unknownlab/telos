import { createFileRoute } from "@tanstack/react-router";
import { DocumentList } from "@/components/document-list";
import { DocumentPage } from "@/components/document-page";
import { content } from "@/lib/generated";
import { documentHead, loadDocument } from "@/lib/load";
import { childDocuments } from "@/lib/site";

export const Route = createFileRoute("/principles/")({
  loader: () => ({
    ...loadDocument("/principles"),
    docs: childDocuments(content, "principles"),
  }),
  head: ({ loaderData }) => documentHead(loaderData),
  component: PrinciplesPage,
});

function PrinciplesPage() {
  const { doc, related, docs } = Route.useLoaderData();
  return (
    <DocumentPage doc={doc} related={related}>
      <DocumentList heading="All principles" docs={docs} />
    </DocumentPage>
  );
}
