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
