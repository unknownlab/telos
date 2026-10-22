// START_MODULE_CONTRACT
//   PURPOSE: Turn the text of one Locus, which the reader edited, into a decoded LocusDefinition, refusing over-long text before any parsing (FR-019, C-002).
//   SCOPE: MAX_INPUT_LENGTH, LocusTextOutcome and decodeLocusText. Input is parsed only by JSON.parse and then decodeLocus; nothing in the text is executed. Out: the Revision step (run-revisions.ts) and the views.
//   DEPENDS: M-DOCS-PLAYGROUND, M-LOCUS-DECODE
//   LINKS: M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MAX_INPUT_LENGTH - the largest accepted text, in UTF-16 code units, equal to the limit of decodeFabricJson
//   LocusTextOutcome - a decoded Locus, or the located issues of text that is not one
//   decodeLocusText - the length check, JSON.parse and decodeLocus of one Locus text
// END_MODULE_MAP

import type { LocusDefinition } from "@telos/locus";
import { decodeLocus } from "@telos/locus";
import { Effect, Result } from "effect";
import type { DecodeIssue } from "@/playground/run-fabric";

// START_CONTRACT: MAX_INPUT_LENGTH
//   PURPOSE: Name the largest text that the playground decodes, the same limit that decodeFabricJson enforces.
//   INPUTS: none (constant)
//   OUTPUTS: { number - 1048576 code units }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: MAX_INPUT_LENGTH
/** The largest text the playground decodes, in UTF-16 code units. */
export const MAX_INPUT_LENGTH = 1_048_576;

// START_CONTRACT: LocusTextOutcome
//   PURPOSE: Name the two outcomes of decoding one Locus text, so that the page shows a valid Locus or its issues and never both.
//   INPUTS: none (type)
//   OUTPUTS: { LocusTextOutcome - ok with the frozen LocusDefinition, or ok false with the located issues }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: LocusTextOutcome
/** The decoded Locus, or the located issues of the text. */
export type LocusTextOutcome =
  | { readonly ok: true; readonly locus: LocusDefinition }
  | { readonly ok: false; readonly issues: ReadonlyArray<DecodeIssue> };

// START_CONTRACT: decodeLocusText
//   PURPOSE: Decode the text of one Locus, so that a length or syntax error is one issue at the whole input and a shape error is the package's located issues.
//   INPUTS: { text: string - the Locus JSON the reader edited }
//   OUTPUTS: { Promise<LocusTextOutcome> - ok with the frozen LocusDefinition, or the issues; resolves and never throws }
//   SIDE_EFFECTS: none. Parses the text with JSON.parse only after the length check, then decodes it with decodeLocus.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: decodeLocusText
/** Decodes one Locus text. Every failure is a result; the promise never rejects. */
export async function decodeLocusText(text: string): Promise<LocusTextOutcome> {
  if (text.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      issues: [
        {
          path: "",
          message: `Input is longer than ${MAX_INPUT_LENGTH} characters.`,
        },
      ],
    };
  }
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      issues: [{ path: "", message: `Not valid JSON: ${reason}` }],
    };
  }
  const decoded = await Effect.runPromise(Effect.result(decodeLocus(value)));
  if (Result.isFailure(decoded)) {
    return { ok: false, issues: decoded.failure.issues };
  }
  return { ok: true, locus: decoded.success };
}
