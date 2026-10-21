// START_MODULE_CONTRACT
//   PURPOSE: Run executable specifications against the public @telos/locus API and report pass, fail or error for each, without ever failing itself.
//   SCOPE: runSpecification, runSpecifications, the per-kind observers, and FixtureError. Out: the catalogue (WP08), the model types (model.ts) and the comparison (canonical-json.ts).
//   DEPENDS: M-LOCUS-MODEL, M-LOCUS-VALIDATION, M-LOCUS-REVISION, M-LOCUS-HISTORY, M-LOCUS-DECODE
//   LINKS: M-LOCUS-SPECS
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   runSpecification - runs one specification; never fails; returns pass, fail or error
//   runSpecifications - runs a list in input order and counts the statuses
// END_MODULE_MAP

import { Cause, Effect, Result } from "effect";
import {
  createRevision,
  decodeFabric,
  decodeFabricJson,
  decodeLocus,
  diffRevisions,
  type Diagnostic,
  type DecodeError,
  RevisionHistory,
  RevisionHistoryInMemory,
  type Revision,
  type RevisionId,
  validateFabric,
} from "@telos/locus";
import { jsonEqual } from "./canonical-json";
import type {
  ExpectedDiagnostic,
  HistoryOutcome,
  SpecCheck,
  Specification,
  SpecReport,
  SpecResult,
} from "./model";

// START_CONTRACT: FixtureError
//   PURPOSE: Report a fixture that the runner cannot run, so that the result is error and not pass or fail.
//   INPUTS: { reason: string - a short description; detail: unknown - optional supporting data }
//   OUTPUTS: { FixtureError - readonly reason and detail }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: FixtureError
/** A fixture that cannot be run. Internal to the runner; reported as status "error". */
class FixtureError {
  constructor(
    readonly reason: string,
    readonly detail?: unknown,
  ) {}
}

// START_CONTRACT: decodeOrFail
//   PURPOSE: Turn a decode failure of a fixture into a FixtureError.
//   INPUTS: { effect: Effect<A, DecodeError> - a public decoder applied to a fixture }
//   OUTPUTS: { Effect<A, FixtureError> - the decoded value, or a FixtureError carrying the located issues }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: decodeOrFail
/** A decode failure of a fixture is an error of the runner, not a result. */
const decodeOrFail = <A>(
  effect: Effect.Effect<A, DecodeError>,
): Effect.Effect<A, FixtureError> =>
  effect.pipe(
    Effect.mapError(
      (e) => new FixtureError("fixture did not decode", e.issues),
    ),
  );

// START_CONTRACT: reviseOrFail
//   PURPOSE: Create the Revision of a definition, turning a digest failure into a FixtureError.
//   INPUTS: { definition: LocusDefinition - a decoded definition }
//   OUTPUTS: { Effect<Revision, FixtureError> - the content-addressed Revision }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: reviseOrFail
/** Creates a Revision; a digest failure is an error of the runner. */
const reviseOrFail = (
  definition: Parameters<typeof createRevision>[0],
): Effect.Effect<Revision, FixtureError> =>
  createRevision(definition).pipe(
    Effect.mapError(
      (e) => new FixtureError("revision could not be digested", e.cause),
    ),
  );

// START_CONTRACT: reduceDiagnostic
//   PURPOSE: Keep only the fields of a diagnostic that a specification states, never its message.
//   INPUTS: { d: Diagnostic - one diagnostic from validateFabric }
//   OUTPUTS: { ExpectedDiagnostic-shaped object - code, scope, subject, path; detail and members only when present }
//   SIDE_EFFECTS: none
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: reduceDiagnostic
/** The observed form of one diagnostic. */
const reduceDiagnostic = (d: Diagnostic): ExpectedDiagnostic => ({
  code: d.code,
  scope: d.scope,
  subject: d.subject,
  path: d.path,
  ...(d.detail === undefined ? {} : { detail: d.detail }),
  ...(d.members === undefined ? {} : { members: [...d.members] }),
});

// START_CONTRACT: observe
//   PURPOSE: Run the public API for one check and return what it observed. Never reads the expectation.
//   INPUTS: { check: SpecCheck - the check of a specification }
//   OUTPUTS: { Effect<unknown, FixtureError> - the observed value for the check kind, or a FixtureError }
//   SIDE_EFFECTS: none beyond the public API calls. An unknown kind dies, so the caller reports it as a defect.
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: observe
/** Dispatches one check to its observer. Each kind is in its own START_BLOCK. */
const observe = (check: SpecCheck): Effect.Effect<unknown, FixtureError> => {
  switch (check.kind) {
    // START_BLOCK_VALIDATE
    case "validate":
      return Effect.gen(function* () {
        const fabric = yield* decodeOrFail(decodeFabric(check.fabric));
        const report = validateFabric(fabric);
        return {
          valid: report.valid,
          diagnostics: report.diagnostics.map(reduceDiagnostic),
        };
      });
    // END_BLOCK_VALIDATE

    // START_BLOCK_VALIDATE_STABLE
    case "validate-stable":
      return Effect.gen(function* () {
        const { variants, runs } = check;
        if (!Number.isInteger(runs) || runs < 1 || variants.length < 2) {
          return yield* Effect.fail(
            new FixtureError(
              "validate-stable needs at least one run and two variants",
              { runs, variants: variants.length },
            ),
          );
        }
        const reports: Array<{ variant: number; run: number; text: string }> =
          [];
        for (const [variant, json] of variants.entries()) {
          const fabric = yield* decodeOrFail(decodeFabric(json));
          for (let run = 0; run < runs; run += 1) {
            reports.push({
              variant,
              run,
              text: JSON.stringify(validateFabric(fabric)),
            });
          }
        }
        const first = reports[0];
        if (first === undefined) {
          return yield* Effect.fail(
            new FixtureError("no reports were produced"),
          );
        }
        const differing = reports.find((r) => r.text !== first.text);
        if (differing === undefined) {
          return "identical";
        }
        return {
          outcome: "different",
          first: first.text,
          differing: differing.text,
          at: { variant: differing.variant, run: differing.run },
        };
      });
    // END_BLOCK_VALIDATE_STABLE

    // START_BLOCK_DECODE
    case "decode":
      return Effect.match(decodeFabricJson(check.input), {
        onFailure: (e) => ({ ok: false, paths: e.issues.map((i) => i.path) }),
        onSuccess: () => ({ ok: true }),
      });
    // END_BLOCK_DECODE

    // START_BLOCK_REVISION_COMPARE
    case "revision-compare":
      return Effect.gen(function* () {
        const a = yield* decodeOrFail(decodeLocus(check.a));
        const b = yield* decodeOrFail(decodeLocus(check.b));
        const ra = yield* reviseOrFail(a);
        const rb = yield* reviseOrFail(b);
        return { sameLocus: ra.locus === rb.locus, sameId: ra.id === rb.id };
      });
    // END_BLOCK_REVISION_COMPARE

    // START_BLOCK_REVISION_IMMUTABLE
    case "revision-immutable":
      return Effect.gen(function* () {
        const definition = yield* decodeOrFail(decodeLocus(check.locus));
        const r = yield* reviseOrFail(definition);
        const snapshot = {
          id: r.id,
          purpose: r.definition.charter.purpose,
          relations: JSON.stringify(r.definition.relations),
        };
        // Module code is strict, so each assignment to a frozen object throws.
        const attempts: ReadonlyArray<() => void> = [
          () => {
            (r as unknown as { id: string }).id = "sha256:0";
          },
          () => {
            (r.definition.charter as unknown as { purpose: string }).purpose =
              "changed";
          },
          () => {
            (r.definition.relations as unknown as Array<unknown>).push({
              kind: "refines",
              target: "x:y",
            });
          },
        ];
        const thrown = attempts.map((attempt) => {
          try {
            attempt();
            return false;
          } catch {
            return true;
          }
        });
        const recomputed = yield* reviseOrFail(r.definition);
        const failed: string[] = [];
        if (!thrown[0]) failed.push("id-writable");
        if (!thrown[1]) failed.push("purpose-writable");
        if (!thrown[2]) failed.push("relations-writable");
        if (
          r.id !== snapshot.id ||
          r.definition.charter.purpose !== snapshot.purpose ||
          JSON.stringify(r.definition.relations) !== snapshot.relations
        ) {
          failed.push("value-changed");
        }
        if (recomputed.id !== r.id) failed.push("id-mismatch");
        return failed.length === 0 ? "immutable" : failed;
      });
    // END_BLOCK_REVISION_IMMUTABLE

    // START_BLOCK_HISTORY
    case "history":
      return Effect.gen(function* () {
        const revs: Revision[] = [];
        for (const json of check.revisions) {
          const definition = yield* decodeOrFail(decodeLocus(json));
          revs.push(yield* reviseOrFail(definition));
        }
        const origin = revs[0];
        if (origin === undefined) {
          return yield* Effect.fail(
            new FixtureError("history needs at least one revision"),
          );
        }
        // An index outside the revisions is a fixture error.
        const at = (index: number): Effect.Effect<Revision, FixtureError> => {
          const found = revs[index];
          return found === undefined
            ? Effect.fail(
                new FixtureError("history index is out of range", index),
              )
            : Effect.succeed(found);
        };
        const program = Effect.gen(function* () {
          const history = yield* RevisionHistory;
          const outcomes: HistoryOutcome[] = [];
          for (const step of check.steps) {
            const revision = yield* at(step.append);
            const expected: RevisionId | null =
              step.expectedHead === null
                ? null
                : (yield* at(step.expectedHead)).id;
            const result = yield* Effect.result(
              history.append(revision, expected),
            );
            outcomes.push(
              Result.isSuccess(result)
                ? result.success.appended
                  ? "appended"
                  : "no-op"
                : "stale",
            );
          }
          const ids = yield* history.entries(origin.locus);
          return {
            outcomes,
            entries: ids.map((id) => revs.findIndex((r) => r.id === id)),
          };
        });
        // A fresh in-memory history for each check; no state is shared between checks.
        return yield* Effect.provide(program, RevisionHistoryInMemory, {
          local: true,
        });
      });
    // END_BLOCK_HISTORY

    // START_BLOCK_DIFF
    case "diff":
      return Effect.gen(function* () {
        const from = yield* reviseOrFail(
          yield* decodeOrFail(decodeLocus(check.from)),
        );
        const to = yield* reviseOrFail(
          yield* decodeOrFail(decodeLocus(check.to)),
        );
        const result = yield* Effect.result(diffRevisions(from, to));
        if (Result.isSuccess(result)) {
          return { ok: true, changes: [...result.success.changes] };
        }
        return { ok: false, error: result.failure._tag };
      });
    // END_BLOCK_DIFF

    default:
      return Effect.die(new Error("unknown check kind"));
  }
};

// START_CONTRACT: runSpecification
//   PURPOSE: Run one specification and report whether its observed value equals its expectation.
//   INPUTS: { spec: Specification - a record with a check and an expectation }
//   OUTPUTS: { Effect<SpecResult> - id, status ("pass" when canonical JSON of observed equals expect, "fail" otherwise, "error" for a fixture that cannot run or a defect), expected, observed, durationMs }
//   SIDE_EFFECTS: Reads the clock for durationMs only. Never fails.
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: runSpecification
/** Runs one specification. Errors and defects become status "error"; the Effect never fails. */
export const runSpecification = (
  spec: Specification,
): Effect.Effect<SpecResult> =>
  Effect.gen(function* () {
    const start = yield* Effect.sync(() => performance.now());
    const outcome = yield* observe(spec.check).pipe(
      Effect.match({
        onFailure: (e: FixtureError) =>
          ({
            status: "error",
            observed: { error: e.reason, detail: e.detail },
          }) as const,
        onSuccess: (observed) =>
          ({
            status: jsonEqual(observed, spec.check.expect) ? "pass" : "fail",
            observed,
          }) as const,
      }),
      Effect.catchCause((cause) =>
        Effect.succeed({
          status: "error",
          observed: { error: "defect", detail: Cause.pretty(cause) },
        } as const),
      ),
    );
    const end = yield* Effect.sync(() => performance.now());
    return {
      id: spec.id,
      status: outcome.status,
      expected: spec.check.expect,
      observed: outcome.observed,
      durationMs: end - start,
    };
  });

// START_CONTRACT: runSpecifications
//   PURPOSE: Run a list of specifications one after another and summarise the statuses.
//   INPUTS: { specs: ReadonlyArray<Specification> - the records to run }
//   OUTPUTS: { Effect<SpecReport> - results in input order and a summary of total, passed, failed and errored }
//   SIDE_EFFECTS: none beyond runSpecification. Never fails.
//   LINKS: M-LOCUS-SPECS
// END_CONTRACT: runSpecifications
/** Runs the records in input order and counts each status. */
export const runSpecifications = (
  specs: ReadonlyArray<Specification>,
): Effect.Effect<SpecReport> =>
  Effect.gen(function* () {
    const results = yield* Effect.forEach(specs, (spec) =>
      runSpecification(spec),
    );
    const count = (status: SpecResult["status"]): number =>
      results.filter((r) => r.status === status).length;
    return {
      results,
      summary: {
        total: results.length,
        passed: count("pass"),
        failed: count("fail"),
        errored: count("error"),
      },
    };
  });
