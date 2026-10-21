// START_MODULE_CONTRACT
//   PURPOSE: Define the Charter value type that records why a Locus exists.
//   SCOPE: The Charter interface only. Out: validation of its rules (WP03), construction (locus.ts).
//   DEPENDS: none
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Charter - purpose, responsibilities, exclusions and success conditions of a Locus
// END_MODULE_MAP

// START_CONTRACT: Charter
//   PURPOSE: Hold the reasons a Locus exists.
//   INPUTS: none
//   OUTPUTS: { Charter - readonly purpose: string; responsibilities, excluded, successConditions: ReadonlyArray<string> }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: Charter
/** Why a Locus exists: purpose, responsibilities, exclusions and success conditions. */
export interface Charter {
  readonly purpose: string;
  readonly responsibilities: ReadonlyArray<string>;
  readonly excluded: ReadonlyArray<string>;
  readonly successConditions: ReadonlyArray<string>;
}
