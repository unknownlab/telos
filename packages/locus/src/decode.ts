// START_MODULE_CONTRACT
//   PURPOSE: Decode the JSON wire format of a Fabric or a Locus into frozen definitions, reporting every problem as a located decode error.
//   SCOPE: decodeFabric, decodeFabricJson, decodeLocus, the wire types FabricJson and LocusJson, and the 1,048,576-character text limit. Out: rule validation, which reports diagnostics instead of decode errors (WP03).
//   DEPENDS: M-LOCUS-MODEL
//   LINKS: M-LOCUS-DECODE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MAX_INPUT_LENGTH - largest accepted text, in UTF-16 code units
//   LocusJson - JSON shape of one Locus; identical to LocusInput
//   FabricJson - JSON shape of a Fabric
//   decodeLocus - decodes one Locus object into a frozen LocusDefinition or a DecodeError
//   decodeFabric - decodes a Fabric object into a frozen Fabric or a DecodeError
//   decodeFabricJson - rejects over-long text, parses JSON, then decodes it with decodeFabric
// END_MODULE_MAP

import { Effect, Schema, SchemaIssue } from "effect";
import { DecodeError } from "./errors";
import { defineFabric, type Fabric } from "./fabric";
import { defineLocus, type LocusDefinition, type LocusInput } from "./locus";
import { RELATION_KINDS } from "./relation";

// START_CONTRACT: MAX_INPUT_LENGTH
//   PURPOSE: Bound the size of external JSON text before it is parsed.
//   INPUTS: none
//   OUTPUTS: { number - 1048576, the largest text length in UTF-16 code units that decodeFabricJson accepts }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-DECODE
// END_CONTRACT: MAX_INPUT_LENGTH
/** Largest accepted JSON text, in UTF-16 code units (1 MB). Longer text is refused before parsing. */
export const MAX_INPUT_LENGTH = 1_048_576;

// Schema values are internal. Consumers see only the TypeScript types below.
const RelationJsonSchema = Schema.Struct({
  kind: Schema.Literals(RELATION_KINDS),
  target: Schema.String,
});

const CharterJsonSchema = Schema.Struct({
  purpose: Schema.String,
  responsibilities: Schema.Array(Schema.String),
  excluded: Schema.optionalKey(Schema.Array(Schema.String)),
  successConditions: Schema.optionalKey(Schema.Array(Schema.String)),
});

const LocusJsonSchema = Schema.Struct({
  id: Schema.String,
  charter: CharterJsonSchema,
  owner: Schema.optionalKey(Schema.String),
  relations: Schema.optionalKey(Schema.Array(RelationJsonSchema)),
  metadata: Schema.optionalKey(Schema.Record(Schema.String, Schema.String)),
});

const FabricJsonSchema = Schema.Struct({
  id: Schema.String,
  loci: Schema.Array(LocusJsonSchema),
});

// START_CONTRACT: LocusJson
//   PURPOSE: Name the JSON shape of one Locus in the wire format.
//   INPUTS: none
//   OUTPUTS: { LocusJson - the same shape as LocusInput }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-DECODE
// END_CONTRACT: LocusJson
/** JSON shape of one Locus; identical to LocusInput. */
export type LocusJson = LocusInput;

// START_CONTRACT: FabricJson
//   PURPOSE: Name the JSON shape of a Fabric in the wire format.
//   INPUTS: none
//   OUTPUTS: { FabricJson - readonly id: string; loci: ReadonlyArray<LocusJson> }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-DECODE
// END_CONTRACT: FabricJson
/** JSON shape of a Fabric. */
export interface FabricJson {
  readonly id: string;
  readonly loci: ReadonlyArray<LocusJson>;
}

type DecodeIssue = { readonly path: string; readonly message: string };

const formatter = SchemaIssue.makeFormatterStandardSchemaV1();

const segment = (p: unknown): PropertyKey =>
  typeof p === "object" && p !== null && "key" in p
    ? (p as { key: PropertyKey }).key
    : (p as PropertyKey);

// Dot form for keys and bracket form for indexes: ["loci", 0, "charter"] -> "loci[0].charter".
const toPath = (path: ReadonlyArray<unknown>): string =>
  path
    .map(segment)
    .map((k, i) =>
      typeof k === "number" ? `[${k}]` : i === 0 ? String(k) : `.${String(k)}`,
    )
    .join("");

const byPathThenMessage = (a: DecodeIssue, b: DecodeIssue): number =>
  a.path < b.path
    ? -1
    : a.path > b.path
      ? 1
      : a.message < b.message
        ? -1
        : a.message > b.message
          ? 1
          : 0;

// Converts a schema failure into a DecodeError with sorted, located issues.
// A DecodeError always carries at least one issue.
const toDecodeError = (issue: SchemaIssue.Issue): DecodeError => {
  const issues: DecodeIssue[] = formatter(issue)
    .issues.map((i) => ({ path: toPath(i.path ?? []), message: i.message }))
    .sort(byPathThenMessage);
  return new DecodeError({
    issues: Object.freeze(
      issues.length > 0 ? issues : [{ path: "", message: "Invalid input" }],
    ),
  });
};

const decodeOptions = { onExcessProperty: "error", errors: "all" } as const;

// START_CONTRACT: decodeLocus
//   PURPOSE: Decode one Locus object from the wire format into a frozen definition.
//   INPUTS: { input: unknown - a value parsed from JSON or built by a caller }
//   OUTPUTS: { Effect<LocusDefinition, DecodeError> - the definition built with defineLocus, or every located issue }
//   SIDE_EFFECTS: none. Unknown keys, wrong types, missing keys and unknown Relation kinds fail. Identity grammar, blank strings and duplicates do not fail; validation reports them.
//   LINKS: M-LOCUS-DECODE
// END_CONTRACT: decodeLocus
/** Decodes one Locus object. Errors are located; rule violations are not decode errors. */
export const decodeLocus = (
  input: unknown,
): Effect.Effect<LocusDefinition, DecodeError> =>
  Schema.decodeUnknownEffect(LocusJsonSchema)(input, decodeOptions).pipe(
    Effect.mapError((e) => toDecodeError(e.issue)),
    Effect.map((json) => defineLocus(json)),
  );

// START_CONTRACT: decodeFabric
//   PURPOSE: Decode a Fabric object from the wire format into a frozen Fabric.
//   INPUTS: { input: unknown - a value parsed from JSON or built by a caller }
//   OUTPUTS: { Effect<Fabric, DecodeError> - the Fabric built with defineFabric and defineLocus, or every located issue }
//   SIDE_EFFECTS: none. Unknown keys, wrong types, missing keys and unknown Relation kinds fail. Identity grammar, blank strings and duplicates do not fail; validation reports them.
//   LINKS: M-LOCUS-DECODE
// END_CONTRACT: decodeFabric
/** Decodes a Fabric object. Errors are located; rule violations are not decode errors. */
export const decodeFabric = (
  input: unknown,
): Effect.Effect<Fabric, DecodeError> =>
  Schema.decodeUnknownEffect(FabricJsonSchema)(input, decodeOptions).pipe(
    Effect.mapError((e) => toDecodeError(e.issue)),
    Effect.map((json) =>
      defineFabric({
        id: json.id,
        loci: json.loci.map((l) => defineLocus(l)),
      }),
    ),
  );

// START_CONTRACT: decodeFabricJson
//   PURPOSE: Decode Fabric JSON text, refusing over-long text before any parsing.
//   INPUTS: { text: string - JSON text, at most MAX_INPUT_LENGTH code units }
//   OUTPUTS: { Effect<Fabric, DecodeError> - a frozen Fabric, or a single issue at path "" for over-long or unparseable text, or the decodeFabric issues }
//   SIDE_EFFECTS: none. Parses the text with JSON.parse only after the length check.
//   LINKS: M-LOCUS-DECODE
// END_CONTRACT: decodeFabricJson
/** Decodes Fabric JSON text. Over-long text and JSON syntax errors give one issue at path "". */
export const decodeFabricJson = (
  text: string,
): Effect.Effect<Fabric, DecodeError> =>
  text.length > MAX_INPUT_LENGTH
    ? Effect.fail(
        new DecodeError({
          issues: [
            {
              path: "",
              message: `Input is longer than ${MAX_INPUT_LENGTH} characters.`,
            },
          ],
        }),
      )
    : Effect.try({
        try: () => JSON.parse(text) as unknown,
        catch: (e) =>
          new DecodeError({
            issues: [
              {
                path: "",
                message:
                  (e instanceof Error ? e.message : String(e)) ||
                  "Invalid JSON",
              },
            ],
          }),
      }).pipe(Effect.flatMap(decodeFabric));
