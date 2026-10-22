// START_MODULE_CONTRACT
//   PURPOSE: Define the Identity value type and the grammar check that decides whether a string is a valid Identity.
//   SCOPE: The Identity alias and isIdentity. Out: validation of references and uniqueness (WP03), decoding.
//   DEPENDS: none
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Identity - a Locus or Fabric identity string, checked by validation rather than by the type
//   isIdentity - true when a string matches the Identity grammar and is at most 128 characters long
// END_MODULE_MAP

// START_CONTRACT: Identity
//   PURPOSE: Name a Locus or a Fabric as "namespace:name".
//   INPUTS: none
//   OUTPUTS: { string - a plain string alias; the grammar is not enforced by the type }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: Identity
/** A Locus or Fabric identity, `namespace:name`. The grammar is checked by validation, not by the type. */
export type Identity = string;

const PART = "[a-z][a-z0-9]*(?:-[a-z0-9]+)*";
const GRAMMAR = new RegExp(`^${PART}:${PART}$`);
const MAX_LENGTH = 128;

// START_CONTRACT: isIdentity
//   PURPOSE: Decide whether a string is a well-formed Identity.
//   INPUTS: { value: string - candidate identity }
//   OUTPUTS: { boolean - true exactly when value matches namespace:name with each part [a-z][a-z0-9]*(-[a-z0-9]+)* and length at most 128 }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: isIdentity
/** True exactly when `value` matches the Identity grammar and is at most 128 characters long. */
export function isIdentity(value: string): boolean {
  return value.length <= MAX_LENGTH && GRAMMAR.test(value);
}
