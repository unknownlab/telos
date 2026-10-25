import { capabilityKey, parseCapabilityKey } from "./identity";

export interface RelationTarget {
  readonly locus: string;
  readonly capability: string | null;
}

export interface CapabilityRef {
  readonly _tag: "CapabilityRef";
  readonly locus: string;
  readonly capability: string;
}

export const CapabilityRef = {
  make: (locus: string, capability: string): CapabilityRef =>
    Object.freeze({ _tag: "CapabilityRef", locus, capability }),
};

export interface RelationType<Id extends string = string> {
  readonly _tag: "RelationType";
  readonly id: Id;
  readonly description: string;
  readonly target: "locus" | "capability";
  readonly acyclic: boolean;
  readonly grantsInvocation: boolean;
  readonly to: (
    target: { readonly id: string } | CapabilityRef | string,
  ) => Relation;
}

export interface Relation {
  readonly type: RelationType;
  readonly target: RelationTarget;
}

function targetOf(
  target: { readonly id: string } | CapabilityRef | string,
): RelationTarget {
  if (typeof target === "string") {
    const parsed = target.includes("#") ? parseCapabilityKey(target) : null;
    return parsed === null
      ? { locus: target, capability: null }
      : { locus: parsed.locus, capability: parsed.capability };
  }
  if ("_tag" in target && target._tag === "CapabilityRef")
    return { locus: target.locus, capability: target.capability };
  return { locus: (target as { readonly id: string }).id, capability: null };
}

export const RelationType = {
  make: <const Id extends string>(
    id: Id,
    options: {
      readonly description: string;
      readonly target: "locus" | "capability";
      readonly acyclic?: boolean;
      readonly grantsInvocation?: boolean;
    },
  ): RelationType<Id> => {
    const type: RelationType<Id> = Object.freeze({
      _tag: "RelationType",
      id,
      description: options.description,
      target: options.target,
      acyclic: options.acyclic ?? false,
      grantsInvocation: options.grantsInvocation ?? false,
      to: (
        target: { readonly id: string } | CapabilityRef | string,
      ): Relation =>
        Object.freeze({ type, target: Object.freeze(targetOf(target)) }),
    });
    return type;
  },
};

export function relationTargetKey(target: RelationTarget): string {
  return target.capability === null
    ? target.locus
    : capabilityKey(target.locus, target.capability);
}
