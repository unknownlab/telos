// START_MODULE_CONTRACT
//   PURPOSE: Check a Fabric against INV-001 to INV-008 and report every violation as a Diagnostic, in an order that depends only on content; refines cycles are capped at 100 per Fabric, followed by one limit diagnostic.
//   SCOPE: validateFabric and its private check phases. Out: decoding, revisions, history, and the diagnostic types and constructors (diagnostic.ts).
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-VALIDATION
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   validateFabric - pure, total check of a Fabric; never throws, caps refines cycles at 100 with one limit diagnostic, and returns a frozen ValidationReport
// END_MODULE_MAP

import {
  compareDiagnostics,
  type Diagnostic,
  makeDiagnostic,
  type ValidationReport,
} from "./diagnostic";
import type { Fabric } from "./fabric";
import { deepFreeze } from "./freeze";
import { type Identity, isIdentity } from "./identity";

const BLANK = /^\s*$/u;
// Most refines cycles reported per Fabric (owner decision, 2026-10-21; locus-api.md).
const MAX_REFINES_CYCLES = 100;
const SET_FIELDS = [
  "responsibilities",
  "excluded",
  "successConditions",
] as const;

// START_CONTRACT: validateFabric
//   PURPOSE: Report every rule violation of a Fabric as a diagnostic, so one pass shows all problems; at most 100 refines cycles are reported, then one limit diagnostic when more exist.
//   INPUTS: { fabric: Fabric - the Fabric to check, with its Loci in any order }
//   OUTPUTS: { ValidationReport - valid is true exactly when diagnostics is empty; diagnostics sorted by subject, code, path, detail, members and free of exact repeats; at most 100 relation.refines-cycle, and relation.refines-cycle-limit on the Fabric exactly when a 101st cycle exists }
//   SIDE_EFFECTS: none. Pure and total: never throws and never returns an Effect. Cycle checks use no recursion, so chains of any depth are safe.
//   LINKS: M-LOCUS-VALIDATION
// END_CONTRACT: validateFabric
/** Validates a Fabric. Reports every violation of INV-001 to INV-008, except that at most 100 refines cycles are reported, followed by one `relation.refines-cycle-limit` when more exist; the same content gives byte-identical output. */
export function validateFabric(fabric: Fabric): ValidationReport {
  const diagnostics: Diagnostic[] = [];
  const loci = fabric.loci;

  // START_BLOCK_FABRIC_IDENTITY
  if (!isIdentity(fabric.id)) {
    diagnostics.push(
      makeDiagnostic({
        code: "identity.malformed",
        scope: "fabric",
        subject: fabric.id,
        path: "id",
        message: `Fabric identity "${fabric.id}" does not match namespace:name.`,
      }),
    );
  }
  // END_BLOCK_FABRIC_IDENTITY

  // START_BLOCK_COUNT_IDENTITIES
  const counts = new Map<Identity, number>();
  for (const locus of loci) {
    counts.set(locus.id, (counts.get(locus.id) ?? 0) + 1);
  }
  for (const [id, count] of counts) {
    if (!isIdentity(id)) {
      diagnostics.push(
        makeDiagnostic({
          code: "identity.malformed",
          scope: "locus",
          subject: id,
          path: "id",
          message: `Identity "${id}" does not match namespace:name.`,
        }),
      );
    }
    if (count > 1) {
      diagnostics.push(
        makeDiagnostic({
          code: "identity.duplicate",
          scope: "locus",
          subject: id,
          path: "id",
          detail: String(count),
          message: `Identity "${id}" is used by ${count} Loci.`,
        }),
      );
    }
  }
  // END_BLOCK_COUNT_IDENTITIES

  // START_BLOCK_CHARTER
  for (const locus of loci) {
    if (BLANK.test(locus.charter.purpose)) {
      diagnostics.push(
        makeDiagnostic({
          code: "charter.purpose-blank",
          scope: "locus",
          subject: locus.id,
          path: "charter.purpose",
          message: "Charter purpose is blank.",
        }),
      );
    }
    if (locus.charter.responsibilities.length === 0) {
      diagnostics.push(
        makeDiagnostic({
          code: "charter.responsibilities-empty",
          scope: "locus",
          subject: locus.id,
          path: "charter.responsibilities",
          message: "Charter has no responsibilities.",
        }),
      );
    }
    for (const field of SET_FIELDS) {
      const entries = locus.charter[field];
      const path = `charter.${field}`;
      if (entries.some((entry) => BLANK.test(entry))) {
        diagnostics.push(
          makeDiagnostic({
            code: "charter.entry-blank",
            scope: "locus",
            subject: locus.id,
            path,
            message: `A blank entry is in ${path}.`,
          }),
        );
      }
      const seen = new Map<string, number>();
      for (const entry of entries) {
        if (BLANK.test(entry)) continue;
        seen.set(entry, (seen.get(entry) ?? 0) + 1);
      }
      for (const [value, occurrences] of seen) {
        if (occurrences > 1) {
          diagnostics.push(
            makeDiagnostic({
              code: "charter.entry-duplicate",
              scope: "locus",
              subject: locus.id,
              path,
              detail: value,
              message: `Entry "${value}" is repeated in ${path}.`,
            }),
          );
        }
      }
    }
  }
  // END_BLOCK_CHARTER

  // START_BLOCK_OWNER
  for (const locus of loci) {
    if (locus.owner === undefined) continue;
    if (locus.owner === locus.id) {
      diagnostics.push(
        makeDiagnostic({
          code: "owner.self",
          scope: "locus",
          subject: locus.id,
          path: "owner",
          message: "Locus names itself as its owner.",
        }),
      );
    } else if (!counts.has(locus.owner)) {
      diagnostics.push(
        makeDiagnostic({
          code: "owner.missing",
          scope: "locus",
          subject: locus.id,
          path: "owner",
          detail: locus.owner,
          message: `Owner "${locus.owner}" is not in the Fabric.`,
        }),
      );
    }
  }
  // END_BLOCK_OWNER

  // START_BLOCK_RELATIONS
  for (const locus of loci) {
    const occurrences = new Map<string, number>();
    for (const relation of locus.relations) {
      const key = `${relation.kind} ${relation.target}`;
      occurrences.set(key, (occurrences.get(key) ?? 0) + 1);
      if (relation.target === locus.id) {
        diagnostics.push(
          makeDiagnostic({
            code: "relation.self",
            scope: "locus",
            subject: locus.id,
            path: "relations",
            detail: key,
            message: `Relation ${key} points at the Locus itself.`,
          }),
        );
      } else if (!counts.has(relation.target)) {
        diagnostics.push(
          makeDiagnostic({
            code: "relation.target-missing",
            scope: "locus",
            subject: locus.id,
            path: "relations",
            detail: key,
            message: `Relation ${key} targets a Locus that is not in the Fabric.`,
          }),
        );
      }
    }
    for (const [key, count] of occurrences) {
      if (count > 1) {
        diagnostics.push(
          makeDiagnostic({
            code: "relation.duplicate",
            scope: "locus",
            subject: locus.id,
            path: "relations",
            detail: key,
            message: `Relation ${key} is repeated.`,
          }),
        );
      }
    }
  }
  // END_BLOCK_RELATIONS

  // Cycle checks use only Loci whose identity is unique. A duplicated identity
  // is already reported, and its edges would be ambiguous.
  const uniqueIds: Identity[] = [];
  for (const [id, count] of counts) {
    if (count === 1) uniqueIds.push(id);
  }
  uniqueIds.sort();

  // START_BLOCK_OWNERSHIP_CYCLES
  // Each Locus has at most one owner, so the owner graph is a set of chains
  // and cycles. Walk each chain once; a cycle is found when the walk meets a
  // node already on its own path.
  const ownerOf = new Map<Identity, Identity>();
  for (const locus of loci) {
    if (locus.owner === undefined) continue;
    if (counts.get(locus.id) !== 1) continue;
    if (locus.owner === locus.id || counts.get(locus.owner) !== 1) continue;
    ownerOf.set(locus.id, locus.owner);
  }
  const ownerState = new Map<Identity, 1 | 2>(); // 1 = on current walk, 2 = finished
  for (const start of uniqueIds) {
    if (ownerState.has(start)) continue;
    const walk: Identity[] = [];
    let current: Identity | undefined = start;
    while (current !== undefined && !ownerState.has(current)) {
      ownerState.set(current, 1);
      walk.push(current);
      current = ownerOf.get(current);
    }
    if (current !== undefined && ownerState.get(current) === 1) {
      const members = rotateToSmallest(walk.slice(walk.indexOf(current)));
      diagnostics.push(
        makeDiagnostic({
          code: "owner.cycle",
          scope: "locus",
          subject: members[0]!,
          path: "owner",
          members,
          message: `Ownership cycle: ${members.join(" -> ")}.`,
        }),
      );
    }
    for (const id of walk) ownerState.set(id, 2);
  }
  // END_BLOCK_OWNERSHIP_CYCLES

  // START_BLOCK_REFINES_CYCLES
  // Every elementary cycle of the refines graph is reported once, on its
  // smallest member, up to MAX_REFINES_CYCLES. Johnson's algorithm, written
  // without recursion. Starts and successors are in ascending identity order,
  // so the first cycles found do not depend on input order. The search stops
  // at the first cycle beyond the limit, so the limit is detected without
  // enumerating the rest.
  const nodes = uniqueIds;
  const index = new Map<Identity, number>();
  nodes.forEach((id, i) => index.set(id, i));
  const successors: number[][] = nodes.map(() => []);
  const predecessors: number[][] = nodes.map(() => []);
  for (const locus of loci) {
    const from = index.get(locus.id);
    if (from === undefined) continue;
    for (const relation of locus.relations) {
      if (relation.kind !== "refines" || relation.target === locus.id) continue;
      const to = index.get(relation.target);
      if (to === undefined) continue;
      successors[from]!.push(to);
      predecessors[to]!.push(from);
    }
  }
  for (const list of [...successors, ...predecessors]) {
    list.sort((a, b) => a - b);
    const distinct = list.filter(
      (value, i) => i === 0 || list[i - 1] !== value,
    );
    list.splice(0, list.length, ...distinct);
  }
  const search = { reported: 0, exceeded: false };
  for (let s = 0; s < nodes.length && !search.exceeded; s += 1) {
    const component = cyclicComponent(s, successors, predecessors);
    if (component.size < 2) continue;
    findElementaryCycles(s, successors, component, (cycle) => {
      if (search.reported === MAX_REFINES_CYCLES) {
        search.exceeded = true;
        return false;
      }
      search.reported += 1;
      const members = cycle.map((i) => nodes[i]!);
      diagnostics.push(
        makeDiagnostic({
          code: "relation.refines-cycle",
          scope: "locus",
          subject: members[0]!,
          path: "relations",
          members,
          message: `Refines cycle: ${members.join(" -> ")} -> ${members[0]}.`,
        }),
      );
      return true;
    });
  }
  if (search.exceeded) {
    diagnostics.push(
      makeDiagnostic({
        code: "relation.refines-cycle-limit",
        scope: "fabric",
        subject: fabric.id,
        path: "relations",
        detail: String(MAX_REFINES_CYCLES),
        message: `More than ${MAX_REFINES_CYCLES} refines cycles exist; only the first ${MAX_REFINES_CYCLES} are reported.`,
      }),
    );
  }
  // END_BLOCK_REFINES_CYCLES

  // START_BLOCK_ORDER
  diagnostics.sort(compareDiagnostics);
  const kept: Diagnostic[] = [];
  let previous: string | undefined;
  for (const diagnostic of diagnostics) {
    const json = JSON.stringify(diagnostic);
    if (json === previous) continue;
    kept.push(diagnostic);
    previous = json;
  }
  return deepFreeze({ valid: kept.length === 0, diagnostics: kept });
  // END_BLOCK_ORDER
}

// Rotates a cycle so that its smallest member comes first. The cycle order is kept.
function rotateToSmallest(cycle: ReadonlyArray<Identity>): Identity[] {
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
