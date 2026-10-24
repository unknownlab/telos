// START_MODULE_CONTRACT
//   PURPOSE: Run a capability only through a grant, decoding its input and encoding its output against its contract, and report every outcome as a value.
//   SCOPE: InvocationIssue, InvocationError, InvocationOutcome, InvokeOptions, isGranted and invoke. Out: describing capabilities (describe.ts) and building the model (model.ts).
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DEFINITIONS, M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-INVOKE, V-M-KERNEL-INVOKE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   InvocationIssue - one decoding or encoding issue with its path and message
//   InvocationError - the error of a failed invocation with its tag, message and issues
//   InvocationOutcome - the encoded output of a successful invocation or the error of a failed one
//   InvokeOptions - the Locus id that performs the invocation
//   isGranted - tells whether a Locus may invoke a capability through its own identity or a valid granting relation
//   invoke - runs a capability through the nine ordered checks and returns the outcome as a value
// END_MODULE_MAP

import { Cause, Effect, Exit, Option, Schema, SchemaIssue } from "effect";
import type { Capability } from "./capability";
import { parseCapabilityKey } from "./identity";
import type { SemanticModel } from "./model";
import { CapabilityRef } from "./relation";

export interface InvocationIssue {
  readonly path: ReadonlyArray<PropertyKey>;
  readonly message: string;
}

export interface InvocationError {
  readonly tag: string;
  readonly message: string;
  readonly issues: ReadonlyArray<InvocationIssue>; // [] unless tag is InvalidInput or InvalidOutput
}

export type InvocationOutcome =
  | { readonly ok: true; readonly output: unknown }
  | { readonly ok: false; readonly error: InvocationError };

export interface InvokeOptions {
  readonly via: string; // the Locus id performing the invocation
}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();
type IssueSource = Parameters<typeof formatIssues>[0];

// Converts the standard-schema issues of a decoding or encoding failure into the contract shape.
function issuesOf(issue: IssueSource): ReadonlyArray<InvocationIssue> {
  return formatIssues(issue).issues.map((entry) => ({
    path: (entry.path ?? []).map((p) => (typeof p === "object" ? p.key : p)),
    message: entry.message,
  }));
}

function failure(
  tag: string,
  message: string,
  issues: ReadonlyArray<InvocationIssue> = [],
): InvocationOutcome {
  return { ok: false, error: { tag, message, issues } };
}

// START_CONTRACT: isGranted
//   PURPOSE: Tell whether a Locus may invoke a capability, by being its own Locus or by a valid granting relation.
//   INPUTS: { model: SemanticModel - a built model; ref: CapabilityRef - the capability; via: string - the invoking Locus id }
//   OUTPUTS: { boolean - true when via is the capability Locus or a valid relation from via grants invocation to the capability }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-INVOKE
// END_CONTRACT: isGranted
/** True when `via` may invoke the capability `ref`. */
export function isGranted(
  model: SemanticModel,
  ref: CapabilityRef,
  via: string,
): boolean {
  if (via === ref.locus) return true;
  return model.relations.some(
    (relation) =>
      relation.valid &&
      relation.from === via &&
      relation.type.grantsInvocation &&
      relation.target.locus === ref.locus &&
      relation.target.capability === ref.capability,
  );
}

// START_CONTRACT: invoke
//   PURPOSE: Run a granted capability with decoded input and encoded output, reporting every failure as a tagged value.
//   INPUTS: { model: SemanticModel - a built model; ref: CapabilityRef or string - the capability reference; input: unknown - the raw input; options: InvokeOptions - the invoking Locus id }
//   OUTPUTS: { Effect<InvocationOutcome> - never fails; ok with the encoded output, or an error with its tag, message and issues }
//   SIDE_EFFECTS: Runs the capability handler when the input decodes and the call is granted.
//   LINKS: M-KERNEL-INVOKE
// END_CONTRACT: invoke
/** Runs a capability through the nine ordered checks of the kernel contract. */
export const invoke = (
  model: SemanticModel,
  ref: CapabilityRef | string,
  input: unknown,
  options: InvokeOptions,
): Effect.Effect<InvocationOutcome> =>
  Effect.gen(function* () {
    // Step 1: parse the reference.
    let target: CapabilityRef;
    if (typeof ref === "string") {
      const parsed = ref.includes("#") ? parseCapabilityKey(ref) : null;
      if (parsed === null)
        return failure(
          "CapabilityNotFound",
          `Not a capability reference: ${ref}.`,
        );
      target = CapabilityRef.make(parsed.locus, parsed.capability);
    } else {
      target = ref;
    }
    const label = `${target.locus}#${target.capability}`;

    // Step 2: the Locus must exist.
    const definition = model.loci.get(target.locus)?.definition;
    if (definition === undefined)
      return failure("LocusNotFound", `No Locus ${target.locus} in the model.`);

    // Step 3: the Locus must have the capability.
    if (
      !Object.prototype.hasOwnProperty.call(
        definition.capabilities,
        target.capability,
      )
    )
      return failure(
        "CapabilityNotFound",
        `Locus ${target.locus} has no capability ${target.capability}.`,
      );
    const capability = definition.capabilities[target.capability] as Capability;

    // Step 4: the caller must be granted the invocation.
    if (!isGranted(model, target, options.via))
      return failure(
        "NotGranted",
        `${options.via} is not granted to invoke ${label}.`,
      );

    // Step 5: decode the input with every issue reported.
    const decoded = Schema.decodeUnknownExit(capability.input)(input, {
      errors: "all",
    });
    if (Exit.isFailure(decoded)) {
      const error = Cause.findErrorOption(decoded.cause);
      return failure(
        "InvalidInput",
        `Invalid input for ${label}.`,
        Option.isSome(error) ? issuesOf(error.value.issue) : [],
      );
    }

    // Step 6: the capability needs an implementation.
    if (capability.handler === null)
      return failure("NotImplemented", `${label} has no implementation.`);

    // Step 7: run the handler, mapping declared errors to values and everything else to a defect.
    const handler = capability.handler;
    const exit = yield* Effect.exit(
      Effect.suspend(() => handler(decoded.value)),
    );
    if (Exit.isFailure(exit)) {
      const raised = Cause.findErrorOption(exit.cause);
      if (Option.isSome(raised)) {
        const value = raised.value as {
          readonly _tag: string;
          readonly message: string;
        };
        const declared = capability.errors.some((errorSchema) =>
          Schema.is(errorSchema)(raised.value),
        );
        if (declared) return failure(value._tag, value.message);
      }
      return failure(
        "Defect",
        `${label} failed unexpectedly: ${String(Cause.squash(exit.cause))}.`,
      );
    }

    // Step 8: encode the output against its contract.
    const encoded = Schema.encodeUnknownExit(capability.output)(exit.value, {
      errors: "all",
    });
    if (Exit.isFailure(encoded)) {
      const error = Cause.findErrorOption(encoded.cause);
      return failure(
        "InvalidOutput",
        `${label} returned output that does not match its contract.`,
        Option.isSome(error) ? issuesOf(error.value.issue) : [],
      );
    }

    // Step 9: the encoded output.
    return { ok: true, output: encoded.value };
  });
