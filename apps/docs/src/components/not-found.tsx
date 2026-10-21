// START_MODULE_CONTRACT
//   PURPOSE: Tell a reader that the page does not exist, and point them back to the introduction.
//   SCOPE: NotFound, the body of the 404 page. It is rendered inside the site layout by the root and not-found routes.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   NotFound - the page shown for an unknown route
// END_MODULE_MAP

// START_CONTRACT: NotFound
//   PURPOSE: Show the not-found page content with a link to the introduction.
//   INPUTS: none
//   OUTPUTS: { JSX.Element - a main element with data-page="not-found", an h1 and a link to "/" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: NotFound
export function NotFound() {
  return (
    <main
      id="content"
      data-page="not-found"
      className="flex flex-col gap-4 py-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        The page you asked for does not exist in this documentation site.
      </p>
      <p>
        <a href="/" className="underline underline-offset-4">
          Go to the introduction
        </a>
      </p>
    </main>
  );
}
