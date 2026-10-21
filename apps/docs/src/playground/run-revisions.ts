// START_MODULE_CONTRACT
//   PURPOSE: Run scenario D on the two Locus texts: decode both, compute both Revision ids, diff A to B, and replay a list of history appends against a fresh in-memory history of the real package (FR-019, FR-021, INV-013).
//   SCOPE: SideOutcome, DiffOutcome, RevisionsOutcome, runRevisions, revisionsKey, AppendStep, StepOutcome, HistoryReplay, replayHistory and isRevisionId. Out: the views (revision-results.tsx, revisions-scenario.tsx) and the run state (run-state.ts). Compare-and-set is never re-implemented: it is RevisionHistoryInMemory.
//   DEPENDS: M-DOCS-PLAYGROUND, M-LOCUS-DECODE, M-LOCUS-REVISION, M-LOCUS-HISTORY
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   SideOutcome - one Locus text: its Revision, its decode issues, or a digest failure
//   DiffOutcome - the change set from A to B, a locus mismatch, or unavailable when a side failed
//   RevisionsOutcome - the outcome of both sides and of their diff
//   AppendStep - one append: the Revision and the expected head, or null for no head
//   StepOutcome - one append's outcome: appended, no-op or stale
//   HistoryReplay - the outcome of every step and the head and entries of each Locus
//   runRevisions - decode both texts, compute both Revisions and diff A to B
//   revisionsKey - the run key of two texts, which the run state compares for staleness
//   replayHistory - run the appends in order against one fresh in-memory history
//   isRevisionId - true for the text of a sha256 Revision id in lower case
// END_MODULE_MAP

import {
  type ChangeSet,
  createRevision,
  diffRevisions,
  type Identity,
  type Revision,
  type RevisionId,
  RevisionHistory,
  RevisionHistoryInMemory,
} from "@telos/locus";
import { Effect, Result } from "effect";
import { decodeLocusText } from "@/playground/locus-text";
import type { DecodeIssue } from "@/playground/run-fabric";

// START_CONTRACT: SideOutcome
//   PURPOSE: Name the outcome of one Locus text: its Revision, its decode issues, or a digest failure.
//   INPUTS: none (type)
//   OUTPUTS: { SideOutcome - ok with the Revision; ok false with the issues or with digestFailed }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: SideOutcome
/** One Locus text: its Revision, its decode issues, or a digest failure. */
export type SideOutcome =
  | { readonly ok: true; readonly revision: Revision }
  | { readonly ok: false; readonly issues: ReadonlyArray<DecodeIssue> }
  | { readonly ok: false; readonly digestFailed: true };

// START_CONTRACT: DiffOutcome
//   PURPOSE: Name the outcome of comparing A with B: a change set, a locus mismatch, or unavailable.
//   INPUTS: none (type)
//   OUTPUTS: { DiffOutcome - kind change-set with the ChangeSet, locus-mismatch with both identities, or unavailable }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DiffOutcome
/** The change set from A to B, a locus mismatch, or unavailable when a side failed. */
export type DiffOutcome =
  | { readonly kind: "change-set"; readonly changeSet: ChangeSet }
  | {
      readonly kind: "locus-mismatch";
      readonly from: Identity;
      readonly to: Identity;
    }
  | { readonly kind: "unavailable" };

// START_CONTRACT: RevisionsOutcome
//   PURPOSE: Hold the outcome of both Locus texts and of their diff, for one Compute press.
//   INPUTS: none (type)
//   OUTPUTS: { RevisionsOutcome - a, b and diff }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: RevisionsOutcome
/** The outcome of both sides and of their diff. */
export interface RevisionsOutcome {
  readonly a: SideOutcome;
  readonly b: SideOutcome;
  readonly diff: DiffOutcome;
}

// START_CONTRACT: reviseText
//   PURPOSE: Decode one Locus text and compute its Revision, so that each side ends in one of three outcomes.
//   INPUTS: { text: string - the Locus JSON of one side }
//   OUTPUTS: { Promise<SideOutcome> - the Revision, the decode issues, or digestFailed; never rejects }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle through createRevision.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: reviseText
async function reviseText(text: string): Promise<SideOutcome> {
  const decoded = await decodeLocusText(text);
  if (!decoded.ok) return { ok: false, issues: decoded.issues };
  const revision = await Effect.runPromise(
    Effect.result(createRevision(decoded.locus)),
  );
  if (Result.isFailure(revision)) return { ok: false, digestFailed: true };
  return { ok: true, revision: revision.success };
}

// START_CONTRACT: runRevisions
//   PURPOSE: Decode both Locus texts, compute both Revisions and diff A to B, so that scenario D shows what the package reports.
//   INPUTS: { textA: string - the Locus JSON of A, textB: string - the Locus JSON of B }
//   OUTPUTS: { Promise<RevisionsOutcome> - both sides and the diff; diff is unavailable when a side failed; never rejects }
//   SIDE_EFFECTS: Reads globalThis.crypto.subtle through createRevision. Parses the texts with JSON.parse only.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: runRevisions
/** Decodes both texts, creates both Revisions and diffs A to B. */
export async function runRevisions(
  textA: string,
  textB: string,
): Promise<RevisionsOutcome> {
  const [a, b] = await Promise.all([reviseText(textA), reviseText(textB)]);
  if (!("revision" in a) || !("revision" in b)) {
    return { a, b, diff: { kind: "unavailable" } };
  }
  const diff = await Effect.runPromise(
    Effect.result(diffRevisions(a.revision, b.revision)),
  );
  if (Result.isFailure(diff)) {
    return {
      a,
      b,
      diff: {
        kind: "locus-mismatch",
        from: diff.failure.from,
        to: diff.failure.to,
      },
    };
  }
  return { a, b, diff: { kind: "change-set", changeSet: diff.success } };
}

// START_CONTRACT: revisionsKey
//   PURPOSE: Give the one text key of a pair of Locus texts, so that the run state can tell whether the pair changed.
//   INPUTS: { textA: string - the text of A, textB: string - the text of B }
//   OUTPUTS: { string - the JSON of the two texts as an array }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: revisionsKey
/** The run key of a pair of texts. */
export function revisionsKey(textA: string, textB: string): string {
  return JSON.stringify([textA, textB]);
}

// START_CONTRACT: AppendStep
//   PURPOSE: Name one append of the history: the Revision and the head it expects.
//   INPUTS: none (type)
//   OUTPUTS: { AppendStep - revision: Revision, expectedHead: RevisionId or null for no head }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: AppendStep
/** One append: the Revision and the head it expects, or null when it expects no head. */
export interface AppendStep {
  readonly revision: Revision;
  readonly expectedHead: RevisionId | null;
}

// START_CONTRACT: StepOutcome
//   PURPOSE: Name the outcome of one append: appended, no-op, or stale with the expected and actual heads.
//   INPUTS: none (type)
//   OUTPUTS: { StepOutcome - outcome appended, no-op or stale }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: StepOutcome
/** The outcome of one append. */
export type StepOutcome =
  | { readonly outcome: "appended"; readonly head: RevisionId }
  | { readonly outcome: "no-op"; readonly head: RevisionId }
  | {
      readonly outcome: "stale";
      readonly expected: RevisionId | null;
      readonly actual: RevisionId | null;
    };

// START_CONTRACT: HistoryReplay
//   PURPOSE: Hold the outcome of every append of a replay and the head and entries of each Locus.
//   INPUTS: none (type)
//   OUTPUTS: { HistoryReplay - outcomes in step order and loci with head and entries }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: HistoryReplay
/** The outcome of every step, and the head and entries of each Locus. */
export interface HistoryReplay {
  readonly outcomes: ReadonlyArray<StepOutcome>;
  /** One entry per distinct Locus, in order of first append. */
  readonly loci: ReadonlyArray<{
    readonly locus: Identity;
    readonly head: RevisionId | null;
    readonly entries: ReadonlyArray<RevisionId>;
  }>;
}

// START_CONTRACT: isRevisionId
//   PURPOSE: Tell whether a text is a Revision id, so that an expected head typed by the reader is refused before it reaches the history.
//   INPUTS: { text: string - the text to test }
//   OUTPUTS: { boolean - true for "sha256:" followed by 64 lower-case hex digits }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: isRevisionId
const REVISION_ID = /^sha256:[0-9a-f]{64}$/;

/** True for the text of a Revision id. */
export function isRevisionId(text: string): boolean {
  return REVISION_ID.test(text);
}

// START_CONTRACT: replayHistory
//   PURPOSE: Run the appends in order against one fresh, empty in-memory history of the package, so that each outcome is what the package reports and no state outlives the call.
//   INPUTS: { steps: ReadonlyArray<AppendStep> - the appends in order }
//   OUTPUTS: { Promise<HistoryReplay> - one outcome per step, and the head and entries of each Locus in order of first append }
//   SIDE_EFFECTS: Builds a fresh RevisionHistoryInMemory for the call. Never rejects.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: replayHistory
/** Replays the appends against a fresh in-memory history, one call at a time. */
export async function replayHistory(
  steps: ReadonlyArray<AppendStep>,
): Promise<HistoryReplay> {
  const program = Effect.gen(function* () {
    const history = yield* RevisionHistory;
    const outcomes: StepOutcome[] = [];
    const loci: Identity[] = [];
    for (const step of steps) {
      if (!loci.includes(step.revision.locus)) loci.push(step.revision.locus);
      const result = yield* Effect.result(
        history.append(step.revision, step.expectedHead),
      );
      outcomes.push(
        Result.isSuccess(result)
          ? {
              outcome: result.success.appended ? "appended" : "no-op",
              head: result.success.head,
            }
          : {
              outcome: "stale",
              expected: result.failure.expected,
              actual: result.failure.actual,
            },
      );
    }
    const summaries: Array<HistoryReplay["loci"][number]> = [];
    for (const locus of loci) {
      const head = yield* history.head(locus);
      const entries = yield* history.entries(locus);
      summaries.push({ locus, head, entries: [...entries] });
    }
    return { outcomes, loci: summaries };
  });
  return Effect.runPromise(
    Effect.provide(program, RevisionHistoryInMemory, { local: true }),
  );
}
