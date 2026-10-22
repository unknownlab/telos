// START_MODULE_CONTRACT
//   PURPOSE: Prove that the run model derives provenance and staleness from the input, so that a result is never shown as current after its input has changed (INV-013).
//   SCOPE: IDLE, running, done, crashed, provenanceFor and isStale, with the message of a crash taken from Error or from any other value.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   AT - the fixed instant of the run in every case
//   SITE_COMMIT - the site commit of the run in every case
//   PROVENANCE - the browser provenance that a run at AT produced
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { browserProvenance, toHistorical } from "@/lib/provenance";
import {
  crashed,
  done,
  IDLE,
  isStale,
  provenanceFor,
  running,
} from "@/playground/run-state";

const AT = new Date("2026-10-21T10:18:46.123Z");
const SITE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const PROVENANCE = browserProvenance(AT, SITE_COMMIT, {
  "@telos/locus": "0.1.0",
});

describe("provenanceFor", () => {
  test("is null for an idle, a running and a crashed run", () => {
    expect(provenanceFor(IDLE, "x")).toBeNull();
    expect(provenanceFor(running("x"), "x")).toBeNull();
    expect(provenanceFor(crashed("x", new Error("boom")), "x")).toBeNull();
  });

  test("gives the stored browser provenance, the same object, while the input is unchanged", () => {
    const state = done("x", { ok: true }, PROVENANCE);
    expect(provenanceFor(state, "x")).toBe(PROVENANCE);
  });

  test("gives the historical form, with the same instant, once the input differs", () => {
    const state = done("x", { ok: true }, PROVENANCE);
    const stale = provenanceFor(state, "y");
    expect(stale).toEqual(toHistorical(PROVENANCE));
    expect(stale?.origin).toBe("historical");
    expect(stale?.at).toBe(PROVENANCE.at);
  });

  test("gives the browser provenance again when the exact text is restored", () => {
    const state = done("x", { ok: true }, PROVENANCE);
    expect(provenanceFor(state, "y")?.origin).toBe("historical");
    expect(provenanceFor(state, "x")).toBe(PROVENANCE);
  });
});

describe("isStale", () => {
  test("is false for an idle run", () => {
    expect(isStale(IDLE, "x")).toBe(false);
  });

  test("is true only for a done run whose input differs", () => {
    const state = done("x", 1, PROVENANCE);
    expect(isStale(state, "x")).toBe(false);
    expect(isStale(state, "y")).toBe(true);
    expect(isStale(running("x"), "y")).toBe(false);
    expect(isStale(crashed("x", new Error("boom")), "y")).toBe(false);
  });
});

describe("crashed", () => {
  test("takes the message of an Error", () => {
    expect(crashed("x", new Error("boom")).status).toBe("crashed");
    const state = crashed("x", new Error("boom"));
    if (state.status !== "crashed") throw new Error("expected a crashed run");
    expect(state.message).toBe("boom");
  });

  test("takes the string form of any other value", () => {
    const state = crashed("x", 7);
    if (state.status !== "crashed") throw new Error("expected a crashed run");
    expect(state.message).toBe("7");
  });
});
