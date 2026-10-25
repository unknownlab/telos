import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import type { InvocationError } from "@telos/kernel";
import { EXIT_CODE, runCli } from "../src/run";
import { model } from "./fixture";

function run(argv: ReadonlyArray<string>) {
  return Effect.runPromise(runCli(model, "example:cli", argv));
}

function parseLine(text: string): Record<string, unknown> {
  expect(text.endsWith("\n")).toBe(true);
  const lines = text.slice(0, -1).split("\n");
  expect(lines.length).toBe(1);
  return JSON.parse(lines[0] ?? "") as Record<string, unknown>;
}

describe("runCli", () => {
  test("double with --n 2 writes the output as one JSON line and exits 0", async () => {
    const result = await run(["double", "--n", "2"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('{"value":4}\n');
    expect(result.stderr).toBe("");
  });

  test("double trims the text before it is converted to a number", async () => {
    const result = await run(["double", "--n", " 2.5 "]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('{"value":5}\n');
    expect(result.stderr).toBe("");
  });

  test("a declared error exits 1 and writes the kernel error to stderr", async () => {
    const result = await run(["double", "--n", "-1"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      '{"tag":"Negative","message":"n must not be negative.","issues":[]}\n',
    );
  });

  test("a non-numeric value exits 2 with InvalidInput and the issue path n", async () => {
    const result = await run(["double", "--n", "x"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    const error = parseLine(result.stderr) as unknown as InvocationError;
    expect(error.tag).toBe("InvalidInput");
    expect(error.message).toBe("Invalid input for example:math#double.");
    expect(error.issues.map((issue) => issue.path)).toEqual([["n"]]);
  });

  test("a missing required flag exits 2 with InvalidInput and the issue path n", async () => {
    const result = await run(["double"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    const error = parseLine(result.stderr) as unknown as InvocationError;
    expect(error.tag).toBe("InvalidInput");
    expect(error.issues.map((issue) => issue.path)).toEqual([["n"]]);
  });

  test("an unknown subcommand exits 2 with a UsageError", async () => {
    const result = await run(["nope"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      '{"tag":"UsageError","message":"Invalid command line: nope.","issues":[]}\n',
    );
  });

  test("an unknown flag exits 2 with a UsageError", async () => {
    const result = await run(["double", "--zzz", "1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      '{"tag":"UsageError","message":"Invalid command line: double --zzz 1.","issues":[]}\n',
    );
  });

  test("--help exits 0", async () => {
    const result = await run(["--help"]);
    expect(result.exitCode).toBe(0);
  });

  test("--version exits 0", async () => {
    const result = await run(["--version"]);
    expect(result.exitCode).toBe(0);
  });

  test("an unknown CLI Locus exits 2 with LocusNotFound", async () => {
    const result = await Effect.runPromise(
      runCli(model, "example:none", ["double"]),
    );
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toBe(
      '{"tag":"LocusNotFound","message":"No CLI Locus example:none in the model.","issues":[]}\n',
    );
  });

  test("a Locus without CliSemantics exits 2 with LocusNotFound naming it", async () => {
    const result = await Effect.runPromise(
      runCli(model, "example:math", ["double"]),
    );
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toBe(
      '{"tag":"LocusNotFound","message":"No CLI Locus example:math in the model.","issues":[]}\n',
    );
  });
});

describe("EXIT_CODE", () => {
  const exitTwo = [
    "InvalidInput",
    "NotGranted",
    "NotImplemented",
    "LocusNotFound",
    "CapabilityNotFound",
    "UsageError",
  ];
  for (const tag of exitTwo) {
    test(`maps ${tag} to exit code 2`, () => {
      expect(EXIT_CODE({ tag, message: "m", issues: [] })).toBe(2);
    });
  }
  for (const tag of ["Negative", "Defect", "InvalidOutput"]) {
    test(`maps ${tag} to exit code 1`, () => {
      expect(EXIT_CODE({ tag, message: "m", issues: [] })).toBe(1);
    });
  }
});
