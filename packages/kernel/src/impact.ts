// START_MODULE_CONTRACT
//   PURPOSE: Derive the change impact of a Locus or capability from the model, and compare two models into the changes a reviewer must read.
//   SCOPE: The AffectedLocus and ImpactReport shapes, impact, the ModelChange shapes and diffModels. Out: verification (verify.ts), the Telos service that checks ids before calling impact (introspection.ts) and any rule evaluation.
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DESCRIBE, M-KERNEL-VERIFY
//   LINKS: M-KERNEL-IMPACT, V-M-KERNEL-IMPACT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   AffectedLocus - one Locus affected by a target with its shortest relation path and distance
//   ImpactReport - the derived impact of a target with affected Loci, applicable checks and the knowledge status
//   impact - the Loci affected by a target and the checks that apply to them
//   ModelChangeKind - the kinds of change diffModels reports
//   ModelChange - one change between two models with its JSON patch
//   diffModels - compares two models by Locus id and reports the changes sorted by locus, capability and kind
// END_MODULE_MAP

import { Effect, JsonPatch, Schema } from "effect";
import type { RuleMethod } from "./archetype";
import {
  describeModel,
  type CapabilityDescription,
  type LocusDescription,
} from "./describe";
import { deepFreeze } from "./freeze";
import { parseCapabilityKey } from "./identity";
import {
  ancestors,
  incoming,
  type ModelRelation,
  type SemanticModel,
} from "./model";
import { relationTargetKey } from "./relation";
import { applicableArchetypes } from "./verify";

export interface AffectedLocus {
  readonly locus: string;
  readonly path: ReadonlyArray<{
    readonly from: string;
    readonly type: string;
    readonly to: string;
  }>;
  readonly distance: number;
}

export interface ImpactReport {
  readonly target: string;
  readonly affected: ReadonlyArray<AffectedLocus>;
  readonly checks: ReadonlyArray<{
    readonly locus: string;
    readonly archetype: string;
    readonly rule: string;
    readonly method: RuleMethod;
  }>;
  readonly knowledge: "derived";
}

export type ModelChangeKind =
  | "locus-added"
  | "locus-removed"
  | "contract-changed"
  | "capability-added"
  | "capability-removed"
  | "locus-changed";

export interface ModelChange {
  readonly kind: ModelChangeKind;
  readonly locus: string;
  readonly capability: string | null;
  readonly patch: ReadonlyArray<JsonPatch.JsonPatchOperation>;
}

interface Step {
  readonly from: string;
  readonly type: string;
  readonly to: string;
}

interface Node {
  readonly locus: string;
  readonly path: ReadonlyArray<Step>;
}

// Orders strings by UTF-16 code unit, never by locale.
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function stepOf(relation: ModelRelation): Step {
  return {
    from: relation.from,
    type: relation.type.id,
    to: relationTargetKey(relation.target),
  };
}

// START_CONTRACT: impact
//   PURPOSE: Find every Locus that reaches a target through valid relations, with the shortest path, and every check that applies to the affected Loci.
//   INPUTS: { model: SemanticModel - a built model; target: string - a Locus id or "<locus>#<capability>", validated by the caller }
//   OUTPUTS: { ImpactReport - affected Loci sorted by distance then locus, checks sorted by locus, archetype and rule, knowledge derived; frozen }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IMPACT
// END_CONTRACT: impact
/** Breadth-first over the valid incoming relations of the target and of every affected Locus. */
export function impact(model: SemanticModel, target: string): ImpactReport {
  const parsed = parseCapabilityKey(target);
  const targetLocus = parsed?.locus ?? target;
  const targetCapability = parsed?.capability ?? null;

  const known = new Set<string>([targetLocus]);
  const affected: Array<AffectedLocus> = [];

  // Level 0: relations that point at the target itself. A capability target only matches its own capability.
  let level: Array<Node> = [];
  for (const relation of incoming(model, targetLocus)) {
    if (
      targetCapability !== null &&
      relation.target.capability !== targetCapability
    ) {
      continue;
    }
    if (known.has(relation.from)) continue;
    known.add(relation.from);
    level.push({ locus: relation.from, path: [stepOf(relation)] });
  }

  while (level.length > 0) {
    for (const node of level) {
      affected.push({
        locus: node.locus,
        path: node.path,
        distance: node.path.length,
      });
    }
    const next: Array<Node> = [];
    const current = [...level].sort((a, b) => byCodeUnit(a.locus, b.locus));
    for (const node of current) {
      for (const relation of incoming(model, node.locus)) {
        if (known.has(relation.from)) continue;
        known.add(relation.from);
        next.push({
          locus: relation.from,
          path: [stepOf(relation), ...node.path],
        });
      }
    }
    level = next;
  }

  affected.sort(
    (a, b) => a.distance - b.distance || byCodeUnit(a.locus, b.locus),
  );

  // Checks: the target, every affected Locus, and every container of those, each Locus once.
  const scope = new Set<string>([targetLocus, ...affected.map((a) => a.locus)]);
  for (const id of [...scope]) {
    for (const container of ancestors(model, id)) scope.add(container);
  }
  const checks: Array<ImpactReport["checks"][number]> = [];
  const seen = new Set<string>();
  for (const locus of scope) {
    for (const archetype of applicableArchetypes(model, locus)) {
      for (const rule of archetype.rules) {
        const key = `${locus}\u0000${archetype.id}\u0000${rule.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        checks.push({
          locus,
          archetype: archetype.id,
          rule: rule.id,
          method: rule.method,
        });
      }
    }
  }
  checks.sort(
    (a, b) =>
      byCodeUnit(a.locus, b.locus) ||
      byCodeUnit(a.archetype, b.archetype) ||
      byCodeUnit(a.rule, b.rule),
  );

  return deepFreeze<ImpactReport>({
    target,
    affected,
    checks,
    knowledge: "derived",
  });
}

function withoutKeys(
  value: object,
  keys: ReadonlyArray<string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );
}

function patchOf(
  before: unknown,
  after: unknown,
): Array<JsonPatch.JsonPatchOperation> {
  return [...JsonPatch.get(before as Schema.Json, after as Schema.Json)];
}

// START_CONTRACT: diffModels
//   PURPOSE: Report the changes between two models by comparing their descriptions per Locus id and per capability name.
//   INPUTS: { before: SemanticModel - the earlier model; after: SemanticModel - the later model }
//   OUTPUTS: { Effect of ReadonlyArray<ModelChange> - changes sorted by locus, capability ("" for none) and kind; frozen }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IMPACT
// END_CONTRACT: diffModels
/** Compares describeModel of both models. Contract digests decide contract changes; the rest of a shared Locus is one locus-changed. */
export const diffModels = (
  before: SemanticModel,
  after: SemanticModel,
): Effect.Effect<ReadonlyArray<ModelChange>> =>
  Effect.gen(function* () {
    const beforeModel = yield* describeModel(before);
    const afterModel = yield* describeModel(after);
    const beforeLoci = new Map(beforeModel.loci.map((l) => [l.id, l]));
    const afterLoci = new Map(afterModel.loci.map((l) => [l.id, l]));
    const ids = [...new Set([...beforeLoci.keys(), ...afterLoci.keys()])].sort(
      byCodeUnit,
    );

    const changes: Array<ModelChange> = [];
    for (const id of ids) {
      const b = beforeLoci.get(id);
      const a = afterLoci.get(id);
      if (b === undefined && a !== undefined) {
        changes.push({
          kind: "locus-added",
          locus: id,
          capability: null,
          patch: [],
        });
        continue;
      }
      if (b !== undefined && a === undefined) {
        changes.push({
          kind: "locus-removed",
          locus: id,
          capability: null,
          patch: [],
        });
        continue;
      }
      if (b === undefined || a === undefined) continue;

      changes.push(...capabilityChanges(id, b, a));

      const patch = patchOf(
        withoutKeys(b, ["capabilities", "digest", "diagnostics"]),
        withoutKeys(a, ["capabilities", "digest", "diagnostics"]),
      );
      if (patch.length > 0) {
        changes.push({
          kind: "locus-changed",
          locus: id,
          capability: null,
          patch,
        });
      }
    }

    changes.sort(
      (x, y) =>
        byCodeUnit(x.locus, y.locus) ||
        byCodeUnit(x.capability ?? "", y.capability ?? "") ||
        byCodeUnit(x.kind, y.kind),
    );
    return deepFreeze(changes);
  });

function capabilityChanges(
  locus: string,
  before: LocusDescription,
  after: LocusDescription,
): Array<ModelChange> {
  const beforeCaps = new Map<string, CapabilityDescription>(
    before.capabilities.map((c) => [c.name, c]),
  );
  const afterCaps = new Map<string, CapabilityDescription>(
    after.capabilities.map((c) => [c.name, c]),
  );
  const names = [...new Set([...beforeCaps.keys(), ...afterCaps.keys()])].sort(
    byCodeUnit,
  );
  const changes: Array<ModelChange> = [];
  for (const name of names) {
    const b = beforeCaps.get(name);
    const a = afterCaps.get(name);
    if (b === undefined && a !== undefined) {
      changes.push({
        kind: "capability-added",
        locus,
        capability: name,
        patch: [],
      });
    } else if (b !== undefined && a === undefined) {
      changes.push({
        kind: "capability-removed",
        locus,
        capability: name,
        patch: [],
      });
    } else if (
      b !== undefined &&
      a !== undefined &&
      b.contractDigest !== a.contractDigest
    ) {
      changes.push({
        kind: "contract-changed",
        locus,
        capability: name,
        patch: patchOf(
          withoutKeys(b, ["exposedBy"]),
          withoutKeys(a, ["exposedBy"]),
        ),
      });
    }
  }
  return changes;
}
