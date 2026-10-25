import { describe, expect, test } from "bun:test";
import { MAX_CYCLES, elementaryCycles } from "../src/cycles";

function completeDigraph(
  nodes: ReadonlyArray<string>,
): Array<readonly [string, string]> {
  const edges: Array<readonly [string, string]> = [];
  for (const from of nodes) {
    for (const to of nodes) {
      if (from !== to) edges.push([from, to]);
    }
  }
  return edges;
}

describe("elementaryCycles", () => {
  test("with no edges reports no cycles and is not exceeded", () => {
    expect(elementaryCycles(["a", "b", "c"], [])).toEqual({
      cycles: [],
      exceeded: false,
    });
  });

  test("reports a two-node cycle once, rotated to its smallest member", () => {
    const result = elementaryCycles(
      ["a", "b"],
      [
        ["a", "b"],
        ["b", "a"],
      ],
    );
    expect(result.cycles).toEqual([["a", "b"]]);
    expect(result.exceeded).toBe(false);
  });

  test("reports both cycles of a three-node graph, sorted by their joined members", () => {
    const result = elementaryCycles(
      ["a", "b", "c"],
      [
        ["a", "b"],
        ["b", "c"],
        ["c", "a"],
        ["b", "a"],
      ],
    );
    expect(result.cycles).toEqual([
      ["a", "b"],
      ["a", "b", "c"],
    ]);
    expect(result.exceeded).toBe(false);
  });

  test("does not report a duplicate edge twice", () => {
    const result = elementaryCycles(
      ["a", "b"],
      [
        ["a", "b"],
        ["a", "b"],
        ["b", "a"],
        ["b", "a"],
      ],
    );
    expect(result.cycles).toEqual([["a", "b"]]);
  });

  test("does not report a self-edge as a cycle", () => {
    const result = elementaryCycles(["a"], [["a", "a"]]);
    expect(result.cycles).toEqual([]);
    expect(result.exceeded).toBe(false);
  });

  test("gives the same output for edges given in a different order", () => {
    const nodes = ["a", "b", "c"];
    const forward = elementaryCycles(nodes, [
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
      ["b", "a"],
    ]);
    const reversed = elementaryCycles(nodes, [
      ["b", "a"],
      ["c", "a"],
      ["b", "c"],
      ["a", "b"],
    ]);
    expect(reversed).toEqual(forward);
  });

  test("stops at MAX_CYCLES and reports exceeded on the complete digraph of six nodes", () => {
    const nodes = ["n1", "n2", "n3", "n4", "n5", "n6"];
    const result = elementaryCycles(nodes, completeDigraph(nodes));
    expect(result.cycles.length).toBe(MAX_CYCLES);
    expect(result.exceeded).toBe(true);
  });

  test("is not exceeded when a single three-node cycle is the only cycle", () => {
    const result = elementaryCycles(
      ["a", "b", "c"],
      [
        ["a", "b"],
        ["b", "c"],
        ["c", "a"],
      ],
    );
    expect(result.cycles).toEqual([["a", "b", "c"]]);
    expect(result.exceeded).toBe(false);
  });
});
