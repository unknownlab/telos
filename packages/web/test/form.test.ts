import { describe, expect, test } from "bun:test";
import { Cause, Effect, Exit, Schema } from "effect";
import { Capability, Locus, buildModel } from "@telos/kernel";
import { formModel } from "../src/form";
import { WebForm, WebSemantics } from "../src/semantics";
import { math, model, root, withWeb } from "./fixture";

const run = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.runPromise(Effect.exit(effect));

describe("formModel", () => {
  test("the fixture model has no diagnostics", () => {
    expect(model.diagnostics).toEqual([]);
  });

  test("the form of example:web names the capability, its key, its description and its field", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    expect(result.locus).toBe("example:web");
    expect(result.title).toBe("Math");
    expect(result.forms.map((form) => form.name)).toEqual(["double"]);
    const form = result.forms[0]!;
    expect(form.ref).toBe("example:math#double");
    expect(form.description).toBe("Doubles n.");
    expect(form.fields).toEqual([
      {
        name: "n",
        label: "N",
        type: "number",
        required: true,
        inputMode: "decimal",
        description: null,
      },
    ]);
  });

  test("integer maps to numeric, string and boolean map to text, with upper-cased labels", async () => {
    const Mixed = Capability.make({
      description: "Mixes fields.",
      input: Schema.Struct({
        i: Schema.Int,
        s: Schema.String,
        b: Schema.Boolean,
      }),
      output: Schema.Struct({ ok: Schema.Boolean }),
      effect: "pure",
      handler: () => Effect.succeed({ ok: true }),
    });
    const mixedLocus = Locus.make({
      id: "example:mixed",
      capabilities: { mix: Mixed },
    });
    const webLocus = Locus.extend(WebSemantics).make({
      id: "example:web",
      properties: { title: "Mixed" },
      relations: [WebForm.to(mixedLocus.capability("mix"))],
    });
    const result = await Effect.runPromise(
      formModel(withWeb(webLocus, [mixedLocus]), "example:web"),
    );
    const fields = result.forms[0]!.fields;
    expect(fields.map((f) => [f.name, f.label, f.inputMode])).toEqual([
      ["i", "I", "numeric"],
      ["s", "S", "text"],
      ["b", "B", "text"],
    ]);
  });

  test("submit with a valid number text gives the output of the capability", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    const form = result.forms[0]!;
    expect(await Effect.runPromise(form.submit({ n: "2" }))).toEqual({
      ok: true,
      output: { value: 4 },
    });
  });

  test("submit trims the text before it is converted", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    expect(
      await Effect.runPromise(result.forms[0]!.submit({ n: " 2.5 " })),
    ).toEqual({
      ok: true,
      output: { value: 5 },
    });
  });

  test("submit with a negative number gives the declared Negative error", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    const outcome = await Effect.runPromise(
      result.forms[0]!.submit({ n: "-1" }),
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.tag).toBe("Negative");
  });

  test("submit with text that is not a number gives InvalidInput with the exact message", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    const outcome = await Effect.runPromise(
      result.forms[0]!.submit({ n: "x" }),
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.tag).toBe("InvalidInput");
      expect(outcome.error.message).toBe(
        "Invalid input for example:math#double.",
      );
    }
  });

  test("submit with an empty required number gives InvalidInput", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    const outcome = await Effect.runPromise(result.forms[0]!.submit({ n: "" }));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.tag).toBe("InvalidInput");
  });

  test("submit with a missing field gives InvalidInput, because the absent key stays absent", async () => {
    const result = await Effect.runPromise(formModel(model, "example:web"));
    const outcome = await Effect.runPromise(result.forms[0]!.submit({}));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.tag).toBe("InvalidInput");
      expect(outcome.error.message).toBe(
        "Invalid input for example:math#double.",
      );
    }
  });

  test("an unknown Locus id fails with LocusNotFound", async () => {
    const exit = await run(formModel(model, "example:none"));
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Cause.findErrorOption(exit.cause);
      expect(error._tag).toBe("Some");
      if (error._tag === "Some") {
        expect((error.value as { _tag: string })._tag).toBe("LocusNotFound");
        expect((error.value as { id: string }).id).toBe("example:none");
        expect((error.value as { message: string }).message).toBe(
          "No web Locus example:none in the model.",
        );
      }
    }
  });

  test("a Locus without the telos.web extension fails with LocusNotFound", async () => {
    const exit = await run(formModel(model, "example:math"));
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Cause.findErrorOption(exit.cause);
      expect(error._tag).toBe("Some");
      if (error._tag === "Some") {
        expect((error.value as { message: string }).message).toBe(
          "No web Locus example:math in the model.",
        );
      }
    }
  });

  test("forms are sorted by capability name", async () => {
    const Zed = Capability.make({
      description: "Zed.",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      effect: "pure",
      handler: () => Effect.succeed({}),
    });
    const Alpha = Capability.make({
      description: "Alpha.",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      effect: "pure",
      handler: () => Effect.succeed({}),
    });
    const other = Locus.make({
      id: "example:other",
      capabilities: { zed: Zed, alpha: Alpha },
    });
    const webLocus = Locus.extend(WebSemantics).make({
      id: "example:web",
      properties: { title: "Sorted" },
      relations: [
        WebForm.to(other.capability("zed")),
        WebForm.to(other.capability("alpha")),
      ],
    });
    const result = await Effect.runPromise(
      formModel(withWeb(webLocus, [other]), "example:web"),
    );
    expect(result.forms.map((form) => form.name)).toEqual(["alpha", "zed"]);
  });

  test("with two targets of the same capability name, the one with the smaller Locus id is used", async () => {
    const Same = Capability.make({
      description: "Same name, from the later Locus.",
      input: Schema.Struct({}),
      output: Schema.Struct({}),
      effect: "pure",
      handler: () => Effect.succeed({}),
    });
    const other = Locus.make({
      id: "example:other",
      capabilities: { double: Same },
    });
    const webLocus = Locus.extend(WebSemantics).make({
      id: "example:web",
      properties: { title: "Shared" },
      relations: [
        WebForm.to(other.capability("double")),
        WebForm.to(math.capability("double")),
      ],
    });
    const result = await Effect.runPromise(
      formModel(withWeb(webLocus, [other]), "example:web"),
    );
    expect(result.forms).toHaveLength(1);
    expect(result.forms[0]!.ref).toBe("example:math#double");
  });

  test("the fixture root is the Locus that contains the web interface", () => {
    expect(root.contains.map((locus) => locus.id)).toEqual([
      "example:math",
      "example:web",
    ]);
    expect(buildModel(root).loci.has("example:web")).toBe(true);
  });
});
