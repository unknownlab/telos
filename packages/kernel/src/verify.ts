// START_MODULE_CONTRACT
//   PURPOSE: Run the Archetype rules of every selected Locus of a model and report each outcome as a passed, failed or error finding with provenance.
//   SCOPE: Outcome, Finding, Provenance, VerificationReport, VerifyOptions, applicableArchetypes and verify. A rule never stops other rules. Out: building the model (model.ts) and closure checks.
//   DEPENDS: M-KERNEL-MODEL, M-KERNEL-DEFINITIONS, M-KERNEL-IDENTITY
//   LINKS: M-KERNEL-VERIFY, V-M-KERNEL-VERIFY
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Outcome - the result of one rule check: passed, failed or error
//   Finding - one rule outcome for one Locus with its archetype, rule, method and message
//   Provenance - the runner and the start and finish times of one verification run
//   VerificationReport - the frozen result of verify with provenance, sorted findings and a summary
//   VerifyOptions - the runner, the selected rule methods, the selected Loci and the clock of a run
//   applicableArchetypes - the archetypes of a model whose extensions cover the kind of a Locus, sorted by id
//   verify - runs the selected rules of the selected Loci and returns the frozen report
// END_MODULE_MAP

import { Cause, Effect, Exit, Option } from "effect";
import type { Archetype, Rule, RuleMethod } from "./archetype";
import { RuleViolation } from "./archetype";
import { deepFreeze } from "./freeze";
import type { SemanticModel } from "./model";

export type Outcome = "passed" | "failed" | "error";

export interface Finding {
  readonly archetype: string;
  readonly rule: string;
  readonly locus: string;
  readonly method: RuleMethod;
  readonly outcome: Outcome;
  readonly message: string | null; // RuleViolation.message for failed; String(defect) for error; null for passed
}

export interface Provenance {
  readonly runner: string;
  readonly startedAt: string;
  readonly finishedAt: string;
}

export interface VerificationReport {
  readonly provenance: Provenance;
  readonly findings: ReadonlyArray<Finding>;
  readonly summary: {
    readonly passed: number;
    readonly failed: number;
    readonly error: number;
  };
}

export interface VerifyOptions {
  readonly runner: string;
  readonly methods?: ReadonlyArray<RuleMethod>;
  readonly loci?: ReadonlyArray<string>;
  readonly now?: () => Date;
}

// Orders strings by UTF-16 code unit, never by locale.
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareFindings(a: Finding, b: Finding): number {
  return (
    byCodeUnit(a.locus, b.locus) ||
    byCodeUnit(a.archetype, b.archetype) ||
    byCodeUnit(a.rule, b.rule)
  );
}

function outcomeOf(
  exit: Exit.Exit<void, RuleViolation>,
): Pick<Finding, "outcome" | "message"> {
  if (Exit.isSuccess(exit)) return { outcome: "passed", message: null };
  const error = Cause.findErrorOption(exit.cause);
  if (Option.isSome(error) && error.value instanceof RuleViolation) {
    return { outcome: "failed", message: error.value.message };
  }
  return {
    outcome: "error",
    message: String(
      Option.isSome(error) ? error.value : Cause.squash(exit.cause),
    ),
  };
}

// START_CONTRACT: applicableArchetypes
//   PURPOSE: List the archetypes of a model that apply to one Locus, by its kind's extension ids.
//   INPUTS: { model: SemanticModel - a built model; locusId: string - a Locus id }
//   OUTPUTS: { ReadonlyArray<Archetype> - archetypes whose appliesTo ids are all extension ids of the Locus kind, sorted by id; empty for an unknown id }
//   SIDE_EFFECTS: none
//   LINKS: M-KERNEL-VERIFY
// END_CONTRACT: applicableArchetypes
/** The archetypes of `model` that apply to the Locus `locusId`, sorted by id. */
export function applicableArchetypes(
  model: SemanticModel,
  locusId: string,
): ReadonlyArray<Archetype> {
  const locus = model.loci.get(locusId);
  if (locus === undefined) return Object.freeze([]);
  const kindIds = new Set(
    locus.definition.kind.extensions.map((extension) => extension.id),
  );
  return Object.freeze(
    [...model.archetypes.values()]
      .filter((archetype) => archetype.appliesTo.every((id) => kindIds.has(id)))
      .sort((a, b) => byCodeUnit(a.id, b.id)),
  );
}

// START_CONTRACT: verify
//   PURPOSE: Run every selected rule of every selected Locus and return a frozen report; a failing or dying rule never stops the others.
//   INPUTS: { model: SemanticModel - a built model; options: VerifyOptions - runner, optional methods, loci and now clock }
//   OUTPUTS: { Effect<VerificationReport> - frozen report with findings sorted by locus, archetype and rule, and a summary; never fails }
//   SIDE_EFFECTS: Runs the rule checks. Reads the clock only through options.now (default new Date()).
//   LINKS: M-KERNEL-VERIFY
// END_CONTRACT: verify
/** Runs the selected rules of the selected Loci and reports every outcome with provenance. */
export const verify = (
  model: SemanticModel,
  options: VerifyOptions,
): Effect.Effect<VerificationReport> =>
  Effect.gen(function* () {
    const now = options.now ?? (() => new Date());
    const startedAt = now().toISOString();
    const methods = new Set<RuleMethod>(
      options.methods ?? ["static", "execution"],
    );
    const selected = [...new Set(options.loci ?? model.ids)]
      .filter((id) => model.loci.has(id))
      .sort(byCodeUnit);

    const findings: Finding[] = [];
    for (const locusId of selected) {
      const ctx = { locus: model.loci.get(locusId)!.definition, model };
      for (const archetype of applicableArchetypes(model, locusId)) {
        for (const rule of archetype.rules as ReadonlyArray<Rule>) {
          if (!methods.has(rule.method)) continue;
          const exit = yield* Effect.exit(
            Effect.suspend(() => rule.check(ctx)),
          );
          findings.push({
            archetype: archetype.id,
            rule: rule.id,
            locus: locusId,
            method: rule.method,
            ...outcomeOf(exit),
          });
        }
      }
    }

    const sorted = findings.sort(compareFindings);
    const count = (outcome: Outcome) =>
      sorted.filter((finding) => finding.outcome === outcome).length;
    return deepFreeze<VerificationReport>({
      provenance: {
        runner: options.runner,
        startedAt,
        finishedAt: now().toISOString(),
      },
      findings: sorted,
      summary: {
        passed: count("passed"),
        failed: count("failed"),
        error: count("error"),
      },
    });
  });
