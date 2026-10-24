// START_MODULE_CONTRACT
//   PURPOSE: Define Archetypes, the named rule sets that apply to Loci of given extensions, and the RuleViolation failure.
//   SCOPE: RuleViolation, Rule and Archetype values and the violation helper. Out: applying rules to a model (verify work package).
//   DEPENDS: none
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RuleViolation - the tagged failure a rule reports with a message
//   RuleMethod - whether a rule is checked statically or during execution
//   RuleContext - the Locus and the whole model a rule is applied to
//   Rule - one check of an Archetype with an id, a method and a check
//   Archetype - a named set of rules that applies to Loci of given extensions
//   violation - an Effect that fails with a RuleViolation carrying the message
// END_MODULE_MAP

import { Effect, Schema } from "effect";
import type { LocusDefinition } from "./locus";
import type { SemanticModel } from "./model";

// START_CONTRACT: RuleViolation
//   PURPOSE: Report that a Locus breaks a rule, with a human message.
//   INPUTS: { message: string - what the rule found }
//   OUTPUTS: { RuleViolation - tagged error with _tag RuleViolation }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: RuleViolation
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

// START_CONTRACT: Rule
//   PURPOSE: Build a frozen rule from its fields.
//   INPUTS: { rule: Rule - id, description, method, check }
//   OUTPUTS: { Rule - frozen copy of the rule }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Rule
export const Rule = {
  make: (rule: Rule): Rule => Object.freeze({ ...rule }),
};

// START_CONTRACT: Archetype
//   PURPOSE: Build a frozen archetype with the _tag Archetype.
//   INPUTS: { options: { id, description, appliesTo, rules } }
//   OUTPUTS: { Archetype - frozen archetype }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Archetype
export const Archetype = {
  make: (options: Omit<Archetype, "_tag">): Archetype =>
    Object.freeze({ _tag: "Archetype", ...options }),
};

// START_CONTRACT: violation
//   PURPOSE: Fail a rule check with a RuleViolation carrying the message.
//   INPUTS: { message: string - what the rule found }
//   OUTPUTS: { Effect<never, RuleViolation> - an Effect that fails with the violation }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: violation
export const violation = (
  message: string,
): Effect.Effect<never, RuleViolation> =>
  Effect.fail(new RuleViolation({ message }));
