// START_MODULE_CONTRACT
//   PURPOSE: Name the knowledge status of a fact on the inspector and verification pages, so that a reader sees whether it was declared, derived, verified, failed, not run, observed, invalidated or unknown.
//   SCOPE: KNOWLEDGE_LABELS and KnowledgeBadge, a presentational badge. It never decides a knowledge status; the value comes from the report.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-INSPECTOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   KNOWLEDGE_LABELS - the visible label of each knowledge status
//   KnowledgeBadge - a badge with the knowledge status as data and as text
// END_MODULE_MAP

import type { Knowledge } from "@telos/kernel";
import { Badge } from "@/components/ui/badge";

export const KNOWLEDGE_LABELS: Readonly<Record<Knowledge, string>> = {
  declared: "declared",
  derived: "derived",
  verified: "verified",
  failed: "failed",
  "not-run": "not run",
  observed: "observed",
  invalidated: "invalidated",
  unknown: "unknown",
};

// START_CONTRACT: KnowledgeBadge
//   PURPOSE: Show one knowledge status as an outlined badge.
//   INPUTS: { knowledge: Knowledge - the status to show }
//   OUTPUTS: { JSX.Element - a Badge with data-knowledge set to the status and its label as text }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: KnowledgeBadge
export function KnowledgeBadge({
  knowledge,
}: {
  readonly knowledge: Knowledge;
}) {
  return (
    <Badge variant="outline" data-knowledge={knowledge}>
      {KNOWLEDGE_LABELS[knowledge]}
    </Badge>
  );
}
