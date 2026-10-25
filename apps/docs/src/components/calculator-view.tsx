// START_MODULE_CONTRACT
//   PURPOSE: Render the calculator page from a web form model, so that each form is derived from a capability contract and submits through the calculator web interface (FR-026).
//   SCOPE: CALCULATOR_INTRO, outcomeText and CalculatorView. It renders the forms it is given, never defines a field or an operation, and never imports a Bun-only module.
//   DEPENDS: M-DOCS-SITE, M-PACK-WEB
//   LINKS: M-DOCS-CALCULATOR, V-M-DOCS-CALCULATOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   CALCULATOR_INTRO - the sentence that describes the calculator page, shared with the page description and llms.txt
//   outcomeText - the text that an invocation outcome shows in its result panel
//   CalculatorView - the calculator page with one form per capability and the outcome of each submit
// END_MODULE_MAP

import { useEffect, useState, type FormEvent } from "react";
import { Effect } from "effect";
import type { InvocationOutcome } from "@telos/kernel";
import type { WebFormDefinition, WebFormModel } from "@telos/web";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// START_CONTRACT: CALCULATOR_INTRO
//   PURPOSE: Give the one sentence that introduces the calculator page and its llms.txt entry.
//   INPUTS: none
//   OUTPUTS: { string - the introduction, identical to the llms.txt bullet }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CALCULATOR
// END_CONTRACT: CALCULATOR_INTRO
export const CALCULATOR_INTRO =
  "The calculator web interface: forms derived from the capability contracts of calculator:arithmetic.";

// START_CONTRACT: outcomeText
//   PURPOSE: Show an invocation outcome as the JSON text that the result panel prints.
//   INPUTS: { outcome: InvocationOutcome - the outcome of one submit }
//   OUTPUTS: { string - JSON.stringify of the outcome }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-CALCULATOR
// END_CONTRACT: outcomeText
export function outcomeText(outcome: InvocationOutcome): string {
  return JSON.stringify(outcome);
}

// START_CONTRACT: CalculatorView
//   PURPOSE: Render one labelled form per capability of the web model, submit each form through its own submit function and show each outcome.
//   INPUTS: { formModel: WebFormModel - the forms derived from the calculator web interface }
//   OUTPUTS: { JSX.Element - the calculator page; forms have data-form, fields have labels with inputMode, results have data-result }
//   SIDE_EFFECTS: after mount, sets the hydration flag; on submit, runs the form submit effect and stores its outcome
//   LINKS: M-DOCS-CALCULATOR
// END_CONTRACT: CalculatorView
export function CalculatorView({
  formModel,
}: {
  readonly formModel: WebFormModel;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [outcomes, setOutcomes] = useState<
    Readonly<Record<string, InvocationOutcome>>
  >({});

  useEffect(() => {
    setHydrated(true);
  }, []);

  function submitForm(form: WebFormDefinition) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const raw = Object.fromEntries(
        form.fields.map((field) => [
          field.name,
          String(data.get(field.name) ?? ""),
        ]),
      );
      void Effect.runPromise(form.submit(raw)).then((outcome) => {
        setOutcomes((previous) => ({ ...previous, [form.name]: outcome }));
      });
    };
  }

  return (
    <main
      id="content"
      data-page="calculator"
      className="flex flex-col gap-8 py-8"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Calculator</h1>
      <p>{CALCULATOR_INTRO}</p>
      <p>
        Each form is derived from a capability contract of calculator:arithmetic
        and submits through the calculator:web interface, so it reports the same
        errors as the command line and the agent tools.
      </p>
      <div data-slot="calculator" data-ready={hydrated ? "true" : "false"}>
        {formModel.forms.map((form) => {
          const titleId = `form-${form.name}-title`;
          const outcome = outcomes[form.name];
          return (
            <form
              key={form.name}
              data-form={form.name}
              aria-labelledby={titleId}
              onSubmit={submitForm(form)}
              className="flex flex-col gap-4 border-t border-border py-6"
            >
              <h2 id={titleId} className="text-xl font-semibold">
                {form.name}
              </h2>
              <p>{form.description}</p>
              {form.fields.map((field) => {
                const inputId = `${form.name}-${field.name}`;
                return (
                  <div key={field.name} className="flex flex-col gap-1">
                    <label htmlFor={inputId} className="font-medium">
                      {field.label}
                    </label>
                    <Input
                      id={inputId}
                      name={field.name}
                      type="text"
                      inputMode={field.inputMode}
                      aria-required={field.required}
                      aria-describedby={
                        field.description === null
                          ? undefined
                          : `${inputId}-description`
                      }
                    />
                    {field.description === null ? null : (
                      <span id={`${inputId}-description`} className="text-sm">
                        {field.description}
                      </span>
                    )}
                  </div>
                );
              })}
              <div>
                <Button type="submit" data-action="submit">
                  Submit
                </Button>
              </div>
              {outcome === undefined ? null : (
                <section
                  data-result="calculator"
                  data-form={form.name}
                  aria-live="polite"
                >
                  <pre data-slot="outcome" className="overflow-x-auto text-sm">
                    {outcomeText(outcome)}
                  </pre>
                </section>
              )}
            </form>
          );
        })}
      </div>
    </main>
  );
}
