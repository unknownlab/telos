// START_MODULE_CONTRACT
//   PURPOSE: Be the browser-safe entry of the calculator and re-export exactly the names of the arithmetic and interface contracts.
//   SCOPE: Re-exports only. It declares nothing and never imports a Bun-only module or a bin file.
//   DEPENDS: M-CALC-ARITHMETIC, M-CALC-INTERFACES
//   LINKS: M-CALC-ARITHMETIC, M-CALC-INTERFACES, V-M-CALC-INTERFACES
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
//   ArithmeticBehavior - the archetype that checks the arithmetic Locus
//   arithmetic - the calculator:arithmetic Locus
//   DivisionByZero - the error of a division by zero
//   NonFiniteResult - the error of a result that is not finite
//   DIVISION_BY_ZERO_MESSAGE - the fixed message of DivisionByZero
//   NON_FINITE_MESSAGE - the fixed message of NonFiniteResult
//   calculatorCli - the calculator:cli Locus
//   calculatorWeb - the calculator:web Locus
//   calculatorAgent - the calculator:agent Locus
//   interfaceLoci - builds the three interface Loci for an arithmetic-like target
//   CalculatorApp - the calculator.app extension
//   CalculatorInterfaces - the archetype that checks the calculator interfaces
//   app - the calculator:app Locus
//   makeApp - builds an application Locus over the given contained Loci
//   calculatorModel - the built semantic model of app
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
export {
  calculatorAgent,
  calculatorCli,
  calculatorWeb,
  interfaceLoci,
} from "./interfaces";
export {
  CalculatorApp,
  CalculatorInterfaces,
  app,
  calculatorModel,
  makeApp,
} from "./app";
