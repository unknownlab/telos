---
id: first-locus
title: Your first Locus
kind: guide
order: 2
section: first-locus
status: provisional
maturity: implemented
summary: A tutorial that defines a Locus, adds an extension and a capability, composes them, builds a model and inspects the result.
related:
  [locus, semantic-extension, composition, capability, semantic-model, examples]
---

# Your first Locus

## 1. A Locus

A [Locus](../foundation/terminology/locus.md) is the unit of the model. Its identity is the only required field, so the smallest definition that the playground accepts is an identity alone:

```json playground=minimal
{
  "id": "demo:hello"
}
```

The same Locus in TypeScript is a call to `Locus.make`. It returns a frozen definition.

```ts source=apps/docs/test/guide-snippets.ts#GUIDE_FIRST_LOCUS
export const hello = Locus.make({
  id: "demo:hello",
  description: "The smallest complete Locus: an identity and a description.",
});
```

An identity alone is a complete Locus. The description is optional.

## 2. A semantic extension

A [semantic extension](../foundation/terminology/semantic-extension.md) adds properties to a Locus. `Extension.make` gives the extension an identity and the schemas of its properties.

```ts source=apps/docs/test/guide-snippets.ts#GUIDE_EXTENSION
export const Greeting = Extension.make("demo.greeting", {
  description: "Gives a Locus the greeting it answers with.",
  properties: { greeting: Schema.String },
});
```

## 3. Composition

`Locus.extend` builds a [kind](../foundation/terminology/locus-kind.md) from extensions. The kind carries the properties of every extension it is built from. The Purpose extension of the kernel adds a `purpose` property, so the kind below requires one.

```ts source=apps/docs/test/guide-snippets.ts#GUIDE_COMPOSITION
export const Greeter = Locus.extend(Purpose, Greeting);
```

When two extensions define the same property with different schemas, the composition fails with the diagnostic `composition.property-conflict`. The playground shows that conflict. Its two extensions both define `label`:

```json playground=property-conflict
{
  "id": "demo:labelled",
  "extensions": ["demo.label-a", "demo.label-b"],
  "properties": {
    "label": "Hello"
  }
}
```

## 4. A capability

A [capability](../foundation/terminology/capability.md) is a typed operation of a Locus. It has an input schema, an output schema and a handler. `Capability.make` builds one, and a Locus lists its capabilities in `capabilities`.

```ts source=apps/docs/test/guide-snippets.ts#GUIDE_CAPABILITY
export const greet = Capability.make({
  description: "Greets a person by name.",
  input: Schema.Struct({ name: Schema.String }),
  output: Schema.Struct({ text: Schema.String }),
  effect: "pure",
  handler: ({ name }) => Effect.succeed({ text: `Hello, ${name}.` }),
});

export const greeter = Greeter.make({
  id: "demo:greeter",
  description: "Answers with a greeting.",
  properties: { purpose: "Greet people by name.", greeting: "Hello" },
  capabilities: { greet },
});
```

## 5. The semantic model

`buildModel` checks a root Locus and its contained Loci, and returns a [semantic model](../foundation/terminology/semantic-model.md). A valid model has no diagnostics.

```ts source=apps/docs/test/guide-snippets.ts#GUIDE_MODEL
export const demo = Locus.make({ id: "demo:app", contains: [hello, greeter] });
export const demoModel = buildModel(demo);
```

A model with a relation to a Locus that does not exist, or with a cycle of relations, has diagnostics. The playground shows a composed model that is valid:

```json playground=composed
{
  "id": "demo:shop",
  "extensions": ["telos.purpose", "telos.source", "demo.flow"],
  "description": "A small shop.",
  "properties": {
    "purpose": "Sell things.",
    "responsibilities": ["Take orders"],
    "sources": ["src/shop/**/*.ts"]
  },
  "contains": [
    {
      "id": "demo:checkout",
      "extensions": ["demo.flow"],
      "description": "Turns a basket into an order."
    }
  ],
  "relations": [
    {
      "type": "demo.flows-to",
      "target": "demo:checkout"
    }
  ]
}
```

## 6. Inspect it

`Telos.resolve` returns a view of one Locus, and `inspect` describes it: its identity, its extensions and its capabilities. The program below builds a layer from the model and inspects `demo:greeter`.

```ts source=apps/docs/test/guide-snippets.ts#GUIDE_INSPECT
export const inspectGreeter = Effect.gen(function* () {
  const telos = yield* Telos;
  const view = yield* telos.resolve("demo:greeter");
  return yield* view.inspect();
}).pipe(Effect.provide(Telos.layer(demo)));
```

## Next steps

- [Examples](examples.md) shows the calculator reference implementation and the invalid definitions.
- The [playground](/playground) runs the kernel on definitions that you can edit.
- The [inspector](/inspector) shows the Loci of this repository.
