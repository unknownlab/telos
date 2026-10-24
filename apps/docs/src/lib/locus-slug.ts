// START_MODULE_CONTRACT
//   PURPOSE: Turn a Locus id into a URL segment and back, so that every Locus has one inspector page address.
//   SCOPE: locusSlug and locusIdOf. Pure string functions; they assume Locus ids never contain "--" (the identity grammar).
//   DEPENDS: none
//   LINKS: M-DOCS-INSPECTOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   locusSlug - the URL segment of a Locus id
//   locusIdOf - the Locus id of a URL segment
// END_MODULE_MAP

// START_CONTRACT: locusSlug
//   PURPOSE: Give the URL segment of a Locus id, with the namespace colon replaced by a double dash.
//   INPUTS: { id: string - a Locus id such as "telos:kernel" }
//   OUTPUTS: { string - the segment such as "telos--kernel" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: locusSlug
export const locusSlug = (id: string): string => id.replace(":", "--");

// START_CONTRACT: locusIdOf
//   PURPOSE: Give the Locus id of a URL segment, the inverse of locusSlug.
//   INPUTS: { slug: string - a URL segment such as "telos--kernel" }
//   OUTPUTS: { string - the Locus id such as "telos:kernel" }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-INSPECTOR
// END_CONTRACT: locusIdOf
export const locusIdOf = (slug: string): string => slug.replace("--", ":");
