// START_MODULE_CONTRACT
//   PURPOSE: Keep one append-only, compare-and-set history of Revisions per Locus, behind an Effect service with an in-memory layer.
//   SCOPE: RevisionHistory service and RevisionHistoryInMemory layer. Out: persistence (out of scope for Stage 0), change sets (diff.ts), Revision ids (revision.ts).
//   DEPENDS: M-LOCUS-REVISION
//   LINKS: M-LOCUS-HISTORY
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RevisionHistory - Effect service: head, entries, get and compare-and-set append per Locus
//   RevisionHistoryInMemory - layer that builds fresh, empty in-memory state each time it is provided
// END_MODULE_MAP

import { Context, Effect, Layer, Ref } from "effect";
import { RevisionNotFoundError, StaleBaselineError } from "./errors";
import type { Identity } from "./identity";
import type { Revision, RevisionId } from "./revision";

// START_CONTRACT: RevisionHistory
//   PURPOSE: Give access to the per-Locus histories of Revisions, with a compare-and-set append.
//   INPUTS: none
//   OUTPUTS: { RevisionHistory - Context service key "@telos/locus/RevisionHistory" whose shape is head, entries, get and append }
//   SIDE_EFFECTS: none. The effects of its methods depend on the layer that provides it.
//   LINKS: M-LOCUS-HISTORY
// END_CONTRACT: RevisionHistory
/**
 * The history service. One instance holds the histories of many Loci, one per
 * Locus, selected by `revision.locus`. Each history is an ordered list of
 * RevisionIds; its head is the last one, or `null` when the list is empty.
 */
export class RevisionHistory extends Context.Service<
  RevisionHistory,
  {
    /**
     * The current head of a Locus history, or `null` when it has no entries.
     * Never fails.
     */
    readonly head: (locus: Identity) => Effect.Effect<RevisionId | null>;
    /**
     * The ids of a Locus history in append order. The returned array is a
     * frozen copy; changing it never changes the history. Never fails.
     */
    readonly entries: (
      locus: Identity,
    ) => Effect.Effect<ReadonlyArray<RevisionId>>;
    /**
     * The stored Revision with this id. Fails with RevisionNotFoundError when
     * no Revision with this id has been appended to any Locus history.
     */
    readonly get: (
      id: RevisionId,
    ) => Effect.Effect<Revision, RevisionNotFoundError>;
    /**
     * Compare-and-set append. Rules, in order:
     * 1. The stale check comes first. When `expectedHead` is not the current
     *    head of `revision.locus`, the call fails with StaleBaselineError,
     *    whatever the Revision, and the history does not change.
     * 2. After the stale check, a Revision equal to the head is a no-op:
     *    `{ appended: false, head }`.
     * 3. Otherwise the Revision becomes the head: `{ appended: true, head: revision.id }`.
     *    Earlier Revisions may reappear (a revert such as `A, B, A`).
     */
    readonly append: (
      revision: Revision,
      expectedHead: RevisionId | null,
    ) => Effect.Effect<
      { readonly appended: boolean; readonly head: RevisionId },
      StaleBaselineError
    >;
  }
>()("@telos/locus/RevisionHistory") {}

// Immutable state: every write builds new maps and never mutates the old ones.
interface HistoryState {
  readonly entries: ReadonlyMap<Identity, ReadonlyArray<RevisionId>>;
  readonly revisions: ReadonlyMap<RevisionId, Revision>;
}

// The result of one append decision, computed inside Ref.modify.
type AppendOutcome =
  | { readonly _tag: "stale"; readonly actual: RevisionId | null }
  | { readonly _tag: "ok"; readonly appended: boolean };

// START_CONTRACT: headOf
//   PURPOSE: Read the head of one Locus history from a state snapshot.
//   INPUTS: { state: HistoryState - a snapshot; locus: Identity - the Locus to read }
//   OUTPUTS: { RevisionId | null - the last entry, or null when there are none }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-HISTORY
// END_CONTRACT: headOf
const headOf = (state: HistoryState, locus: Identity): RevisionId | null =>
  state.entries.get(locus)?.at(-1) ?? null;

// START_CONTRACT: RevisionHistoryInMemory
//   PURPOSE: Provide RevisionHistory backed by in-memory immutable state that starts empty each time the layer is built.
//   INPUTS: none
//   OUTPUTS: { Layer<RevisionHistory> - a fresh, empty history on every build }
//   SIDE_EFFECTS: Creates a Ref when the layer is built. Shares no state between builds.
//   LINKS: M-LOCUS-HISTORY
// END_CONTRACT: RevisionHistoryInMemory
/**
 * In-memory RevisionHistory. The state lives in a Ref created inside
 * Layer.effect, so every build starts empty. `Ref.modify` is the only write,
 * which makes append atomic within one runtime.
 */
export const RevisionHistoryInMemory: Layer.Layer<RevisionHistory> =
  Layer.effect(
    RevisionHistory,
    Effect.gen(function* () {
      const ref = yield* Ref.make<HistoryState>({
        entries: new Map(),
        revisions: new Map(),
      });

      return {
        head: (locus) => Effect.map(Ref.get(ref), (s) => headOf(s, locus)),
        entries: (locus) =>
          Effect.map(Ref.get(ref), (s) =>
            Object.freeze([...(s.entries.get(locus) ?? [])]),
          ),
        get: (id) =>
          Effect.flatMap(Ref.get(ref), (s) => {
            const found = s.revisions.get(id);
            return found === undefined
              ? Effect.fail(new RevisionNotFoundError({ id }))
              : Effect.succeed(found);
          }),
        append: (revision, expectedHead) =>
          // START_BLOCK_APPEND
          Effect.flatMap(
            Ref.modify(ref, (s): readonly [AppendOutcome, HistoryState] => {
              const actual = headOf(s, revision.locus);
              // Rule 1: the stale check runs first, whatever the Revision.
              if (actual !== expectedHead) {
                return [{ _tag: "stale", actual }, s];
              }
              // Rule 2: after the stale check, the head itself is a no-op.
              if (actual === revision.id) {
                return [{ _tag: "ok", appended: false }, s];
              }
              // Rule 3: the Revision becomes the head. Copy, never mutate.
              const entries = new Map(s.entries);
              entries.set(revision.locus, [
                ...(s.entries.get(revision.locus) ?? []),
                revision.id,
              ]);
              const revisions = new Map(s.revisions);
              revisions.set(revision.id, revision);
              return [
                { _tag: "ok", appended: true },
                { entries, revisions },
              ];
            }),
            (outcome) =>
              outcome._tag === "stale"
                ? Effect.fail(
                    new StaleBaselineError({
                      locus: revision.locus,
                      expected: expectedHead,
                      actual: outcome.actual,
                    }),
                  )
                : Effect.succeed({
                    appended: outcome.appended,
                    head: revision.id,
                  }),
          ),
        // END_BLOCK_APPEND
      };
    }),
  );
