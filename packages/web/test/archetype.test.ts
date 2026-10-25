// START_MODULE_CONTRACT
//   PURPOSE: Prove that every WebInterface rule passes for a correct web Locus and fails with its exact message for a broken one.
//   SCOPE: Tests of the four WebInterface rules through verify. Out: form derivation and submit (form.test.ts).
//   DEPENDS: M-PACK-WEB, M-KERNEL-API
//   LINKS: M-PACK-WEB, V-M-PACK-WEB
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   findingOf - returns the finding of one rule of the web Locus in a verification report
//   check - verifies the web Locus of a model with the test runner
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import {
  Capability,
  Extension,
  Locus,
  RelationType,
  buildModel,
  verify,
} from "@telos/kernel";
import type { VerificationReport } from "@telos/kernel";
import { Effect, Schema } from "effect";
import { WebInterface } from "../src/archetype";
import { WebForm, WebSemantics } from "../src/semantics";
import { Negative, math, model, withWeb } from "./fixture";

const findingOf = (report: VerificationReport, rule: string) => {
  const finding = report.findings.find(
    (f) => f.locus === "example:web" && f.rule === rule,
  );
  if (finding === undefined) throw new Error(`No finding for ${rule}.`);
  return finding;
};

const check = (m: Parameters<typeof verify>[0]) =>
  Effect.runPromise(verify(m, { runner: "test", loci: ["example:web"] }));

describe("WebInterface rules", () => {
  test("the archetype has the id, the extension and the four rules in table order", () => {
    expect(WebInterface.id).toBe("telos.web.interface");
    expect(WebInterface.appliesTo).toEqual(["telos.web"]);
    expect(WebInterface.rules.map((rule) => rule.id)).toEqual([
      "web.forms-exist",
      "web.unique-forms",
      "web.fields-derivable",
      "web.invalid-input-error",
    ]);
  });

  test("web.forms-exist passes when the interface exposes a form", async () => {
    const report = await check(model);
    expect(findingOf(report, "web.forms-exist").outcome).toBe("passed");
  });

  test("web.forms-exist fails when the web Locus exposes no form", async () => {
    const webLocus = Locus.extend(WebSemantics).make({
      id: "example:web",
      properties: { title: "Math" },
    });
    const report = await check(withWeb(webLocus));
    const finding = findingOf(report, "web.forms-exist");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("Web Locus example:web exposes no form.");
  });

  test("web.unique-forms passes when every form name is used once", async () => {
    const report = await check(model);
    expect(findingOf(report, "web.unique-forms").outcome).toBe("passed");
  });

  test("web.unique-forms fails when two targets expose the same name", async () => {
    const Other = Capability.make({
      description: "Doubles with another target.",
      input: Schema.Struct({ n: Schema.Finite }),
      output: Schema.Struct({ value: Schema.Finite }),
      errors: [Negative],
      effect: "pure",
      handler: ({ n }) => Effect.succeed({ value: n * 2 }),
    });
    const other = Locus.make({
      id: "example:other",
      capabilities: { double: Other },
    });
    const webLocus = Locus.extend(WebSemantics).make({
      id: "example:web",
      properties: { title: "Math" },
      relations: [
        WebForm.to(math.capability("double")),
        WebForm.to(other.capability("double")),
      ],
    });
    const report = await check(withWeb(webLocus, [other]));
    const finding = findingOf(report, "web.unique-forms");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe("Form double is exposed more than once.");
  });

  test("web.fields-derivable passes when every field is supported", async () => {
    const report = await check(model);
    expect(findingOf(report, "web.fields-derivable").outcome).toBe("passed");
  });

  test("web.fields-derivable fails when a field has an unsupported type", async () => {
    const Tags = Capability.make({
      description: "Takes tags.",
      input: Schema.Struct({ tags: Schema.Array(Schema.String) }),
      output: Schema.Struct({}),
      effect: "pure",
      handler: () => Effect.succeed({}),
    });
    const tagged = Locus.make({
      id: "example:math",
      capabilities: { tags: Tags },
    });
    const webLocus = Locus.extend(WebSemantics).make({
      id: "example:web",
      properties: { title: "Tags" },
      relations: [WebForm.to(tagged.capability("tags"))],
    });
    const taggedModel = buildModel(
      Locus.make({ id: "example:root", contains: [tagged, webLocus] }),
    );
    const report = await check(taggedModel);
    const finding = findingOf(report, "web.fields-derivable");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Capability example:math#tags has an unsupported field tags.",
    );
  });

  test("web.invalid-input-error passes when the fixture form answers missing input with InvalidInput", async () => {
    const report = await check(model);
    expect(findingOf(report, "web.invalid-input-error").outcome).toBe("passed");
  });

  test("web.invalid-input-error fails when the form is not granted, so missing input is not InvalidInput", async () => {
    const FakeForm = RelationType.make("web.form", {
      description: "Fake form.",
      target: "capability",
    });
    const FakeWeb = Extension.make("telos.web", {
      description: "Fake web.",
      properties: { title: Schema.String },
      relationTypes: [FakeForm],
      archetypes: [WebInterface],
    });
    const fake = Locus.extend(FakeWeb).make({
      id: "example:web",
      properties: { title: "Math" },
      relations: [FakeForm.to(math.capability("double"))],
    });
    const report = await check(withWeb(fake));
    const finding = findingOf(report, "web.invalid-input-error");
    expect(finding.outcome).toBe("failed");
    expect(finding.message).toBe(
      "Form double does not answer missing input with InvalidInput.",
    );
  });
});
