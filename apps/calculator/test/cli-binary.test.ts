// START_MODULE_CONTRACT
//   PURPOSE: Prove that the calculator command-line binary answers every shared case with the expected exit code and streams, and that --help exits 0.
//   SCOPE: Subprocess runs of bin/cli.ts with the shared case table. Out: the in-memory runCli path (interfaces.test.ts).
//   DEPENDS: M-CALC-INTERFACES, M-PACK-CLI
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   BIN - the absolute path of bin/cli.ts
//   runBinary - runs bin/cli.ts with the given arguments and collects its streams and exit code
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { CASES, argvOf, matchesExpected, normalizeCli } from "./cases";

const BIN = join(import.meta.dir, "../bin/cli.ts");

const runBinary = async (args: ReadonlyArray<string>) => {
  const proc = Bun.spawn(["bun", BIN, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { exitCode: exitCode as 0 | 1 | 2, stdout, stderr };
};

describe("calculator cli binary", () => {
  for (const c of CASES) {
    test(
      c.name,
      async () => {
        const result = await runBinary(argvOf(c));
        expect(result.exitCode).toBe(c.exitCode);
        if (c.expected.ok) {
          expect(JSON.parse(result.stdout)).toEqual(c.expected.output);
          expect(result.stderr).toBe("");
        } else {
          expect(result.stdout).toBe("");
        }
        expect(matchesExpected(normalizeCli(result), c)).toBe(true);
      },
      20000,
    );
  }

  test("--help exits 0", async () => {
    const result = await runBinary(["--help"]);
    expect(result.exitCode).toBe(0);
  }, 20000);
});
