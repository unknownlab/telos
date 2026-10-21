// START_MODULE_CONTRACT
//   PURPOSE: Render one content document as the page a reader sees, with its own heading shown once, its badges, summary, body, outline, related documents and source link.
//   SCOPE: DocumentPage, a presentational component. It takes the document and its related documents as props and never reads the router or the generated content.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DocumentPage - the page of one document with its outline and related documents
// END_MODULE_MAP

import type { ReactNode } from "react";
import { MaturityBadge, StatusBadge } from "@/components/badges";
import type { ContentDocument } from "@/lib/content-types";
import { sourceUrl, splitTitle } from "@/lib/site";

// START_CONTRACT: DocumentPage
//   PURPOSE: Show a document. The body's leading h1 is the visible heading; when the body has none, the document title is the heading. The source link points into the repository.
//   INPUTS: { doc: ContentDocument - the document, related: ReadonlyArray<ContentDocument> - the documents it relates to, children: ReactNode - optional content after the body }
//   OUTPUTS: { JSX.Element - a main element with data-doc-id, the article and, when the document has h2 or h3 headings, the "On this page" outline }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: DocumentPage
export function DocumentPage({
  doc,
  related,
  children,
}: {
  readonly doc: ContentDocument;
  readonly related: ReadonlyArray<ContentDocument>;
  readonly children?: ReactNode;
}) {
  const { title, body } = splitTitle(doc.html);
  const outline = doc.outline.filter(
    (heading) => heading.level === 2 || heading.level === 3,
  );
  return (
    <main
      id="content"
      data-doc-id={doc.id}
      className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_14rem]"
    >
      <article className="min-w-0">
        {title ? (
          <div dangerouslySetInnerHTML={{ __html: title }} />
        ) : (
          <h1>{doc.title}</h1>
        )}
        <div data-slot="doc-meta" className="my-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={doc.status} />
            <MaturityBadge maturity={doc.maturity} />
          </div>
          <p data-slot="summary" className="text-muted-foreground">
            {doc.summary}
          </p>
        </div>
        <div className="prose" dangerouslySetInnerHTML={{ __html: body }} />
        {children}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="text-xl font-semibold">
              Related
            </h2>
            <ul className="mt-2 list-disc ps-6">
              {related.map((item) => (
                <li key={item.id}>
                  <a href={item.route} className="underline underline-offset-4">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <footer className="mt-10 border-t pt-4 text-sm text-muted-foreground">
          <p>
            Source:{" "}
            <a
              href={sourceUrl(doc)}
              className="underline underline-offset-4 break-all"
            >
              {doc.source}
            </a>
          </p>
        </footer>
      </article>
      {outline.length > 0 && (
        <nav
          aria-label="On this page"
          className="text-sm lg:sticky lg:top-20 lg:self-start"
        >
          <p className="mb-2 font-semibold">On this page</p>
          <ul className="flex flex-col gap-1">
            {outline.map((heading) => (
              <li
                key={heading.id}
                className={heading.level === 3 ? "ps-4" : undefined}
              >
                <a
                  href={`#${heading.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}
