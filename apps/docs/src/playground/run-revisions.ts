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
//   LabelledStep - one append with the side it came from
//   HistoryModel - the steps of the history panel, their replay and the browser provenance of the replay
//   EMPTY_HISTORY - the history before any append, and after each Compute or reset
//   HistoryAction - what the history panel can do: start over on Compute, reset, or store a finished replay
//   historyReducer - the one place where the history panel's state changes
//   appendAllowed - true when a side with a Revision may append while the results are current
//   AppendDecision - the outcome of an append request: the step, or the reason it was refused
//   decideAppend - decide one append request from the side, its Revision, the expected head text and staleness
//   historyProvenance - the provenance of the history, historical once the run's input has changed
//   currentHeadOf - the head of one Locus in the replayed history, or null
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
import {
  type BrowserProvenance,
  type HistoricalProvenance,
  toHistorical,
} from "@/lib/provenance";
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

/** One append of the history, with the side it came from. */
export interface LabelledStep extends AppendStep {
  readonly side: "a" | "b";
}

/** The history panel state: its steps, their replay and the provenance of that replay. */
export interface HistoryModel {
  readonly steps: ReadonlyArray<LabelledStep>;
  readonly replay: HistoryReplay | null;
  readonly provenance: BrowserProvenance | null;
}

/** The history before any append, and after each Compute or reset. */
export const EMPTY_HISTORY: HistoryModel = {
  steps: [],
  replay: null,
  provenance: null,
};

/** The actions of the history panel. */
export type HistoryAction =
  | { readonly type: "compute" }
  | { readonly type: "reset" }
  | {
      readonly type: "replayed";
      readonly steps: ReadonlyArray<LabelledStep>;
      readonly replay: HistoryReplay;
      readonly provenance: BrowserProvenance;
    };

// START_CONTRACT: historyReducer
//   PURPOSE: Change the history panel state, so that a new Compute and a reset both start an empty history and only a finished replay stores steps.
//   INPUTS: { model: HistoryModel - the current state, action: HistoryAction - what happened }
//   OUTPUTS: { HistoryModel - EMPTY_HISTORY for compute and reset; the stored steps, replay and provenance for replayed }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: historyReducer
/** The state changes of the history panel. */
export function historyReducer(
  _model: HistoryModel,
  action: HistoryAction,
): HistoryModel {
  switch (action.type) {
    case "compute":
    case "reset":
      return EMPTY_HISTORY;
    case "replayed":
      return {
        steps: action.steps,
        replay: action.replay,
        provenance: action.provenance,
      };
  }
}

// START_CONTRACT: appendAllowed
//   PURPOSE: Tell whether a side may append, so that no append is offered for a side with no Revision or while the results are stale (INV-013).
//   INPUTS: { revision: Revision | null - the side's Revision, stale: boolean - whether the run's input has changed }
//   OUTPUTS: { boolean - true only for a Revision while the results are current }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: appendAllowed
/** True when a side with a Revision may append while the results are current. */
export function appendAllowed(
  revision: Revision | null,
  stale: boolean,
): boolean {
  return revision !== null && !stale;
}

/** The outcome of one append request. */
export type AppendDecision =
  | { readonly ok: true; readonly step: LabelledStep }
  | {
      readonly ok: false;
      readonly reason: "no-revision" | "stale" | "invalid-head";
    };

// START_CONTRACT: decideAppend
//   PURPOSE: Decide one append request, so that the step carries the expected head the reader typed and a refused request never reaches the history.
//   INPUTS: { side: "a" | "b" - the side, revision: Revision | null - its Revision, expectedText: string - the expected head as typed, stale: boolean - whether the run is stale }
//   OUTPUTS: { AppendDecision - ok with the labelled step, or refused with the reason: no-revision, stale or invalid-head }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: decideAppend
/** Decides one append request. Blank expected text means no head. */
export function decideAppend(input: {
  readonly side: "a" | "b";
  readonly revision: Revision | null;
  readonly expectedText: string;
  readonly stale: boolean;
}): AppendDecision {
  if (!appendAllowed(input.revision, input.stale)) {
    return {
      ok: false,
      reason: input.revision === null ? "no-revision" : "stale",
    };
  }
  const trimmed = input.expectedText.trim();
  if (trimmed !== "" && !isRevisionId(trimmed)) {
    return { ok: false, reason: "invalid-head" };
  }
  return {
    ok: true,
    step: {
      side: input.side,
      revision: input.revision as Revision,
      expectedHead: trimmed === "" ? null : (trimmed as RevisionId),
    },
  };
}

// START_CONTRACT: historyProvenance
//   PURPOSE: Give the provenance of the history, marked historical once the run's input has changed, so that a stale history is never shown as current (INV-013).
//   INPUTS: { model: HistoryModel - the history state, stale: boolean - whether the run's input has changed }
//   OUTPUTS: { BrowserProvenance | HistoricalProvenance | null - null before any replay, the historical form when stale, otherwise the browser provenance }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: historyProvenance
/** The provenance of the history for the current input. */
export function historyProvenance(
  model: HistoryModel,
  stale: boolean,
): BrowserProvenance | HistoricalProvenance | null {
  if (model.provenance === null) return null;
  return stale ? toHistorical(model.provenance) : model.provenance;
}

// START_CONTRACT: currentHeadOf
//   PURPOSE: Give the head of one Locus in the replayed history, which "Use current head" fills into the expected head field.
//   INPUTS: { model: HistoryModel - the history state, locus: Identity | null - the Locus }
//   OUTPUTS: { RevisionId | null - the head, or null when there is no Locus or no head }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: currentHeadOf
/** The head of one Locus in the replayed history, or null. */
export function currentHeadOf(
  model: HistoryModel,
  locus: Identity | null,
): RevisionId | null {
  if (locus === null) return null;
  return (
    model.replay?.loci.find((entry) => entry.locus === locus)?.head ?? null
  );
}
