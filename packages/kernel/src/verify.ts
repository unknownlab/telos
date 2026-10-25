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
  readonly message: string | null;
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
