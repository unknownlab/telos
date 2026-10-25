// START_MODULE_CONTRACT
//   PURPOSE: Be the one wrapper for every build-time result the site shows, so that each result carries its kind, its origin and its provenance label (FR-021, INV-013).
//   SCOPE: ResultKind, the one result kind "semantic-report", and ResultPanel. No other kind is added.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ResultKind - the kinds of result element
//   ResultPanel - the section that holds one result, with its provenance label
// END_MODULE_MAP

import type { ReactNode } from "react";
import { ProvenanceLabel } from "@/components/provenance-label";
import type { Provenance } from "@/lib/provenance";

export type ResultKind = "semantic-report";

// START_CONTRACT: ResultPanel
//   PURPOSE: Show one result with its provenance label first.
//   INPUTS: { kind: ResultKind - the result kind, provenance: Provenance | null - its provenance, title: string - the accessible name, children: ReactNode - the result content }
//   OUTPUTS: { JSX.Element - a section with data-result, data-provenance ("none" when null), aria-label and the ProvenanceLabel }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: ResultPanel
export function ResultPanel({
  kind,
  provenance,
  title,
  children,
}: {
  readonly kind: ResultKind;
  readonly provenance: Provenance | null;
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <section
      data-result={kind}
      data-provenance={provenance?.origin ?? "none"}
      aria-label={title}
      className="flex flex-col gap-3 rounded-lg border p-4"
    >
      <ProvenanceLabel provenance={provenance} />
      {children}
    </section>
  );
}
