// START_MODULE_CONTRACT
//   PURPOSE: Be the public entry of the web Pack and re-export exactly the names of the web contract.
//   SCOPE: Re-exports only. It declares nothing and never exports the exposure helpers exposedRelations and firstExposed.
//   DEPENDS: M-PACK-WEB
//   LINKS: M-PACK-WEB, V-M-PACK-WEB
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   WEB_FORM_TYPE - the relation type id of a web form relation
//   WebForm - the relation type that exposes a capability as a web form
//   WebSemantics - the telos.web extension that marks a web interface Locus
//   WebInterface - the archetype that checks a web interface Locus
//   formModel - derives the form model of a web interface Locus
//   WebFormModel - the forms of one web interface Locus with its title
//   WebFormDefinition - one form with its name, reference, fields and submit action
//   WebField - one field of a form
// END_MODULE_MAP

export { WEB_FORM_TYPE, formModel } from "./form";
export type { WebField, WebFormDefinition, WebFormModel } from "./form";
export { WebForm, WebSemantics } from "./semantics";
export { WebInterface } from "./archetype";
