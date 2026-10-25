import { describe, expect, test } from "bun:test";
import { Schema } from "effect";
import { deepFreeze } from "../src/freeze";

describe("deepFreeze", () => {
  test("freezes a nested plain object and array at every level and returns the same reference", () => {
    const value = { a: { b: [1, { c: 2 }] } };
    const result = deepFreeze(value);
    expect(result).toBe(value);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.a)).toBe(true);
    expect(Object.isFrozen(value.a.b)).toBe(true);
    expect(Object.isFrozen(value.a.b[1])).toBe(true);
  });

  test("leaves an Effect Schema (an object with an ast property) unfrozen inside a frozen object", () => {
    const schema = Schema.Struct({ a: Schema.String });
    expect("ast" in schema).toBe(true);
    const holder = { schema, plain: { x: 1 } };
    deepFreeze(holder);
    expect(Object.isFrozen(holder)).toBe(true);
    expect(Object.isFrozen(schema)).toBe(false);
  });

  test("leaves a function value inside the object unfrozen", () => {
    const fn = () => 1;
    const holder = { fn, data: { x: 1 } };
    deepFreeze(holder);
    expect(Object.isFrozen(holder)).toBe(true);
    expect(Object.isFrozen(fn)).toBe(false);
  });
});
