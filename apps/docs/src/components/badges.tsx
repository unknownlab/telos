// START_MODULE_CONTRACT
//   PURPOSE: Show the status and maturity of a document as labelled badges, so a reader sees how far a document can be trusted (FR-018).
//   SCOPE: StatusBadge and MaturityBadge, each a shadcn Badge with a data attribute for tests and a visible "Status:" or "Maturity:" label.
//   DEPENDS: none
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   StatusBadge - the status of a document as a badge
//   MaturityBadge - the maturity of a document as a badge
// END_MODULE_MAP

import { Badge } from "@/components/ui/badge";
import type { Maturity, Status } from "@/lib/content-types";

const MATURITY_VARIANT = {
  vision: "outline",
  proposed: "secondary",
  implemented: "default",
} as const;

// START_CONTRACT: StatusBadge
//   PURPOSE: Show a document status as a labelled badge.
//   INPUTS: { status: Status - the document status }
//   OUTPUTS: { JSX.Element - a Badge with data-status and the text "Status: <status>" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: StatusBadge
export function StatusBadge({ status }: { readonly status: Status }) {
  return (
    <Badge variant="outline" data-status={status}>
      {`Status: ${status}`}
    </Badge>
  );
}

// START_CONTRACT: MaturityBadge
//   PURPOSE: Show a document maturity as a labelled badge; vision reads as outline, proposed as secondary, implemented as default.
//   INPUTS: { maturity: Maturity - the document maturity }
//   OUTPUTS: { JSX.Element - a Badge with data-maturity and the text "Maturity: <maturity>" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: MaturityBadge
export function MaturityBadge({ maturity }: { readonly maturity: Maturity }) {
  return (
    <Badge variant={MATURITY_VARIANT[maturity]} data-maturity={maturity}>
      {`Maturity: ${maturity}`}
    </Badge>
  );
}
