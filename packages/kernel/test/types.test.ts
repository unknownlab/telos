import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability } from "../src/capability";
import { Purpose } from "../src/extensions/purpose";
import { Source, SourceDependsOn } from "../src/extensions/source";
import { Locus } from "../src/locus";

class E1 extends Schema.TaggedError<E1>()("E1", { message: Schema.String }) {}
const operands = Schema.Struct({ x: Schema.Finite });

describe("compile-time composition", () => {
  test("a required property is enforced by the type and reported at run time", () => {
    const P = Locus.extend(Purpose);
    // @ts-expect-error purpose is required
    const missing = P.make({ id: "app:c" });
    expect(missing.propertyIssues.length).toBeGreaterThan(0);
    // @ts-expect-error purpose must be a string
    const wrong = P.make({ id: "app:c", properties: { purpose: 1 } });
    expect(wrong.propertyIssues.length).toBeGreaterThan(0);
    const ok = P.make({ id: "app:b", properties: { purpose: "x" } });
    expect(ok.propertyIssues).toEqual([]);
  });

  test("a composed kind requires the properties of every extension", () => {
    const a = Locus.make({ id: "app:a" });
    const PS = Locus.extend(Purpose, Source);
    const d = PS.make({
      id: "app:d",
      properties: { purpose: "x", sources: ["a/**"] },
      relations: [SourceDependsOn.to(a)],
    });
    expect(d.propertyIssues).toEqual([]);
    // @ts-expect-error sources is required
    const noSources = PS.make({ id: "app:d", properties: { purpose: "x" } });
    expect(noSources.propertyIssues.length).toBeGreaterThan(0);
  });

  test("capability names are typed", () => {
    const cap = Capability.make({
      description: "d",
      input: operands,
      output: Schema.Finite,
      errors: [E1],
      effect: "pure",
      handler: ({ x }) =>
        x > 0 ? Effect.succeed(x) : Effect.fail(new E1({ message: "neg" })),
    });
    const c = Locus.make({ id: "app:c", capabilities: { add: cap } });
    expect(c.capability("add").capability).toBe("add");
    // @ts-expect-error sub is not a capability of app:c
    const sub = c.capability("sub");
    expect(sub.capability).toBe("sub");
  });

  test("a handler may fail only with declared errors", () => {
    const cap = Capability.make({
      description: "d",
      input: operands,
      output: Schema.Finite,
      effect: "pure",
      // @ts-expect-error E1 is not declared in errors
      handler: () => Effect.fail(new E1({ message: "m" })),
    });
    expect(cap.errors).toEqual([]);
  });
});
