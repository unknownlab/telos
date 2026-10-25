# Telos

Telos by UnknownLab is a semantic-first, agent-native TypeScript framework. Software is described as Loci composed from semantic extensions, verified by Archetypes and exposed to people and agents through Packs.

## Start here

- [Foundation](docs/foundation/README.md): what Telos is, its principles and terms.
- [Your first Locus](docs/guides/first-locus.md): the kernel API step by step.
- [Examples](docs/guides/examples.md): the calculator reference implementation.
- [Development tooling](docs/tooling.md): setup, commands and checks.

## Workspace

- `apps/docs`: `@telos/docs`, the documentation site.
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
bun run docs:build
```
