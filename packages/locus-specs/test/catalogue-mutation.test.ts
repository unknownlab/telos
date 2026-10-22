import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { catalogue } from "../src/catalogue";
import type { ExpectedDiagnostic, Specification } from "../src/model";
import { runSpecification } from "../src/runner";

// Mutation pass: every catalogue record must be able to fail. For each record,
// one copy has its expectation altered; the runner must report "fail" for it.
// The original record is never changed (structuredClone).

const extraDiagnostic: ExpectedDiagnostic = {
  code: "owner.self",
  scope: "locus",
  subject: "x:x",
  path: "owner",
};

// Returns a copy of the record whose expectation is wrong for its kind.
const mutate = (spec: Specification): Specification => {
  const copy = structuredClone(spec);
  const check = copy.check;
  switch (check.kind) {
    case "validate": {
      const wanted = check.expect as {
        valid: boolean;
        diagnostics: ExpectedDiagnostic[];
      };
      wanted.valid = !wanted.valid;
      if (wanted.diagnostics.length > 0) {
        wanted.diagnostics.pop();
      } else {
        wanted.diagnostics.push(extraDiagnostic);
      }
      break;
    }
    case "validate-stable":
      (check as unknown as { expect: unknown }).expect = "different";
      break;
    case "decode": {
      const replaced: unknown = check.expect.ok
        ? { ok: false, paths: [""] }
        : { ok: false, paths: [...check.expect.paths, "zzz"] };
      (check as unknown as { expect: unknown }).expect = replaced;
      break;
    }
    case "revision-compare": {
      const wanted = check.expect as { sameLocus: boolean; sameId: boolean };
      wanted.sameId = !wanted.sameId;
      break;
    }
    case "revision-immutable":
      (check as unknown as { expect: unknown }).expect = "mutable";
      break;
    case "history": {
      const wanted = check.expect as unknown as {
        outcomes: string[];
        entries: number[];
      };
      wanted.outcomes.push("stale");
      break;
    }
    case "diff": {
      const replaced: unknown = check.expect.ok
        ? {
            ok: true,
            changes: [
              ...check.expect.changes,
              { part: "owner", kind: "changed", from: null, to: "x:x" },
            ],
          }
        : { ok: true, changes: [] };
      (check as unknown as { expect: unknown }).expect = replaced;
      break;
    }
  }
  return copy;
};

describe("catalogue mutation pass", () => {
  test("covers every record of the catalogue", () => {
    expect(catalogue.length).toBe(44);
  });

  for (const spec of catalogue) {
    test(`${spec.id} fails when its expectation is mutated`, async () => {
      const mutated = mutate(spec);
      expect(mutated).not.toEqual(spec);
      const result = await Effect.runPromise(runSpecification(mutated));
      expect(result.status).toBe("fail");
    });
  }
});
