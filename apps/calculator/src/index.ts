// START_MODULE_CONTRACT
//   PURPOSE: Be the browser-safe entry of the calculator arithmetic core and re-export exactly the names of the arithmetic contract.
//   SCOPE: Re-exports only. It declares nothing and never imports a Pack or a Bun-only module.
//   DEPENDS: M-KERNEL-API
//   LINKS: M-CALC-ARITHMETIC, V-M-CALC-ARITHMETIC
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Operands - the input schema of a binary operation
//   Result - the output schema of a binary operation
//   add - the capability that adds b to a
//   subtract - the capability that subtracts b from a
//   multiply - the capability that multiplies a by b
//   divide - the capability that divides a by b
//   Arithmetic - the extension that marks an arithmetic Locus
//   arithmetic - the calculator:arithmetic Locus
//   DivisionByZero - the error of a division by zero
//   NonFiniteResult - the error of a result that is not finite
//   DIVISION_BY_ZERO_MESSAGE - the fixed message of DivisionByZero
//   NON_FINITE_MESSAGE - the fixed message of NonFiniteResult
//   ArithmeticBehavior - the archetype that checks the arithmetic Locus
// END_MODULE_MAP

export {
  Arithmetic,
  Operands,
  Result,
  add,
  arithmetic,
  divide,
  multiply,
  subtract,
} from "./arithmetic";
export {
  DIVISION_BY_ZERO_MESSAGE,
  DivisionByZero,
  NON_FINITE_MESSAGE,
  NonFiniteResult,
} from "./errors";
export { ArithmeticBehavior } from "./archetypes";
