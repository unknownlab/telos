# Quickstart: Semantic Foundation Rebuild

These commands work once the mission is merged. Each line names the work package that makes it work.

## Define and inspect a Locus (WP03, WP04, WP09)

```ts
import { Effect, Schema } from "effect"
import { Capability, Extension, Locus, Purpose, RelationType, Telos } from "@telos/kernel"

const Greets = RelationType.make("demo.greets", { description: "Greets the target Locus.", target: "locus" })
const Friendly = Extension.make("demo.friendly", {
  description: "A Locus that greets.",
  properties: { greeting: Schema.String },
  relationTypes: [Greets],
})

const world = Locus.make({ id: "demo:world" })
const hello = Locus.extend(Purpose, Friendly).make({
  id: "demo:hello",
  properties: { purpose: "Say hello.", greeting: "Hello" },
  relations: [Greets.to(world)],
  capabilities: {
    greet: Capability.make({
      description: "Greets a name.",
      input: Schema.Struct({ name: Schema.String }),
      output: Schema.Struct({ text: Schema.String }),
      effect: "pure",
      handler: ({ name }) => Effect.succeed({ text: `Hello, ${name}` }),
    }),
  },
})
const root = Locus.make({ id: "demo:root", contains: [hello, world] })

const program = Effect.gen(function* () {
  const telos = yield* Telos
  const view = yield* telos.resolve("demo:hello")
  return yield* view.capabilities()
})
console.log(JSON.stringify(await Effect.runPromise(program.pipe(Effect.provide(Telos.layer(root)))), null, 2))
```

## Calculator (WP14)

```sh
bun run calculator add --a 2 --b 3          # {"result":5}, exit 0
bun run calculator divide --a 1 --b 0       # stderr {"tag":"DivisionByZero",...}, exit 1
bun run calculator add --a x --b 1          # stderr {"tag":"InvalidInput",...}, exit 2
bun run calculator:mcp                      # MCP server on stdio (for an agent host)
bun run calculator:agent-demo               # deterministic agent: discover, call, impact; last line {"ok":true}
```

Web: `bun run --cwd apps/docs dev`, then open `/calculator` (WP20).

## Repository model (WP15)

```sh
bun run telos list
bun run telos inspect calculator:arithmetic
bun run telos verify
bun run telos closure
bun run telos impact calculator:arithmetic#add
bun run telos check        # also runs inside `bun run verify` and the review gate
```

## Documentation (WP18, WP19, WP20)

`bun run docs:build && bun run docs:preview` serves these pages:

- `/inspector`: the real repository model
- `/verification`: the Archetype and closure report
- `/playground`: kernel in the browser
- `/calculator`: the calculator web interface

## Full check

```sh
bun run verify
```
