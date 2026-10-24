// START_MODULE_CONTRACT
//   PURPOSE: Run one JSON text through the real kernel in the browser: decode it, build the model, verify its static rules and describe it (FR-026, NFR-001).
//   SCOPE: MAX_INPUT_LENGTH, PlaygroundResult and runDefinition. Out: the page, the examples and the registry (registry.ts).
//   DEPENDS: M-KERNEL-API, M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND, V-M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MAX_INPUT_LENGTH - the longest input the playground decodes, in characters
//   PlaygroundResult - the outcome of one run: a decode error with its issues, or a built model with its report
//   runDefinition - decodes, builds, verifies and describes one JSON text
// END_MODULE_MAP

import {
  buildModel,
  decodeLocusText,
  describeModel,
  type Diagnostic,
  type DecodeIssue,
  type ModelDescription,
  type VerificationReport,
  verify,
} from "@telos/kernel";
import { Effect } from "effect";
import { PLAYGROUND_REGISTRY } from "@/playground/registry";

// START_CONTRACT: MAX_INPUT_LENGTH
//   PURPOSE: Refuse input that is too long to read in a page, before any decoding.
//   INPUTS: none (constant)
//   OUTPUTS: { number - 1 000 000 characters }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: MAX_INPUT_LENGTH
export const MAX_INPUT_LENGTH = 1_000_000;

// START_CONTRACT: PlaygroundResult
//   PURPOSE: Tell the page whether the input failed to decode, with its issues, or was built, with its diagnostics, report and description.
//   INPUTS: none (type)
//   OUTPUTS: { decode-error | built - the kind discriminator and the fields of each case }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PlaygroundResult
export type PlaygroundResult =
  | {
      readonly kind: "decode-error";
      readonly decodeIssues: ReadonlyArray<DecodeIssue>;
    }
  | {
      readonly kind: "built";
      readonly diagnostics: ReadonlyArray<Diagnostic>;
      readonly report: VerificationReport;
      readonly description: ModelDescription;
    };

// START_CONTRACT: runDefinition
//   PURPOSE: Decode a JSON Locus definition with the playground registry and, when it decodes, build its model, verify its static rules in the browser runner and describe it. Input over the limit is refused before decoding.
//   INPUTS: { text: string - the JSON text the reader typed or picked }
//   OUTPUTS: { Effect<PlaygroundResult> - decode-error with the issues, or built with the sorted diagnostics, the verification report and the model description }
//   SIDE_EFFECTS: Reads the clock once through verify (the report provenance). No network, no storage.
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: runDefinition
export const runDefinition = (text: string): Effect.Effect<PlaygroundResult> =>
  Effect.gen(function* () {
    if (text.length > MAX_INPUT_LENGTH) {
      return {
        kind: "decode-error",
        decodeIssues: [{ path: "", message: "The input is larger than 1 MB." }],
      } satisfies PlaygroundResult;
    }
    const decoded = decodeLocusText(text, PLAYGROUND_REGISTRY);
    if (!decoded.ok) {
      return {
        kind: "decode-error",
        decodeIssues: decoded.issues,
      } satisfies PlaygroundResult;
    }
    const model = buildModel(decoded.root);
    const report = yield* verify(model, {
      runner: "browser",
      methods: ["static"],
    });
    const description = yield* describeModel(model);
    return {
      kind: "built",
      diagnostics: model.diagnostics,
      report,
      description,
    } satisfies PlaygroundResult;
  });
