# Quickstart: Locus Foundation

How to use and check what this mission delivers once it is merged. Commands run from the repository root.

## Install and check

```bash
bun install                # workspace dependencies, from the committed bun.lock
bun run verify             # format, lint, typecheck, unit tests and specifications, grace lint, docs build, browser tests
```

Browser tests need Playwright's Chromium once per machine (owner approval item 2 in [plan.md](plan.md#owner-approvals-required)).

## Define and validate a Fabric

```ts
import { Effect } from "effect"
import { decodeFabricJson, defineFabric, defineLocus, validateFabric } from "@telos/locus"

const storefront = defineLocus({
  id: "shop:storefront",
  charter: { purpose: "Sell products online.", responsibilities: ["Present the catalogue", "Take orders"] },
})
const checkout = defineLocus({
  id: "shop:checkout",
  owner: "shop:storefront",
  charter: { purpose: "Turn a basket into an order.", responsibilities: ["Collect payment details"] },
  relations: [{ kind: "depends-on", target: "shop:payment" }],
})

const report = validateFabric(defineFabric({ id: "shop:system", loci: [storefront, checkout] }))
// report.valid === false
// report.diagnostics[0].code === "relation.target-missing", subject "shop:checkout", detail "depends-on shop:payment"

// External input: decode errors are separate from diagnostics
const fabric = await Effect.runPromise(decodeFabricJson(text))
```

## Revisions, history and change sets

```ts
import { Effect } from "effect"
import { createRevision, diffRevisions, RevisionHistory, RevisionHistoryInMemory } from "@telos/locus"

const program = Effect.gen(function* () {
  const history = yield* RevisionHistory
  const r1 = yield* createRevision(checkout)
  yield* history.append(r1, null)                        // { appended: true, head: r1.id }
  const r2 = yield* createRevision(defineLocus({ ...checkout, charter: { ...checkout.charter, purpose: "Turn a basket into a paid order." } }))
  yield* history.append(r2, r1.id)                       // { appended: true, head: r2.id }
  return yield* diffRevisions(r1, r2)                    // [{ part: "charter.purpose", kind: "changed", from, to }]
})

await Effect.runPromise(program.pipe(Effect.provide(RevisionHistoryInMemory)))
```

Appending with a stale expected head fails with `StaleBaselineError`.

## Specifications

```bash
bun test packages/locus-specs     # one test per LOC-### record, plus runner meta-tests
```

## Documentation site

```bash
bun run --filter @telos/docs dev       # local development server
bun run --filter @telos/docs build     # content check, spec report, static build
bun run --filter @telos/docs preview   # serve the static build
bun run --filter @telos/docs test:e2e  # Playwright, Chromium
```

Content is edited only in `docs/`. The build fails when front matter, ids, `related` ids or links are invalid.

## Reconstructing state (agents)

Read `AGENTS.md`, then `docs/foundation/README.md`, then the `/agent-reference` page (source: `docs/guides/agent-reference.md`). The page lists the state queries and check commands.
