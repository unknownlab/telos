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
