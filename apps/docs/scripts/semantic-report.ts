// START_MODULE_CONTRACT
//   PURPOSE: Run bun run telos report at build time, write the semantic report and the build info, and serve the report as /semantic-report.json (FR-012, FR-025).
//   SCOPE: readGit, reportProblem, writeSemanticReport and the command line. It writes build-info.json first, removes a stale report before every run, and copies the report to public/ only when the run wrote it. It never imports the root scripts: it spawns them.
//   DEPENDS: M-DOCS-SEMANTIC-REPORT, M-TELOS-COMMAND
//   LINKS: M-DOCS-SEMANTIC-REPORT
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   GitInfo - the commit and whether the working tree has changes
//   readGit - the commit and dirty flag of a git checkout, or unknown when git fails
//   ReportRun - the exit code and standard error of the telos report run
//   ReportProblem - a problem with the run, fatal when the build must stop
//   reportProblem - the problem of one telos report run, or null when the run is clean
//   WriteOptions - the docs directory, the repository root, the git reader and the optional runner
//   writeSemanticReport - run telos report and write the report, the build info and the public copy
// END_MODULE_MAP

import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface GitInfo {
  readonly commit: string;
  readonly dirty: boolean;
}

// START_CONTRACT: readGit
//   PURPOSE: Read the commit and the dirty flag of the checkout the build runs in, so the report can name them.
//   INPUTS: { root: string - the repository root }
//   OUTPUTS: { GitInfo - the sha of HEAD and whether git status reports changes; { commit: "unknown", dirty: true } when git fails }
//   SIDE_EFFECTS: runs git rev-parse HEAD and git status --porcelain in root
//   LINKS: M-DOCS-SEMANTIC-REPORT
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

export interface ReportRun {
  readonly exitCode: number | null;
  readonly stderr: string;
}

export interface ReportProblem {
  readonly fatal: boolean;
  readonly message: string;
}

// START_CONTRACT: reportProblem
//   PURPOSE: Decide whether one telos report run is a problem. Exit 1 is the repository check failing: the report is still written and shown, so it is not fatal.
//   INPUTS: { run: ReportRun - the exit code and stderr, written: boolean - whether the report file exists, out: string - the report path }
//   OUTPUTS: { ReportProblem | null - null for a clean run; fatal true for an exit other than 0 or 1 or a missing file; fatal false for exit 1 with the file written }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: reportProblem
export function reportProblem(
  run: ReportRun,
  written: boolean,
  out: string,
): ReportProblem | null {
  if (run.exitCode !== 0 && run.exitCode !== 1) {
    const code = run.exitCode === null ? "no exit code" : String(run.exitCode);
    return {
      fatal: true,
      message: `telos report exited with ${code}: ${run.stderr.trim()}`,
    };
  }
  if (!written) {
    return { fatal: true, message: `telos report did not write ${out}` };
  }
  if (run.exitCode === 1) {
    return {
      fatal: false,
      message:
        "telos report: the repository check failed; the report was written and the site shows the failures",
    };
  }
  return null;
}

export interface WriteOptions {
  readonly docsDir: string; // the apps/docs directory
  readonly repoRoot: string; // the repository root
  readonly git: () => GitInfo;
  readonly run?: (cmd: ReadonlyArray<string>, cwd: string) => ReportRun; // default: Bun.spawnSync
}

const spawnRun = (cmd: ReadonlyArray<string>, cwd: string): ReportRun => {
  const result = Bun.spawnSync({
    cmd: [...cmd],
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return { exitCode: result.exitCode, stderr: result.stderr.toString() };
};

// START_CONTRACT: writeSemanticReport
//   PURPOSE: Produce the build-time semantic report from the real repository run, so that a stale report never survives a failed run.
//   INPUTS: { options: WriteOptions - the docs directory, the repository root, the git reader and the optional runner }
//   OUTPUTS: { Promise<ReportProblem | null> - null for a clean run, a non-fatal problem for a failed repository check, a fatal problem when the run cannot finish }
//   SIDE_EFFECTS: writes src/generated/build-info.json and src/generated/semantic-report.json; writes public/semantic-report.json when the run wrote the report; deletes older copies of both first
//   LINKS: M-DOCS-SEMANTIC-REPORT
// END_CONTRACT: writeSemanticReport
export async function writeSemanticReport(
  options: WriteOptions,
): Promise<ReportProblem | null> {
  const generated = join(options.docsDir, "src/generated");
  const out = join(generated, "semantic-report.json");
  const publicFile = join(options.docsDir, "public/semantic-report.json");
  const run = options.run ?? spawnRun;

  // START_BLOCK_CLEAR_STALE
  await mkdir(generated, { recursive: true });
  await rm(out, { force: true });
  await rm(publicFile, { force: true });
  // END_BLOCK_CLEAR_STALE

  // START_BLOCK_WRITE_BUILD_INFO
  const git = options.git();
  await Bun.write(
    join(generated, "build-info.json"),
    `${JSON.stringify({ commit: git.commit, dirty: git.dirty }, null, 2)}\n`,
  );
  // END_BLOCK_WRITE_BUILD_INFO

  // START_BLOCK_RUN_AND_COPY
  const command = [
    process.execPath,
    join(options.repoRoot, "scripts/telos.ts"),
    "report",
    "--out",
    out,
  ];
  let result: ReportRun;
  try {
    result = run(command, options.repoRoot);
  } catch (cause) {
    result = {
      exitCode: null,
      stderr: cause instanceof Error ? cause.message : String(cause),
    };
  }
  const written = await Bun.file(out).exists();
  const problem = reportProblem(result, written, out);
  if (written) {
    await mkdir(join(options.docsDir, "public"), { recursive: true });
    await Bun.write(publicFile, Bun.file(out));
  }
  return problem;
  // END_BLOCK_RUN_AND_COPY
}

// START_BLOCK_CLI
if (import.meta.main) {
  const docsDir = resolve(import.meta.dir, "..");
  const repoRoot = resolve(import.meta.dir, "../../..");
  const problem = await writeSemanticReport({
    docsDir,
    repoRoot,
    git: () => readGit(repoRoot),
  });
  if (problem === null) {
    console.log(
      "semantic-report: wrote src/generated/semantic-report.json and public/semantic-report.json",
    );
  } else {
    console.error(`semantic-report: ${problem.message}`);
    process.exit(problem.fatal ? 1 : 0);
  }
}
// END_BLOCK_CLI
