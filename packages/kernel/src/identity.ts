// START_MODULE_CONTRACT
//   PURPOSE: Define the grammar of kernel identifiers: Locus ids, extension ids, capability names and capability keys.
//   SCOPE: The id and capability patterns, their checks and the capability key helpers. Out: validation of references and uniqueness (later work packages), decoding and freezing.
//   DEPENDS: none
//   LINKS: M-KERNEL-IDENTITY
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   LOCUS_ID_PATTERN - grammar of a Locus id, namespace:name
//   EXTENSION_ID_PATTERN - grammar of an extension id, one or more dot-separated parts
//   CAPABILITY_NAME_PATTERN - grammar of a capability name, camelCase
//   isLocusId - true when a string is a well-formed Locus id of at most 128 characters
//   isExtensionId - true when a string is a well-formed extension id of at most 128 characters
//   isCapabilityName - true when a string is a well-formed capability name of at most 64 characters
//   capabilityKey - joins a Locus id and a capability name into one key
//   parseCapabilityKey - splits a capability key at its last hash, or returns null
// END_MODULE_MAP

const PART = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";

// START_CONTRACT: LOCUS_ID_PATTERN
//   PURPOSE: Match a Locus id of the form namespace:name.
//   INPUTS: none
//   OUTPUTS: { RegExp - anchored pattern for namespace:name }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: LOCUS_ID_PATTERN
/** Grammar of a Locus id: `namespace:name`, each part lowercase with single hyphens. */
export const LOCUS_ID_PATTERN: RegExp = new RegExp(`^${PART}:${PART}$`);

// START_CONTRACT: EXTENSION_ID_PATTERN
//   PURPOSE: Match an extension id made of dot-separated parts.
//   INPUTS: none
//   OUTPUTS: { RegExp - anchored pattern for dot-separated parts }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: EXTENSION_ID_PATTERN
/** Grammar of an extension id: one or more lowercase parts separated by dots. */
export const EXTENSION_ID_PATTERN: RegExp = new RegExp(
  `^${PART}(?:\\.${PART})*$`,
);

// START_CONTRACT: CAPABILITY_NAME_PATTERN
//   PURPOSE: Match a capability name in camelCase.
//   INPUTS: none
//   OUTPUTS: { RegExp - anchored pattern for camelCase names }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: CAPABILITY_NAME_PATTERN
/** Grammar of a capability name: a lowercase first letter, then letters and digits. */
export const CAPABILITY_NAME_PATTERN: RegExp = /^[a-z][a-zA-Z0-9]*$/;

// START_CONTRACT: isLocusId
//   PURPOSE: Decide whether a string is a well-formed Locus id.
//   INPUTS: { value: string - candidate Locus id }
//   OUTPUTS: { boolean - true when the pattern matches and length is at most 128 }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: isLocusId
/** True when `value` matches LOCUS_ID_PATTERN and is at most 128 characters long. */
export function isLocusId(value: string): boolean {
  return value.length <= 128 && LOCUS_ID_PATTERN.test(value);
}

// START_CONTRACT: isExtensionId
//   PURPOSE: Decide whether a string is a well-formed extension id.
//   INPUTS: { value: string - candidate extension id }
//   OUTPUTS: { boolean - true when the pattern matches and length is at most 128 }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: isExtensionId
/** True when `value` matches EXTENSION_ID_PATTERN and is at most 128 characters long. */
export function isExtensionId(value: string): boolean {
  return value.length <= 128 && EXTENSION_ID_PATTERN.test(value);
}

// START_CONTRACT: isCapabilityName
//   PURPOSE: Decide whether a string is a well-formed capability name.
//   INPUTS: { value: string - candidate capability name }
//   OUTPUTS: { boolean - true when the pattern matches and length is at most 64 }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: isCapabilityName
/** True when `value` matches CAPABILITY_NAME_PATTERN and is at most 64 characters long. */
export function isCapabilityName(value: string): boolean {
  return value.length <= 64 && CAPABILITY_NAME_PATTERN.test(value);
}

// START_CONTRACT: capabilityKey
//   PURPOSE: Build the key that names one capability of one Locus.
//   INPUTS: { locus: string - Locus id; capability: string - capability name }
//   OUTPUTS: { string - `${locus}#${capability}` }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: capabilityKey
/** Joins a Locus id and a capability name with a hash. */
export function capabilityKey(locus: string, capability: string): string {
  return `${locus}#${capability}`;
}

// START_CONTRACT: parseCapabilityKey
//   PURPOSE: Split a capability key back into its Locus id and capability name.
//   INPUTS: { key: string - a capability key }
//   OUTPUTS: { { locus, capability } | null - split at the last hash; null when there is no hash or either side is empty }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: parseCapabilityKey
/** Splits at the last `#`. Returns null when there is no `#` or either side is empty. */
export function parseCapabilityKey(
  key: string,
): { readonly locus: string; readonly capability: string } | null {
  const at = key.lastIndexOf("#");
  if (at <= 0 || at === key.length - 1) return null;
  return { locus: key.slice(0, at), capability: key.slice(at + 1) };
}
