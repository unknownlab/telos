//@unknownhero NOT GLOBAL ERRORS and technical names like "errors", errors must be belong to where its can be triggered, not global
import { Schema } from "effect";

export class DivisionByZero extends Schema.TaggedError<DivisionByZero>()(
  "DivisionByZero",
  { message: Schema.String },
) {}

export class NonFiniteResult extends Schema.TaggedError<NonFiniteResult>()(
  "NonFiniteResult",
  { message: Schema.String },
) {}

export const DIVISION_BY_ZERO_MESSAGE = "Division by zero is not defined.";

export const NON_FINITE_MESSAGE = "The result is not a finite number.";
