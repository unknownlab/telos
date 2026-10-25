import { Effect } from "effect";
import {
  Archetype,
  Rule,
  describeCapability,
  inputFields,
  violation,
} from "@telos/kernel";
import {
  WEB_EXTENSION_ID,
  exposedRelations,
  firstExposed,
  formModel,
} from "./form";

export const WebInterface: Archetype = Archetype.make({
  id: "telos.web.interface",
  description:
    "Checks that a web interface Locus exposes uniquely named forms with derivable fields that reject invalid input.",
  appliesTo: [WEB_EXTENSION_ID],
  rules: [
    Rule.make({
      id: "web.forms-exist",
      description: "The interface exposes at least one form.",
      method: "static",
      check: ({ locus, model }) =>
        exposedRelations(model, locus.id).length > 0
          ? Effect.void
          : violation(`Web Locus ${locus.id} exposes no form.`),
    }),
    Rule.make({
      id: "web.unique-forms",
      description: "No two exposed capabilities share a form name.",
      method: "static",
      check: ({ locus, model }) => {
        const names = new Set<string>();
        for (const relation of exposedRelations(model, locus.id)) {
          const name = relation.target.capability ?? "";
          if (names.has(name)) {
            return violation(`Form ${name} is exposed more than once.`);
          }
          names.add(name);
        }
        return Effect.void;
      },
    }),
    Rule.make({
      id: "web.fields-derivable",
      description: "Every field of every form can be derived.",
      method: "static",
      check: ({ locus, model }) =>
        Effect.gen(function* () {
          for (const relation of firstExposed(
            exposedRelations(model, locus.id),
          )) {
            const capability = yield* describeCapability(
              model,
              relation.target.locus,
              relation.target.capability ?? "",
            );
            for (const field of inputFields(capability)) {
              if (field.type === "unsupported") {
                return yield* violation(
                  `Capability ${capability.ref} has an unsupported field ${field.name}.`,
                );
              }
            }
          }
        }),
    }),
    Rule.make({
      id: "web.invalid-input-error",
      description:
        "Every form with a required field answers missing input with InvalidInput.",
      method: "execution",
      check: ({ locus, model }) =>
        Effect.gen(function* () {
          const webModel = yield* formModel(model, locus.id).pipe(Effect.orDie);
          for (const form of webModel.forms) {
            if (!form.fields.some((field) => field.required)) continue;
            const outcome = yield* form.submit({});
            if (outcome.ok || outcome.error.tag !== "InvalidInput") {
              return yield* violation(
                `Form ${form.name} does not answer missing input with InvalidInput.`,
              );
            }
          }
        }),
    }),
  ],
});
