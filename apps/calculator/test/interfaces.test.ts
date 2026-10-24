// START_MODULE_CONTRACT
//   PURPOSE: Prove that every shared case gives the same normalized outcome through the kernel, the in-memory CLI, the agent tools and the web form, and that the app model builds without diagnostics.
//   SCOPE: The diagnostics of the app model and one test per case of the shared table. Out: the subprocess binaries (cli-binary.test.ts, mcp.test.ts) and the archetype rules (app.test.ts).
//   DEPENDS: M-CALC-INTERFACES, M-CALC-ARITHMETIC, M-PACK-CLI, M-PACK-WEB, M-PACK-AGENT
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   ARITHMETIC_ID - the Locus id of the arithmetic implementation
//   CLI_ID - the Locus id of the command line interface
//   WEB_ID - the Locus id of the web interface
//   AGENT_ID - the Locus id of the agent interface
//   submitWeb - submits the web form of one case and returns its outcome
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { buildModel, invoke } from "@telos/kernel";
import { runCli } from "@telos/cli";
import { callTool } from "@telos/agent";
import { formModel } from "@telos/web";
import { arithmetic } from "../src/arithmetic";
import { app, calculatorModel } from "../src/app";
import {
  CASES,
  argvOf,
  matchesExpected,
  normalizeCli,
  normalizeOutcome,
  normalizeTool,
  type Case,
} from "./cases";

const ARITHMETIC_ID = "calculator:arithmetic";
const CLI_ID = "calculator:cli";
const WEB_ID = "calculator:web";
const AGENT_ID = "calculator:agent";

const submitWeb = (c: Case) =>
  Effect.gen(function* () {
    const model = yield* formModel(calculatorModel, WEB_ID);
    const form = model.forms.find((f) => f.name === c.capability);
    if (form === undefined) throw new Error(`no web form ${c.capability}`);
    return yield* form.submit(c.text);
  });

describe("calculator interfaces", () => {
  test("the app model builds without diagnostics", () => {
    expect(buildModel(app).diagnostics).toEqual([]);
  });

  for (const c of CASES) {
    test(c.name, async () => {
      const kernel = normalizeOutcome(
        await Effect.runPromise(
          invoke(calculatorModel, arithmetic.capability(c.capability), c.json, {
            via: ARITHMETIC_ID,
          }),
        ),
      );
      const cli = await Effect.runPromise(
        runCli(calculatorModel, CLI_ID, argvOf(c)),
      );
      expect(cli.exitCode).toBe(c.exitCode);
      const fromCli = normalizeCli(cli);
      const fromTool = normalizeTool(
        await Effect.runPromise(
          callTool(calculatorModel, AGENT_ID, c.capability, c.json),
        ),
      );
      const fromWeb = normalizeOutcome(await Effect.runPromise(submitWeb(c)));

      expect(matchesExpected(kernel, c)).toBe(true);
      expect(matchesExpected(fromCli, c)).toBe(true);
      expect(matchesExpected(fromTool, c)).toBe(true);
      expect(matchesExpected(fromWeb, c)).toBe(true);
      expect(fromCli).toEqual(kernel);
      expect(fromTool).toEqual(kernel);
      expect(fromWeb).toEqual(kernel);
    });
  }
});
