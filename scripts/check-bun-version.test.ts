// START_MODULE_CONTRACT
//   PURPOSE: Prove the version guard accepts every Bun at or above the minimum and rejects older ones.
//   SCOPE: Table test of isSupported against ">=1.4.4-canary.1".
//   DEPENDS: M-BUN-VERSION-GUARD
//   LINKS: V-M-BUN-VERSION-GUARD
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MINIMUM - the engines.bun value the table is checked against
// END_MODULE_MAP

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
