// START_MODULE_CONTRACT
//   PURPOSE: Be the public entry of the kernel and re-export exactly the names of the kernel contract.
//   SCOPE: Re-exports only. It declares nothing and never exports the internal helpers deepFreeze, sortKeys, makeDiagnostic, sortDiagnostics, SEVERITY, elementaryCycles or MAX_CYCLES, and never exports the Bun-only closure module.
//   DEPENDS: M-KERNEL-IDENTITY, M-KERNEL-CANONICAL, M-KERNEL-DIAGNOSTIC, M-KERNEL-DEFINITIONS, M-KERNEL-MODEL, M-KERNEL-VERIFY, M-KERNEL-DESCRIBE, M-KERNEL-INVOKE, M-KERNEL-DECODE, M-KERNEL-INTROSPECTION, M-KERNEL-IMPACT
//   LINKS: M-KERNEL-API, V-M-KERNEL-API
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   LOCUS_ID_PATTERN - the pattern of a valid Locus id
//   EXTENSION_ID_PATTERN - the pattern of a valid extension id
//   CAPABILITY_NAME_PATTERN - the pattern of a valid capability name
//   isLocusId - true when a string is a valid Locus id
//   isExtensionId - true when a string is a valid extension id
//   isCapabilityName - true when a string is a valid capability name
//   capabilityKey - the key "<locus>#<capability>" of a capability
//   parseCapabilityKey - splits a capability key at its last hash
//   canonicalJson - the canonical JSON text of a value
//   jsonEqual - true when two values have the same canonical JSON
//   digestOf - the sha256 digest of the canonical JSON of a value
//   Digest - a sha256 digest string
//   Diagnostic - one structural diagnostic of a model
//   DiagnosticCode - the code of a diagnostic
//   Severity - the severity of a diagnostic
//   compareDiagnostics - orders two diagnostics deterministically
//   RelationType - a named relation type that a Locus can use
//   Relation - one relation of a Locus with its target
//   RelationTarget - the Locus and optional capability that a relation points at
//   CapabilityRef - a reference to one capability of a Locus
//   relationTargetKey - the key of a relation target
//   Capability - a capability with its contract and handler
//   EffectClass - the effect class of a capability
//   ErrorSchema - the schema of a declared capability error
//   errorTag - the tag of a declared capability error schema
//   Extension - a named set of properties, relation types and archetypes
//   Archetype - a named set of rules applied to Loci of some kinds
//   Rule - one rule of an archetype
//   RuleViolation - the typed failure of a rule that does not hold
//   RuleContext - the Locus and the model a rule is applied to
//   RuleMethod - whether a rule is static or an execution rule
//   violation - fails a rule with a message
//   Locus - the Locus kind to extend and define Loci with
//   LocusKind - a Locus kind with its extensions
//   LocusDefinition - a Locus definition with its containers, relations and capabilities
//   CompositionConflict - a conflict found while composing extensions
//   MergedFields - the property fields of a set of extensions
//   PropertiesOf - the property type of a set of extensions
//   Purpose - the extension that gives a Locus a purpose
//   Source - the extension that describes the sources of a Locus
//   SourceDependsOn - the relation type from a source to what it depends on
//   External - the extension that marks a Locus as external
//   SemanticModel - the frozen model built from a root Locus
//   ModelLocus - one Locus of a semantic model
//   ModelRelation - one relation of a semantic model
//   buildModel - builds the semantic model of a root Locus
//   incoming - the valid relations that point at a Locus
//   outgoing - every relation that starts at a Locus
//   ancestors - the containers of a Locus, nearest first
//   hasErrors - true when a model has an error diagnostic
//   verify - runs the rules of a model and reports every outcome
//   applicableArchetypes - the archetypes that apply to a Locus
//   VerifyOptions - the options of a verification run
//   VerificationReport - the report of a verification run with provenance
//   Finding - the outcome of one rule of one Locus
//   Outcome - the outcome of a rule
//   Provenance - the runner and the times of a verification run
//   Knowledge - the knowledge status of a described fact
//   JsonSchemaDocument - a JSON Schema with its dialect and definitions
//   toJsonSchema - the JSON Schema document of a schema
//   describeLocus - describes one Locus as JSON
//   describeModel - describes a whole model as JSON
//   describeCapability - describes one capability as JSON
//   describeVerifications - the verification state of a Locus
//   LocusDescription - the description of one Locus
//   ModelDescription - the description of a whole model
//   CapabilityDescription - the description of one capability
//   RelationDescription - the description of one relation
//   VerificationDescription - the description of one rule outcome
//   invoke - runs a capability through its grant and contract checks
//   isGranted - true when a Locus may invoke a capability
//   InvocationOutcome - the value outcome of an invocation
//   InvocationError - the error of a failed invocation
//   InvocationIssue - one issue of an invalid input or output
//   InvokeOptions - the options of an invocation
//   inputFields - the input fields derived from a capability
//   coerceInput - coerces text into a typed input
//   InputField - one field of a capability input
//   InputFieldType - the type of an input field
//   decodeLocus - decodes JSON into a Locus definition
//   decodeLocusText - decodes JSON text into a Locus definition
//   LocusJson - the JSON shape of a Locus
//   LocusJsonSchema - the schema of the JSON shape of a Locus
//   DecodeResult - the result of decoding a Locus
//   DecodeIssue - one issue found while decoding a Locus
//   ExtensionRegistry - the extensions that a decoder knows by id
//   FieldType - the type of a decoded field
//   Telos - the Effect service that serves the kernel to agents and tools
//   TelosApi - the surface of the Telos service
//   LocusView - one Locus as seen through the Telos service
//   LocusNotFound - typed failure for a Locus id that is not in the model
//   CapabilityNotFound - typed failure for a capability that the Locus does not have
//   impact - the Loci affected by a target and the checks that apply to them
//   ImpactReport - the derived impact of a target
//   AffectedLocus - one Locus affected by a target with its path
//   diffModels - the changes between two models
//   ModelChange - one change between two models
//   ModelChangeKind - the kind of a model change
// END_MODULE_MAP

export {
  CAPABILITY_NAME_PATTERN,
  EXTENSION_ID_PATTERN,
  LOCUS_ID_PATTERN,
  capabilityKey,
  isCapabilityName,
  isExtensionId,
  isLocusId,
  parseCapabilityKey,
} from "./identity";
export { canonicalJson, jsonEqual } from "./canonical";
export { digestOf } from "./digest";
export type { Digest } from "./digest";
export { compareDiagnostics } from "./diagnostic";
export type { Diagnostic, DiagnosticCode, Severity } from "./diagnostic";
export { CapabilityRef, RelationType, relationTargetKey } from "./relation";
export type { Relation, RelationTarget } from "./relation";
export { Capability, errorTag } from "./capability";
export type { EffectClass, ErrorSchema } from "./capability";
export { Extension } from "./extension";
export { Archetype, Rule, RuleViolation, violation } from "./archetype";
export type { RuleContext, RuleMethod } from "./archetype";
export { Locus } from "./locus";
export type {
  CompositionConflict,
  LocusDefinition,
  LocusKind,
  MergedFields,
  PropertiesOf,
} from "./locus";
export { Purpose } from "./extensions/purpose";
export { External, Source, SourceDependsOn } from "./extensions/source";
export { ancestors, buildModel, hasErrors, incoming, outgoing } from "./model";
export type { ModelLocus, ModelRelation, SemanticModel } from "./model";
export { applicableArchetypes, verify } from "./verify";
export type {
  Finding,
  Outcome,
  Provenance,
  VerificationReport,
  VerifyOptions,
} from "./verify";
export {
  describeCapability,
  describeLocus,
  describeModel,
  describeVerifications,
  toJsonSchema,
} from "./describe";
export type {
  CapabilityDescription,
  JsonSchemaDocument,
  Knowledge,
  LocusDescription,
  ModelDescription,
  RelationDescription,
  VerificationDescription,
} from "./describe";
export { invoke, isGranted } from "./invoke";
export type {
  InvocationError,
  InvocationIssue,
  InvocationOutcome,
  InvokeOptions,
} from "./invoke";
export { coerceInput, inputFields } from "./fields";
export type { InputField, InputFieldType } from "./fields";
export { LocusJsonSchema, decodeLocus, decodeLocusText } from "./decode";
export type {
  DecodeIssue,
  DecodeResult,
  ExtensionRegistry,
  FieldType,
  LocusJson,
} from "./decode";
export { LocusNotFound, CapabilityNotFound, Telos } from "./introspection";
export type { LocusView, TelosApi } from "./introspection";
export { diffModels, impact } from "./impact";
export type {
  AffectedLocus,
  ImpactReport,
  ModelChange,
  ModelChangeKind,
} from "./impact";
