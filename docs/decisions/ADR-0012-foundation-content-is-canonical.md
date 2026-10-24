---
id: ADR-0012
title: Foundation content is canonical Markdown with front matter, compiled by the site
kind: decision
status: proposed
maturity: proposed
date: 2026-10-21
summary: The doctrine lives in docs/ as Markdown with typed front matter; the documentation site, llms.txt and the machine-readable index are generated from those files at build time and never copied by hand.
related:
  [
    foundation,
    ADR-0001,
    P04-code-is-the-source-of-truth,
    P03-no-code-outside-semantics,
  ]
---

# ADR-0012 — Foundation content is canonical Markdown with front matter, compiled by the site

## Context

The doctrine must be readable on GitHub without tooling, editable in a normal pull request, consumable by agents, and presentable as a website. Writing site pages separately would create two copies that drift. Writing the doctrine as TypeScript values would make it unpleasant to read and review.

## Decision

1. `docs/foundation/`, `docs/decisions/` and `docs/research/` are the canonical source for doctrine, decisions and research.
2. Every file has YAML front matter with the [common fields](../foundation/README.md#front-matter-schema); some kinds add fields (principle `number`, term `classification`, decision `date`).
3. The documentation site compiles these files at build time, validating front matter against a schema. A missing required field, an unknown `kind`, a duplicate `id`, or a `related` id that does not resolve fails the build.
4. `/llms.txt` and a JSON index are generated from the same data.
5. The site never contains hand-written copies of this content. Site-only pages (landing, playground) may summarise and link.
6. The Spec Kitty glossary points to the foundation terminology for product terms, rather than redefining them (charter wording change pending owner approval; see the [discovery report](../research/stage-0-discovery.md)).

## Alternatives

- **MDX in the app**: rich, but content then lives in the app and is harder to read and to consume as data.
- **Content as TypeScript values**: typed, but poor for prose and review.
- **A docs framework with its own content tree (for example Fumadocs)**: considered; adds a content layer and conventions for little gain at this size.

## Consequences

- The site build doubles as a content linter.
- Interactive elements live in site pages, not in the canonical Markdown.
