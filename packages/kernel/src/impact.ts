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

export function impact(model: SemanticModel, target: string): ImpactReport {
  const parsed = parseCapabilityKey(target);
  const targetLocus = parsed?.locus ?? target;
  const targetCapability = parsed?.capability ?? null;

  const known = new Set<string>([targetLocus]);
  const affected: Array<AffectedLocus> = [];

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
