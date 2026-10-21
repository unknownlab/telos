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
