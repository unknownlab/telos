// START_MODULE_CONTRACT
//   PURPOSE: Derive the UI-independent form model of a web interface Locus, one form per exposed capability, and invoke the submitted capability through the kernel.
//   SCOPE: The form id constants, exposure rules, WebField and WebFormDefinition mapping, and formModel. Out: the Extension and RelationType values (semantics.ts) and the archetype rules (archetype.ts).
//   DEPENDS: M-KERNEL-API
//   LINKS: M-PACK-WEB, V-M-PACK-WEB
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   WEB_FORM_TYPE - the relation type id of a web form relation
//   WEB_EXTENSION_ID - the extension id that marks a Locus as a web interface
//   WebField - one field of a form with its label, input type and input mode
//   WebFormDefinition - one form with its name, reference, fields and submit action
//   WebFormModel - the forms of one web interface Locus with its title
//   exposedRelations - the valid web form relations of a Locus, sorted by capability name then Locus id
//   firstExposed - the first valid web form relation per capability name
//   formModel - derives the form model of a web interface Locus
// END_MODULE_MAP

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

// START_CONTRACT: WEB_FORM_TYPE
//   PURPOSE: Name the relation type that exposes a capability as a web form.
//   INPUTS: none
//   OUTPUTS: { "web.form" - the relation type id }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WEB_FORM_TYPE
export const WEB_FORM_TYPE = "web.form";

// START_CONTRACT: WEB_EXTENSION_ID
//   PURPOSE: Name the extension that marks a Locus as a web interface.
//   INPUTS: none
//   OUTPUTS: { "telos.web" - the extension id }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WEB_EXTENSION_ID
export const WEB_EXTENSION_ID = "telos.web";

// START_CONTRACT: WebField
//   PURPOSE: Describe one form field for a user interface.
//   INPUTS: none (type only)
//   OUTPUTS: { WebField - name, label, type, required, inputMode and description }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WebField
export interface WebField {
  readonly name: string;
  readonly label: string;
  readonly type: InputFieldType;
  readonly required: boolean;
  readonly inputMode: "decimal" | "numeric" | "text";
  readonly description: string | null;
}

// START_CONTRACT: WebFormDefinition
//   PURPOSE: Describe one form named after an exposed capability and submit it through the kernel.
//   INPUTS: none (type only)
//   OUTPUTS: { WebFormDefinition - name, ref, description, fields and submit }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WebFormDefinition
export interface WebFormDefinition {
  readonly name: string;
  readonly ref: string;
  readonly description: string;
  readonly fields: ReadonlyArray<WebField>;
  readonly submit: (
    raw: Readonly<Record<string, string | undefined>>,
  ) => Effect.Effect<InvocationOutcome>;
}

// START_CONTRACT: WebFormModel
//   PURPOSE: Hold the forms of one web interface Locus with its page title.
//   INPUTS: none (type only)
//   OUTPUTS: { WebFormModel - locus, title and forms }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WebFormModel
export interface WebFormModel {
  readonly locus: string;
  readonly title: string;
  readonly forms: ReadonlyArray<WebFormDefinition>;
}

const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

// START_CONTRACT: exposedRelations
//   PURPOSE: List the valid web form relations of a web interface Locus in the shared exposure order.
//   INPUTS: { model: SemanticModel - a built model; locusId: string - the web interface Locus id }
//   OUTPUTS: { ReadonlyArray<ModelRelation> - valid web.form relations sorted by capability name then Locus id; empty for an unknown Locus }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: exposedRelations
/** The valid web form relations of a Locus, sorted by capability name, then by target Locus id. */
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

// START_CONTRACT: firstExposed
//   PURPOSE: Keep the first exposed relation of each capability name, so that each name gives one form.
//   INPUTS: { relations: ReadonlyArray<ModelRelation> - relations already in the exposure order }
//   OUTPUTS: { ReadonlyArray<ModelRelation> - one relation per capability name, in the same order }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: firstExposed
/** The first relation of each capability name, in the given order. */
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

// START_CONTRACT: formModel
//   PURPOSE: Derive the forms of a web interface Locus, one per exposed capability, with submit going through kernel invoke.
//   INPUTS: { model: SemanticModel - a built model; webLocusId: string - the web interface Locus id }
//   OUTPUTS: { Effect<WebFormModel, LocusNotFound> - the form model; fails when the id is unknown or the Locus lacks the telos.web extension }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: formModel
/** The form model of a web interface Locus. Each submit invokes the capability with the web Locus as the invoker. */
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
