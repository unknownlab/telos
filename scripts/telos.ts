// START_MODULE_CONTRACT
//   PURPOSE: Give developers and agents one command, bun run telos, that reads the repository model, runs its checks and writes the semantic report.
//   SCOPE: Parses the command line, computes the model, verification and closure, and prints one JSON document per command. It never edits repository sources, only writes the report file that report asks for.
//   DEPENDS: M-REPOSITORY-MODEL, M-KERNEL-API, M-KERNEL-CLOSURE
//   LINKS: M-TELOS-COMMAND, V-M-TELOS-COMMAND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   TelosRunResult - the exit code and the stdout and stderr text of one command
//   CLOSURE_SCOPE - the globs, exclusions and aliases the closure check reads
//   SemanticReport - the JSON document that report writes for the docs site
//   runTelos - runs one telos command and returns its result
// END_MODULE_MAP

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Effect } from "effect";
import {
  buildModel,
  describeLocus,
  describeModel,
  describeVerifications,
  hasErrors,
  impact,
  parseCapabilityKey,
  verify,
  type Finding,
  type LocusDefinition,
  type ModelDescription,
  type SemanticModel,
  type VerificationDescription,
  type VerificationReport,
} from "@telos/kernel";
import {
  checkClosure,
  hasClosureErrors,
  type ClosureFinding,
  type ClosureReport,
} from "@telos/kernel/closure";
import { repository } from "../telos";

export interface TelosRunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface SemanticReport {
  readonly version: 1;
  readonly provenance: {
    readonly runner: string;
    readonly generatedAt: string;
    readonly commit: string | null;
  };
  readonly model: ModelDescription;
  readonly verification: VerificationReport;
  readonly verifications: Readonly<
    Record<string, ReadonlyArray<VerificationDescription>>
  >;
  readonly closure: {
    readonly limits: ReadonlyArray<string>;
    readonly scope: ClosureReport["scope"];
    readonly fileCount: number;
    readonly findings: ReadonlyArray<ClosureFinding>;
  };
  readonly ok: boolean;
}

// START_CONTRACT: CLOSURE_SCOPE
//   PURPOSE: Name the repository files the closure check covers, the files it never covers and the docs path alias.
//   INPUTS: {}
//   OUTPUTS: { { include, exclude, aliases } - the closure scope of the repository }
//   SIDE_EFFECTS: none
//   LINKS: M-TELOS-COMMAND
// END_CONTRACT: CLOSURE_SCOPE
export const CLOSURE_SCOPE = {
  include: [
    "telos.ts",
    "scripts/**/*.ts",
    "packages/*/src/**/*.ts",
    "packages/*/test/**/*.ts",
    "packages/*/specs/**/*.ts",
    "apps/calculator/src/**/*.ts",
    "apps/calculator/bin/**/*.ts",
    "apps/calculator/test/**/*.ts",
  ],
  exclude: ["**/node_modules/**", "**/*.d.ts"],
  aliases: [],
} as const;

const REPO_ROOT = resolve(import.meta.dir, "..");
const RUNNER = `bun ${Bun.version}`;
const USAGE =
  "Usage: telos list|inspect <id>|verify [--static]|closure|impact <target>|check|report --out <path>";

const byCodeUnit = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

const emit = (value: unknown): string => `${JSON.stringify(value)}\n`;

const success = (value: unknown, exitCode = 0): TelosRunResult => ({
  exitCode,
  stdout: emit(value),
  stderr: "",
});

const failure = (
  tag: string,
  message: string,
  exitCode: number,
): TelosRunResult => ({
  exitCode,
  stdout: "",
  stderr: emit({ tag, message }),
});

const usage = (): TelosRunResult => failure("UsageError", USAGE, 2);

const run = <A>(effect: Effect.Effect<A>): Promise<A> =>
  Effect.runPromise(effect);

const readPackages = (
  cwd: string,
): Array<{ readonly name: string; readonly dir: string }> => {
  const found: Array<{ readonly name: string; readonly dir: string }> = [];
  for (const file of new Bun.Glob("{packages,apps}/*/package.json").scanSync({
    cwd,
  })) {
    const manifest = JSON.parse(readFileSync(resolve(cwd, file), "utf8")) as {
      readonly name?: unknown;
    };
    if (typeof manifest.name !== "string") continue;
    found.push({ name: manifest.name, dir: dirname(file) });
  }
  return found.sort((a, b) => byCodeUnit(a.name, b.name));
};

const runClosure = (
  model: SemanticModel,
  cwd: string,
): Promise<ClosureReport> =>
  run(
    checkClosure(model, {
      root: cwd,
      include: CLOSURE_SCOPE.include,
      exclude: CLOSURE_SCOPE.exclude,
      aliases: CLOSURE_SCOPE.aliases,
      packages: readPackages(cwd),
    }),
  );

const runVerify = (
  model: SemanticModel,
  staticOnly: boolean,
): Promise<VerificationReport> =>
  run(
    verify(
      model,
      staticOnly ? { runner: RUNNER, methods: ["static"] } : { runner: RUNNER },
    ),
  );

const isError = (finding: { readonly severity: string }): boolean =>
  finding.severity === "error";

const computeCheck = async (model: SemanticModel, cwd: string) => {
  const verification = await runVerify(model, false);
  const closure = await runClosure(model, cwd);
  const ok =
    !hasErrors(model) &&
    verification.summary.failed === 0 &&
    verification.summary.error === 0 &&
    !hasClosureErrors(closure);
  return { ok, verification, closure, model };
};

const readCommit = (cwd: string): string | null => {
  try {
    const result = Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd });
    return result.exitCode === 0 ? result.stdout.toString().trim() : null;
  } catch {
    return null;
  }
};

// START_CONTRACT: runTelos
//   PURPOSE: Run one telos command over a model and return its exit code and output text, never printing or exiting.
//   INPUTS: { argv: ReadonlyArray<string> - the command and its arguments, options: { root: LocusDefinition - the root Locus, default the repository Locus; cwd: string - the repository root, default the directory above scripts } }
//   OUTPUTS: { Promise<TelosRunResult> - exit code 0, 1 or 2 with the JSON stdout or the JSON stderr of the command }
//   SIDE_EFFECTS: report writes the semantic report file given by --out; no other command writes anything
//   LINKS: M-TELOS-COMMAND
// END_CONTRACT: runTelos
export async function runTelos(
  argv: ReadonlyArray<string>,
  options: { readonly root?: LocusDefinition; readonly cwd?: string } = {},
): Promise<TelosRunResult> {
  const root = options.root ?? repository;
  const cwd = options.cwd ?? REPO_ROOT;
  const model = buildModel(root);
  const [command, ...args] = argv;

  switch (command) {
    case "list":
      return success({ loci: [...model.ids] });

    case "inspect": {
      const id = args[0];
      if (id === undefined || args.length !== 1) return usage();
      if (!model.loci.has(id)) {
        return failure("LocusNotFound", `No Locus ${id} in the model.`, 2);
      }
      return success(await run(describeLocus(model, id)));
    }

    case "verify": {
      const staticOnly = args[0] === "--static";
      if (args.length > (staticOnly ? 1 : 0)) return usage();
      const report = await runVerify(model, staticOnly);
      const exitCode =
        report.summary.failed + report.summary.error === 0 ? 0 : 1;
      return success(report, exitCode);
    }

    case "closure": {
      if (args.length > 0) return usage();
      const report = await runClosure(model, cwd);
      return success(report, hasClosureErrors(report) ? 1 : 0);
    }

    case "impact": {
      const target = args[0];
      if (target === undefined || args.length !== 1) return usage();
      const parsed = parseCapabilityKey(target);
      const locusId = parsed?.locus ?? target;
      const locus = model.loci.get(locusId);
      if (locus === undefined) {
        return failure("LocusNotFound", `No Locus ${locusId} in the model.`, 2);
      }
      if (
        parsed !== null &&
        !Object.hasOwn(locus.definition.capabilities, parsed.capability)
      ) {
        return failure(
          "CapabilityNotFound",
          `Locus ${locusId} has no capability ${parsed.capability}.`,
          2,
        );
      }
      return success(impact(model, target));
    }

    case "check": {
      if (args.length > 0) return usage();
      const result = await computeCheck(model, cwd);
      const findings = result.closure.findings;
      const errors = findings.filter(isError);
      return success(
        {
          ok: result.ok,
          diagnostics: model.diagnostics,
          verification: result.verification.summary,
          failures: result.verification.findings.filter(
            (finding: Finding) => finding.outcome !== "passed",
          ),
          closure: {
            errors: errors.length,
            warnings: findings.length - errors.length,
            findings: errors,
          },
        },
        result.ok ? 0 : 1,
      );
    }

    case "report": {
      const [flag, out] = args;
      if (flag !== "--out" || out === undefined || args.length !== 2) {
        return usage();
      }
      const result = await computeCheck(model, cwd);
      const description = await run(describeModel(model));
      const verifications: Record<
        string,
        ReturnType<typeof describeVerifications>
      > = {};
      for (const id of model.ids) {
        verifications[id] = describeVerifications(
          model,
          id,
          result.verification,
        );
      }
      const semanticReport: SemanticReport = {
        version: 1,
        provenance: {
          runner: RUNNER,
          generatedAt: new Date().toISOString(),
          commit: readCommit(cwd),
        },
        model: description,
        verification: result.verification,
        verifications,
        closure: {
          limits: result.closure.limits,
          scope: result.closure.scope,
          fileCount: result.closure.files.length,
          findings: result.closure.findings,
        },
        ok: result.ok,
      };
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, `${JSON.stringify(semanticReport, null, 2)}\n`);
      return success({ written: out }, result.ok ? 0 : 1);
    }

    default:
      return usage();
  }
}

if (import.meta.main) {
  const result = await runTelos(process.argv.slice(2));
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
