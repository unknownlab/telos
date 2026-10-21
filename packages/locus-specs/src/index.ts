// START_MODULE_CONTRACT
//   PURPOSE: Public entry point of @telos/locus-specs; re-exports the executable specification model, catalogue, examples and runner.
//   SCOPE: Export statements only. No logic lives here.
//   DEPENDS: none
//   LINKS: M-LOCUS-SPECS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ExpectedDiagnostic - a diagnostic as a specification states it, without the message
//   HistoryOutcome - the outcome of one history append: appended, no-op or stale
//   InvariantId - an invariant reference such as INV-001
//   ScenarioId - a negative scenario reference such as NS-001
//   SpecCheck - the check a specification runs, with its expected value, as a closed union of seven kinds
//   Specification - one executable specification record
//   SpecReport - the results of running a list of specifications, with a summary
//   SpecResult - the outcome of running one specification
//   canonicalJson - JSON text with object keys sorted at every level; arrays keep order; undefined members dropped
//   jsonEqual - deep equality through canonicalJson
//   runSpecification - runs one specification; never fails; returns pass, fail or error
//   runSpecifications - runs a list in input order and counts the statuses
// END_MODULE_MAP

export type {
  ExpectedDiagnostic,
  HistoryOutcome,
  InvariantId,
  ScenarioId,
  SpecCheck,
  Specification,
  SpecReport,
  SpecResult,
} from "./model";
export { runSpecification, runSpecifications } from "./runner";
export { canonicalJson, jsonEqual } from "./canonical-json";
