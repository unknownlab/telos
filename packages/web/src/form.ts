import { Effect } from "effect";
import {
  CapabilityRef,
  LocusNotFound,
  coerceInput,
  describeCapability,
  inputFields,
  invoke,
  type InputField,
  type InputFieldType,
  type InvocationOutcome,
  type ModelRelation,
  type SemanticModel,
} from "@telos/kernel";

export const WEB_FORM_TYPE = "web.form";

export const WEB_EXTENSION_ID = "telos.web";

export interface WebField {
  readonly name: string;
  readonly label: string;
  readonly type: InputFieldType;
  readonly required: boolean;
  readonly inputMode: "decimal" | "numeric" | "text";
  readonly description: string | null;
}

export interface WebFormDefinition {
  readonly name: string;
  readonly ref: string;
  readonly description: string;
  readonly fields: ReadonlyArray<WebField>;
  readonly submit: (
    raw: Readonly<Record<string, string | undefined>>,
  ) => Effect.Effect<InvocationOutcome>;
}

export interface WebFormModel {
  readonly locus: string;
  readonly title: string;
  readonly forms: ReadonlyArray<WebFormDefinition>;
}

const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

export function exposedRelations(
  model: SemanticModel,
  locusId: string,
): ReadonlyArray<ModelRelation> {
  return model.relations
    .filter(
      (relation) =>
        relation.valid &&
        relation.from === locusId &&
        relation.type.id === WEB_FORM_TYPE,
    )
    .slice()
    .sort(
      (a, b) =>
        byCodeUnit(a.target.capability ?? "", b.target.capability ?? "") ||
        byCodeUnit(a.target.locus, b.target.locus),
    );
}

export function firstExposed(
  relations: ReadonlyArray<ModelRelation>,
): ReadonlyArray<ModelRelation> {
  const seen = new Set<string>();
  return relations.filter((relation) => {
    const name = relation.target.capability ?? "";
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

const inputModeOf = (type: InputFieldType): WebField["inputMode"] =>
  type === "number" ? "decimal" : type === "integer" ? "numeric" : "text";

const toWebField = (field: InputField): WebField => ({
  name: field.name,
  label: field.name.charAt(0).toUpperCase() + field.name.slice(1),
  type: field.type,
  required: field.required,
  inputMode: inputModeOf(field.type),
  description: field.description,
});

export const formModel = (
  model: SemanticModel,
  webLocusId: string,
): Effect.Effect<WebFormModel, LocusNotFound> =>
  Effect.gen(function* () {
    const locus = model.loci.get(webLocusId);
    const isWeb =
      locus !== undefined &&
      locus.definition.kind.extensions.some((e) => e.id === WEB_EXTENSION_ID);
    if (locus === undefined || !isWeb) {
      return yield* Effect.fail(
        new LocusNotFound({
          id: webLocusId,
          message: `No web Locus ${webLocusId} in the model.`,
        }),
      );
    }
    const title = String(locus.definition.properties["title"]);
    const forms: WebFormDefinition[] = [];
    for (const relation of firstExposed(exposedRelations(model, webLocusId))) {
      const capability = relation.target.capability ?? "";
      const description = yield* describeCapability(
        model,
        relation.target.locus,
        capability,
      );
      const fields = inputFields(description);
      const ref = CapabilityRef.make(relation.target.locus, capability);
      forms.push({
        name: capability,
        ref: description.ref,
        description: description.description,
        fields: fields.map(toWebField),
        submit: (raw) =>
          invoke(model, ref, coerceInput(fields, raw), { via: webLocusId }),
      });
    }
    return { locus: webLocusId, title, forms };
  });
