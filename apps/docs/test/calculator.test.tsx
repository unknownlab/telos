// START_MODULE_CONTRACT
//   PURPOSE: Prove that the calculator page is derived from the calculator web interface, renders one labelled form per capability and reports the real outcomes of each submit (FR-026).
//   SCOPE: The form model of calculator:web, the static markup of the calculator page and the outcome text of the add, divide and invalid-input submits.
//   DEPENDS: M-DOCS-CALCULATOR
//   LINKS: V-M-DOCS-CALCULATOR
//   ROLE: TEST
//   MAP_MODE: LOCALS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   FORMS - the form model of calculator:web, built once with the real kernel
//   formOf - the form of the calculator web model with the given capability name
// END_MODULE_MAP

import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { renderToStaticMarkup } from "react-dom/server";
import { calculatorModel } from "@telos/calculator";
import { formModel, type WebFormDefinition } from "@telos/web";
import { CalculatorView, outcomeText } from "@/components/calculator-view";

const FORMS = await Effect.runPromise(
  formModel(calculatorModel, "calculator:web"),
);

function formOf(name: string): WebFormDefinition {
  const form = FORMS.forms.find((candidate) => candidate.name === name);
  if (form === undefined) throw new Error(`no form named ${name}`);
  return form;
}

describe("calculator page: the form model", () => {
  test("calculator:web has one form per arithmetic capability", () => {
    expect(FORMS.forms.map((form) => form.name).sort()).toEqual([
      "add",
      "divide",
      "multiply",
      "subtract",
    ]);
  });
});

describe("calculator page: the rendered markup", () => {
  const html = renderToStaticMarkup(<CalculatorView formModel={FORMS} />);

  test("renders exactly one form element per capability, each named by its capability", () => {
    expect(html.match(/<form\b/g)?.length ?? 0).toBe(FORMS.forms.length);
    for (const form of FORMS.forms) {
      expect(
        html.match(new RegExp(`<form[^>]*data-form="${form.name}"`, "g"))
          ?.length,
      ).toBe(1);
    }
  });

  test("decimal fields carry the decimal input mode", () => {
    expect(html).toContain('inputMode="decimal"');
  });

  test("the label of the first field of add is A and points at its input", () => {
    expect(html).toMatch(/<label[^>]*for="add-a"[^>]*>A<\/label>/);
  });

  test("the page is not hydrated in static rendering", () => {
    expect(html).toContain('data-ready="false"');
  });

  test("the page states that the forms are derived from the capability contracts", () => {
    expect(html).toContain("capability contracts of calculator:arithmetic");
  });
});

describe("calculator page: the outcome of each submit", () => {
  test("add of 2 and 3 reports result 5", async () => {
    const outcome = await Effect.runPromise(
      formOf("add").submit({ a: "2", b: "3" }),
    );
    expect(outcomeText(outcome)).toContain('"result":5');
  });

  test("divide of 1 by 0 reports DivisionByZero", async () => {
    const outcome = await Effect.runPromise(
      formOf("divide").submit({ a: "1", b: "0" }),
    );
    expect(outcomeText(outcome)).toContain("DivisionByZero");
  });

  test("a non-numeric operand reports InvalidInput", async () => {
    const outcome = await Effect.runPromise(
      formOf("add").submit({ a: "x", b: "1" }),
    );
    expect(outcomeText(outcome)).toContain("InvalidInput");
  });
});
