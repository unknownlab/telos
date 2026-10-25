import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import * as Kernel from "../src/index";
import type {
  AffectedLocus,
  CapabilityDescription,
  CapabilityNotFound,
  CompositionConflict,
  DecodeIssue,
  DecodeResult,
  Diagnostic,
  DiagnosticCode,
  Digest,
  EffectClass,
  ErrorSchema,
  ExtensionRegistry,
  Finding,
  FieldType,
  ImpactReport,
  InputField,
  InputFieldType,
  InvocationError,
  InvocationIssue,
  InvocationOutcome,
  InvokeOptions,
  JsonSchemaDocument,
  Knowledge,
  LocusDefinition,
  LocusDescription,
  LocusJson,
  LocusKind,
  LocusNotFound,
  LocusView,
  MergedFields,
  ModelChange,
  ModelChangeKind,
  ModelDescription,
  ModelLocus,
  ModelRelation,
  Outcome,
  PropertiesOf,
  Provenance,
  Relation,
  RelationDescription,
  RelationTarget,
  RuleContext,
  RuleMethod,
  SemanticModel,
  Severity,
  TelosApi,
  VerificationDescription,
  VerificationReport,
  VerifyOptions,
} from "../src/index";

const expectedValues = [
  "Archetype",
  "CAPABILITY_NAME_PATTERN",
  "Capability",
  "CapabilityNotFound",
  "CapabilityRef",
  "EXTENSION_ID_PATTERN",
  "Extension",
  "External",
  "LOCUS_ID_PATTERN",
  "Locus",
  "LocusJsonSchema",
  "LocusNotFound",
  "Purpose",
  "RelationType",
  "Rule",
  "RuleViolation",
  "Source",
  "SourceDependsOn",
  "Telos",
  "ancestors",
  "applicableArchetypes",
  "buildModel",
  "canonicalJson",
  "capabilityKey",
  "coerceInput",
  "compareDiagnostics",
  "decodeLocus",
  "decodeLocusText",
  "describeCapability",
  "describeLocus",
  "describeModel",
  "describeVerifications",
  "diffModels",
  "digestOf",
  "errorTag",
  "hasErrors",
  "impact",
  "incoming",
  "inputFields",
  "invoke",
  "isCapabilityName",
  "isExtensionId",
  "isGranted",
  "isLocusId",
  "jsonEqual",
  "outgoing",
  "parseCapabilityKey",
  "relationTargetKey",
  "toJsonSchema",
  "verify",
  "violation",
];

export type ContractTypeNames = [
  AffectedLocus,
  CapabilityDescription,
  CapabilityNotFound,
  CompositionConflict,
  DecodeIssue,
  DecodeResult,
  Diagnostic,
  DiagnosticCode,
  Digest,
  EffectClass,
  ErrorSchema,
  ExtensionRegistry,
  FieldType,
  Finding,
  ImpactReport,
  InputField,
  InputFieldType,
  InvocationError,
  InvocationIssue,
  InvocationOutcome,
  InvokeOptions,
  JsonSchemaDocument,
  Knowledge,
  LocusDefinition,
  LocusDescription,
  LocusJson,
  LocusKind<readonly []>,
  LocusNotFound,
  LocusView,
  MergedFields<readonly []>,
  ModelChange,
  ModelChangeKind,
  ModelDescription,
  ModelLocus,
  ModelRelation,
  Outcome,
  PropertiesOf<readonly []>,
  Provenance,
  Relation,
  RelationDescription,
  RelationTarget,
  RuleContext,
  RuleMethod,
  SemanticModel,
  Severity,
  TelosApi,
  VerificationDescription,
  VerificationReport,
  VerifyOptions,
];

const forbiddenPackages = ["bun", "react"];
const forbiddenPrefixes = [
  "bun:",
  "node:",
  "effect/cli",
  "effect/ai",
  "effect/process",
  "@telos/",
];

function resolveRelative(fromFile: string, specifier: string): string {
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [`${base}.ts`, join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`Cannot resolve ${specifier} from ${fromFile}`);
}

function importsOf(file: string): ReadonlyArray<string> {
  const transpiler = new Bun.Transpiler({ loader: "ts" });
  return transpiler
    .scanImports(readFileSync(file, "utf8"))
    .map((entry) => entry.path);
}

function reachableFrom(entry: string): {
  readonly files: ReadonlySet<string>;
  readonly packages: ReadonlySet<string>;
} {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (files.has(file)) continue;
    files.add(file);
    for (const specifier of importsOf(file)) {
      if (specifier.startsWith(".")) {
        queue.push(resolveRelative(file, specifier));
      } else {
        packages.add(specifier);
      }
    }
  }
  return { files, packages };
}

describe("public API", () => {
  test("the value exports are exactly the contract names", () => {
    expect(Object.keys(Kernel).sort()).toEqual([...expectedValues].sort());
  });

  test("the main entry never reaches closure.ts, Bun, node, React, effect platform modules or Packs", () => {
    const entry = resolve(import.meta.dir, "../src/index.ts");
    const { files, packages } = reachableFrom(entry);

    expect(files.has(resolve(import.meta.dir, "../src/index.ts"))).toBe(true);
    expect([...files].some((file) => file.endsWith("/closure.ts"))).toBe(false);
    expect(
      [...packages].filter((name) => forbiddenPackages.includes(name)),
    ).toEqual([]);
    expect(
      [...packages].filter((name) =>
        forbiddenPrefixes.some((prefix) => name.startsWith(prefix)),
      ),
    ).toEqual([]);
  });
});
