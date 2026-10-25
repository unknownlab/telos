# Agent usage

Lightweight measurement of how missions use models. It reads Claude Code's local transcripts (`~/.claude/projects/<repo key>/`), sends nothing anywhere and needs only `python3`.

| File        | Purpose                                                                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ledger.py` | Per-mission ledger. `python3 tools/agents/usage/ledger.py --mission <slug> [--until <ISO time>]` writes `ledgers/<slug>.md`. Run it at each phase boundary (see `tools/agents/delegation.md`). |
| `ledgers/`  | Generated ledgers, one per mission.                                                                                                                                                            |
| `weekly.md` | The weekly usage % the owner reports at phase boundaries.                                                                                                                                      |
| `audit/`    | The scripts behind the October 2026 usage audit, kept as they ran. They hard-code the session ids and dashboard figures of that audit.                                                         |

## What the ledger separates

- **Measured:** model ids, effort and token counts per request, compaction markers, the number of agents per role and WP, and rejections from `status.events.jsonl`.
- **Estimated:** dollars at API list prices, using the rate table in `ledger.py` with its date. They are API-equivalent estimates, not subscription usage.
- **Unknown:** subscription usage (only the owner's weekly %), effort on requests the transcript does not record, per-WP cost of a planner that wrote several WPs in one context, owner time and defects found after merge.

A root session that also held other work (an audit, another mission) is counted in full. Use `--since` and `--until` to cut it to the mission's window. Roles are inferred from each agent's profile and description, and an agent counts towards a WP only when its description names exactly one WP.
