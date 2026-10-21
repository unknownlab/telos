// START_MODULE_CONTRACT
//   PURPOSE: Freeze plain object and array graphs deeply and iteratively, without recursion depth limits.
//   SCOPE: deepFreeze only. Internal to @telos/locus: not exported from index.ts. Out: any copying.
//   DEPENDS: none
//   LINKS: M-LOCUS-MODEL
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   deepFreeze - freezes a value made of plain objects and arrays, all the way down, and returns it
// END_MODULE_MAP

// START_CONTRACT: deepFreeze
//   PURPOSE: Make a value and every object or array reachable from it immutable.
//   INPUTS: { value: T - a value, typically a freshly built plain object or array graph }
//   OUTPUTS: { T - the same value reference, now deeply frozen }
//   SIDE_EFFECTS: Freezes every reachable object that is not already frozen. Does not copy.
//   LINKS: M-LOCUS-MODEL
// END_CONTRACT: deepFreeze
/** Freezes a value made of plain objects and arrays, all the way down. Returns the same value. */
export function deepFreeze<T>(value: T): T {
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (
      typeof current !== "object" ||
      current === null ||
      Object.isFrozen(current)
    )
      continue;
    Object.freeze(current);
    for (const child of Object.values(current)) stack.push(child);
  }
  return value;
}
