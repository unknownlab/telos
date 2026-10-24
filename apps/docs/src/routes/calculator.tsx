// START_MODULE_CONTRACT
//   PURPOSE: Serve the /calculator page, whose forms are built once from the calculator web interface of the calculator model.
//   SCOPE: The route definition, its head and the form model built at module load. It never defines a field or an operation.
//   DEPENDS: M-DOCS-CALCULATOR
//   LINKS: M-DOCS-CALCULATOR, V-M-DOCS-CALCULATOR
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   Route - the TanStack route of /calculator
// END_MODULE_MAP

import { createFileRoute } from "@tanstack/react-router";
import { Effect } from "effect";
import { calculatorModel } from "@telos/calculator";
import { formModel } from "@telos/web";
import { CALCULATOR_INTRO, CalculatorView } from "@/components/calculator-view";
import { pageTitle } from "@/lib/site";

// Built once at module load with top-level await: formModel hashes contracts with Web Crypto, which is
// asynchronous, so runSync cannot be used. Not a loader: loader data is serialized and submit is a function.
const CALCULATOR_FORMS = await Effect.runPromise(
  formModel(calculatorModel, "calculator:web"),
);

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: pageTitle("Calculator") },
      { name: "description", content: CALCULATOR_INTRO },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  return <CalculatorView formModel={CALCULATOR_FORMS} />;
}
