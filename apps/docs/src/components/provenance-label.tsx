// START_MODULE_CONTRACT
//   PURPOSE: Show where and when a result was produced, as one visible line with an icon for its origin (FR-021, INV-013).
//   SCOPE: ProvenanceLabel, a presentational component. Its text comes only from provenanceText; it never formats a time itself.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ProvenanceLabel - the provenance text of a result, with an origin icon
// END_MODULE_MAP

import {
  CircleSlash,
  Globe,
  Hammer,
  History,
  type LucideIcon,
} from "lucide-react";
import type { Provenance, ProvenanceOrigin } from "@/lib/provenance";
import { provenanceText } from "@/lib/provenance";

const ICONS: Readonly<Record<ProvenanceOrigin, LucideIcon>> = {
  browser: Globe,
  "bun-build": Hammer,
  ci: CircleSlash,
  none: CircleSlash,
  historical: History,
};

// START_CONTRACT: ProvenanceLabel
//   PURPOSE: Show the provenance of a result as its label text, next to an icon for the origin that the reader does not need to read.
//   INPUTS: { provenance: Provenance | null - the provenance of the result, null when nothing ran }
//   OUTPUTS: { JSX.Element - a p with data-slot="provenance-label" and data-origin, holding an aria-hidden icon and provenanceText(provenance) }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
// END_CONTRACT: ProvenanceLabel
export function ProvenanceLabel({
  provenance,
}: {
  readonly provenance: Provenance | null;
}) {
  const origin: ProvenanceOrigin = provenance?.origin ?? "none";
  const Icon = ICONS[origin];
  return (
    <p
      data-slot="provenance-label"
      data-origin={origin}
      className="flex items-start gap-2 text-sm text-muted-foreground"
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{provenanceText(provenance)}</span>
    </p>
  );
}
