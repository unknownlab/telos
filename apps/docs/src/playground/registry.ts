// START_MODULE_CONTRACT
//   PURPOSE: Declare the extension registry of the playground, so that a JSON Locus definition can name the extensions, relation types and archetypes the real kernel checks (FR-026).
//   SCOPE: PLAYGROUND_INTRO, the demo extensions DemoLabelA, DemoLabelB and DemoFlow, the demo relation type DemoFlowsTo, the demo archetype DemoFlowHasLabel, and PLAYGROUND_REGISTRY. Out: the examples (examples.ts) and the run (run.ts).
//   DEPENDS: M-KERNEL-API
//   LINKS: M-DOCS-PLAYGROUND, V-M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PLAYGROUND_INTRO - the one sentence that introduces the playground on its page
//   DemoLabelA - the first demo extension that gives a Locus a label
//   DemoLabelB - the second demo extension that gives a Locus a label, to show a property conflict
//   DemoFlowsTo - the demo relation type from a flow Locus to another Locus, acyclic
//   DemoFlowHasLabel - the demo archetype whose static rule needs a description on each flow Locus
//   DemoFlow - the demo extension that marks a Locus as part of a flow
//   PLAYGROUND_REGISTRY - the extensions the playground decodes JSON against
// END_MODULE_MAP

import {
  Archetype,
  Extension,
  External,
  type ExtensionRegistry,
  Purpose,
  RelationType,
  Rule,
  Source,
  violation,
} from "@telos/kernel";
import { Effect, Schema } from "effect";

// START_CONTRACT: PLAYGROUND_INTRO
//   PURPOSE: Introduce the playground on its page, and say that the typed text is decoded and checked by the real kernel in the browser.
//   INPUTS: none (constant)
//   OUTPUTS: { string - the introduction, also the text of the page's paragraph }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PLAYGROUND_INTRO
export const PLAYGROUND_INTRO =
  "Type a Locus definition as JSON; the real @telos/kernel decodes, builds and verifies it in your browser.";

// START_CONTRACT: DemoLabelA
//   PURPOSE: Give a Locus a label, as the first of two extensions that define the same property.
//   INPUTS: none (constant)
//   OUTPUTS: { Extension - the extension "demo.label-a" with a string property label }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DemoLabelA
export const DemoLabelA = Extension.make("demo.label-a", {
  description: "Gives a Locus a label (first definition).",
  properties: { label: Schema.String },
});

// START_CONTRACT: DemoLabelB
//   PURPOSE: Give a Locus a label, as the second definition of the same property, so that composing both shows a conflict.
//   INPUTS: none (constant)
//   OUTPUTS: { Extension - the extension "demo.label-b" with a string property label }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DemoLabelB
export const DemoLabelB = Extension.make("demo.label-b", {
  description: "Gives a Locus a label (second definition).",
  properties: { label: Schema.String },
});

// START_CONTRACT: DemoFlowsTo
//   PURPOSE: Name the relation from a flow Locus to another Locus, which may not form a cycle.
//   INPUTS: none (constant)
//   OUTPUTS: { RelationType - "demo.flows-to" with target "locus" and acyclic true }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DemoFlowsTo
export const DemoFlowsTo = RelationType.make("demo.flows-to", {
  description: "Work flows from this Locus to the target Locus.",
  target: "locus",
  acyclic: true,
});

// START_CONTRACT: DemoFlowHasLabel
//   PURPOSE: Check that every flow Locus says what it does, by a static rule that fails when the Locus has no description.
//   INPUTS: none (constant)
//   OUTPUTS: { Archetype - "demo.flow-has-label" applying to "demo.flow" with the static rule flow.labelled }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DemoFlowHasLabel
export const DemoFlowHasLabel = Archetype.make({
  id: "demo.flow-has-label",
  description: "Checks that every flow Locus says what it does.",
  appliesTo: ["demo.flow"],
  rules: [
    Rule.make({
      id: "flow.labelled",
      description: "A flow Locus has a description.",
      method: "static",
      check: (ctx) =>
        ctx.locus.description
          ? Effect.void
          : violation(`Locus ${ctx.locus.id} has no description.`),
    }),
  ],
});

// START_CONTRACT: DemoFlow
//   PURPOSE: Mark a Locus as part of a flow, which brings the flows-to relation and the flow archetype.
//   INPUTS: none (constant)
//   OUTPUTS: { Extension - "demo.flow" with the relation type DemoFlowsTo and the archetype DemoFlowHasLabel }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: DemoFlow
export const DemoFlow = Extension.make("demo.flow", {
  description: "Marks a Locus that takes part in a flow.",
  relationTypes: [DemoFlowsTo],
  archetypes: [DemoFlowHasLabel],
});

// START_CONTRACT: PLAYGROUND_REGISTRY
//   PURPOSE: Give the extensions the playground decodes JSON against, so that only these ids are known.
//   INPUTS: none (constant)
//   OUTPUTS: { ExtensionRegistry - the kernel's Purpose, Source, External and the demo extensions }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PLAYGROUND_REGISTRY
export const PLAYGROUND_REGISTRY: ExtensionRegistry = {
  extensions: [Purpose, Source, External, DemoLabelA, DemoLabelB, DemoFlow],
};
