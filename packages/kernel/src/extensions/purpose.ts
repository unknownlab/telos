// START_MODULE_CONTRACT
//   PURPOSE: Define the built-in purpose extension that states why a Locus exists.
//   SCOPE: The Purpose extension value only. Out: its composition with other extensions.
//   DEPENDS: M-KERNEL-DEFINITIONS
//   LINKS: M-KERNEL-DEFINITIONS, V-M-KERNEL-DEFINITIONS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Purpose - the built-in extension with purpose, responsibilities and excluded properties
// END_MODULE_MAP

import { Schema } from "effect";
import { Extension } from "../extension";

// START_CONTRACT: Purpose
//   PURPOSE: Declare the telos.purpose extension with a required purpose and optional responsibilities and excluded lists.
//   INPUTS: none
//   OUTPUTS: { Extension - the telos.purpose extension }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-DEFINITIONS
// END_CONTRACT: Purpose
export const Purpose = Extension.make("telos.purpose", {
  description:
    "States why a Locus exists, what it is responsible for and what it explicitly excludes.",
  properties: {
    purpose: Schema.String,
    responsibilities: Schema.optionalKey(Schema.Array(Schema.String)),
    excluded: Schema.optionalKey(Schema.Array(Schema.String)),
  },
});
