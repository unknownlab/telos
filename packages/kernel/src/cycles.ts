// START_MODULE_CONTRACT
//   PURPOSE: Enumerate the elementary cycles of a directed graph up to a fixed limit, in a deterministic order.
//   SCOPE: MAX_CYCLES and elementaryCycles, with Johnson's search written without recursion. Out: the diagnostics built from cycles and any model rule.
//   DEPENDS: M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-DIAGNOSTIC
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MAX_CYCLES - the most cycles elementaryCycles reports
//   elementaryCycles - the elementary cycles of a graph, each rotated to its smallest member, sorted, with an exceeded flag
// END_MODULE_MAP

import { deepFreeze } from "./freeze";

// START_CONTRACT: MAX_CYCLES
//   PURPOSE: Bound the number of cycles that elementaryCycles collects.
//   INPUTS: none
//   OUTPUTS: { number - 100 }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: MAX_CYCLES
/** The most cycles elementaryCycles reports. */
export const MAX_CYCLES = 100;

// START_CONTRACT: elementaryCycles
//   PURPOSE: List the elementary cycles of a directed graph, once each, up to MAX_CYCLES.
//   INPUTS: { nodes: ReadonlyArray<string> - node ids, sorted; edges: ReadonlyArray<readonly [string, string]> - from and to ids, both in nodes }
//   OUTPUTS: { { cycles: ReadonlyArray<ReadonlyArray<string>>, exceeded: boolean } - cycles rotated to their smallest member and sorted by join(","); exceeded is true when more cycles exist }
//   SIDE_EFFECTS: none. Result is deeply frozen.
//   LINKS: M-KERNEL-DIAGNOSTIC
// END_CONTRACT: elementaryCycles
/** Reports at most MAX_CYCLES elementary cycles. Edges outside the nodes and self-edges are ignored. */
export function elementaryCycles(
  nodes: ReadonlyArray<string>,
  edges: ReadonlyArray<readonly [string, string]>,
): {
  readonly cycles: ReadonlyArray<ReadonlyArray<string>>;
  readonly exceeded: boolean;
} {
  const index = new Map<string, number>();
  nodes.forEach((id, i) => index.set(id, i));
  const successors: number[][] = nodes.map(() => []);
  const predecessors: number[][] = nodes.map(() => []);
  for (const [from, to] of edges) {
    const a = index.get(from);
    const b = index.get(to);
    if (a === undefined || b === undefined || a === b) continue;
    successors[a]!.push(b);
    predecessors[b]!.push(a);
  }
  for (const list of [...successors, ...predecessors]) {
    list.sort((x, y) => x - y);
    const distinct = list.filter(
      (value, i) => i === 0 || list[i - 1] !== value,
    );
    list.splice(0, list.length, ...distinct);
  }
  const found: string[][] = [];
  let exceeded = false;
  for (let s = 0; s < nodes.length && !exceeded; s += 1) {
    const component = cyclicComponent(s, successors, predecessors);
    if (component.size < 2) continue;
    findElementaryCycles(s, successors, component, (cycle) => {
      if (found.length === MAX_CYCLES) {
        exceeded = true;
        return false;
      }
      found.push(rotateToSmallest(cycle.map((i) => nodes[i]!)));
      return true;
    });
  }
  found.sort((a, b) => {
    const x = a.join(",");
    const y = b.join(",");
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return deepFreeze({ cycles: found, exceeded });
}

// Rotates a cycle so that its smallest member comes first. The cycle order is kept.
function rotateToSmallest(cycle: ReadonlyArray<string>): string[] {
  let best = 0;
  for (let i = 1; i < cycle.length; i += 1) {
    if (cycle[i]! < cycle[best]!) best = i;
  }
  return [...cycle.slice(best), ...cycle.slice(0, best)];
}

// Nodes that lie on a cycle through `s` using only nodes with index >= s.
// That is the strongly connected component of `s` in the subgraph, computed
// as the intersection of what `s` reaches and what reaches `s`.
function cyclicComponent(
  s: number,
  successors: ReadonlyArray<ReadonlyArray<number>>,
  predecessors: ReadonlyArray<ReadonlyArray<number>>,
): Set<number> {
  const forward = reachWithin(s, successors);
  const backward = reachWithin(s, predecessors);
  const component = new Set<number>();
  for (const node of forward) {
    if (backward.has(node)) component.add(node);
  }
  return component;
}

// Breadth-first reach from `start` through `edges`, visiting only nodes >= start.
function reachWithin(
  start: number,
  edges: ReadonlyArray<ReadonlyArray<number>>,
): Set<number> {
  const seen = new Set<number>([start]);
  const queue: number[] = [start];
  while (queue.length > 0) {
    const node = queue.pop()!;
    for (const next of edges[node]!) {
      if (next >= start && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

// Johnson's elementary-cycle search from `s` inside `component`, iterative.
// Calls `onCycle` once per cycle, with node indices in cycle order starting at `s`.
// The search ends at once when `onCycle` returns false.
function findElementaryCycles(
  s: number,
  successors: ReadonlyArray<ReadonlyArray<number>>,
  component: ReadonlySet<number>,
  onCycle: (cycle: number[]) => boolean,
): void {
  const blocked = new Set<number>();
  const blockedBy = new Map<number, Set<number>>();
  const path: number[] = [s];
  const frames: Array<{ node: number; next: number; found: boolean }> = [
    { node: s, next: 0, found: false },
  ];
  blocked.add(s);
  while (frames.length > 0) {
    const frame = frames[frames.length - 1]!;
    const targets = successors[frame.node]!;
    if (frame.next < targets.length) {
      const target = targets[frame.next]!;
      frame.next += 1;
      if (!component.has(target)) continue;
      if (target === s) {
        const keepGoing = onCycle([...path]);
        frame.found = true;
        if (!keepGoing) return;
      } else if (!blocked.has(target)) {
        blocked.add(target);
        path.push(target);
        frames.push({ node: target, next: 0, found: false });
      }
      continue;
    }
    frames.pop();
    path.pop();
    if (frame.found) {
      unblock(frame.node, blocked, blockedBy);
    } else {
      for (const target of targets) {
        if (!component.has(target)) continue;
        let set = blockedBy.get(target);
        if (set === undefined) {
          set = new Set<number>();
          blockedBy.set(target, set);
        }
        set.add(frame.node);
      }
    }
    const parent = frames[frames.length - 1];
    if (parent !== undefined && frame.found) parent.found = true;
  }
}

// Clears the blocked mark of `start` and, transitively, of the nodes it blocked.
function unblock(
  start: number,
  blocked: Set<number>,
  blockedBy: Map<number, Set<number>>,
): void {
  const work: number[] = [start];
  while (work.length > 0) {
    const node = work.pop()!;
    if (!blocked.has(node)) continue;
    blocked.delete(node);
    const waiting = blockedBy.get(node);
    if (waiting !== undefined) {
      blockedBy.delete(node);
      for (const other of waiting) work.push(other);
    }
  }
}
