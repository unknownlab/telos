// START_MODULE_CONTRACT
//   PURPOSE: Declare the web relation type and the telos.web extension that marks a Locus as a web interface.
//   SCOPE: WebForm and WebSemantics values only. Out: the form model (form.ts) and the archetype rules (archetype.ts).
//   DEPENDS: M-PACK-WEB, M-KERNEL-API
//   LINKS: M-PACK-WEB, V-M-PACK-WEB
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   WebForm - the relation type that exposes a capability as a web form
//   WebSemantics - the telos.web extension with a title and the WebForm relation type
// END_MODULE_MAP

import { Schema } from "effect";
import { Extension, RelationType } from "@telos/kernel";
import { WEB_EXTENSION_ID, WEB_FORM_TYPE } from "./form";
import { WebInterface } from "./archetype";

// START_CONTRACT: WebForm
//   PURPOSE: Declare the web.form relation type, which targets a capability and grants its invocation.
//   INPUTS: none
//   OUTPUTS: { RelationType<"web.form"> - the relation type }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WebForm
export const WebForm = RelationType.make(WEB_FORM_TYPE, {
  description:
    "Exposes the target capability as a web form named after the capability.",
  target: "capability",
  grantsInvocation: true,
});

// START_CONTRACT: WebSemantics
//   PURPOSE: Declare the telos.web extension with a page title, the WebForm relation type and the WebInterface archetype.
//   INPUTS: none
//   OUTPUTS: { Extension<"telos.web"> - the extension }
//   SIDE_EFFECTS: none
//   LINKS: M-PACK-WEB
// END_CONTRACT: WebSemantics
export const WebSemantics = Extension.make(WEB_EXTENSION_ID, {
  description:
    "Marks a Locus as a web interface. Its `title` is the page title.",
  properties: { title: Schema.String },
  relationTypes: [WebForm],
  archetypes: [WebInterface],
});
