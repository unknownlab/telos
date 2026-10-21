// START_MODULE_CONTRACT
//   PURPOSE: Show the two Revisions of scenario D and the change set from A to B, each in a ResultPanel with its provenance, so that a Revision id or a change is never shown without where and when it was produced (FR-019, FR-021).
//   SCOPE: SideView and ChangeSetView. Presentational: they render the values they are given and never recompute a Revision or a change.
//   DEPENDS: M-DOCS-PLAYGROUND, M-DOCS-SITE, M-LOCUS-REVISION
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SideView - the result of one Locus text: its Revision id, or its decode issues, or the digest failure
//   ChangeSetView - the change set from A to B, or the locus mismatch, or that no change set exists
// END_MODULE_MAP

import { ResultPanel } from "@/components/result-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Provenance } from "@/lib/provenance";
import { DecodeIssueList } from "@/playground/components/fabric-results";
import type { DiffOutcome, SideOutcome } from "@/playground/run-revisions";

// START_CONTRACT: SideView
//   PURPOSE: Show one Locus of scenario D: its identity and Revision id when it computed, its decode issues when it did not, or the digest failure.
//   INPUTS: { side: "a" | "b" - which Locus, outcome: SideOutcome - the side's outcome, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a div with data-side around a ResultPanel of kind revision-id, or decode-error when the text was not a Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: SideView
/** The result of one Locus text of scenario D. */
export function SideView({
  side,
  outcome,
  provenance,
}: {
  readonly side: "a" | "b";
  readonly outcome: SideOutcome;
  readonly provenance: Provenance | null;
}) {
  const letter = side === "a" ? "A" : "B";
  const title = `Locus ${letter}`;
  if ("revision" in outcome) {
    return (
      <div data-side={side}>
        <ResultPanel kind="revision-id" provenance={provenance} title={title}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p>
            Identity{" "}
            <code data-locus={outcome.revision.locus} className="break-all">
              {outcome.revision.locus}
            </code>
          </p>
          <p>
            Revision id{" "}
            <code
              data-revision-id={outcome.revision.id}
              data-locus={outcome.revision.locus}
              className="break-all"
            >
              {outcome.revision.id}
            </code>
          </p>
          <p>A Revision id does not mean that the Locus is valid.</p>
        </ResultPanel>
      </div>
    );
  }
  if ("issues" in outcome) {
    return (
      <div data-side={side}>
        <ResultPanel kind="decode-error" provenance={provenance} title={title}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p>
            {`Locus ${letter} is not a Locus: ${outcome.issues.length} decode issue(s).`}
          </p>
          <DecodeIssueList issues={outcome.issues} />
        </ResultPanel>
      </div>
    );
  }
  return (
    <div data-side={side}>
      <ResultPanel kind="revision-id" provenance={provenance} title={title}>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p>Revision id unavailable: Web Crypto failed.</p>
      </ResultPanel>
    </div>
  );
}

// START_CONTRACT: ChangeSetView
//   PURPOSE: Show the change set from A to B as a table with the part, the kind and the value of each change, or the reason there is none.
//   INPUTS: { diff: DiffOutcome - the diff of the run, provenance: Provenance | null - the provenance of the run }
//   OUTPUTS: { JSX.Element - a ResultPanel of kind change-set; change rows carry data-change-part and data-change-kind }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: ChangeSetView
/** The change set of scenario D, the locus mismatch, or the reason there is none. */
export function ChangeSetView({
  diff,
  provenance,
}: {
  readonly diff: DiffOutcome;
  readonly provenance: Provenance | null;
}) {
  return (
    <ResultPanel kind="change-set" provenance={provenance} title="Change set">
      <h2 className="text-lg font-semibold">Change set from A to B</h2>
      {diff.kind === "unavailable" ? (
        <p>No change set: fix the input above first.</p>
      ) : null}
      {diff.kind === "locus-mismatch" ? (
        <p>
          {`A and B are different Loci (${diff.from}, ${diff.to}). A change set compares two Revisions of one Locus.`}
        </p>
      ) : null}
      {diff.kind === "change-set" ? (
        diff.changeSet.changes.length === 0 ? (
          <p>No changes: A and B have the same Revision id.</p>
        ) : (
          <>
            <p>{`${diff.changeSet.changes.length} change(s) from A to B.`}</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diff.changeSet.changes.map((change, index) => (
                  <TableRow
                    key={`${change.part}-${change.kind}-${index}`}
                    data-change-part={change.part}
                    data-change-kind={change.kind}
                  >
                    <TableCell className="whitespace-normal [overflow-wrap:anywhere]">
                      <code>{change.part}</code>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {change.kind}
                    </TableCell>
                    <TableCell className="whitespace-normal [overflow-wrap:anywhere]">
                      {"value" in change
                        ? change.value
                        : `${change.from ?? "none"} → ${change.to ?? "none"}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )
      ) : null}
    </ResultPanel>
  );
}
