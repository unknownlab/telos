// START_MODULE_CONTRACT
//   PURPOSE: Prove that the provenance model gives one label text per origin, always in UTC, and that a result which did not run is never labelled as run.
//   SCOPE: PACKAGE_VERSIONS against the two package.json files, formatInstant, shortCommit, siteCommitOf, provenanceText for the five rows, browserProvenance and toHistorical.
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   INSTANT - the fixed ISO instant that the label cases use
//   HEX40 - a 40-character lower-case hex commit that the label cases use
//   PACKAGES - the package versions that the label cases use
//   readPackageVersion - the version field of a package.json in the repository
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import {
  CI_PROVENANCE,
  PACKAGE_VERSIONS,
  type BrowserProvenance,
  type BunBuildProvenance,
  browserProvenance,
  formatInstant,
  provenanceText,
  shortCommit,
  siteCommitOf,
  toHistorical,
} from "../src/lib/provenance";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const INSTANT = "2026-10-21T10:18:46.123Z";
const HEX40 = "0123456789abcdef0123456789abcdef01234567";
const PACKAGES = { "@telos/locus": "0.1.0", "@telos/locus-specs": "0.1.0" };

async function readPackageVersion(relative: string): Promise<string> {
  const json = (await Bun.file(resolve(REPO_ROOT, relative)).json()) as {
    version: string;
  };
  return json.version;
}

describe("PACKAGE_VERSIONS", () => {
  test("equals the version fields of the two workspace packages", async () => {
    expect(PACKAGE_VERSIONS).toEqual({
      "@telos/locus": await readPackageVersion("packages/locus/package.json"),
      "@telos/locus-specs": await readPackageVersion(
        "packages/locus-specs/package.json",
      ),
    });
  });
});

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

describe("siteCommitOf", () => {
  test("is unknown when there is no build info", () => {
    expect(siteCommitOf(null)).toBe("unknown");
  });

  test("is the commit when the tree is clean", () => {
    expect(siteCommitOf({ commit: "abc", dirty: false })).toBe("abc");
  });

  test("appends -dirty when the tree has changes", () => {
    expect(siteCommitOf({ commit: "abc", dirty: true })).toBe("abc-dirty");
  });
});

describe("provenanceText", () => {
  const browser: BrowserProvenance = {
    origin: "browser",
    at: INSTANT,
    packages: PACKAGES,
    siteCommit: HEX40,
  };

  function buildOf(dirty: boolean): BunBuildProvenance {
    return {
      origin: "bun-build",
      at: INSTANT,
      runtime: "Bun 1.4.4",
      packages: PACKAGES,
      commit: HEX40,
      dirty,
    };
  }

  test("browser: the run time, the packages and the site commit", () => {
    expect(provenanceText(browser)).toBe(
      "Run in this browser at 2026-10-21 10:18:46 UTC · @telos/locus 0.1.0 · @telos/locus-specs 0.1.0 · site commit 0123456",
    );
  });

  test("bun-build, clean: the runtime, the build time and the commit", () => {
    expect(provenanceText(buildOf(false))).toBe(
      "Run by Bun 1.4.4 at build time, 2026-10-21 10:18:46 UTC · commit 0123456 · @telos/locus 0.1.0 · @telos/locus-specs 0.1.0",
    );
  });

  test("bun-build, dirty: the commit is followed by the uncommitted changes note", () => {
    expect(provenanceText(buildOf(true))).toBe(
      "Run by Bun 1.4.4 at build time, 2026-10-21 10:18:46 UTC · commit 0123456 (uncommitted changes) · @telos/locus 0.1.0 · @telos/locus-specs 0.1.0",
    );
  });

  test("ci: the fixed text that says there is no CI result", () => {
    expect(provenanceText(CI_PROVENANCE)).toBe("CI: not available");
  });

  test("historical: the stale run, with the note that the input has changed", () => {
    expect(provenanceText(toHistorical(browser))).toBe(
      "Historical: run in this browser at 2026-10-21 10:18:46 UTC · @telos/locus 0.1.0 · @telos/locus-specs 0.1.0 · site commit 0123456. The input has changed since this run.",
    );
  });

  test("null: Not run, never a pass count", () => {
    expect(provenanceText(null)).toBe("Not run");
  });
});

describe("browserProvenance and toHistorical", () => {
  test("browserProvenance records the instant, the packages and the site commit", () => {
    expect(
      browserProvenance(new Date(INSTANT), "abc", PACKAGE_VERSIONS),
    ).toEqual({
      origin: "browser",
      at: INSTANT,
      packages: PACKAGE_VERSIONS,
      siteCommit: "abc",
    });
  });

  test("toHistorical keeps the run and changes only the origin", () => {
    const run = browserProvenance(new Date(INSTANT), "abc", PACKAGE_VERSIONS);
    expect(toHistorical(run)).toEqual({
      origin: "historical",
      at: INSTANT,
      packages: PACKAGE_VERSIONS,
      siteCommit: "abc",
    });
  });
});
