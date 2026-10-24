// START_MODULE_CONTRACT
//   PURPOSE: Prove that digestOf gives the SHA-256 digest of canonical JSON, independent of key order.
//   SCOPE: Tests of digest.ts only. Out: canonical JSON rules (canonical.test.ts).
//   DEPENDS: M-KERNEL-CANONICAL
//   LINKS: M-KERNEL-CANONICAL, V-M-KERNEL-CANONICAL
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { digestOf } from "../src/digest";

describe("digestOf", () => {
  test("equals the SHA-256 of the canonical JSON of the value", async () => {
    expect(await Effect.runPromise(digestOf({ a: 1 }))).toBe(
      "sha256:015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862",
    );
  });

  test("is the same for the same members in a different key order", async () => {
    expect(await Effect.runPromise(digestOf({ a: 1, b: 2 }))).toBe(
      await Effect.runPromise(digestOf({ b: 2, a: 1 })),
    );
  });

  test("differs for a different value", async () => {
    expect(await Effect.runPromise(digestOf({ a: 1 }))).not.toBe(
      await Effect.runPromise(digestOf({ a: 2 })),
    );
  });

  test("always has the form sha256 followed by 64 lowercase hex digits", async () => {
    for (const value of [{ a: 1 }, [1, 2], "text", null]) {
      expect(await Effect.runPromise(digestOf(value))).toMatch(
        /^sha256:[0-9a-f]{64}$/,
      );
    }
  });
});
