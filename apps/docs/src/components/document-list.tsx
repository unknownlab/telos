// START_MODULE_CONTRACT
//   PURPOSE: List documents with their titles, summaries, badges and dates, so an index page shows what each document says (User Story 3).
//   SCOPE: DocumentList, a presentational section with a heading and one list entry per document.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DocumentList - a titled list of documents with their summaries and badges
// END_MODULE_MAP

import { MaturityBadge, StatusBadge } from "@/components/badges";
import type { ContentDocument } from "@/lib/content-types";

// START_CONTRACT: DocumentList
//   PURPOSE: Show a labelled list of documents, each linked to its route with its summary, badges and date when it has one.
//   INPUTS: { heading: string - the visible heading of the list, docs: ReadonlyArray<ContentDocument> - the documents to list in the order given }
//   OUTPUTS: { JSX.Element - a section labelled by its h2 holding a ul of li entries }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: DocumentList
export function DocumentList({
  heading,
  docs,
}: {
  readonly heading: string;
  readonly docs: ReadonlyArray<ContentDocument>;
}) {
  const headingId = `list-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className="mt-8">
      <h2 id={headingId} className="text-xl font-semibold">
        {heading}
      </h2>
      <ul className="mt-4 flex flex-col divide-y">
        {docs.map((doc) => (
          <li key={doc.id} className="flex flex-col gap-2 py-4">
            <a
              href={doc.route}
              className="font-medium underline underline-offset-4"
            >
              {doc.title}
            </a>
            <p className="text-muted-foreground">{doc.summary}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge status={doc.status} />
              <MaturityBadge maturity={doc.maturity} />
              {doc.date !== undefined && (
                <time dateTime={doc.date} className="text-muted-foreground">
                  {doc.date}
                </time>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
