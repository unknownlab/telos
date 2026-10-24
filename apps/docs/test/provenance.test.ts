// START_MODULE_CONTRACT
//   PURPOSE: Prove that the build provenance gives one label text, always in UTC, that a missing report is never labelled as run, and that the commit and dirty flag come from the build info.
//   SCOPE: formatInstant, shortCommit, buildProvenanceOf and provenanceText for the bun-build origin and for null.
//   DEPENDS: M-DOCS-SITE
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   INSTANT - the fixed ISO instant that the label cases use
//   HEX40 - a 40-character lower-case hex commit that the label cases use
//   REPORT - a semantic report provenance block that the label cases use
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import {
  buildProvenanceOf,
  formatInstant,
  provenanceText,
  shortCommit,
} from "../src/lib/provenance";

const INSTANT = "2026-10-22T10:00:00.000Z";
const HEX40 = "0123456789abcdef0123456789abcdef01234567";
const REPORT = {
  provenance: { runner: "bun 1.4.4", generatedAt: INSTANT, commit: HEX40 },
};

describe("formatInstant", () => {
  test("writes an ISO instant as a UTC date and time, with or without milliseconds", () => {
    expect(formatInstant("2026-10-21T10:18:46.123Z")).toBe(
      "2026-10-21 10:18:46 UTC",
    );
    expect(formatInstant("2026-10-21T10:18:46Z")).toBe(
      "2026-10-21 10:18:46 UTC",
    );
  });

  test("returns input that is not an ISO instant unchanged", () => {
    expect(formatInstant("yesterday")).toBe("yesterday");
  });
});

describe("shortCommit", () => {
  test("keeps the first 7 characters of a 40-character sha", () => {
    expect(shortCommit(HEX40)).toBe("0123456");
  });

  test("keeps a -dirty suffix after the 7 characters", () => {
    expect(shortCommit(`${HEX40}-dirty`)).toBe("0123456-dirty");
  });

  test("returns anything else unchanged", () => {
    expect(shortCommit("unknown")).toBe("unknown");
  });
});

describe("buildProvenanceOf", () => {
  test("a null report has no provenance", () => {
    expect(buildProvenanceOf(null, { dirty: true })).toBeNull();
  });

  test("the dirty flag comes from the build info", () => {
    expect(buildProvenanceOf(REPORT, { dirty: true })?.dirty).toBe(true);
  });

  test("without build info the tree is taken as clean", () => {
    expect(buildProvenanceOf(REPORT, null)).toEqual({
      origin: "bun-build",
      runner: "bun 1.4.4",
      generatedAt: INSTANT,
      commit: HEX40,
      dirty: false,
    });
  });
});

describe("provenanceText", () => {
  test("null reads Not run", () => {
    expect(provenanceText(null)).toBe("Not run");
  });

  test("a clean build names the runner, the UTC time and the short commit", () => {
    const provenance = buildProvenanceOf(REPORT, { dirty: false });
    expect(provenanceText(provenance)).toBe(
      "Run by bun 1.4.4 at build time, 2026-10-22 10:00:00 UTC · commit 0123456",
    );
  });

  test("a dirty build adds the uncommitted changes note", () => {
    const provenance = buildProvenanceOf(REPORT, { dirty: true });
    expect(provenanceText(provenance)).toBe(
      "Run by bun 1.4.4 at build time, 2026-10-22 10:00:00 UTC · commit 0123456 (uncommitted changes)",
    );
  });

  test("a null commit reads commit unknown", () => {
    const provenance = buildProvenanceOf(
      {
        provenance: { runner: "bun 1.4.4", generatedAt: INSTANT, commit: null },
      },
      { dirty: false },
    );
    expect(provenanceText(provenance)).toContain("commit unknown");
  });
});
