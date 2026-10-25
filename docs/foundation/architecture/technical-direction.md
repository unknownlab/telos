---
id: technical-direction
title: Technical direction
kind: direction
status: provisional
maturity: proposed
summary: TypeScript, Effect and Bun as the fixed stack, a browser-safe kernel, Packs that extend it, engines behind interfaces, and research directions for native compilation and a semantic intermediate representation.
related:
  [
    capabilities,
    ADR-0004,
    ADR-0003,
    ADR-0013,
    ADR-0016,
    P14-no-ai-in-the-kernel,
    P09-no-duplicated-frameworks,
  ]
---

# Technical direction

## Authoring language: TypeScript

TypeScript is the primary language for authoring Telos and systems built with it ([ADR-0004](../../decisions/ADR-0004-typescript-and-effect.md)). Its structural type system expresses definitions as plain typed values, its ecosystem covers the frontend, the backend and tooling, and agents read and write it well.

Telos favours ordinary TypeScript over new syntax. A Locus is made by an ordinary function call that returns an ordinary value. There is no Telos language, no decorators that change semantics and no code generation step needed to define something.

## Computational foundation: Effect

Effect is the foundation for anything that runs: validation, hashing, storage, verification and orchestration. It is used where it brings something concrete:

| Need                                         | Effect feature                      |
| -------------------------------------------- | ----------------------------------- |
| Decoding untrusted input with precise errors | `Schema`                            |
| Errors that are part of the type             | Typed error channel, tagged errors  |
| Engines that can be swapped                  | Services and layers                 |
| Resources with a lifetime                    | Scopes                              |
| Asynchronous and concurrent work             | Fibers, structured concurrency      |
| Durable, observable processes (later)        | Effect workflow and tracing support |

Effect is **not** used to wrap pure data. A Locus is a frozen value, not an `Effect`. A pure function stays a pure function. The rule of thumb: if it can fail, needs a service, does I/O or needs time, it returns an `Effect`; if it is data or a total pure function, it does not.

Effect 4 became stable on 2026-10-01. Telos starts on Effect 4, not 3, so it does not begin with a known migration.

## Runtime and toolchain: Bun

Bun is the development toolchain: package manager, test runner, type checker, linter, formatter. It is also the default runtime for scripts and servers. The version is pinned in `package.json`, and the install step checks it.

The kernel, `packages/kernel`, is browser-safe. It avoids Bun-specific APIs where a portable standard exists, so the same code runs in browsers, Bun, Node and Deno. Example: digests use Web Crypto (`crypto.subtle`), which all of them provide, rather than `Bun.hash`. This is what lets the documentation playground run the real kernel in the browser.

Applications and scripts, such as `apps/docs` and the command line, may use Bun APIs freely.

## Packages

Workspace packages follow the repository conventions in [docs/tooling.md](https://github.com/unknownlab/telos/blob/main/docs/tooling.md). Telos packages use the `@telos/` scope ([ADR-0015](../../decisions/ADR-0015-product-naming.md)). The foundation must stay free of circular workspace dependencies: `packages/kernel` depends on nothing in `apps/` or on the other packages, and apps depend on packages, never the reverse.

Packs are ordinary TypeScript packages that depend on the kernel's public API. The kernel has no knowledge of a Pack.

## Engines behind interfaces

External engines connect through interfaces that the semantic model defines ([P14](../principles/P14-no-ai-in-the-kernel.md), [P09](../principles/P09-no-duplicated-frameworks.md)). In code, an engine interface is an Effect service; an engine is a layer that implements it. The kernel never imports an engine directly. Engines Telos expects to connect to, and does not intend to replace: test runners, model checkers, AI model providers, infrastructure-as-code engines, durable workflow engines, databases and telemetry backends.

Temporary development engines follow the same rule. Stage 0 specification checks were data run by a small runner, with `bun test` and the browser as two adapters ([ADR-0013](../../decisions/ADR-0013-temporary-executable-specifications.md)). They have been removed.

## Semantic intermediate representation

The kernel uses TypeScript values and a canonical JSON form used for digests. It has no intermediate representation beyond these. A portable representation is a research direction ([OQ-014](../open-questions.md#oq-014)). Requirements it should meet when it is designed:

1. Lossless for the semantic part of every managed definition; no storage or display metadata.
2. Canonical: one serialisation per meaning, so digests are stable ([OQ-011](../open-questions.md#oq-011)).
3. Versioned, with explicit migration between versions.
4. Language-neutral, with a published schema, so non-TypeScript tools can read it.
5. Graph-friendly: identities and relations are first-class, not nested blobs.
6. Streamable and diffable, so large semantic models and change sets stay practical.
7. Free of engine-specific concepts.

No compiler infrastructure is built for this in the current foundation.

## Native compilation

Compiling TypeScript to native code is a research direction, not a dependency. Candidates such as Perry and ScriptC may be evaluated later for specific needs (start-up time, embedding, constrained environments). None is required, and no code may depend on one.

Rust is not part of the required stack. It may be used later for an isolated substrate component, such as a sandbox or a hashing hot path, when there is measured need and an architecture decision.

## Extensibility rules

1. The kernel depends on no AI provider, test framework, storage engine, infrastructure provider, UI library, compiler, graph database or orchestration platform.
2. Extension happens through semantic extensions, Packs and engine services, not through patching kernel types ([P02](../principles/P02-composable-extensions.md)).
3. Any new required dependency of the kernel needs an architecture decision ([P16](../principles/P16-no-speculative-implementation.md)).
