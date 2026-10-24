// START_MODULE_CONTRACT
//   PURPOSE: Prove that the two built-in extension files define their ids, descriptions, properties and relation types as specified.
//   SCOPE: Tests of extensions/purpose.ts and extensions/source.ts only. Out: composition rules, which locus.test.ts covers.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   (none) - no local helpers
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Locus } from "../src/locus";
import { Purpose } from "../src/extensions/purpose";
import { External, Source, SourceDependsOn } from "../src/extensions/source";

describe("Purpose extension", () => {
  test("has the id telos.purpose and the specified description", () => {
    expect(Purpose.id).toBe("telos.purpose");
    expect(Purpose.description).toBe(
      "States why a Locus exists, what it is responsible for and what it explicitly excludes.",
    );
  });

  test("responsibilities and excluded are optional", () => {
    const locus = Locus.extend(Purpose).make({
      id: "app:a",
      properties: { purpose: "p" },
    });
    expect(locus.propertyIssues).toEqual([]);
  });
});

describe("Source extension", () => {
  test("has the id telos.source and declares SourceDependsOn", () => {
    expect(Source.id).toBe("telos.source");
    expect(Source.relationTypes.length).toBe(1);
    expect(Source.relationTypes[0]).toBe(SourceDependsOn);
  });
});

describe("SourceDependsOn relation type", () => {
  test("has the id source.depends-on, locus target, and no acyclic or invocation flags", () => {
    expect(SourceDependsOn.id).toBe("source.depends-on");
    expect(SourceDependsOn.target).toBe("locus");
    expect(SourceDependsOn.acyclic).toBe(false);
    expect(SourceDependsOn.grantsInvocation).toBe(false);
  });
});

describe("External extension", () => {
  test("has the id telos.external", () => {
    expect(External.id).toBe("telos.external");
  });

  test("a Locus that extends External without packages has a property issue", () => {
    const noPackages = Locus.extend(External).make({
      id: "app:e",
      // @ts-expect-error packages is required
      properties: {},
    });
    expect(noPackages.propertyIssues.length).toBeGreaterThan(0);
  });
});
