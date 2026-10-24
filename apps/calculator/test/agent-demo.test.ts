// START_MODULE_CONTRACT
//   PURPOSE: Prove that the deterministic agent demo runs its seven steps against the calculator MCP server and exits 0 with the success line.
//   SCOPE: One subprocess run of bin/agent-demo.ts and the shape of its output lines. Out: the individual MCP responses (mcp.test.ts).
//   DEPENDS: M-CALC-INTERFACES, M-PACK-AGENT-MCP
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   DEMO - the absolute path of bin/agent-demo.ts
// END_MODULE_MAP

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
