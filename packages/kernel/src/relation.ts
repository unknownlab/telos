// START_MODULE_CONTRACT
//   PURPOSE: Define relation types and the frozen relations they create between Loci and capabilities.
//   SCOPE: RelationType and CapabilityRef values, relation targets and their keys. Out: validating that targets exist (model and closure work packages).
//   DEPENDS: M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   RelationTarget - the locus id and optional capability name a relation points at
//   CapabilityRef - a typed reference to one capability of one Locus
//   RelationType - a named kind of relation between Loci or capabilities, with its flags
//   Relation - one relation of a Locus, pairing a relation type with its target
//   relationTargetKey - the single string key of a relation target
// END_MODULE_MAP

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

// START_CONTRACT: CapabilityRef
//   PURPOSE: Build a frozen reference to one capability of one Locus.
//   INPUTS: { locus: string - the Locus id, capability: string - the capability name }
//   OUTPUTS: { CapabilityRef - frozen object with _tag CapabilityRef }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: CapabilityRef
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
  // A string with a hash is a capability key; any other string is a Locus id.
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

// START_CONTRACT: RelationType
//   PURPOSE: Create a frozen relation type whose to() builds frozen relations of that type.
//   INPUTS: { id: string - relation type id, options: { description: string, target: "locus" | "capability", acyclic: boolean default false, grantsInvocation: boolean default false } }
//   OUTPUTS: { RelationType<Id> - frozen relation type }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: RelationType
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

// START_CONTRACT: relationTargetKey
//   PURPOSE: Give a relation target one string key, the locus id or the capability key.
//   INPUTS: { target: RelationTarget - the relation target }
//   OUTPUTS: { string - the locus id when no capability, otherwise locus#capability }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: relationTargetKey
export function relationTargetKey(target: RelationTarget): string {
  return target.capability === null
    ? target.locus
    : capabilityKey(target.locus, target.capability);
}
