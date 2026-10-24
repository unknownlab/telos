// START_MODULE_CONTRACT
//   PURPOSE: Prove that capabilities keep their declared parts, default their errors and expose the error tag.
//   SCOPE: Tests of capability.ts only. Out: running handlers and decoding inputs.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   E1 - a tagged error schema used as a declared capability error
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability, errorTag } from "../src/capability";

class E1 extends Schema.TaggedError<E1>()("E1", {
  message: Schema.String,
}) {}

describe("Capability.make", () => {
  test("keeps description, input, output, effect and handler, and is frozen", () => {
    const handler = (x: number) => Effect.succeed(x);
    const cap = Capability.make({
      description: "d",
      input: Schema.Finite,
      output: Schema.Finite,
      effect: "pure",
      handler,
    });
    expect(cap._tag).toBe("Capability");
    expect(cap.description).toBe("d");
    expect(cap.input).toBe(Schema.Finite);
    expect(cap.output).toBe(Schema.Finite);
    expect(cap.effect).toBe("pure");
    expect(cap.handler).toBe(handler);
    expect(Object.isFrozen(cap)).toBe(true);
  });

  test("defaults errors to an empty array", () => {
    const cap = Capability.make({
      description: "d",
      input: Schema.Finite,
      output: Schema.Finite,
      effect: "read",
      handler: (x: number) => Effect.succeed(x),
    });
    expect(cap.errors).toEqual([]);
  });

  test("keeps the declared error schemas", () => {
    const cap = Capability.make({
      description: "d",
      input: Schema.Finite,
      output: Schema.Finite,
      errors: [E1],
      effect: "write",
      handler: (x: number) =>
        x > 0 ? Effect.succeed(x) : Effect.fail(new E1({ message: "neg" })),
    });
    expect(cap.errors).toEqual([E1]);
  });
});

describe("Capability.declare", () => {
  test("gives a capability with a null handler", () => {
    const cap = Capability.declare({
      description: "d",
      input: Schema.Finite,
      output: Schema.Finite,
      effect: "pure",
    });
    expect(cap.handler).toBeNull();
    expect(cap.errors).toEqual([]);
    expect(cap._tag).toBe("Capability");
  });
});

describe("errorTag", () => {
  test("is the tag of a tagged error schema", () => {
    expect(errorTag(E1)).toBe("E1");
  });
});
