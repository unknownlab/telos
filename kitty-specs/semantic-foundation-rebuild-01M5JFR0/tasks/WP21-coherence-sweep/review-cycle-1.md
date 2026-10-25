---
affected_files: []
cycle_number: 1
mission_slug: semantic-foundation-rebuild-01M5JFR0
reproduction_command:
reviewed_at: '2026-10-24T21:13:56Z'
reviewer_agent: user
wp_id: WP21
---

# WP21 review cycle 1: rejected (documentation still calls built things future)

Checks that passed: bun run verify (846 unit pass, 0 fail; 102 e2e passed; lint 31 warnings; grace lint and telos check ok), group 1 grep empty, remaining group 2 hits all class a/b/c, S1-S9 done as written, all documented paths exist, README links resolve, 23 terms raised with real code, P14 claim is backed by closure.unknown-external (probed: an import of "openai" in packages/kernel/src makes bun run telos check exit non-zero).

## Blocking (T128 item 4: implemented versus future, directive section 9 and 12)

1. docs/foundation/roadmap/README.md, "Next candidates" item 1 ("Telos describes itself ... Add a first drift check between declared relations and package imports") describes work that exists: telos.ts models every package and Semantic Closure (closure.undeclared-dependency, closure.unknown-external) is the drift check, run by bun run telos check as the last verify step. Move it to "Done in this mission" (or reword it to what is really still open, for example narrower-than-file attribution) and renumber. The "Done" list also omits the repository model and the Packs.
2. docs/foundation/architecture/capabilities.md line 79: "Not built in this mission: ... import-graph extractors for drift detection." Closure is an import-graph check. Reword to the real gap (type-only imports and attribution below file level are not covered; see ADR-0026).
3. docs/foundation/terminology/semantic-closure.md, "In the model": "The check is part of the repository gate that WP15 adds." Use the present tense: bun run telos check is the last step of bun run verify. Also state what the check covers (ownership, undeclared dependency between Loci, unknown external package) and its limits: per-file ownership, type-only imports not seen, computed import() only a warning (currently 5 warnings), Bun only. The definition names only ownership, yet P14 relies on the import check.

## Non-blocking (fix in the same pass if cheap)

- P14 "rejects every package import" is slightly broad: static and literal dynamic imports are errors, a computed import(name) is only a warning and type-only imports are not seen. Add this to P14 "Limits".
- ADR-0003, ADR-0011, ADR-0016 (accepted) were edited beyond the two ADR-0015 sentences. Wording only, meaning unchanged, acceptable. ADR-0024 edit is fine (new proposed record).
- The prompt said 24 terms; the table lists 23 and 23 are implemented. Report only.
- kitty-specs on the lane differs from the base by 3 lines in WP21-coherence-sweep.md (allocation metadata); restore with git restore --source feat/semantic-foundation-rebuild --staged --worktree -- kitty-specs/ and commit.
