// START_MODULE_CONTRACT
//   PURPOSE: Prove that scenario D runs the real @telos/locus package on the history example, with its decode, Revision ids, change set and append replay with the stale refusal (FR-019, FR-021).
//   SCOPE: decodeLocusText, runRevisions, replayHistory and isRevisionId on the history examples and on hand-built inputs. Bun only; no DOM.
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: V-M-DOCS-PLAYGROUND
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   A_ID - the Revision id of examples.history.a
//   B_ID - the Revision id of examples.history.b
//   MAX_LENGTH - the largest accepted text length, in code units
//   revisionOf - the Revision of an outcome side, failing the test for a side that did not compute
//   otherIdentity - a copy of the A example with a different Locus identity
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { createRevision, decodeLocus, type Revision } from "@telos/locus";
import { examples } from "@telos/locus-specs";
import { Effect } from "effect";
import { decodeLocusText, MAX_INPUT_LENGTH } from "@/playground/locus-text";
import {
  isRevisionId,
  replayHistory,
  runRevisions,
  type SideOutcome,
} from "@/playground/run-revisions";

const A_ID =
  "sha256:666edf2862a0c96b032bfe46e7c0862f017b30e55d35f0b991636f3a3f6cc6c6";
const B_ID =
  "sha256:6c5a7162f418e32b09814af51e749845bab69c0170b4a9cd008af8514b36a315";
const MAX_LENGTH = 1_048_576;

function revisionOf(side: SideOutcome): Revision {
  if (!("revision" in side)) {
    throw new Error("expected a Revision, the side did not compute");
  }
  return side.revision;
}

function otherIdentity() {
  return { ...examples.history.a, id: "shop:other" };
}

describe("decodeLocusText", () => {
  test("decodes the JSON of the A example", async () => {
    const outcome = await decodeLocusText(JSON.stringify(examples.history.a));
    expect(outcome.ok).toBe(true);
  });

  test("gives one issue at the whole input for text that is not JSON", async () => {
    const outcome = await decodeLocusText("{");
    if (outcome.ok) throw new Error("expected a decode error");
    expect(outcome.issues.length).toBe(1);
    expect(outcome.issues[0]?.path).toBe("");
    expect(outcome.issues[0]?.message.startsWith("Not valid JSON:")).toBe(true);
  });

  test("refuses text one code unit over the limit with one issue at the whole input", async () => {
    const outcome = await decodeLocusText(" ".repeat(MAX_LENGTH + 1));
    if (outcome.ok) throw new Error("expected a decode error");
    expect(outcome.issues).toEqual([
      { path: "", message: "Input is longer than 1048576 characters." },
    ]);
  });

  test("accepts the limit itself: text of exactly 1048576 code units reaches the JSON step", async () => {
    const outcome = await decodeLocusText(" ".repeat(MAX_LENGTH));
    if (outcome.ok) throw new Error("expected a decode error");
    expect(outcome.issues[0]?.message.startsWith("Not valid JSON:")).toBe(true);
  });

  test("keeps the package's located issues for JSON that is not a Locus", async () => {
    const outcome = await decodeLocusText('{"id":"bad id"}');
    if (outcome.ok) throw new Error("expected a decode error");
    expect(outcome.issues.length).toBeGreaterThan(0);
    for (const issue of outcome.issues) {
      expect(issue.path).not.toBe("");
    }
  });

  test("the limit is the one that decodeFabricJson enforces", async () => {
    expect(MAX_INPUT_LENGTH).toBe(MAX_LENGTH);
  });
});

describe("runRevisions on the history example", () => {
  test("gives the Revision id of A and of B", async () => {
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(examples.history.b),
    );
    expect(revisionOf(outcome.a).id).toBe(A_ID);
    expect(revisionOf(outcome.b).id).toBe(B_ID);
  });

  test("gives the change set from A to B: one removed and one added responsibility", async () => {
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(examples.history.b),
    );
    if (outcome.diff.kind !== "change-set") {
      throw new Error(`expected a change set, got ${outcome.diff.kind}`);
    }
    expect(outcome.diff.changeSet.changes).toEqual([
      {
        part: "charter.responsibilities",
        kind: "removed",
        value: "Collect payment details",
      },
      {
        part: "charter.responsibilities",
        kind: "added",
        value: "Collect payment and delivery details",
      },
    ]);
  });

  test("the Revision ids equal createRevision of the package's own decode", async () => {
    const definitionA = await Effect.runPromise(
      decodeLocus(examples.history.a),
    );
    const definitionB = await Effect.runPromise(
      decodeLocus(examples.history.b),
    );
    const expectedA = await Effect.runPromise(createRevision(definitionA));
    const expectedB = await Effect.runPromise(createRevision(definitionB));
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(examples.history.b),
    );
    expect(revisionOf(outcome.a).id).toBe(expectedA.id);
    expect(revisionOf(outcome.b).id).toBe(expectedB.id);
  });
});

describe("runRevisions on other pairs", () => {
  test("the same Revision on both sides gives no changes", async () => {
    const text = JSON.stringify(examples.history.a);
    const outcome = await runRevisions(text, text);
    if (outcome.diff.kind !== "change-set") {
      throw new Error(`expected a change set, got ${outcome.diff.kind}`);
    }
    expect(outcome.diff.changeSet.changes).toEqual([]);
  });

  test("two different Loci give a locus mismatch with both identities", async () => {
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(otherIdentity()),
    );
    expect(outcome.diff).toEqual({
      kind: "locus-mismatch",
      from: "shop:checkout",
      to: "shop:other",
    });
  });

  test("a side that is not JSON leaves that side unresolved and the diff unavailable", async () => {
    const outcome = await runRevisions("{", JSON.stringify(examples.history.b));
    expect("issues" in outcome.a).toBe(true);
    expect(outcome.b).toMatchObject({ ok: true });
    expect(outcome.diff).toEqual({ kind: "unavailable" });
  });

  test("a side with no charter gives its located decode issues and no Revision", async () => {
    const { charter: _charter, ...withoutCharter } = examples.history.a;
    const outcome = await runRevisions(
      JSON.stringify(withoutCharter),
      JSON.stringify(examples.history.b),
    );
    if (!("issues" in outcome.a)) throw new Error("expected decode issues");
    expect(outcome.a.issues.length).toBeGreaterThan(0);
    expect(outcome.a.issues.every((issue) => issue.path !== "")).toBe(true);
    expect(outcome.diff).toEqual({ kind: "unavailable" });
  });

  test("when Web Crypto is missing, each side reports the digest failure and the diff is unavailable", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
    });
    try {
      const outcome = await runRevisions(
        JSON.stringify(examples.history.a),
        JSON.stringify(examples.history.b),
      );
      expect(outcome.a).toEqual({ ok: false, digestFailed: true });
      expect(outcome.b).toEqual({ ok: false, digestFailed: true });
      expect(outcome.diff).toEqual({ kind: "unavailable" });
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(globalThis, "crypto", descriptor);
      }
    }
  });
});

describe("replayHistory", () => {
  test("A with no head, B with no head, B with head A, B again with head B gives appended, stale, appended, no-op", async () => {
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(examples.history.b),
    );
    const a = revisionOf(outcome.a);
    const b = revisionOf(outcome.b);
    const replay = await replayHistory([
      { revision: a, expectedHead: null },
      { revision: b, expectedHead: null },
      { revision: b, expectedHead: a.id },
      { revision: b, expectedHead: b.id },
    ]);
    expect(replay.outcomes).toEqual([
      { outcome: "appended", head: A_ID },
      { outcome: "stale", expected: null, actual: A_ID },
      { outcome: "appended", head: B_ID },
      { outcome: "no-op", head: B_ID },
    ]);
  });

  test("the history of the one Locus has head B and entries A then B", async () => {
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(examples.history.b),
    );
    const a = revisionOf(outcome.a);
    const b = revisionOf(outcome.b);
    const replay = await replayHistory([
      { revision: a, expectedHead: null },
      { revision: b, expectedHead: null },
      { revision: b, expectedHead: a.id },
      { revision: b, expectedHead: b.id },
    ]);
    expect(replay.loci).toEqual([
      { locus: "shop:checkout", head: B_ID, entries: [A_ID, B_ID] },
    ]);
  });

  test("an empty step list gives no outcomes and no Loci", async () => {
    const replay = await replayHistory([]);
    expect(replay).toEqual({ outcomes: [], loci: [] });
  });

  test("two replays of the same steps give equal results, because each starts from an empty history", async () => {
    const outcome = await runRevisions(
      JSON.stringify(examples.history.a),
      JSON.stringify(examples.history.b),
    );
    const a = revisionOf(outcome.a);
    const steps = [
      { revision: a, expectedHead: null },
      { revision: a, expectedHead: null },
    ];
    const first = await replayHistory(steps);
    const second = await replayHistory(steps);
    expect(second).toEqual(first);
    expect(first.outcomes[1]).toEqual({
      outcome: "stale",
      expected: null,
      actual: A_ID,
    });
  });
});

describe("isRevisionId", () => {
  test("accepts both example ids", () => {
    expect(isRevisionId(A_ID)).toBe(true);
    expect(isRevisionId(B_ID)).toBe(true);
  });

  test("refuses the empty text, a short id and an upper-case id", () => {
    expect(isRevisionId("")).toBe(false);
    expect(isRevisionId("sha256:abc")).toBe(false);
    expect(isRevisionId(A_ID.toUpperCase().replace("SHA256", "sha256"))).toBe(
      false,
    );
  });
});
