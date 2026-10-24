// START_MODULE_CONTRACT
//   PURPOSE: Give readers the sections of the site (NAV_SECTIONS) in their order, mark the current section and page, and list the pages of the current section (FR-013).
//   SCOPE: SiteNav, one navigation landmark with a list of the sections of NAV_SECTIONS and, under the active section, its child pages.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SiteNav - the section navigation with the active section and current page marked
// END_MODULE_MAP

import {
  type ContentDocument,
  type ContentFile,
  NAV_SECTIONS,
  type NavSectionId,
} from "@/lib/content-types";
import { documentsInSection, sectionForPath } from "@/lib/site";

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

// The pages listed under an active section are its child documents (no index documents),
// except the document that the section link already points to, which would repeat the link.
// An index document other than the section page is listed only while it is the current page,
// so that the current page is always marked in the navigation.
function pagesUnder(
  content: ContentFile,
  section: NavSectionId,
  sectionRoute: string,
  current: string,
): ContentDocument[] {
  return documentsInSection(content, section).filter(
    (doc) =>
      doc.route !== sectionRoute &&
      (doc.kind !== "index" || doc.route === current),
  );
}

// START_CONTRACT: SiteNav
//   PURPOSE: Render the navigation once, with every section link carrying data-nav-section and the current page marked with aria-current.
//   INPUTS: { content: ContentFile - the compiled documents, currentPath: string - the path being shown }
//   OUTPUTS: { JSX.Element - a nav labelled "Sections" holding the section links in NAV_SECTIONS order; the active section has data-active and, under it, its child pages }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SiteNav
export function SiteNav({
  content,
  currentPath,
}: {
  readonly content: ContentFile;
  readonly currentPath: string;
}) {
  const current = withoutTrailingSlash(currentPath);
  const active = sectionForPath(currentPath);
  return (
    <nav aria-label="Sections" className="text-sm">
      <ul className="flex flex-col gap-1">
        {NAV_SECTIONS.map((section) => {
          const isActive = section.id === active;
          const children = isActive
            ? pagesUnder(content, section.id, section.route, current)
            : [];
          return (
            <li key={section.id}>
              <a
                href={section.route}
                data-nav-section={section.id}
                data-active={isActive ? "true" : undefined}
                aria-current={section.route === current ? "page" : undefined}
                className={
                  isActive
                    ? "block rounded-md bg-accent px-2 py-1 font-medium text-accent-foreground"
                    : "block rounded-md px-2 py-1 hover:bg-accent"
                }
              >
                {section.title}
              </a>
              {children.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1 ps-4">
                  {children.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.route}
                        aria-current={
                          doc.route === current ? "page" : undefined
                        }
                        className={
                          doc.route === current
                            ? "block px-2 py-1 font-medium underline underline-offset-4"
                            : "block px-2 py-1 hover:underline"
                        }
                      >
                        {doc.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
