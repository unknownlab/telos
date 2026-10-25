import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const DEMO = join(import.meta.dir, "../bin/agent-demo.ts");

describe("calculator agent demo", () => {
  test("the demo exits 0, prints seven steps and ends with the success line", async () => {
    const proc = Bun.spawn(["bun", DEMO], { stdout: "pipe", stderr: "pipe" });
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    const lines = stdout.split("\n").filter((line) => line.trim() !== "");
    expect(lines.length).toBe(8);
    expect(lines[lines.length - 1]).toBe('{"ok":true}');
    const steps = lines
      .slice(0, -1)
      .map((line) => (JSON.parse(line) as { step: string }).step);
    expect(steps).toEqual([
      "initialize",
      "list-tools",
      "discover",
      "call-add",
      "call-divide-by-zero",
      "call-invalid",
      "impact",
    ]);
  }, 20000);
});
