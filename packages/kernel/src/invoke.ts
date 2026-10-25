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
  readonly issues: ReadonlyArray<InvocationIssue>;
}

export type InvocationOutcome =
  | { readonly ok: true; readonly output: unknown }
  | { readonly ok: false; readonly error: InvocationError };

export interface InvokeOptions {
  readonly via: string;
}

const formatIssues = SchemaIssue.makeFormatterStandardSchemaV1();
type IssueSource = Parameters<typeof formatIssues>[0];

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

export const invoke = (
  model: SemanticModel,
  ref: CapabilityRef | string,
  input: unknown,
  options: InvokeOptions,
): Effect.Effect<InvocationOutcome> =>
  Effect.gen(function* () {
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

    const definition = model.loci.get(target.locus)?.definition;
    if (definition === undefined)
      return failure("LocusNotFound", `No Locus ${target.locus} in the model.`);

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

    if (!isGranted(model, target, options.via))
      return failure(
        "NotGranted",
        `${options.via} is not granted to invoke ${label}.`,
      );

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

    if (capability.handler === null)
      return failure("NotImplemented", `${label} has no implementation.`);

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

    return { ok: true, output: encoded.value };
  });
