import type { Archetype } from "./archetype";
import type { CompositionConflict, LocusDefinition } from "./locus";
import { elementaryCycles, MAX_CYCLES } from "./cycles";
import { makeDiagnostic, sortDiagnostics, type Diagnostic } from "./diagnostic";
import type { Extension } from "./extension";
import { isCapabilityName, isLocusId } from "./identity";
import { readonlyMap } from "./readonly-map";
import {
  relationTargetKey,
  type RelationTarget,
  type RelationType,
} from "./relation";

export interface ModelLocus {
  readonly definition: LocusDefinition;
  readonly container: string | null;
  readonly contains: ReadonlyArray<string>;
  readonly depth: number;
}
export interface ModelRelation {
  readonly from: string;
  readonly type: RelationType;
  readonly target: RelationTarget;
  readonly index: number;
  readonly valid: boolean;
}
export interface SemanticModel {
  readonly root: string;
  readonly ids: ReadonlyArray<string>;
  readonly loci: ReadonlyMap<string, ModelLocus>;
  readonly relations: ReadonlyArray<ModelRelation>;
  readonly extensions: ReadonlyMap<string, Extension>;
  readonly archetypes: ReadonlyMap<string, Archetype>;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
}

interface Registered {
  readonly def: LocusDefinition;
  readonly container: string | null;
  readonly depth: number;
  readonly children: string[];
}

interface Pending {
  readonly def: LocusDefinition;
  readonly container: string | null;
  readonly depth: number;
}

function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareRelations(a: ModelRelation, b: ModelRelation): number {
  return (
    byCodeUnit(a.from, b.from) ||
    byCodeUnit(a.type.id, b.type.id) ||
    byCodeUnit(relationTargetKey(a.target), relationTargetKey(b.target)) ||
    a.index - b.index
  );
}

const CONFLICT_TEXT: Record<
  CompositionConflict["code"],
  (subject: string, first: string, second: string) => string
> = {
  "composition.extension-id-conflict": (subject) =>
    `Two different extensions share the id ${subject}.`,
  "composition.property-conflict": (subject, first, second) =>
    `Extensions ${first} and ${second} both define property ${subject}.`,
  "composition.relation-type-conflict": (subject, first, second) =>
    `Extensions ${first} and ${second} both define relation type ${subject}.`,
  "composition.archetype-id-conflict": (subject, first, second) =>
    `Extensions ${first} and ${second} both define archetype ${subject}.`,
};

export function buildModel(root: LocusDefinition): SemanticModel {
  const diagnostics: Diagnostic[] = [];
  const registered = new Map<string, Registered>();
  const visited = new Set<LocusDefinition>();
  const firstContainer = new Map<LocusDefinition, string | null>();
  const stack: Pending[] = [{ def: root, container: null, depth: 0 }];

  while (stack.length > 0) {
    const { def, container, depth } = stack.pop()!;
    if (visited.has(def)) {
      const first = firstContainer.get(def) ?? null;
      const members = [first, container].filter(
        (id): id is string => id !== null,
      );
      diagnostics.push(
        makeDiagnostic({
          code: "ownership.multiple",
          subject: def.id,
          path: "contains",
          members,
          message: `Locus ${def.id} is contained by both ${first ?? "(root)"} and ${container ?? "(root)"}.`,
        }),
      );
      continue;
    }
    visited.add(def);
    firstContainer.set(def, container);
    if (registered.has(def.id)) {
      diagnostics.push(
        makeDiagnostic({
          code: "identity.duplicate",
          subject: def.id,
          path: "id",
          message: `Locus id ${def.id} is declared by two different Locus objects.`,
        }),
      );
      continue;
    }
    registered.set(def.id, { def, container, depth, children: [] });
    const parent = container === null ? undefined : registered.get(container);
    parent?.children.push(def.id);
    for (let i = def.contains.length - 1; i >= 0; i -= 1) {
      stack.push({
        def: def.contains[i]!,
        container: def.id,
        depth: depth + 1,
      });
    }
  }

  const ids = [...registered.keys()].sort(byCodeUnit);

  for (const id of ids) {
    const { def } = registered.get(id)!;
    if (!isLocusId(id)) {
      diagnostics.push(
        makeDiagnostic({
          code: "identity.malformed",
          subject: id,
          path: "id",
          message: `Locus id "${id}" does not match the identity grammar.`,
        }),
      );
    }
    for (const conflict of def.kind.conflicts) {
      diagnostics.push(
        makeDiagnostic({
          code: conflict.code,
          subject: id,
          path: "kind",
          members: conflict.extensions,
          message: CONFLICT_TEXT[conflict.code](
            conflict.subject,
            conflict.extensions[0] ?? "",
            conflict.extensions[1] ?? "",
          ),
        }),
      );
    }
    if (def.propertyIssues.length > 0) {
      const issues = def.propertyIssues
        .map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`)
        .join("; ");
      diagnostics.push(
        makeDiagnostic({
          code: "property.invalid",
          subject: id,
          path: "properties",
          message: `Properties of ${id} are invalid: ${issues}.`,
        }),
      );
    }
    for (const name of Object.keys(def.capabilities).sort(byCodeUnit)) {
      if (!isCapabilityName(name)) {
        diagnostics.push(
          makeDiagnostic({
            code: "capability.name-malformed",
            subject: id,
            path: `capabilities/${name}`,
            message: `Capability name "${name}" does not match the capability name grammar.`,
          }),
        );
      }
    }
    for (const extension of def.kind.extensions) {
      for (const archetype of extension.archetypes) {
        if (archetype.appliesTo.length === 0) {
          diagnostics.push(
            makeDiagnostic({
              code: "archetype.applies-to-empty",
              subject: id,
              path: "kind",
              members: [archetype.id],
              message: `Archetype ${archetype.id} of extension ${extension.id} has an empty appliesTo list, so it would apply to every Locus.`,
            }),
          );
        }
      }
    }
  }

  const relations: ModelRelation[] = [];
  for (const id of ids) {
    const { def } = registered.get(id)!;
    const seen = new Set<string>();
    def.relations.forEach((relation, index) => {
      const { type, target } = relation;
      const path = `relations/${index}`;
      const key = relationTargetKey(target);
      const report = (code: Diagnostic["code"], message: string) =>
        diagnostics.push(makeDiagnostic({ code, subject: id, path, message }));
      let errors = 0;
      if (!def.kind.relationTypes.includes(type)) {
        report(
          "relation.type-unavailable",
          `Relation type ${type.id} is not declared by any extension of ${id}.`,
        );
        errors += 1;
      }
      const targetLocus = registered.get(target.locus);
      if (targetLocus === undefined) {
        report(
          "relation.target-missing",
          `Relation target ${target.locus} is not in the model.`,
        );
        errors += 1;
      } else if (
        (type.target === "capability") !==
        (target.capability !== null)
      ) {
        report(
          "relation.target-kind",
          `Relation type ${type.id} needs a ${type.target} target, got ${key}.`,
        );
        errors += 1;
      } else if (
        target.capability !== null &&
        !Object.prototype.hasOwnProperty.call(
          targetLocus.def.capabilities,
          target.capability,
        )
      ) {
        report(
          "relation.capability-missing",
          `Locus ${target.locus} has no capability ${target.capability}.`,
        );
        errors += 1;
      }
      if (target.capability === null && target.locus === id) {
        report(
          "relation.self",
          `Locus ${id} relates to itself with ${type.id}.`,
        );
        errors += 1;
      }
      const duplicateKey = `${type.id}\u0000${key}`;
      if (seen.has(duplicateKey)) {
        report(
          "relation.duplicate",
          `Relation ${type.id} to ${key} is declared more than once.`,
        );
      }
      seen.add(duplicateKey);
      relations.push({ from: id, type, target, index, valid: errors === 0 });
    });
  }

  const acyclicEdges = new Map<string, Array<readonly [string, string]>>();
  for (const relation of relations) {
    if (!relation.valid || !relation.type.acyclic) continue;
    if (relation.target.capability !== null) continue;
    const edges = acyclicEdges.get(relation.type.id) ?? [];
    edges.push([relation.from, relation.target.locus]);
    acyclicEdges.set(relation.type.id, edges);
  }
  const rootId = root.id;
  for (const typeId of [...acyclicEdges.keys()].sort(byCodeUnit)) {
    const { cycles, exceeded } = elementaryCycles(
      ids,
      acyclicEdges.get(typeId)!,
    );
    for (const cycle of cycles) {
      const first = cycle[0]!;
      diagnostics.push(
        makeDiagnostic({
          code: "relation.cycle",
          subject: first,
          path: "relations",
          members: cycle,
          message: `${typeId} cycle: ${cycle.join(" -> ")} -> ${first}.`,
        }),
      );
    }
    if (exceeded) {
      diagnostics.push(
        makeDiagnostic({
          code: "relation.cycle-limit",
          subject: rootId,
          path: "relations",
          members: [typeId],
          message: `More than ${MAX_CYCLES} cycles exist for ${typeId}; only the first ${MAX_CYCLES} are reported.`,
        }),
      );
    }
  }

  const extensions = new Map<string, Extension>();
  const archetypes = new Map<string, Archetype>();
  for (const id of ids) {
    for (const extension of registered.get(id)!.def.kind.extensions) {
      if (!extensions.has(extension.id))
        extensions.set(extension.id, extension);
      for (const archetype of extension.archetypes) {
        if (!archetypes.has(archetype.id))
          archetypes.set(archetype.id, archetype);
      }
    }
  }
  const sortedExtensions = new Map(
    [...extensions].sort(([a], [b]) => byCodeUnit(a, b)),
  );
  const sortedArchetypes = new Map(
    [...archetypes].sort(([a], [b]) => byCodeUnit(a, b)),
  );

  const loci = new Map<string, ModelLocus>();
  for (const id of ids) {
    const entry = registered.get(id)!;
    loci.set(
      id,
      Object.freeze({
        definition: entry.def,
        container: entry.container,
        contains: Object.freeze([...entry.children].sort(byCodeUnit)),
        depth: entry.depth,
      }),
    );
  }
  const frozenRelations = Object.freeze(
    relations
      .slice()
      .sort(compareRelations)
      .map((relation) => Object.freeze({ ...relation })),
  );
  return Object.freeze({
    root: rootId,
    ids: Object.freeze(ids),
    loci: readonlyMap(loci),
    relations: frozenRelations,
    extensions: readonlyMap(sortedExtensions),
    archetypes: readonlyMap(sortedArchetypes),
    diagnostics: Object.freeze([...sortDiagnostics(diagnostics)]),
  });
}

export function incoming(
  model: SemanticModel,
  target: string,
): ReadonlyArray<ModelRelation> {
  return Object.freeze(
    model.relations.filter((r) => r.valid && r.target.locus === target),
  );
}

export function outgoing(
  model: SemanticModel,
  from: string,
): ReadonlyArray<ModelRelation> {
  return Object.freeze(model.relations.filter((r) => r.from === from));
}

export function ancestors(
  model: SemanticModel,
  id: string,
): ReadonlyArray<string> {
  const result: string[] = [];
  let current = model.loci.get(id)?.container ?? null;
  while (current !== null) {
    result.push(current);
    current = model.loci.get(current)?.container ?? null;
  }
  return Object.freeze(result);
}

export function hasErrors(model: SemanticModel): boolean {
  return model.diagnostics.some((d) => d.severity === "error");
}
