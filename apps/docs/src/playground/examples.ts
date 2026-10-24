// START_MODULE_CONTRACT
//   PURPOSE: Give the playground its example definitions, each with the diagnostic or decode issue it shows, so that a reader can pick one and run it (FR-026).
//   SCOPE: PlaygroundExample, PLAYGROUND_EXAMPLES and the JSON text of each example. Out: running them (run.ts) and the page (components).
//   DEPENDS: M-DOCS-PLAYGROUND
//   LINKS: M-DOCS-PLAYGROUND, V-M-DOCS-PLAYGROUND
//   ROLE: RUNTIME
//   MAP_MODE: EXPORTS
// END_MODULE_CONTRACT
//
// START_MODULE_MAP
//   PlaygroundExample - one example: its name, title, whether it is valid, and its JSON text
//   PLAYGROUND_EXAMPLES - the examples in the order the picker shows them
// END_MODULE_MAP

// START_CONTRACT: PlaygroundExample
//   PURPOSE: Describe one example of the playground picker.
//   INPUTS: none (type)
//   OUTPUTS: { PlaygroundExample - name, title, valid flag and the JSON text }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PlaygroundExample
export interface PlaygroundExample {
  readonly name: string;
  readonly title: string;
  readonly valid: boolean;
  readonly json: string;
}

// START_CONTRACT: PLAYGROUND_EXAMPLES
//   PURPOSE: List the examples in picker order, each with the JSON of one definition and the expected outcome of its run.
//   INPUTS: none (constant)
//   OUTPUTS: { ReadonlyArray<PlaygroundExample> - eight examples, two valid and six invalid }
//   SIDE_EFFECTS: none
//   LINKS: M-DOCS-PLAYGROUND
// END_CONTRACT: PLAYGROUND_EXAMPLES
export const PLAYGROUND_EXAMPLES: ReadonlyArray<PlaygroundExample> = [
  {
    name: "minimal",
    title: "Minimal Locus",
    valid: true,
    json: JSON.stringify({ id: "demo:hello" }, null, 2),
  },
  {
    name: "composed",
    title: "Composed Locus",
    valid: true,
    json: JSON.stringify(
      {
        id: "demo:shop",
        extensions: ["telos.purpose", "telos.source", "demo.flow"],
        description: "A small shop.",
        properties: {
          purpose: "Sell things.",
          responsibilities: ["Take orders"],
          sources: ["src/shop/**/*.ts"],
        },
        contains: [
          {
            id: "demo:checkout",
            extensions: ["demo.flow"],
            description: "Turns a basket into an order.",
          },
        ],
        relations: [{ type: "demo.flows-to", target: "demo:checkout" }],
      },
      null,
      2,
    ),
  },
  {
    name: "property-conflict",
    title: "Property conflict",
    valid: false,
    json: JSON.stringify(
      {
        id: "demo:labelled",
        extensions: ["demo.label-a", "demo.label-b"],
        properties: { label: "Hello" },
      },
      null,
      2,
    ),
  },
  {
    name: "invalid-property",
    title: "Invalid property",
    valid: false,
    json: JSON.stringify(
      {
        id: "demo:purpose",
        extensions: ["telos.purpose"],
        properties: { purpose: 5 },
      },
      null,
      2,
    ),
  },
  {
    name: "missing-target",
    title: "Missing relation target",
    valid: false,
    json: JSON.stringify(
      {
        id: "demo:flow",
        extensions: ["demo.flow"],
        description: "Flows nowhere.",
        relations: [{ type: "demo.flows-to", target: "demo:nowhere" }],
      },
      null,
      2,
    ),
  },
  {
    name: "cycle",
    title: "Relation cycle",
    valid: false,
    json: JSON.stringify(
      {
        id: "demo:loop",
        contains: [
          {
            id: "demo:a",
            extensions: ["demo.flow"],
            description: "First step.",
            relations: [{ type: "demo.flows-to", target: "demo:b" }],
          },
          {
            id: "demo:b",
            extensions: ["demo.flow"],
            description: "Second step.",
            relations: [{ type: "demo.flows-to", target: "demo:a" }],
          },
        ],
      },
      null,
      2,
    ),
  },
  {
    name: "malformed-id",
    title: "Malformed identity",
    valid: false,
    json: JSON.stringify({ id: "Demo Hello" }, null, 2),
  },
  {
    name: "unknown-extension",
    title: "Unknown extension",
    valid: false,
    json: JSON.stringify(
      { id: "demo:hello", extensions: ["demo.unknown"] },
      null,
      2,
    ),
  },
];
