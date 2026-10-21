// START_MODULE_CONTRACT
//   PURPOSE: Prove that search groups hits by document, limits them, and finds the real content through the index that the build writes.
//   SCOPE: groupHits on fixtures (grouping and limit), createSearch on the real docs index compiled from the repository (baseline, prefix, empty query).
//   DEPENDS: M-DOCS-SITE
//   LINKS: V-M-DOCS-SITE
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   REPO_ROOT - the repository root, three levels above this test directory
//   hit - a raw search result with the given id, route, document title and heading
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { compileContent } from "../scripts/content";
import { createSearch, groupHits } from "@/lib/search";

const REPO_ROOT = resolve(import.meta.dir, "../../..");

function hit(
  id: string,
  route: string,
  docTitle: string,
  heading: string,
): {
  readonly id: string;
  readonly route: string;
  readonly docTitle: string;
  readonly heading: string;
} {
  return { id, route, docTitle, heading };
}

describe("groupHits", () => {
  test("keeps the first hit of each route, in input order", () => {
    const hits = groupHits([
      hit("/a#x", "/a", "A", "X"),
      hit("/a", "/a", "A", ""),
      hit("/b", "/b", "B", ""),
    ]);
    expect(hits.map((h) => h.id)).toEqual(["/a#x", "/b"]);
    expect(hits[0]).toEqual({
      id: "/a#x",
      route: "/a",
      docTitle: "A",
      heading: "X",
    });
  });

  test("limits the number of hits, ten by default", () => {
    const results = Array.from({ length: 15 }, (_, i) =>
      hit(`/r${i}`, `/r${i}`, `R${i}`, ""),
    );
    expect(groupHits(results)).toHaveLength(10);
    expect(groupHits(results, 3).map((h) => h.id)).toEqual([
      "/r0",
      "/r1",
      "/r2",
    ]);
  });

  test("reads missing stored fields as empty strings", () => {
    const hits = groupHits([{ id: "/z" }]);
    expect(hits).toEqual([{ id: "/z", route: "", docTitle: "", heading: "" }]);
  });
});

describe("createSearch over the real docs index", () => {
  const realSearch = (async () => {
    const output = await compileContent({
      root: REPO_ROOT,
      git: () => ({ commit: "test", dirty: false }),
    });
    if (!output.ok) throw new Error("the real docs must compile");
    return createSearch(output.output.search);
  })();

  test("baseline finds the principle and the term", async () => {
    const search = await realSearch;
    const hits = search("baseline");
    const routes = hits.map((h) => h.route);
    expect(routes).toContain("/principles/P08-preserve-the-baseline");
    expect(routes).toContain("/terminology/revision");
  });

  test("baseline results name each route once", async () => {
    const search = await realSearch;
    const routes = search("baseline").map((h) => h.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  test("a prefix finds the philosophy page", async () => {
    const search = await realSearch;
    expect(search("determ").map((h) => h.route)).toContain("/philosophy");
  });

  test("a blank query gives no hits", async () => {
    const search = await realSearch;
    expect(search("   ")).toEqual([]);
  });
});
