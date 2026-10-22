// START_MODULE_CONTRACT
//   PURPOSE: Record the golden Revision ids of every revision-compare fixture, computed outside this code, so that the Bun and browser determinism checks compare against fixed values.
//   SCOPE: The revisionGoldens value only. Out: computing Revision ids (the @telos/locus createRevision) and the fixtures themselves (catalogue.ts).
//   DEPENDS: none
//   LINKS: M-LOCUS-SPECS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   revisionGoldens - golden Revision ids keyed by "<record id>.a" and "<record id>.b"
// END_MODULE_MAP

// START_CONTRACT: revisionGoldens
//   PURPOSE: Hold the expected Revision id of each side of each revision-compare fixture.
//   INPUTS: none
//   OUTPUTS: { Readonly<Record<string, sha256:...>> - keys "<LOC id>.a" and "<LOC id>.b" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: revisionGoldens
/**
 * Revision ids of every revision-compare fixture, computed independently of this code with
 * `shasum -a 256` over the canonical form (version 1). If a value does not match, compare the
 * fixture with the WP08 prompt before changing anything here.
 */
export const revisionGoldens: Readonly<Record<string, `sha256:${string}`>> = {
  "LOC-008.a":
    "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-008.b":
    "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-009.a":
    "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6",
  "LOC-009.b":
    "sha256:a7ab044ffa34fd3a0e5e2e044da0f49c7757c1e3cabc276173f18c698ddfe20b",
  "LOC-034.a":
    "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "LOC-034.b":
    "sha256:24a275d3475216e097ad87a14041b78d8bd8e2cb1c97029f03d5e7cfcd49ef75",
  "LOC-039.a":
    "sha256:8a9333897e78439849c9d89b9f873187b2045c9e646a00633bf48c7981f9c4bd",
  "LOC-039.b":
    "sha256:8a9333897e78439849c9d89b9f873187b2045c9e646a00633bf48c7981f9c4bd",
};
