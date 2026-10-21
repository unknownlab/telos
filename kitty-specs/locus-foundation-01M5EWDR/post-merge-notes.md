# Post-merge notes

Follow-ups decided during implementation. Each is done as a reviewed direct commit after the lanes merge, not as a new mission.

## 1. Cap `relation.refines-cycle` reports (owner decision, 2026-10-21)

- Contract already amended (`contracts/locus-api.md`, `research.md` R-03): at most 100 `relation.refines-cycle`, then one `relation.refines-cycle-limit` on the Fabric (detail `100`).
- Code to change: `packages/locus/src/validate.ts` (WP03, approved without the cap) and the diagnostic code union in `diagnostic.ts`.
- Tests to add in `packages/locus/test/`: a complete `refines` graph of 9 Loci returns 100 cycle diagnostics plus one limit diagnostic, identical for shuffled input; exactly 100 cycles gives no limit diagnostic; the three-cycle case is unchanged.
- The spec catalogue (LOC-001 to LOC-044) is not extended: its record count is fixed by WP08 and WP13.
- Update the GRACE contract text for `validateFabric` if it mentions the cycle rule.

## 2. Test gaps found in review (non-blocking)

- WP03: add tests for a duplicate-id Locus pair with identical Charter problems (final de-duplication), an `owner.cycle` lead-in that sorts before the cycle, and `["", ""]` giving only `charter.entry-blank`.
- WP04: add a `charter.purpose` case to `canonical.test.ts` that fails if purpose is trimmed or normalised.

## 3. Guide and test wording after the cycle cap

- WP10 guides and `apps/docs/test/guides.test.ts` hard-code 13 diagnostic codes. The cycle-cap follow-up adds `relation.refines-cycle-limit`, making 14: update the guide table and the test in the same commit.
- WP07 narrowed the bundle check to `node:`/`bun:` in import position (`forbiddenBundleReferences`), because `validate.ts` has an object key `node:` and Effect has a guarded `getBuiltinModule("node:async_hooks")`. Reviewed in WP07.

## 4. WP07 review gaps (non-blocking)

- `packages/locus-specs/test/runner.meta.test.ts`: add a validate record with two or more diagnostics and an `expect` whose keys are written in reversed order (must pass), plus its order-swapped variant (must fail); add a `sameLocus: false` revision-compare record. Survivors found: key-order-sensitive comparison, truncated or reversed diagnostics, validate-stable running once.
- `packages/locus-specs/test/scan.ts`: add the backtick to `SPECIFIER_PATTERNS` so a template-literal `import(\`node:fs\`)` in source is caught.
- `packages/locus-specs/src/model.ts`: `DEPENDS: M-LOCUS-SPECS` is a self-reference; use `M-LOCUS-MODEL` or none.
- `runSpecification` dies if a spec has no `check` (outside the types); optional.

## 5. WP11 review notes (non-blocking)

- `apps/docs/src/components/document-page.tsx:47,60`: add a one-line comment that the HTML passed to `dangerouslySetInnerHTML` is the compiler's own pre-rendered output (no user input).
- Mission review: confirm `content.ts` escapes raw HTML in Markdown bodies (not checked in WP09/WP11), since the pages inject compiled HTML.
- Owner UX choice: `/architecture/foundation` and `/architecture/research` are in the sidebar only while current; both are reachable from the `/architecture` index.
- Page weight: the 415 kB (112 kB gzip) shared chunk carries all document data on every page; revisit when search lands (WP12) if budgets complain.
- WP16's static server must return `/not-found` with status 404 for unknown paths; directories redirect `/x` to `/x/` on a plain static server.

## 6. WP12/WP13 review notes (non-blocking)

- WP12: entry chunk grew about 18 kB gzip per page (Radix dialog, icons). Option for a later performance pass: lazy-load the dialog content on first open and keep only the trigger and the `/`, Ctrl+K handlers in the entry.
- WP12: Mermaid diagrams use the `neutral` theme on a fixed light card in both themes; a dark palette is a follow-up if wanted.
- WP12: `mermaid-renderer.tsx` marks `data-mermaid` before the `disposed` check; under React StrictMode (not used) a first effect cleanup could leave blocks pending. Moot today.
- WP12: search results are plain links (full page load); no DOM-level unit tests for the dialog/renderer, e2e in WP16 covers them.
- WP13: a release build must come from a clean checkout (else the Verification label carries "uncommitted changes"); `build:site` alone reuses the existing report, use `build`; `bun test` stays the gate.

## 7. MERGE-TIME ACTIONS (required)

- After WP12 (lane-l) and WP14 (lane-n) are both merged: `apps/docs/test/playground-safety.test.ts` test "innerHTML occurs in no site source at this point in the mission" fails because `src/components/mermaid-renderer.tsx:100` (`figure.innerHTML = svg`, Mermaid strict-mode SVG) is now present. Change the assertion to `expect(await filesContaining("innerHTML")).toEqual(["src/components/mermaid-renderer.tsx"])` and rename the test to "innerHTML occurs only in the Mermaid renderer, which renders strict-mode SVG of repository content". One commit on `feat/locus-foundation`, then `bun run verify`. The playground-specific scan still forbids innerHTML in `src/playground`.
- WP17 must keep `check-verification.ts` in the root `docs:build` (already written into its task file).

## 8. WP14 review gaps (non-blocking)

- `run-fabric.ts` cycle rule: `d.members.includes(target)` mutated to `true` survives; add a test with a `refines` relation from a cycle member to a non-member that must not be flagged.
- `fabric-scenario.tsx` wiring (Validate onClick, `provenanceFor(state, text)`) has no unit test; WP16 e2e must cover them via `data-valid`, `data-action="run"`, `data-diagnostic-code` (not text).
- `safety-scan.ts` MODULE_MAP lists `stripComments` twice (cosmetic).

## 9. WP15 review notes

- WP16 e2e must cover the playground wiring that `bun test` cannot (no DOM test env): Compute dispatches `compute` and clears the log (a second Compute shows 0 steps); Append A/B disabled while stale with the "Compute again…" note and results `data-provenance="historical"`; `expectedText` reaches `onAppend` (stale refusal visible, entries unchanged); "Use current head" fills the head; invalid head `aria-invalid` and no append; Reset history empties the log; an older replay is dropped after a newer press.
- Add a two-Locus case for `currentHeadOf` in `playground-revisions.test.ts` (mutant taking `loci[0]` survives).
- `decideAppend` order of invalid-head vs stale/no-revision checks only changes the refusal reason when both apply (button disabled then); tolerable.
- The golden "Expected" cell has no `data-revision-id` by design (static catalogue text); tests read the observed cell.
