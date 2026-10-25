import { deepFreeze } from "./freeze";

export const MAX_CYCLES = 100;

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

function rotateToSmallest(cycle: ReadonlyArray<string>): string[] {
  let best = 0;
  for (let i = 1; i < cycle.length; i += 1) {
    if (cycle[i]! < cycle[best]!) best = i;
  }
  return [...cycle.slice(best), ...cycle.slice(0, best)];
}

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
