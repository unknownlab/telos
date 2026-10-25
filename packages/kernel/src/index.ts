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
