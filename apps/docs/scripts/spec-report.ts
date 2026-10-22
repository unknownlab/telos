// START_MODULE_CONTRACT
//   PURPOSE: Run the executable specifications once at build time with Bun, and write the report with its bun-build provenance and the commit it was built from (FR-022, NS-018).
//   SCOPE: createSpecReportFile, readGit, writeSpecReport and the command line. It writes build-info.json first and spec-report.json last, and deletes a stale report before every run. It never edits content.json or any source file.
//   DEPENDS: M-LOCUS-SPECS
//   LINKS: M-DOCS-SPEC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   GitInfo - the commit and whether the working tree has changes
//   createSpecReportFile - wrap a report with bun-build provenance
//   readGit - the commit and dirty flag of a git checkout, or unknown when git fails
//   WriteOptions - the output directory, the git reader and the optional clock, catalogue and runner
//   writeSpecReport - run the specifications and write build-info.json and spec-report.json
// END_MODULE_MAP

import { mkdir, rm } from "node:fs/promises";
import { parseArgs } from "node:util";
import { join, resolve } from "node:path";
import { Effect } from "effect";
import {
  type Specification,
  type SpecReport,
  catalogue,
  runSpecifications,
} from "@telos/locus-specs";
import type { SpecReportFile } from "../src/lib/build-data";
import {
  PACKAGE_VERSIONS,
  type PackageVersions,
  shortCommit,
} from "../src/lib/provenance";

export interface GitInfo {
  readonly commit: string;
  readonly dirty: boolean;
}

// START_CONTRACT: createSpecReportFile
//   PURPOSE: Wrap a specification report with the bun-build provenance of the run.
//   INPUTS: { options: { report: SpecReport - the run, at: Date - the instant of the run, runtime: string - the Bun version label, packages: PackageVersions, git: GitInfo - the commit and dirty flag } }
//   OUTPUTS: { SpecReportFile - the report and origin "bun-build" with the instant as an ISO string }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SPEC-REPORT
// END_CONTRACT: createSpecReportFile
export function createSpecReportFile(options: {
  readonly report: SpecReport;
  readonly at: Date;
  readonly runtime: string;
  readonly packages: PackageVersions;
  readonly git: GitInfo;
}): SpecReportFile {
  return {
    report: options.report,
    provenance: {
      origin: "bun-build",
      at: options.at.toISOString(),
      runtime: options.runtime,
      packages: options.packages,
      commit: options.git.commit,
      dirty: options.git.dirty,
    },
  };
}

// START_CONTRACT: readGit
//   PURPOSE: Read the commit and the dirty flag of the checkout the build runs in, so the report can name them.
//   INPUTS: { root: string - the repository root }
//   OUTPUTS: { GitInfo - the sha of HEAD and whether git status reports changes; { commit: "unknown", dirty: true } when git fails }
//   SIDE_EFFECTS: runs git rev-parse HEAD and git status --porcelain in root
//   LINKS: M-DOCS-SPEC-REPORT
// END_CONTRACT: readGit
export function readGit(root: string): GitInfo {
  // START_BLOCK_READ_GIT
  try {
    const head = Bun.spawnSync({
      cmd: ["git", "rev-parse", "HEAD"],
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
    const status = Bun.spawnSync({
      cmd: ["git", "status", "--porcelain"],
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
    if (!head.success || !status.success) {
      return { commit: "unknown", dirty: true };
    }
    return {
      commit: head.stdout.toString().trim(),
      dirty: status.stdout.toString().trim() !== "",
    };
  } catch {
    return { commit: "unknown", dirty: true };
  }
  // END_BLOCK_READ_GIT
}

export interface WriteOptions {
  readonly outDir: string; // the apps/docs directory
  readonly git: () => GitInfo;
  readonly now?: () => Date; // default () => new Date()
  readonly specs?: ReadonlyArray<Specification>; // default catalogue
  readonly run?: (specs: ReadonlyArray<Specification>) => Promise<SpecReport>; // default Effect.runPromise(runSpecifications(specs))
}

// START_CONTRACT: writeSpecReport
//   PURPOSE: Produce the build-time spec report. A stale report is removed first, so that a run which crashes leaves "Not run" and never old evidence.
//   INPUTS: { options: WriteOptions - the output directory, the git reader, the optional clock, records and runner }
//   OUTPUTS: { Promise<SpecReportFile> - the written report; rejects with the run's error, after build-info.json was written and spec-report.json was not }
//   SIDE_EFFECTS: writes src/generated/build-info.json and src/generated/spec-report.json under outDir; deletes an old spec-report.json
//   LINKS: M-DOCS-SPEC-REPORT
// END_CONTRACT: writeSpecReport
export async function writeSpecReport(
  options: WriteOptions,
): Promise<SpecReportFile> {
  const generated = join(options.outDir, "src/generated");
  const specs = options.specs ?? catalogue;
  const now = options.now ?? (() => new Date());
  const run =
    options.run ??
    ((records: ReadonlyArray<Specification>) =>
      Effect.runPromise(runSpecifications(records)));

  // START_BLOCK_CLEAR_STALE
  await mkdir(generated, { recursive: true });
  await rm(join(generated, "spec-report.json"), { force: true });
  // END_BLOCK_CLEAR_STALE

  // START_BLOCK_WRITE_BUILD_INFO
  const git = options.git();
  await Bun.write(
    join(generated, "build-info.json"),
    `${JSON.stringify({ commit: git.commit, dirty: git.dirty }, null, 2)}\n`,
  );
  // END_BLOCK_WRITE_BUILD_INFO

  // START_BLOCK_RUN_AND_WRITE_REPORT
  const at = now();
  const report = await run(specs);
  const file = createSpecReportFile({
    report,
    at,
    runtime: `Bun ${Bun.version}`,
    packages: PACKAGE_VERSIONS,
    git,
  });
  await Bun.write(
    join(generated, "spec-report.json"),
    `${JSON.stringify(file, null, 2)}\n`,
  );
  return file;
  // END_BLOCK_RUN_AND_WRITE_REPORT
}

// START_BLOCK_CLI
if (import.meta.main) {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { out: { type: "string" } },
    strict: true,
  });
  const outDir = resolve(values.out ?? resolve(import.meta.dir, ".."));
  const gitRoot = resolve(import.meta.dir, "../../..");
  try {
    const file = await writeSpecReport({
      outDir,
      git: () => readGit(gitRoot),
    });
    const { total, passed, failed, errored } = file.report.summary;
    console.log(
      `spec-report: ${total} specifications, ${passed} passed, ${failed} failed, ${errored} errored (commit ${shortCommit(file.provenance.commit)})`,
    );
    const notPassing = failed + errored;
    if (notPassing > 0) {
      // A failing report is still written and shown. Only a run that cannot finish exits 1.
      console.error(
        `spec-report: ${notPassing} specification(s) did not pass; the report shows them`,
      );
    }
  } catch (cause) {
    console.error(
      `spec-report: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    process.exit(1);
  }
}
// END_BLOCK_CLI
