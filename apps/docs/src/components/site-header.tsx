// START_MODULE_CONTRACT
//   PURPOSE: Give every page the site header with a link back to the introduction and a place for the header actions.
//   SCOPE: SiteHeader, the header element with the site name link and the header-actions slot that WP12 fills.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SiteHeader - the header of every page
// END_MODULE_MAP

// START_CONTRACT: SiteHeader
//   PURPOSE: Show the site name as a link to the introduction, followed by the header actions slot.
//   INPUTS: none
//   OUTPUTS: { JSX.Element - a header element with a home link and the data-slot="header-actions" container }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: SiteHeader
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
        <a href="/" className="font-semibold tracking-tight">
          Telos by UnknownLab
        </a>
        <div
          data-slot="header-actions"
          className="ml-auto flex items-center gap-2"
        >
          {/* header actions: WP12 */}
        </div>
      </div>
    </header>
  );
}
