import { Schema } from "effect";
import { Extension, RelationType } from "@telos/kernel";
import { WEB_EXTENSION_ID, WEB_FORM_TYPE } from "./form";
import { WebInterface } from "./archetype";

export const WebForm = RelationType.make(WEB_FORM_TYPE, {
  description:
    "Exposes the target capability as a web form named after the capability.",
  target: "capability",
  grantsInvocation: true,
});

export const WebSemantics = Extension.make(WEB_EXTENSION_ID, {
  description:
    "Marks a Locus as a web interface. Its `title` is the page title.",
  properties: { title: Schema.String },
  relationTypes: [WebForm],
  archetypes: [WebInterface],
});
