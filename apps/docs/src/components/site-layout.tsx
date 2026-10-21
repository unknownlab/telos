// START_MODULE_CONTRACT
//   PURPOSE: Wrap every page in the shared shell: a skip link, the header, the navigation beside the content, and the footer with the machine-readable links.
//   SCOPE: SiteLayout, which takes the compiled content and the current path as props and renders its children in the content column.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SiteLayout - the shared shell around every page
// END_MODULE_MAP

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteNav } from "@/components/site-nav";
import type { ContentFile } from "@/lib/content-types";
import { REPOSITORY_URL } from "@/lib/site";

// START_CONTRACT: SiteLayout
//   PURPOSE: Frame a page with the skip link, header, navigation, content column and footer.
//   INPUTS: { content: ContentFile - the compiled documents for the navigation, currentPath: string - the path being shown, children: ReactNode - the page }
//   OUTPUTS: { JSX.Element - the shell with the children in the content column }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SiteLayout
export function SiteLayout({
  content,
  currentPath,
  children,
}: {
  readonly content: ContentFile;
  readonly currentPath: string;
  readonly children: ReactNode;
}) {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:grid-cols-[16rem_minmax(0,1fr)]">
        <SiteNav content={content} currentPath={currentPath} />
        <div className="min-w-0">{children}</div>
      </div>
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-4 px-4 py-6 text-sm text-muted-foreground">
          <a href="/llms.txt" className="underline underline-offset-4">
            llms.txt
          </a>
          <a href="/index.json" className="underline underline-offset-4">
            JSON index
          </a>
          <a href={REPOSITORY_URL} className="underline underline-offset-4">
            Source on GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
