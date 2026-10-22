import { describe, expect, test } from "bun:test";
import {
  DecodeError,
  DigestError,
  LocusMismatchError,
  RevisionNotFoundError,
  StaleBaselineError,
} from "../src/errors";

describe("tagged errors", () => {
  test("DigestError carries its tag and cause", () => {
    const cause = new Error("boom");
    const error = new DigestError({ cause });
    expect(error._tag).toBe("DigestError");
    expect(error.cause).toBe(cause);
    expect(error instanceof Error).toBe(true);
  });

  test("LocusMismatchError carries its tag and both identities", () => {
    const error = new LocusMismatchError({ from: "shop:a", to: "shop:b" });
    expect(error._tag).toBe("LocusMismatchError");
    expect(error.from).toBe("shop:a");
    expect(error.to).toBe("shop:b");
    expect(error instanceof Error).toBe(true);
  });

  test("StaleBaselineError carries its tag, locus and both heads", () => {
    const error = new StaleBaselineError({
      locus: "shop:checkout",
      expected: "sha256:aa",
      actual: null,
    });
    expect(error._tag).toBe("StaleBaselineError");
    expect(error.locus).toBe("shop:checkout");
    expect(error.expected).toBe("sha256:aa");
    expect(error.actual).toBeNull();
    expect(error instanceof Error).toBe(true);
  });

  test("RevisionNotFoundError carries its tag and id", () => {
    const error = new RevisionNotFoundError({ id: "sha256:bb" });
    expect(error._tag).toBe("RevisionNotFoundError");
    expect(error.id).toBe("sha256:bb");
    expect(error instanceof Error).toBe(true);
  });

  test("DecodeError carries its tag and issues", () => {
    const issues = [{ path: "loci[2].relations[0].kind", message: "bad" }];
    const error = new DecodeError({ issues });
    expect(error._tag).toBe("DecodeError");
    expect(error.issues).toEqual(issues);
    expect(error instanceof Error).toBe(true);
  });
});
