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
