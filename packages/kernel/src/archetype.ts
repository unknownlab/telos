import { Effect, Schema } from "effect";
import type { LocusDefinition } from "./locus";
import type { SemanticModel } from "./model";

export class RuleViolation extends Schema.TaggedError<RuleViolation>()(
  "RuleViolation",
  { message: Schema.String },
) {}

export type RuleMethod = "static" | "execution";

export interface RuleContext {
  readonly locus: LocusDefinition;
  readonly model: SemanticModel;
}

export interface Rule {
  readonly id: string;
  readonly description: string;
  readonly method: RuleMethod;
  readonly check: (ctx: RuleContext) => Effect.Effect<void, RuleViolation>;
}

export interface Archetype {
  readonly _tag: "Archetype";
  readonly id: string;
  readonly description: string;
  readonly appliesTo: ReadonlyArray<string>;
  readonly rules: ReadonlyArray<Rule>;
}

export const Rule = {
  make: (rule: Rule): Rule => Object.freeze({ ...rule }),
};

export const Archetype = {
  make: (options: Omit<Archetype, "_tag">): Archetype =>
    Object.freeze({ _tag: "Archetype", ...options }),
};

export const violation = (
  message: string,
): Effect.Effect<never, RuleViolation> =>
  Effect.fail(new RuleViolation({ message }));
