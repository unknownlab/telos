import { Schema } from "effect";
import { Extension } from "../extension";

export const Purpose = Extension.make("telos.purpose", {
  description:
    "States why a Locus exists, what it is responsible for and what it explicitly excludes.",
  properties: {
    purpose: Schema.String,
    responsibilities: Schema.optionalKey(Schema.Array(Schema.String)),
    excluded: Schema.optionalKey(Schema.Array(Schema.String)),
  },
});
