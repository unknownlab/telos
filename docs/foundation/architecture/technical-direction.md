---
id: technical-direction
title: Technical direction
kind: direction
status: provisional
maturity: proposed
summary: TypeScript and Effect as the authoring model, Bun as the toolchain, portable foundations, engines behind interfaces, and the research directions for native compilation and a semantic intermediate representation.
related: [capabilities, ADR-0004, ADR-0003, ADR-0013, P15-engine-independence]
---

# Technical direction

## Authoring language: TypeScript

TypeScript is the primary language for authoring Telos and systems built with it ([ADR-0004](../../decisions/ADR-0004-typescript-and-effect.md)). Its structural type system expresses definitions as plain typed values, its ecosystem covers the frontend, the backend and tooling, and agents read and write it well.

Telos favours ordinary TypeScript over new syntax. A Locus is declared with an ordinary function call that returns an ordinary value. There is no Telos language, no decorators that change semantics and no code generation step needed to define something.

## Computational foundation: Effect

Effect is the foundation for anything that runs: validation, hashing, storage, verification, orchestration. It is used where it brings something concrete:

| Need                                         | Effect feature                      |
| -------------------------------------------- | ----------------------------------- |
| Decoding untrusted input with precise errors | `Schema`                            |
| Errors that are part of the type             | Typed error channel, tagged errors  |
| Engines that can be swapped                  | Services and layers                 |
| Resources with a lifetime                    | Scopes                              |
| Asynchronous and concurrent work             | Fibers, structured concurrency      |
| Durable, observable processes (later)        | Effect workflow and tracing support |

Effect is **not** used to wrap pure data. A Locus definition is a frozen object, not an `Effect`. A pure function stays a pure function. The rule of thumb: if it can fail, needs a service, does I/O or needs time, it returns an `Effect`; if it is data or a total pure function, it does not.

Effect 4 became stable on 2026-10-01. Telos starts on Effect 4, not 3, so it does not begin with a known migration.

## Runtime and toolchain: Bun

Bun is the development toolchain: package manager, test runner, type checker, linter, formatter. It is also the default runtime for scripts and servers.

Foundational packages avoid Bun-specific APIs where a portable standard exists, so the same code runs in browsers, Bun, Node and Deno. Example: Revision digests use Web Crypto (`crypto.subtle`), which all of them provide, rather than `Bun.hash`. This is what lets the documentation playground run the real Locus package in the browser.

Applications and scripts may use Bun APIs freely.

## Packages

Workspace packages follow the repository conventions in [docs/tooling.md](../../tooling.md). Telos packages use the `@telos/` scope ([ADR-0015](../../decisions/ADR-0015-product-naming.md)). The foundation must stay free of circular workspace dependencies: foundation packages depend on nothing in `apps/`, and apps depend on packages, never the reverse.

## Engines behind interfaces

External engines connect through interfaces that the semantic model defines ([P15](../principles/P15-engine-independence.md)). In code, an engine interface is an Effect service; an engine is a layer that implements it. The model never imports an engine directly. Engines Telos expects to connect to, and does not intend to replace: test runners, model checkers, AI model providers, infrastructure-as-code engines, durable workflow engines, databases, telemetry backends.

Temporary development engines follow the same rule. Stage 0 specification checks are data run by a small runner, with `bun test` and the browser as two adapters ([ADR-0013](../../decisions/ADR-0013-temporary-executable-specifications.md)).

## Semantic intermediate representation

Stage 0 has no IR beyond TypeScript values and a canonical JSON form used for hashing. A portable IR is a research direction ([OQ-014](../open-questions.md#oq-014)). Requirements it should meet when it is designed:

1. Lossless for the semantic part of every managed definition; no storage or display metadata.
2. Canonical: one serialisation per meaning, so digests are stable ([OQ-011](../open-questions.md#oq-011)).
3. Versioned, with explicit migration between versions.
4. Language-neutral, with a published schema, so non-TypeScript tools can read it.
5. Graph-friendly: identities and Relations are first-class, not nested blobs.
6. Streamable and diffable, so large Fabrics and change sets stay practical.
7. Free of engine-specific concepts.

No compiler infrastructure is built for this in Stage 0.

## Native compilation

Compiling TypeScript to native code is a research direction, not a dependency. Candidates such as Perry and ScriptC may be evaluated later for specific needs (start-up time, embedding, constrained environments). None is required, and no code may depend on one.

Rust is not part of the required stack. It may be used later for an isolated substrate component, such as a sandbox or a hashing hot path, when there is measured need and an architecture decision.

## Extensibility rules

1. The semantic foundation depends on no AI provider, test framework, storage engine, infrastructure provider, UI library, compiler, graph database or orchestration platform.
2. Extension happens through Facets (deferred), engine services and Archetypes (deferred), not through patching core types.
3. Any new required dependency of a foundation package needs an architecture decision.
