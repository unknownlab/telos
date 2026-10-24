// START_MODULE_CONTRACT
//   PURPOSE: Freeze plain object and array graphs deeply and iteratively, without recursion depth limits.
//   SCOPE: deepFreeze only. Effect Schemas (objects with an ast property) and functions are left unfrozen. Out: any copying.
//   DEPENDS: none
//   LINKS: M-KERNEL-IDENTITY
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   deepFreeze - freezes a value made of plain objects and arrays, all the way down, skipping Effect Schemas, and returns it
// END_MODULE_MAP

// START_CONTRACT: deepFreeze
//   PURPOSE: Make a value and every plain object or array reachable from it immutable.
//   INPUTS: { value: T - a value, typically a freshly built plain object or array graph }
//   OUTPUTS: { T - the same value reference, now deeply frozen except for Effect Schemas and functions }
//   SIDE_EFFECTS: Freezes every reachable plain object that is not already frozen. Does not copy.
//   LINKS: M-KERNEL-IDENTITY
// END_CONTRACT: deepFreeze
/** Freezes a value made of plain objects and arrays, all the way down. Effect Schemas and functions are not frozen. Returns the same value. */
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
    if ("ast" in current) continue;
    Object.freeze(current);
    for (const child of Object.values(current)) stack.push(child);
  }
  return value;
}
