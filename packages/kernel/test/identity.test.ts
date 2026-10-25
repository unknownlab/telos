import { describe, expect, test } from "bun:test";
import {
  capabilityKey,
  isCapabilityName,
  isExtensionId,
  isLocusId,
  parseCapabilityKey,
} from "../src/identity";

describe("isLocusId", () => {
  test("accepts well-formed Locus ids", () => {
    expect(isLocusId("telos:kernel")).toBe(true);
    expect(isLocusId("calculator:arithmetic")).toBe(true);
    expect(isLocusId("a1:b-2")).toBe(true);
  });

  test("rejects uppercase, missing parts, extra colons and bad hyphens", () => {
    expect(isLocusId("Telos:kernel")).toBe(false);
    expect(isLocusId("telos")).toBe(false);
    expect(isLocusId("telos:")).toBe(false);
    expect(isLocusId("telos:kernel:x")).toBe(false);
    expect(isLocusId("telos:-x")).toBe(false);
    expect(isLocusId("telos:x--y")).toBe(false);
    expect(isLocusId("telos: kernel")).toBe(false);
  });

  test("rejects an id of 129 characters (length limit 128)", () => {
    const longId = `telos:${"a".repeat(123)}`;
    expect(longId.length).toBe(129);
    expect(isLocusId(longId)).toBe(false);
  });
});

describe("isExtensionId", () => {
  test("accepts dotted and plain extension ids", () => {
    expect(isExtensionId("telos.purpose")).toBe(true);
    expect(isExtensionId("calculator.arithmetic-behavior")).toBe(true);
    expect(isExtensionId("demo")).toBe(true);
  });

  test("rejects uppercase, empty segments, trailing dots and colons", () => {
    expect(isExtensionId("Telos.purpose")).toBe(false);
    expect(isExtensionId("telos..purpose")).toBe(false);
    expect(isExtensionId("telos.purpose.")).toBe(false);
    expect(isExtensionId("telos:purpose")).toBe(false);
  });
});

describe("isCapabilityName", () => {
  test("accepts camelCase names", () => {
    expect(isCapabilityName("add")).toBe(true);
    expect(isCapabilityName("divideBy2")).toBe(true);
  });

  test("rejects uppercase start, hyphens, leading digits, empty and too long names", () => {
    expect(isCapabilityName("Add")).toBe(false);
    expect(isCapabilityName("add-x")).toBe(false);
    expect(isCapabilityName("2add")).toBe(false);
    expect(isCapabilityName("")).toBe(false);
    expect(isCapabilityName("a".repeat(65))).toBe(false);
  });

  test("accepts a name of exactly 64 characters (length limit 64)", () => {
    expect(isCapabilityName("a".repeat(64))).toBe(true);
  });
});

describe("capabilityKey and parseCapabilityKey", () => {
  test("capabilityKey joins the Locus id and the capability with a hash", () => {
    expect(capabilityKey("calculator:arithmetic", "add")).toBe(
      "calculator:arithmetic#add",
    );
  });

  test("parseCapabilityKey returns the Locus id and the capability of a key", () => {
    expect(parseCapabilityKey("calculator:arithmetic#add")).toEqual({
      locus: "calculator:arithmetic",
      capability: "add",
    });
  });

  test("parseCapabilityKey splits at the last hash", () => {
    expect(parseCapabilityKey("a#b#c")).toEqual({
      locus: "a#b",
      capability: "c",
    });
  });

  test("parseCapabilityKey returns null when there is no hash or a side is empty", () => {
    expect(parseCapabilityKey("nohash")).toBeNull();
    expect(parseCapabilityKey("#add")).toBeNull();
    expect(parseCapabilityKey("x:y#")).toBeNull();
  });
});
