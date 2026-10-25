// START_MODULE_CONTRACT
//   PURPOSE: Declare the two typed errors of the arithmetic capabilities and their fixed messages.
//   SCOPE: Error classes and message constants only. It never computes a result and never formats text for presentation.
//   DEPENDS: M-KERNEL-API
//   LINKS: M-CALC-ARITHMETIC, V-M-CALC-ARITHMETIC
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DivisionByZero - the error of a division whose divisor is zero
//   NonFiniteResult - the error of an operation whose result is not a finite number
//   DIVISION_BY_ZERO_MESSAGE - the fixed message of DivisionByZero
//   NON_FINITE_MESSAGE - the fixed message of NonFiniteResult
// END_MODULE_MAP
//@unknownhero NOT GLOBAL ERRORS and technical names like "errors", errors must be belong to where its can be triggered, not global
import { Schema } from "effect";

// START_CONTRACT: DivisionByZero
//   PURPOSE: Report a division whose divisor is zero.
//   INPUTS: { message: string - the message, normally DIVISION_BY_ZERO_MESSAGE }
//   OUTPUTS: { DivisionByZero - a tagged error with tag "DivisionByZero" }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: DivisionByZero
export class DivisionByZero extends Schema.TaggedError<DivisionByZero>()(
  "DivisionByZero",
  { message: Schema.String },
) {}

// START_CONTRACT: NonFiniteResult
//   PURPOSE: Report an operation whose result is not a finite number.
//   INPUTS: { message: string - the message, normally NON_FINITE_MESSAGE }
//   OUTPUTS: { NonFiniteResult - a tagged error with tag "NonFiniteResult" }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: NonFiniteResult
export class NonFiniteResult extends Schema.TaggedError<NonFiniteResult>()(
  "NonFiniteResult",
  { message: Schema.String },
) {}

// START_CONTRACT: DIVISION_BY_ZERO_MESSAGE
//   PURPOSE: The fixed message of a division by zero.
//   INPUTS: none
//   OUTPUTS: { string - "Division by zero is not defined." }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: DIVISION_BY_ZERO_MESSAGE
export const DIVISION_BY_ZERO_MESSAGE = "Division by zero is not defined.";

// START_CONTRACT: NON_FINITE_MESSAGE
//   PURPOSE: The fixed message of a result that is not finite.
//   INPUTS: none
//   OUTPUTS: { string - "The result is not a finite number." }
//   SIDE_EFFECTS: none
//   LINKS: M-CALC-ARITHMETIC
// END_CONTRACT: NON_FINITE_MESSAGE
export const NON_FINITE_MESSAGE = "The result is not a finite number.";
