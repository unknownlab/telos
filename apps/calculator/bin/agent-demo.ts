// START_MODULE_CONTRACT
//   PURPOSE: Run a deterministic agent that discovers and calls the calculator tools over MCP and prints one JSON line per step.
//   SCOPE: Spawns bin/mcp.ts with McpStdioClient, runs seven fixed steps and prints their results. It needs no LLM, no network and no credentials, and never changes the calculator.
//   DEPENDS: M-CALC-INTERFACES, M-PACK-AGENT-MCP, M-PACK-AGENT, M-KERNEL-API
//   LINKS: M-CALC-INTERFACES, V-M-CALC-INTERFACES
//   ROLE: SCRIPT
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   MCP - the absolute path of bin/mcp.ts
//   ARITHMETIC_ID - the id of the arithmetic Locus
//   OPERATION_NAMES - the names of the four calculator tools
//   EXPECTED_AFFECTED - the interface Loci the impact step expects
//   FIXED_VALUES - the fixed operand values of the call-add step
//   CallResponse - the part of a tools/call result the steps read
//   outputOf - the output of a successful tool result
//   errorTagOf - the error tag of a failed tool result
//   CapabilityEntry - one capability of the telos_capabilities output
//   addEntryOf - the add capability of a telos_capabilities response
//   requiredOf - the required field names of an input schema
//   failed - the names of the steps whose expectation did not hold
//   printStep - prints one step line to stdout
//   runStep - runs one step, records whether it held and prints it
//   client - the deterministic MCP client of the run
// END_MODULE_MAP

import { join } from "node:path";
import { INTROSPECTION_TOOL_NAMES, toolInputSchema } from "@telos/agent";
import { McpStdioClient } from "@telos/agent/client";
import { jsonEqual, type JsonSchemaDocument } from "@telos/kernel";

const MCP = join(import.meta.dir, "mcp.ts");
const ARITHMETIC_ID = "calculator:arithmetic";
const OPERATION_NAMES = ["add", "divide", "multiply", "subtract"];
const EXPECTED_AFFECTED = [
  "calculator:agent",
  "calculator:cli",
  "calculator:web",
];
const FIXED_VALUES: Readonly<Record<string, number>> = { a: 2, b: 3 };

interface CallResponse {
  readonly isError: boolean;
  readonly structuredContent: unknown;
}

const outputOf = (response: CallResponse): unknown =>
  (response.structuredContent as { output?: unknown } | null)?.output;

const errorTagOf = (response: CallResponse): unknown =>
  (
    response.structuredContent as {
      error?: { tag?: unknown };
    } | null
  )?.error?.tag;

interface CapabilityEntry {
  readonly name: string;
  readonly input: JsonSchemaDocument;
}

// The add capability description of telos_capabilities, or undefined.
const addEntryOf = (response: CallResponse): CapabilityEntry | undefined =>
  (
    outputOf(response) as
      { readonly capabilities?: ReadonlyArray<CapabilityEntry> } | undefined
  )?.capabilities?.find((capability) => capability.name === "add");

// The required field names of an input schema, in document order.
const requiredOf = (
  input: JsonSchemaDocument | undefined,
): ReadonlyArray<string> => {
  if (input === undefined) return [];
  const required = (toolInputSchema(input) as { readonly required?: unknown })
    .required;
  return Array.isArray(required)
    ? required.filter((name): name is string => typeof name === "string")
    : [];
};

const failed: string[] = [];

const printStep = (step: string, request: unknown, response: unknown): void => {
  process.stdout.write(`${JSON.stringify({ step, request, response })}\n`);
};

const runStep = async (
  step: string,
  request: unknown,
  run: () => Promise<unknown>,
  expectation: (response: unknown) => boolean,
): Promise<unknown> => {
  let response: unknown;
  let held = false;
  try {
    response = await run();
    held = expectation(response);
  } catch (error) {
    response = {
      error: error instanceof Error ? error.message : String(error),
    };
  }
  if (!held) failed.push(step);
  printStep(step, request, response);
  return response;
};

const client = await McpStdioClient.spawn(["bun", MCP]);
try {
  await runStep(
    "initialize",
    null,
    async () => client.server,
    (response) =>
      (response as { serverName?: unknown }).serverName === "telos-calculator",
  );

  await runStep(
    "list-tools",
    null,
    () => client.listTools(),
    (response) => {
      const names = (response as ReadonlyArray<{ name: string }>).map(
        (tool) => tool.name,
      );
      return [...OPERATION_NAMES, ...INTROSPECTION_TOOL_NAMES].every((name) =>
        names.includes(name),
      );
    },
  );

  const discoverRequest = {
    name: "telos_capabilities",
    arguments: { id: ARITHMETIC_ID },
  };
  const discovered = await runStep(
    "discover",
    discoverRequest,
    () => client.callTool("telos_capabilities", { id: ARITHMETIC_ID }),
    (response) => {
      const required = requiredOf(addEntryOf(response as CallResponse)?.input);
      return required.includes("a") && required.includes("b");
    },
  );
  const requiredNames = requiredOf(
    addEntryOf(discovered as CallResponse)?.input,
  );
  const addArguments = Object.fromEntries(
    requiredNames.map((name) => [name, FIXED_VALUES[name]]),
  );

  await runStep(
    "call-add",
    { name: "add", arguments: addArguments },
    () => client.callTool("add", addArguments),
    (response) => {
      const result = response as CallResponse;
      return !result.isError && jsonEqual(outputOf(result), { result: 5 });
    },
  );

  await runStep(
    "call-divide-by-zero",
    { name: "divide", arguments: { a: 1, b: 0 } },
    () => client.callTool("divide", { a: 1, b: 0 }),
    (response) => {
      const result = response as CallResponse;
      return result.isError && errorTagOf(result) === "DivisionByZero";
    },
  );

  await runStep(
    "call-invalid",
    { name: "add", arguments: { a: "x", b: 1 } },
    () => client.callTool("add", { a: "x", b: 1 }),
    (response) => {
      const result = response as CallResponse;
      return result.isError && errorTagOf(result) === "InvalidInput";
    },
  );

  await runStep(
    "impact",
    {
      name: "telos_impact",
      arguments: { target: "calculator:arithmetic#add" },
    },
    () =>
      client.callTool("telos_impact", { target: "calculator:arithmetic#add" }),
    (response) => {
      const affected = (
        outputOf(response as CallResponse) as
          { affected?: ReadonlyArray<{ locus: string }> } | undefined
      )?.affected;
      const loci = (affected ?? []).map((entry) => entry.locus);
      return EXPECTED_AFFECTED.every((locus) => loci.includes(locus));
    },
  );
} finally {
  await client.close();
}

if (failed.length === 0) {
  process.stdout.write('{"ok":true}\n');
} else {
  process.stdout.write(`${JSON.stringify({ ok: false, failed })}\n`);
  process.exitCode = 1;
}
