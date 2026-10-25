import { expect, test } from "bun:test";
import { isSupported } from "./check-bun-version";

const MINIMUM = ">=1.4.4-canary.1";

test.each([
  ["1.4.3", false],
  ["1.4.4-canary.1", true],
  ["1.4.4-canary.7", true],
  ["1.4.4", true],
  ["1.4.5-canary.1", true],
  ["1.5.0", true],
] as const)(
  "Bun %s against >=1.4.4-canary.1 is supported: %p",
  (version, expected) => {
    expect(isSupported(version, MINIMUM)).toBe(expected);
  },
);
