// START_MODULE_CONTRACT
//   PURPOSE: Derive input fields from a capability description and turn raw text into input values the same way for every interface.
//   SCOPE: InputFieldType, InputField, inputFields and coerceInput. Out: decoding the input (invoke.ts) and rendering any interface.
//   DEPENDS: M-KERNEL-DESCRIBE
//   LINKS: M-KERNEL-DESCRIBE, V-M-KERNEL-DESCRIBE
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   InputFieldType - the field types an interface can show: number, integer, string, boolean or unsupported
//   InputField - one input field with its name, type, required flag and description
//   inputFields - the input fields of a capability description, in property order
//   coerceInput - turns the raw text of each field into its input value
// END_MODULE_MAP

import type { CapabilityDescription } from "./describe";

export type InputFieldType =
  "number" | "integer" | "string" | "boolean" | "unsupported";

export interface InputField {
  readonly name: string;
  readonly type: InputFieldType;
  readonly required: boolean;
  readonly description: string | null;
}

const REF_PATTERN = /^#\/\$defs\/(.+)$/;

type Json = Readonly<Record<string, unknown>>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Resolves one "#/$defs/<Name>" reference through the definitions. Any other schema is returned as it is.
function resolveOnce(schema: unknown, definitions: Json): unknown {
  if (!isObject(schema) || typeof schema["$ref"] !== "string") return schema;
  const match = REF_PATTERN.exec(schema["$ref"]);
  if (match === null) return schema;
  return definitions[match[1]!];
}

function fieldTypeOf(schema: unknown): InputFieldType {
  const type = isObject(schema) ? schema["type"] : undefined;
  return type === "number" ||
    type === "integer" ||
    type === "string" ||
    type === "boolean"
    ? type
    : "unsupported";
}

// START_CONTRACT: inputFields
//   PURPOSE: List the input fields of a capability, one per property of its input object schema.
//   INPUTS: { capability: CapabilityDescription - a described capability whose input document is used }
//   OUTPUTS: { ReadonlyArray<InputField> - fields in property order; empty when the input is not an object with properties }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: inputFields
/** The input fields of a capability. $ref is resolved once at the top level and for each property. */
export function inputFields(
  capability: CapabilityDescription,
): ReadonlyArray<InputField> {
  const definitions = capability.input.definitions;
  const top = resolveOnce(capability.input.schema, definitions);
  const properties = isObject(top) ? top["properties"] : undefined;
  if (!isObject(top) || top["type"] !== "object" || !isObject(properties))
    return Object.freeze([]);
  const required: ReadonlyArray<unknown> = Array.isArray(top["required"])
    ? top["required"]
    : [];
  return Object.freeze(
    Object.keys(properties).map((name) => {
      const original = properties[name];
      const resolved = resolveOnce(original, definitions);
      const description =
        isObject(original) && typeof original["description"] === "string"
          ? original["description"]
          : null;
      return {
        name,
        type: fieldTypeOf(resolved),
        required: required.includes(name),
        description,
      };
    }),
  );
}

// START_CONTRACT: coerceInput
//   PURPOSE: Turn the raw text of each field into its input value, keeping the text when it cannot be converted.
//   INPUTS: { fields: ReadonlyArray<InputField> - the fields; raw: Record<string, string | undefined> - the raw text by field name }
//   OUTPUTS: { Record<string, unknown> - the coerced values of the fields that have raw text; absent fields are omitted }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DESCRIBE
// END_CONTRACT: coerceInput
/** Coerces the raw text of each present field to the value its type expects. */
export function coerceInput(
  fields: ReadonlyArray<InputField>,
  raw: Readonly<Record<string, string | undefined>>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(raw, field.name)) continue;
    const text = raw[field.name];
    if (text === undefined) continue;
    switch (field.type) {
      case "number":
      case "integer": {
        if (text.trim() === "") {
          result[field.name] = text;
          break;
        }
        const value = Number(text.trim());
        result[field.name] = Number.isNaN(value) ? text : value;
        break;
      }
      case "boolean":
        result[field.name] =
          text === "true" ? true : text === "false" ? false : text;
        break;
      default:
        result[field.name] = text;
    }
  }
  return result;
}
