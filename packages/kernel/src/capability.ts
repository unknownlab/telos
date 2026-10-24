// START_MODULE_CONTRACT
//   PURPOSE: Define capabilities, the named typed operations a Locus offers, and their error tags.
//   SCOPE: The Capability value with its make and declare constructors, the effect classes and errorTag. Out: running handlers and decoding inputs.
//   DEPENDS: none
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   EffectClass - the declared effect class of a capability: pure, read or write
//   ErrorSchema - a tagged error schema with a message field and an identifier
//   Capability - a named typed operation with optional handler
//   errorTag - the tag of an error schema
// END_MODULE_MAP

import type { Effect, Schema } from "effect";

export type EffectClass = "pure" | "read" | "write";

/** A TaggedError class schema with a `message: string` field, e.g. Schema.TaggedError<X>()("X", { message: Schema.String }). */
export type ErrorSchema = Schema.Codec<
  { readonly _tag: string; readonly message: string },
  any
> & { readonly identifier: string };

export interface Capability<I = any, O = any, E = any> {
  readonly _tag: "Capability";
  readonly description: string;
  readonly input: Schema.Codec<I, any>;
  readonly output: Schema.Codec<O, any>;
  readonly errors: ReadonlyArray<ErrorSchema>;
  readonly effect: EffectClass;
  readonly handler: ((input: I) => Effect.Effect<O, E>) | null;
}

// START_CONTRACT: Capability
//   PURPOSE: Build a frozen capability with an implementation (make) or a declared capability without one (declare).
//   INPUTS: { make: { description, input schema, output schema, errors default [], effect class, handler }, declare: { description, input, output, errors default [], effect class } }
//   OUTPUTS: { Capability - frozen capability; declare gives handler null }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Capability
export const Capability = {
  make: <
    I,
    IE,
    O,
    OE,
    const Errs extends ReadonlyArray<ErrorSchema> = readonly [],
  >(options: {
    readonly description: string;
    readonly input: Schema.Codec<I, IE>;
    readonly output: Schema.Codec<O, OE>;
    readonly errors?: Errs;
    readonly effect: EffectClass;
    readonly handler: (input: I) => Effect.Effect<O, Errs[number]["Type"]>;
  }): Capability<I, O, Errs[number]["Type"]> =>
    Object.freeze({
      _tag: "Capability",
      description: options.description,
      input: options.input,
      output: options.output,
      errors: options.errors ?? [],
      effect: options.effect,
      handler: options.handler,
    }),
  /** A declared capability without implementation, used by decodeLocus; handler is null. */
  declare: (options: {
    readonly description: string;
    readonly input: Schema.Codec<any, any>;
    readonly output: Schema.Codec<any, any>;
    readonly errors?: ReadonlyArray<ErrorSchema>;
    readonly effect: EffectClass;
  }): Capability =>
    Object.freeze({
      _tag: "Capability",
      description: options.description,
      input: options.input,
      output: options.output,
      errors: options.errors ?? [],
      effect: options.effect,
      handler: null,
    }),
};

// START_CONTRACT: errorTag
//   PURPOSE: Read the tag that an error schema gives its errors.
//   INPUTS: { schema: ErrorSchema - a tagged error schema }
//   OUTPUTS: { string - the schema identifier, which is the error tag }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: errorTag
export function errorTag(schema: ErrorSchema): string {
  return schema.identifier;
}
