# Telos

Telos by UnknownLab is a semantic-first, agent-native TypeScript framework. Software is described as Loci composed from semantic extensions, verified by Archetypes and exposed to people and agents through Packs.

There is no product documentation until Telos is written by Telos. [`tools/README.md`](tools/README.md) covers setup, commands and checks.

## Workspace

- `apps/calculator`: `@telos/calculator`, the reference implementation.
- `packages/kernel`: `@telos/kernel`, the semantic kernel.
- `packages/cli`: `@telos/cli`, the CLI Pack.
- `packages/agent`: `@telos/agent`, the Agent Pack.
- `packages/web`: `@telos/web`, the Web Pack.
- `telos.ts`: the repository's own Telos model.

## Commands

```sh
bun install
bun run verify
bun run telos list
bun run calculator add --a 2 --b 3
```
