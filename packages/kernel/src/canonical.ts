// START_MODULE_CONTRACT
//   PURPOSE: Render values as canonical JSON, so that key order and undefined members never change the result.
//   SCOPE: sortKeys, canonicalJson and jsonEqual. Out: digests (digest.ts) and any schema or model rule.
//   DEPENDS: none
//   LINKS: M-KERNEL-CANONICAL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   sortKeys - returns a sorted copy of a value, with object keys in code-unit order and undefined members removed
//   canonicalJson - JSON text with object keys sorted at every level, no spaces, undefined members dropped
//   jsonEqual - true when two values have the same canonical JSON
// END_MODULE_MAP

// START_CONTRACT: sortKeys
//   PURPOSE: Build a copy of a value whose object keys are sorted and whose undefined members are removed.
//   INPUTS: { value: unknown - any JSON-like value }
//   OUTPUTS: { unknown - a new value with the same content; object keys in code-unit order at every level }
//   SIDE_EFFECTS: none. Does not mutate the input.
//   LINKS: M-KERNEL-CANONICAL
// END_CONTRACT: sortKeys
/** Returns a sorted copy of a value. Arrays keep their order. */
export const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      const member = source[key];
      if (member !== undefined) {
        copy[key] = sortKeys(member);
      }
    }
    return copy;
  }
  return value;
};

// START_CONTRACT: canonicalJson
//   PURPOSE: Render a value as JSON text that does not depend on object key order or undefined members.
//   INPUTS: { value: unknown - any JSON-like value }
//   OUTPUTS: { string - JSON text of the sorted copy; the text "undefined" for a top-level undefined }
//   SIDE_EFFECTS: none. Never throws for JSON-like values.
//   LINKS: M-KERNEL-CANONICAL
// END_CONTRACT: canonicalJson
/** JSON text with object keys sorted (code-unit order) at every level; arrays keep order; undefined members dropped. */
export const canonicalJson = (value: unknown): string =>
  String(JSON.stringify(sortKeys(value)));

// START_CONTRACT: jsonEqual
//   PURPOSE: Decide whether two values have the same canonical JSON.
//   INPUTS: { a: unknown - first value; b: unknown - second value }
//   OUTPUTS: { boolean - true exactly when canonicalJson gives the same text for both }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-CANONICAL
// END_CONTRACT: jsonEqual
/** Deep equality through canonicalJson. */
export const jsonEqual = (a: unknown, b: unknown): boolean =>
  canonicalJson(a) === canonicalJson(b);
