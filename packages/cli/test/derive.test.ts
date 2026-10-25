import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import { Capability, CapabilityRef, Locus } from "@telos/kernel";
import { CliCommand, CliSemantics } from "../src/semantics";
import { CLI_COMMAND_TYPE, deriveCommands } from "../src/derive";
import { cli, math, model, withCli } from "./fixture";

describe("deriveCommands", () => {
  test("derives the double command of example:cli from its exposed capability", async () => {
    expect(CLI_COMMAND_TYPE).toBe("cli.command");
    const commands = await Effect.runPromise(
      deriveCommands(model, "example:cli"),
    );
    expect(commands).toEqual([
      {
        name: "double",
        ref: CapabilityRef.make("example:math", "double"),
        description: "Doubles n.",
        fields: [
          { name: "n", type: "number", required: true, description: null },
        ],
      },
    ]);
  });

  test("returns no commands for an unknown Locus id", async () => {
    expect(
      await Effect.runPromise(deriveCommands(model, "example:none")),
    ).toEqual([]);
  });

  test("returns no commands for a Locus without CliSemantics", async () => {
    expect(
      await Effect.runPromise(deriveCommands(model, "example:math")),
    ).toEqual([]);
  });

  test("sorts commands by name and takes the first Locus for a duplicate name", async () => {
    const other = Locus.make({
      id: "example:other",
      capabilities: {
        double: Capability.make({
          description: "Doubles n in other.",
          input: Schema.Struct({ n: Schema.Finite }),
          output: Schema.Struct({ value: Schema.Finite }),
          effect: "pure",
          handler: ({ n }) => Effect.succeed({ value: n * 2 }),
        }),
        triple: Capability.make({
          description: "Triples n.",
          input: Schema.Struct({ n: Schema.Finite }),
          output: Schema.Struct({ value: Schema.Finite }),
          effect: "pure",
          handler: ({ n }) => Effect.succeed({ value: n * 3 }),
        }),
      },
    });
    const crowded = Locus.extend(CliSemantics).make({
      id: "example:cli",
      properties: { program: "math" },
      relations: [
        CliCommand.to(CapabilityRef.make("example:other", "triple")),
        CliCommand.to(CapabilityRef.make("example:other", "double")),
        CliCommand.to(math.capability("double")),
      ],
    });
    const crowdedModel = withCli(crowded, [other]);
    const commands = await Effect.runPromise(
      deriveCommands(crowdedModel, "example:cli"),
    );
    expect(commands.map((command) => command.name)).toEqual([
      "double",
      "triple",
    ]);
    expect(commands[0]?.ref).toEqual(
      CapabilityRef.make("example:math", "double"),
    );
    expect(commands[1]?.ref).toEqual(
      CapabilityRef.make("example:other", "triple"),
    );
  });

  test("skips a relation to a capability that the Locus does not have", async () => {
    const dangling = Locus.extend(CliSemantics).make({
      id: "example:cli",
      properties: { program: "math" },
      relations: [
        CliCommand.to("example:math#missing"),
        CliCommand.to(math.capability("double")),
      ],
    });
    const danglingModel = withCli(dangling);
    const missing = danglingModel.relations.find(
      (relation) => relation.target.capability === "missing",
    );
    expect(missing?.valid).toBe(false);
    const commands = await Effect.runPromise(
      deriveCommands(danglingModel, "example:cli"),
    );
    expect(commands.map((command) => command.name)).toEqual(["double"]);
  });
});

test("the fixture model builds with no diagnostics", () => {
  expect(model.diagnostics).toEqual([]);
  expect(cli.id).toBe("example:cli");
});
