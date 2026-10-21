// START_MODULE_CONTRACT
//   PURPOSE: Give every route the document shell, the shared site layout and the not-found page, and the head that all pages share.
//   SCOPE: The root route with its head, the html document shell, the layout that wraps each route's outlet, and the not-found component.
//   DEPENDS: M-DOCS-CONTENT
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Route - the root route of the site
// END_MODULE_MAP

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MermaidRenderer } from "@/components/mermaid-renderer";
import { NotFound } from "@/components/not-found";
import { SiteLayout } from "@/components/site-layout";
import { content } from "@/lib/generated";
import { SITE_TITLE } from "@/lib/site";
import { THEME_SCRIPT } from "@/lib/theme";
import css from "../styles.css?url";

// START_CONTRACT: Route
//   PURPOSE: Define the root route with the shared head, the document shell, the site layout around each page and the not-found page.
//   INPUTS: none (route definition)
//   OUTPUTS: { Route - the root route object used by the route tree }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: Route
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
    ],
    links: [
      { rel: "stylesheet", href: css },
      {
        rel: "alternate",
        type: "text/plain",
        href: "/llms.txt",
        title: "llms.txt",
      },
    ],
    scripts: [{ children: THEME_SCRIPT }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: () => (
    <SiteLayout content={content} currentPath="">
      <NotFound />
    </SiteLayout>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <MermaidRenderer />
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const { pathname } = useLocation();
  return (
    <SiteLayout content={content} currentPath={pathname}>
      <Outlet />
    </SiteLayout>
  );
}
