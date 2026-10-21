// START_MODULE_CONTRACT
//   PURPOSE: Refuse to run the toolchain on a Bun older than engines.bun in package.json.
//   SCOPE: Compare Bun.version with the engines.bun minimum; print one fix-it line and exit 1 when unsupported.
//   DEPENDS: none
//   LINKS: M-BUN-VERSION-GUARD, V-M-BUN-VERSION-GUARD
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   isSupported - true when a Bun version is at or above a ">=<version>" minimum
// END_MODULE_MAP

import pkg from "../package.json";

// START_CONTRACT: isSupported
//   PURPOSE: Decide whether a Bun version meets a ">=<version>" minimum, prereleases included.
//   INPUTS: { actual: string - a Bun version such as Bun.version, required: string - engines.bun such as ">=1.4.4-canary.1" }
//   OUTPUTS: { boolean - true when actual is at or above the minimum }
//   SIDE_EFFECTS: none
//   LINKS: M-BUN-VERSION-GUARD
// END_CONTRACT: isSupported
export function isSupported(actual: string, required: string): boolean {
  return Bun.semver.order(actual, required.replace(/^>=/, "")) >= 0;
}

if (import.meta.main) {
  // START_BLOCK_READ_MINIMUM
  const required: unknown = pkg.engines?.bun;
  if (typeof required !== "string" || !required.startsWith(">=")) {
    console.error('package.json engines.bun must be ">=<version>"');
    process.exit(1);
  }
  // END_BLOCK_READ_MINIMUM

  // START_BLOCK_ENFORCE_MINIMUM
  if (!isSupported(Bun.version, required)) {
    console.error(
      `Bun ${required} required, found ${Bun.version}. Run: bun upgrade --canary`,
    );
    process.exit(1);
  }
  // END_BLOCK_ENFORCE_MINIMUM
}
