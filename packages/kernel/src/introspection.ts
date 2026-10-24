// START_MODULE_CONTRACT
//   PURPOSE: Give agents and tools one Effect service that resolves Loci, describes, verifies, impacts and invokes through the kernel with typed failures for unknown ids and capabilities.
//   SCOPE: LocusNotFound, CapabilityNotFound, LocusView, TelosApi and the Telos service with its make and layer. Out: the model rules, the verification rules and the invocation checks, which their own modules own.
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DESCRIBE, M-KERNEL-VERIFY, M-KERNEL-INVOKE, M-KERNEL-IMPACT, M-KERNEL-DEFINITIONS, M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-INTROSPECTION, V-M-KERNEL-INTROSPECTION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   LocusNotFound - typed failure for a Locus id that is not in the model
//   CapabilityNotFound - typed failure for a capability that the named Locus does not have
//   LocusView - one Locus of the model with its description, verifications and the latest report state
//   TelosApi - the service surface of the kernel for agents and tools
//   Telos - the Effect service that builds the model of a root Locus and serves TelosApi
// END_MODULE_MAP

import { Context, Effect, Layer, Ref, Schema } from "effect";
import {
  describeLocus,
  describeModel,
  describeVerifications,
  type CapabilityDescription,
  type LocusDescription,
  type ModelDescription,
  type VerificationDescription,
} from "./describe";
import type { Diagnostic } from "./diagnostic";
import { impact as computeImpact, type ImpactReport } from "./impact";
import { parseCapabilityKey } from "./identity";
import { invoke, type InvocationOutcome, type InvokeOptions } from "./invoke";
import type { LocusDefinition } from "./locus";
import { buildModel, type SemanticModel } from "./model";
import type { CapabilityRef } from "./relation";
import { verify, type VerificationReport, type VerifyOptions } from "./verify";

export class LocusNotFound extends Schema.TaggedError<LocusNotFound>()(
  "LocusNotFound",
  { id: Schema.String, message: Schema.String },
) {}

export class CapabilityNotFound extends Schema.TaggedError<CapabilityNotFound>()(
  "CapabilityNotFound",
  { ref: Schema.String, message: Schema.String },
) {}

export interface LocusView {
  readonly id: string;
  readonly inspect: () => Effect.Effect<LocusDescription>;
  readonly relations: () => Effect.Effect<LocusDescription["relations"]>;
  readonly capabilities: () => Effect.Effect<
    ReadonlyArray<CapabilityDescription>
  >;
  readonly verifications: () => Effect.Effect<
    ReadonlyArray<VerificationDescription>
  >; // uses the latest report of this service, else not-run
}

export interface TelosApi {
  readonly model: SemanticModel;
  readonly loci: () => Effect.Effect<ReadonlyArray<string>>;
  readonly resolve: (id: string) => Effect.Effect<LocusView, LocusNotFound>;
  readonly describe: () => Effect.Effect<ModelDescription>;
  readonly diagnostics: () => Effect.Effect<ReadonlyArray<Diagnostic>>;
  readonly verify: (
    options: VerifyOptions,
  ) => Effect.Effect<VerificationReport>; // also stores it as the latest report
  readonly impact: (
    target: string,
  ) => Effect.Effect<ImpactReport, LocusNotFound | CapabilityNotFound>;
  readonly invoke: (
    ref: CapabilityRef | string,
    input: unknown,
    options: InvokeOptions,
  ) => Effect.Effect<InvocationOutcome>;
}

function locusNotFound(id: string): LocusNotFound {
  return new LocusNotFound({ id, message: `No Locus ${id} in the model.` });
}

// START_CONTRACT: Telos
//   PURPOSE: The single Effect service through which agents and tools use a Locus tree.
//   INPUTS: { root: LocusDefinition - the root Locus of the tree, given to make or layer }
//   OUTPUTS: { Telos service with make: Effect of TelosApi and layer: Layer providing Telos }
//   SIDE_EFFECTS: none; the latest verification report lives in a Ref of the built service
//   LINKS: M-KERNEL-INTROSPECTION
// END_CONTRACT: Telos
export class Telos extends Context.Service<Telos, TelosApi>()(
  "@telos/kernel/Telos",
) {
  static readonly make = (root: LocusDefinition): Effect.Effect<TelosApi> =>
    Effect.gen(function* () {
      const model = buildModel(root);
      const latest = yield* Ref.make<VerificationReport | null>(null);

      const viewOf = (id: string): LocusView => ({
        id,
        inspect: () => describeLocus(model, id),
        relations: () =>
          Effect.map(describeLocus(model, id), (d) => d.relations),
        capabilities: () =>
          Effect.map(describeLocus(model, id), (d) => d.capabilities),
        verifications: () =>
          Effect.map(Ref.get(latest), (report) =>
            describeVerifications(model, id, report),
          ),
      });

      const impactOf = (
        target: string,
      ): Effect.Effect<ImpactReport, LocusNotFound | CapabilityNotFound> => {
        if (!target.includes("#")) {
          return model.loci.has(target)
            ? Effect.succeed(computeImpact(model, target))
            : Effect.fail(locusNotFound(target));
        }
        const parsed = parseCapabilityKey(target);
        if (parsed === null) return Effect.fail(locusNotFound(target));
        const definition = model.loci.get(parsed.locus)?.definition;
        if (definition === undefined) {
          return Effect.fail(locusNotFound(parsed.locus));
        }
        if (
          !Object.prototype.hasOwnProperty.call(
            definition.capabilities,
            parsed.capability,
          )
        ) {
          return Effect.fail(
            new CapabilityNotFound({
              ref: target,
              message: `Locus ${parsed.locus} has no capability ${parsed.capability}.`,
            }),
          );
        }
        return Effect.succeed(computeImpact(model, target));
      };

      return {
        model,
        loci: () => Effect.succeed(model.ids),
        resolve: (id) =>
          model.loci.has(id)
            ? Effect.succeed(viewOf(id))
            : Effect.fail(locusNotFound(id)),
        describe: () => describeModel(model),
        diagnostics: () => Effect.succeed(model.diagnostics),
        verify: (options) =>
          Effect.gen(function* () {
            const report = yield* verify(model, options);
            yield* Ref.set(latest, report);
            return report;
          }),
        impact: impactOf,
        invoke: (ref, input, options) => invoke(model, ref, input, options),
      };
    });

  static readonly layer = (root: LocusDefinition): Layer.Layer<Telos> =>
    Layer.effect(Telos, Telos.make(root));
}
