// START_MODULE_CONTRACT
//   PURPOSE: Be the one wrapper for every result the site shows, so that each result carries its kind, its origin, its stale marker and its provenance label (FR-021, INV-013).
//   SCOPE: ResultKind, the seven result kinds of the docs-site contract, and ResultPanel. WP14 and WP15 reuse them; no other kind is added.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SITE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ResultKind - the kinds of result element, as the docs-site contract names them
//   ResultPanel - the section that holds one result, with its provenance label
// END_MODULE_MAP

import type { ReactNode } from "react";
import { ProvenanceLabel } from "@/components/provenance-label";
import type { Provenance } from "@/lib/provenance";
import { cn } from "@/lib/utils";

export type ResultKind =
  | "validation-report"
  | "revision-id"
  | "change-set"
  | "history-state"
  | "decode-error"
  | "spec-report"
  | "spec-result";

// START_CONTRACT: ResultPanel
//   PURPOSE: Show one result with its provenance label first. A historical result keeps its content at full contrast and is marked as stale by its dashed border, its label, its icon and data-stale; its text is never dimmed.
//   INPUTS: { kind: ResultKind - the result kind, provenance: Provenance | null - its provenance, title: string - the accessible name, children: ReactNode - the result content }
//   OUTPUTS: { JSX.Element - a section with data-result, data-provenance ("none" when null), data-stale="true" when historical, a dashed border when historical, aria-label and the ProvenanceLabel }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SITE
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
  const historical = provenance?.origin === "historical";
  return (
    <section
      data-result={kind}
      data-provenance={provenance?.origin ?? "none"}
      data-stale={historical ? "true" : undefined}
      aria-label={title}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        historical && "border-dashed",
      )}
    >
      <ProvenanceLabel provenance={provenance} />
      {children}
    </section>
  );
}
