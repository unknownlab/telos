import type { Effect, Schema } from "effect";

export type EffectClass = "pure" | "read" | "write";

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

export function errorTag(schema: ErrorSchema): string {
  return schema.identifier;
}
