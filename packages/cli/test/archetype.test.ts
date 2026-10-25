import { describe, expect, test } from "bun:test";
import { Effect, Schema } from "effect";
import {
  Capability,
  Extension,
  Locus,
  RelationType,
  buildModel,
  verify,
  type Finding,
  type LocusDefinition,
} from "@telos/kernel";
import { CliInterface } from "../src/archetype";
import { CliCommand, CliSemantics } from "../src/semantics";
import { Negative, double, math, model } from "./fixture";

function findingFor(
  target: ReturnType<typeof buildModel>,
  rule: string,
): Promise<Finding> {
  return Effect.runPromise(
    verify(target, { runner: "test", loci: ["example:cli"] }),
  ).then((report) => {
    const found = report.findings.find((finding) => finding.rule === rule);
    if (found === undefined) throw new Error(`No finding for ${rule}.`);
    return found;
  });
}

function buildWith(
  mathLocus: LocusDefinition,
  cliLocus: LocusDefinition,
  extra: ReadonlyArray<LocusDefinition> = [],
) {
  return buildModel(
    Locus.make({
      id: "example:root",
      contains: [mathLocus, cliLocus, ...extra],
    }),
  );
}

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
  },
});

describe("CliInterface archetype", () => {
  test("the extension id is pinned once: CliSemantics is telos.cli", () => {
    expect(CliSemantics.id).toBe("telos.cli");
  });

  test("is the telos.cli.interface archetype for telos.cli", () => {
    expect(CliInterface.id).toBe("telos.cli.interface");
    expect(CliInterface.appliesTo).toEqual(["telos.cli"]);
    expect(CliInterface.rules.map((rule) => rule.id)).toEqual([
      "cli.commands-exist",
      "cli.unique-commands",
      "cli.flags-derivable",
      "cli.invalid-input-exit",
    ]);
  });

  test("cli.commands-exist passes when the Locus exposes a command", async () => {
    const finding = await findingFor(model, "cli.commands-exist");
    expect(finding.outcome).toBe("passed");
  });

  test("cli.commands-exist fails when the Locus exposes no command", async () => {
    const bare = Locus.extend(CliSemantics).make({
      id: "example:cli",
      properties: { program: "math" },
    });
    const finding = await findingFor(
      buildWith(math, bare),
      "cli.commands-exist",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("CLI Locus example:cli exposes no command.");
  });

  test("cli.unique-commands passes when every command name is unique", async () => {
    const finding = await findingFor(model, "cli.unique-commands");
    expect(finding.outcome).toBe("passed");
  });

  test("cli.unique-commands fails when two targets share a command name", async () => {
    const twice = Locus.extend(CliSemantics).make({
      id: "example:cli",
      properties: { program: "math" },
      relations: [
        CliCommand.to(math.capability("double")),
        CliCommand.to(other.capability("double")),
      ],
    });
    const finding = await findingFor(
      buildWith(math, twice, [other]),
      "cli.unique-commands",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("Command double is exposed more than once.");
  });

  test("cli.flags-derivable passes when every exposed input has supported fields", async () => {
    const finding = await findingFor(model, "cli.flags-derivable");
    expect(finding.outcome).toBe("passed");
  });

  test("cli.flags-derivable fails when an exposed input has an unsupported field", async () => {
    const tagged = Locus.make({
      id: "example:math",
      capabilities: {
        double,
        tags: Capability.make({
          description: "Takes tags.",
          input: Schema.Struct({ tags: Schema.Array(Schema.String) }),
          output: Schema.Struct({ value: Schema.Finite }),
          errors: [Negative],
          effect: "pure",
          handler: () => Effect.succeed({ value: 0 }),
        }),
      },
    });
    const cliLocus = Locus.extend(CliSemantics).make({
      id: "example:cli",
      properties: { program: "math" },
      relations: [CliCommand.to(tagged.capability("tags"))],
    });
    const finding = await findingFor(
      buildWith(tagged, cliLocus),
      "cli.flags-derivable",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Capability example:math#tags has an unsupported field tags.",
    );
  });

  test("cli.invalid-input-exit passes when a missing required input exits 2 with InvalidInput", async () => {
    const finding = await findingFor(model, "cli.invalid-input-exit");
    expect(finding.outcome).toBe("passed");
  });

  test("cli.invalid-input-exit fails when the command is not granted invocation", async () => {
    const FakeCommand = RelationType.make("cli.command", {
      description: "Fake command.",
      target: "capability",
    });
    const FakeCli = Extension.make("telos.cli", {
      description: "Fake CLI.",
      properties: { program: Schema.String },
      relationTypes: [FakeCommand],
      archetypes: [CliInterface],
    });
    const fake = Locus.extend(FakeCli).make({
      id: "example:cli",
      properties: { program: "math" },
      relations: [FakeCommand.to(math.capability("double"))],
    });
    const finding = await findingFor(
      buildWith(math, fake),
      "cli.invalid-input-exit",
    );
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Command double does not exit with code 2 and InvalidInput for missing input.",
    );
  });
});
