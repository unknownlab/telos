// START_MODULE_CONTRACT
//   PURPOSE: Prove that fields.ts derives input fields from a capability description and coerces text into input values the same way for every interface.
//   SCOPE: Tests of inputFields and coerceInput, including $ref resolution, unsupported types and coercion edge cases. Out: describing capabilities (describe.test.ts) and invocation (invoke.test.ts).
//   DEPENDS: M-KERNEL-DESCRIBE, M-KERNEL-MODEL, M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DESCRIBE, V-M-KERNEL-DESCRIBE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   withInput - builds a capability description carrying only the given input document
//   Num - the input schema of the fixture capability
//   model - the built model holding the fixture capability app:math#double
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability } from "../src/capability";
import {
  describeCapability,
  type CapabilityDescription,
} from "../src/describe";
import { coerceInput, inputFields, type InputField } from "../src/fields";
import { Purpose } from "../src/extensions/purpose";
import { Locus } from "../src/locus";
import { buildModel } from "../src/model";

const Num = Schema.Struct({ n: Schema.Finite });

const model = buildModel(
  Locus.extend(Purpose).make({
    id: "app:math",
    properties: { purpose: "Math." },
    capabilities: {
      double: Capability.make({
        description: "Doubles n.",
        input: Num,
        output: Num,
        effect: "pure",
        handler: ({ n }) => Effect.succeed({ n: n * 2 }),
      }),
    },
  }),
);

function withInput(input: unknown): CapabilityDescription {
  return { input } as unknown as CapabilityDescription;
}

describe("inputFields", () => {
  test("keeps the key order and maps types, required and description", () => {
    const fields = inputFields(
      withInput({
        schema: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "integer", description: "B." },
            c: { type: "array" },
          },
          required: ["a"],
        },
        definitions: {},
      }),
    );
    expect(fields).toEqual([
      { name: "a", type: "number", required: true, description: null },
      { name: "b", type: "integer", required: false, description: "B." },
      { name: "c", type: "unsupported", required: false, description: null },
    ]);
  });

  test("resolves a top-level and a property $ref through definitions", () => {
    const fields = inputFields(
      withInput({
        schema: { $ref: "#/$defs/In" },
        definitions: {
          In: {
            type: "object",
            properties: { s: { $ref: "#/$defs/Str" } },
            required: ["s"],
          },
          Str: { type: "string" },
        },
      }),
    );
    expect(fields).toEqual([
      { name: "s", type: "string", required: true, description: null },
    ]);
  });

  test("a non-object schema gives no fields", () => {
    expect(
      inputFields(withInput({ schema: { type: "number" }, definitions: {} })),
    ).toEqual([]);
  });

  test("a real capability gives its single number field, required", async () => {
    const description = await Effect.runPromise(
      describeCapability(model, "app:math", "double"),
    );
    expect(inputFields(description)).toEqual([
      { name: "n", type: "number", required: true, description: null },
    ]);
  });
});

describe("coerceInput", () => {
  const fields: ReadonlyArray<InputField> = [
    { name: "a", type: "number", required: true, description: null },
    { name: "i", type: "integer", required: false, description: null },
    { name: "f", type: "boolean", required: false, description: null },
    { name: "s", type: "string", required: false, description: null },
  ];

  test("converts each typed field from its text", () => {
    expect(
      coerceInput(fields, { a: "2.5", i: "3", f: "true", s: "x" }),
    ).toEqual({ a: 2.5, i: 3, f: true, s: "x" });
  });

  test("a non-numeric number keeps the raw text", () => {
    expect(coerceInput(fields, { a: "x" })).toEqual({ a: "x" });
  });

  test("an empty number keeps the raw text", () => {
    expect(coerceInput(fields, { a: "" })).toEqual({ a: "" });
  });

  test("surrounding spaces are trimmed before a number is read", () => {
    expect(coerceInput(fields, { a: " 4 " })).toEqual({ a: 4 });
  });

  test("a boolean other than true or false keeps the raw text", () => {
    expect(coerceInput(fields, { f: "yes" })).toEqual({ f: "yes" });
  });

  test("an absent field is omitted from the result", () => {
    const result = coerceInput(fields, { a: "1", i: undefined });
    expect(result).toEqual({ a: 1 });
    expect("i" in result).toBe(false);
  });
});
