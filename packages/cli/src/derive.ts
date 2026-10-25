import { Effect } from "effect";
import {
  CapabilityRef,
  describeCapability,
  inputFields,
  outgoing,
  type CapabilityDescription,
  type InputField,
  type SemanticModel,
} from "@telos/kernel";

export const CLI_EXTENSION_ID = "telos.cli";

export const CLI_COMMAND_TYPE = "cli.command";

export interface DerivedCommand {
  readonly name: string;
  readonly ref: CapabilityRef;
  readonly description: string;
  readonly fields: ReadonlyArray<InputField>;
}

function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export const deriveCommands = (
  model: SemanticModel,
  cliLocusId: string,
): Effect.Effect<ReadonlyArray<DerivedCommand>> =>
  Effect.gen(function* () {
    const locus = model.loci.get(cliLocusId);
    if (
      locus === undefined ||
      !locus.definition.kind.extensions.some((e) => e.id === CLI_EXTENSION_ID)
    )
      return [];
    const exposed = outgoing(model, cliLocusId)
      .filter(
        (relation) =>
          relation.valid &&
          relation.type.id === CLI_COMMAND_TYPE &&
          relation.target.capability !== null,
      )
      .map((relation) => ({
        locus: relation.target.locus,
        capability: relation.target.capability as string,
      }))
      .sort(
        (a, b) =>
          byCodeUnit(a.capability, b.capability) ||
          byCodeUnit(a.locus, b.locus),
      );
    const seen = new Set<string>();
    const commands: DerivedCommand[] = [];
    for (const target of exposed) {
      if (seen.has(target.capability)) continue;
      seen.add(target.capability);
      const description: CapabilityDescription = yield* describeCapability(
        model,
        target.locus,
        target.capability,
      );
      commands.push({
        name: target.capability,
        ref: CapabilityRef.make(target.locus, target.capability),
        description: description.description,
        fields: inputFields(description),
      });
    }
    return commands;
  });
