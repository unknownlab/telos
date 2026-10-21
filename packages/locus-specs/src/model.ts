// START_MODULE_CONTRACT
//   PURPOSE: Define the executable specification record, its seven check kinds and the report shapes the runner returns.
//   SCOPE: Types only. Out: running a specification (runner.ts) and comparing values (canonical-json.ts).
//   DEPENDS: M-LOCUS-SPECS
//   LINKS: M-LOCUS-SPECS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   InvariantId - an invariant reference such as INV-001
//   ScenarioId - a negative scenario reference such as NS-001
//   ExpectedDiagnostic - a diagnostic as a specification states it, without the message
//   HistoryOutcome - the outcome of one history append: appended, no-op or stale
//   SpecCheck - the check a specification runs, with its expected value, as a closed union of seven kinds
//   Specification - one executable specification record
//   SpecResult - the outcome of running one specification
//   SpecReport - the results of running a list of specifications, with a summary
// END_MODULE_MAP

import type {
  Change,
  DiagnosticCode,
  FabricJson,
  LocusJson,
} from "@telos/locus";

// START_CONTRACT: InvariantId
//   PURPOSE: Name an invariant of the Locus specification, such as INV-001.
//   INPUTS: none
//   OUTPUTS: { InvariantId - template type "INV-${string}" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: InvariantId
/** An invariant reference, `INV-` followed by its number. */
export type InvariantId = `INV-${string}`;

// START_CONTRACT: ScenarioId
//   PURPOSE: Name a negative scenario from the specification, such as NS-001.
//   INPUTS: none
//   OUTPUTS: { ScenarioId - template type "NS-${string}" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: ScenarioId
/** A negative scenario reference, `NS-` followed by its number. */
export type ScenarioId = `NS-${string}`;

// START_CONTRACT: ExpectedDiagnostic
//   PURPOSE: State one expected diagnostic without its message, so that rewording a message never breaks a specification.
//   INPUTS: none
//   OUTPUTS: { ExpectedDiagnostic - code, scope, subject, path; optional detail and members }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: ExpectedDiagnostic
/** An expected diagnostic. It never includes `message`. */
export interface ExpectedDiagnostic {
  readonly code: DiagnosticCode;
  readonly scope: "fabric" | "locus";
  readonly subject: string;
  readonly path: string;
  readonly detail?: string;
  readonly members?: ReadonlyArray<string>;
}

// START_CONTRACT: HistoryOutcome
//   PURPOSE: Name the outcome of one history append.
//   INPUTS: none
//   OUTPUTS: { HistoryOutcome - "appended" | "no-op" | "stale" }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: HistoryOutcome
/** The outcome of one history append. */
export type HistoryOutcome = "appended" | "no-op" | "stale";

// START_CONTRACT: SpecCheck
//   PURPOSE: Describe what a specification runs and the value its observed result must equal.
//   INPUTS: none
//   OUTPUTS: { SpecCheck - a union of seven kinds: validate, validate-stable, decode, revision-compare, revision-immutable, history, diff }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: SpecCheck
/** The check a specification runs. Each kind has its own input fields and its own `expect`. */
export type SpecCheck =
  | {
      readonly kind: "validate";
      readonly fabric: FabricJson;
      readonly expect: {
        readonly valid: boolean;
        readonly diagnostics: ReadonlyArray<ExpectedDiagnostic>;
      };
    }
  | {
      readonly kind: "validate-stable";
      readonly variants: ReadonlyArray<FabricJson>;
      readonly runs: number;
      readonly expect: "identical";
    }
  | {
      readonly kind: "decode";
      readonly input: string;
      readonly expect:
        | { readonly ok: true }
        | { readonly ok: false; readonly paths: ReadonlyArray<string> };
    }
  | {
      readonly kind: "revision-compare";
      readonly a: LocusJson;
      readonly b: LocusJson;
      readonly expect: {
        readonly sameLocus: boolean;
        readonly sameId: boolean;
      };
    }
  | {
      readonly kind: "revision-immutable";
      readonly locus: LocusJson;
      readonly expect: "immutable";
    }
  | {
      readonly kind: "history";
      readonly revisions: ReadonlyArray<LocusJson>;
      readonly steps: ReadonlyArray<{
        readonly append: number;
        readonly expectedHead: number | null;
      }>;
      readonly expect: {
        readonly outcomes: ReadonlyArray<HistoryOutcome>;
        readonly entries: ReadonlyArray<number>;
      };
    }
  | {
      readonly kind: "diff";
      readonly from: LocusJson;
      readonly to: LocusJson;
      readonly expect:
        | { readonly ok: true; readonly changes: ReadonlyArray<Change> }
        | { readonly ok: false; readonly error: "LocusMismatchError" };
    };

// START_CONTRACT: Specification
//   PURPOSE: Hold one executable specification as a plain, JSON-serialisable record.
//   INPUTS: none
//   OUTPUTS: { Specification - id "LOC-${string}", title, invariants, scenarios, polarity ("positive" | "negative") and check }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: Specification
/** One executable specification. Changing its meaning requires a new id. */
export interface Specification {
  readonly id: `LOC-${string}`;
  readonly title: string;
  readonly invariants: ReadonlyArray<InvariantId>;
  readonly scenarios: ReadonlyArray<ScenarioId>;
  readonly polarity: "positive" | "negative";
  readonly check: SpecCheck;
}

// START_CONTRACT: SpecResult
//   PURPOSE: Report the outcome of running one specification.
//   INPUTS: none
//   OUTPUTS: { SpecResult - id, status ("pass" | "fail" | "error"), expected, observed and durationMs }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: SpecResult
/** The outcome of one specification. `error` means the runner could not complete the check. */
export interface SpecResult {
  readonly id: Specification["id"];
  readonly status: "pass" | "fail" | "error";
  readonly expected: unknown;
  readonly observed: unknown;
  readonly durationMs: number;
}

// START_CONTRACT: SpecReport
//   PURPOSE: Report the results of running a list of specifications, with counts.
//   INPUTS: none
//   OUTPUTS: { SpecReport - results in input order and a summary of total, passed, failed and errored }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: SpecReport
/** The results of a run, with a summary. */
export interface SpecReport {
  readonly results: ReadonlyArray<SpecResult>;
  readonly summary: {
    readonly total: number;
    readonly passed: number;
    readonly failed: number;
    readonly errored: number;
  };
}
