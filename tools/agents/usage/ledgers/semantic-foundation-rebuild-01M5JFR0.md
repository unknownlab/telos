# Usage ledger: semantic-foundation-rebuild-01M5JFR0

Generated 2026-10-25 12:36 UTC by `tools/agents/usage/ledger.py` from 2 root session(s): `48f2abba`, `f2b2b2c3`, requests from the start until 2026-10-25T08:00.

## Measured

Read from Claude Code transcripts (model, effort, tokens, compaction markers) and Spec Kitty status events (rejections).

### Root sessions

| Session | Requests | Models (requests) | Effort (requests) | Output tok | Cache read | Cache write | Compactions | First → last |
| --- | --: | --- | --- | --: | --: | --: | --: | --- |
| `48f2abba` | 190 | sonnet-5-5 190 | medium 190 | 0.13M | 43.64M | 1.28M | 0 | 2026-10-23T14:15 → 2026-10-25T07:33 |
| `f2b2b2c3` | 19 | sonnet-5-5 19 | medium 19 | 0.02M | 1.24M | 0.15M | 0 | 2026-10-22T18:51 → 2026-10-23T14:03 |

### Subagents by role

| Role | Agents | Requests | Models (requests) | Effort (requests) | Output tok | Cache read | Cache write | Compactions |
| --- | --: | --: | --- | --- | --: | --: | --: | --: |
| implementation | 26 | 1429 | haiku-5-5 1429 | medium 1429 | 1.48M | 192.73M | 5.04M | 0 |
| mission review | 1 | 107 | opus-5-5 107 | high 107 | 0.06M | 12.95M | 0.50M | 1 |
| other | 1 | 15 | haiku-5-5 15 | medium 15 | 0.02M | 0.98M | 0.09M | 0 |
| preparation | 8 | 1468 | opus-5-5 1468 | high 1468 | 1.42M | 202.48M | 6.93M | 27 |
| recovery | 6 | 193 | opus-5-5 148, sonnet-5-5 45 | high 148, medium 45 | 0.12M | 15.34M | 0.57M | 0 |
| review | 24 | 360 | sonnet-5-5 360 | medium 360 | 0.17M | 26.22M | 2.18M | 0 |

### Per work package

Agents are attributed to a WP only when their description names exactly one WP.

| WP | Preparation agents | Implementation agents | Review agents | Escalations (Opus) | Rejections |
| --- | --: | --: | --: | --: | --: |
| WP01 | 0 | 3 | 1 | 0 | 0 |
| WP02 | 0 | 2 | 1 | 0 | 0 |
| WP03 | 0 | 1 | 1 | 0 | 0 |
| WP04 | 0 | 1 | 1 | 0 | 0 |
| WP05 | 0 | 1 | 1 | 0 | 0 |
| WP06 | 0 | 1 | 1 | 0 | 0 |
| WP07 | 0 | 1 | 1 | 0 | 0 |
| WP08 | 0 | 1 | 1 | 0 | 0 |
| WP09 | 0 | 1 | 1 | 0 | 0 |
| WP10 | 0 | 1 | 2 | 0 | 1 |
| WP11 | 0 | 1 | 1 | 0 | 0 |
| WP12 | 0 | 1 | 1 | 0 | 0 |
| WP13 | 0 | 1 | 1 | 0 | 0 |
| WP14 | 0 | 1 | 1 | 0 | 0 |
| WP15 | 1 | 1 | 1 | 0 | 0 |
| WP16 | 0 | 2 | 1 | 0 | 0 |
| WP17 | 0 | 1 | 1 | 0 | 0 |
| WP18 | 0 | 1 | 1 | 0 | 0 |
| WP19 | 0 | 1 | 1 | 0 | 0 |
| WP20 | 1 | 1 | 1 | 0 | 0 |
| WP21 | 0 | 1 | 2 | 0 | 1 |
| WP22 | 1 | 1 | 1 | 0 | 0 |

## Estimated

API-equivalent dollars at list prices (rates in `ledger.py`). This is not subscription usage and not a bill.

| Scope | API-equivalent $ |
| --- | --: |
| root `48f2abba` | 15.20 |
| root `f2b2b2c3` | 1.07 |
| subagents: implementation | 13.73 |
| subagents: mission review | 6.34 |
| subagents: other | 0.03 |
| subagents: preparation | 103.61 |
| subagents: recovery | 7.76 |
| subagents: review | 12.41 |
| WP01 (attributed agents) | 0.44 |
| WP02 (attributed agents) | 0.72 |
| WP03 (attributed agents) | 0.82 |
| WP04 (attributed agents) | 0.86 |
| WP05 (attributed agents) | 0.57 |
| WP06 (attributed agents) | 1.23 |
| WP07 (attributed agents) | 0.61 |
| WP08 (attributed agents) | 0.59 |
| WP09 (attributed agents) | 0.93 |
| WP10 (attributed agents) | 1.60 |
| WP11 (attributed agents) | 1.26 |
| WP12 (attributed agents) | 1.00 |
| WP13 (attributed agents) | 0.78 |
| WP14 (attributed agents) | 3.86 |
| WP15 (attributed agents) | 6.89 |
| WP16 (attributed agents) | 1.59 |
| WP17 (attributed agents) | 0.56 |
| WP18 (attributed agents) | 1.21 |
| WP19 (attributed agents) | 2.25 |
| WP20 (attributed agents) | 13.40 |
| WP21 (attributed agents) | 2.21 |
| WP22 (attributed agents) | 8.83 |

## Unknown

- Subscription usage. Record the weekly % the owner reports in `tools/agents/usage/weekly.md`.
- Effort on requests the transcript does not record (counted as `not recorded` above).
- Preparation cost per WP when one planner wrote several WPs in a single context.
- Agents whose description names no single WP (see Subagents by role).
- Defects found after merge, and owner time.
- Requests with a model missing from the rate table: 0.

## Agents

| Role | WP | Profile | Requests | Models | Effort | Compactions | API-equivalent $ | Description |
| --- | --- | --- | --: | --- | --- | --: | --: | --- |
| preparation |  | planner-priti | 636 | opus-5-5 636 | high 636 | 15 | 46.82 | Finish renumbering, run tasks phase |
| preparation |  | general-purpose | 223 | opus-5-5 223 | high 223 | 5 | 19.59 | Create mission and specify |
| preparation | WP20 | planner-priti | 187 | opus-5-5 187 | high 187 | 2 | 10.92 | Plan fix for async formModel in WP20 |
| preparation | WP22 | planner-priti | 114 | opus-5-5 114 | high 114 | 2 | 8.07 | Add kernel hardening WP22 |
| preparation |  | analyst-annie | 106 | opus-5-5 106 | high 106 | 1 | 6.51 | Run mission analysis gate |
| mission review |  | general-purpose | 107 | opus-5-5 107 | high 107 | 1 | 6.34 | Opus pre-merge mission review |
| preparation | WP15 | planner-priti | 80 | opus-5-5 80 | high 80 | 1 | 5.36 | Plan closure resolver fix for WP15 |
| preparation |  | planner-priti | 79 | opus-5-5 79 | high 79 | 1 | 4.87 | Plan fix for MCP registration race |
| recovery |  | general-purpose | 50 | opus-5-5 50 | high 50 | 0 | 2.07 | Fix recurring status.json lane conflicts |
| recovery |  | general-purpose | 34 | opus-5-5 34 | high 34 | 0 | 1.72 | Fix lane-g/lane-i merge conflict |
| recovery | WP14 | general-purpose | 34 | opus-5-5 34 | high 34 | 0 | 1.72 | Fix WP14 lane-n allocation failure |
| implementation | WP20 | frontend-freddy | 114 | haiku-5-5 114 | medium 114 | 0 | 1.59 | Implement WP20 calculator page and guides |
| preparation |  | planner-priti | 43 | opus-5-5 43 | high 43 | 0 | 1.47 | Fix map-line wording in WP prompts |
| implementation | WP14 | implementer-ivan | 111 | haiku-5-5 111 | medium 111 | 0 | 1.46 | Implement WP14 calculator interfaces |
| implementation | WP19 | frontend-freddy | 103 | haiku-5-5 103 | medium 103 | 0 | 1.33 | Implement WP19 report and inspector |
| recovery |  | general-purpose | 30 | opus-5-5 30 | high 30 | 0 | 1.12 | Recover lane-a state conflict |
| implementation | WP21 | curator-carla | 101 | haiku-5-5 101 | medium 101 | 0 | 1.12 | Implement WP21 coherence sweep |
| implementation | WP16 | curator-carla | 90 | haiku-5-5 90 | medium 90 | 0 | 1.02 | Implement WP16 foundation docs |
| review | WP19 | reviewer-renata | 26 | sonnet-5-5 26 | medium 26 | 0 | 0.92 | Review WP19 report and inspector |
| review | WP20 | reviewer-renata | 23 | sonnet-5-5 23 | medium 23 | 0 | 0.90 | Review WP20 calculator page and guides |
| implementation | WP10 | implementer-ivan | 85 | haiku-5-5 85 | medium 85 | 0 | 0.88 | Implement WP10 CLI Pack |
| implementation | WP15 | implementer-ivan | 76 | haiku-5-5 76 | medium 76 | 0 | 0.82 | Implement WP15 repository gate |
| review | WP21 | reviewer-renata | 25 | sonnet-5-5 25 | medium 25 | 0 | 0.77 | Review WP21 coherence sweep |
| review | WP06 | reviewer-renata | 16 | sonnet-5-5 16 | medium 16 | 0 | 0.77 | Review WP06 |
| implementation | WP11 | implementer-ivan | 66 | haiku-5-5 66 | medium 66 | 0 | 0.72 | Implement WP11 Agent Pack |
| review | WP15 | reviewer-renata | 21 | sonnet-5-5 21 | medium 21 | 0 | 0.71 | Review WP15 repository gate |
| review | WP14 | reviewer-renata | 17 | sonnet-5-5 17 | medium 17 | 0 | 0.68 | Review WP14 calculator interfaces |
| recovery |  | general-purpose | 26 | sonnet-5-5 26 | medium 26 | 0 | 0.67 | Merge mission into main |
| implementation | WP18 | frontend-freddy | 70 | haiku-5-5 70 | medium 70 | 0 | 0.64 | Implement WP18 docs playground |
| implementation | WP12 | implementer-ivan | 83 | haiku-5-5 83 | medium 83 | 0 | 0.63 | Implement WP12 Web Pack |
| implementation | WP09 | implementer-ivan | 63 | haiku-5-5 63 | medium 63 | 0 | 0.57 | Implement WP09 kernel public API |
| review | WP18 | reviewer-renata | 18 | sonnet-5-5 18 | medium 18 | 0 | 0.57 | Review WP18 docs playground |
| review | WP16 | reviewer-renata | 17 | sonnet-5-5 17 | medium 17 | 0 | 0.57 | Review WP16 |
| review | WP11 | reviewer-renata | 15 | sonnet-5-5 15 | medium 15 | 0 | 0.54 | Review WP11 Agent Pack |
| review | WP10 | reviewer-renata | 14 | sonnet-5-5 14 | medium 14 | 0 | 0.54 | Review WP10 CLI Pack |
| review | WP04 | reviewer-renata | 15 | sonnet-5-5 15 | medium 15 | 0 | 0.51 | Review WP04 |
| review | WP03 | reviewer-renata | 16 | sonnet-5-5 16 | medium 16 | 0 | 0.51 | Review WP03 |
| recovery |  | general-purpose | 19 | sonnet-5-5 19 | medium 19 | 0 | 0.48 | Run mission accept gate |
| review | WP22 | reviewer-renata | 16 | sonnet-5-5 16 | medium 16 | 0 | 0.48 | Review WP22 kernel hardening |
| review | WP02 | reviewer-renata | 13 | sonnet-5-5 13 | medium 13 | 0 | 0.46 | Review WP02 |
| implementation | WP06 | implementer-ivan | 58 | haiku-5-5 58 | medium 58 | 0 | 0.46 | Implement WP06 describe and invoke |
| review | WP13 | reviewer-renata | 13 | sonnet-5-5 13 | medium 13 | 0 | 0.45 | Review WP13 calculator core |
| review | WP05 | reviewer-renata | 11 | sonnet-5-5 11 | medium 11 | 0 | 0.41 | Review WP05 |
| review | WP12 | reviewer-renata | 12 | sonnet-5-5 12 | medium 12 | 0 | 0.37 | Review WP12 Web Pack |
| review | WP07 | reviewer-renata | 13 | sonnet-5-5 13 | medium 13 | 0 | 0.37 | Review WP07 |
| review | WP17 | reviewer-renata | 11 | sonnet-5-5 11 | medium 11 | 0 | 0.36 | Review WP17 |
| review | WP09 | reviewer-renata | 10 | sonnet-5-5 10 | medium 10 | 0 | 0.36 | Review WP09 |
| implementation | WP04 | implementer-ivan | 37 | haiku-5-5 37 | medium 37 | 0 | 0.35 | Implement WP04 kernel model |
| review | WP01 | reviewer-renata | 10 | sonnet-5-5 10 | medium 10 | 0 | 0.34 | Review WP01 |
| implementation | WP13 | implementer-ivan | 51 | haiku-5-5 51 | medium 51 | 0 | 0.33 | Implement WP13 calculator arithmetic |
| review | WP21 | reviewer-renata | 12 | sonnet-5-5 12 | medium 12 | 0 | 0.32 | Re-review WP21 after rework |
| review | WP08 | reviewer-renata | 10 | sonnet-5-5 10 | medium 10 | 0 | 0.32 | Review WP08 |
| implementation | WP03 | implementer-ivan | 34 | haiku-5-5 34 | medium 34 | 0 | 0.32 | Implement WP03 kernel definitions |
| implementation | WP22 | implementer-ivan | 55 | haiku-5-5 55 | medium 55 | 0 | 0.28 | Implement WP22 kernel hardening |
| implementation | WP08 | implementer-ivan | 34 | haiku-5-5 34 | medium 34 | 0 | 0.27 | Implement WP08 kernel closure |
| implementation | WP02 | implementer-ivan | 40 | haiku-5-5 40 | medium 40 | 0 | 0.25 | Implement WP02 kernel foundations |
| implementation | WP07 | implementer-ivan | 39 | haiku-5-5 39 | medium 39 | 0 | 0.24 | Implement WP07 kernel decode |
| implementation | WP17 | curator-carla | 36 | haiku-5-5 36 | medium 36 | 0 | 0.20 | Implement WP17 decision records |
| review | WP10 | reviewer-renata | 6 | sonnet-5-5 6 | medium 6 | 0 | 0.19 | Re-review WP10 after rework |
| implementation | WP05 | implementer-ivan | 39 | haiku-5-5 39 | medium 39 | 0 | 0.17 | Implement WP05 kernel verify |
| implementation | WP01 | implementer-ivan | 30 | haiku-5-5 30 | medium 30 | 0 | 0.08 | Implement WP01 scaffolds |
| other |  | curator-carla | 15 | haiku-5-5 15 | medium 15 | 0 | 0.03 | Fix impact and grant doc over-claims |
| implementation | WP01 | implementer-ivan | 6 | haiku-5-5 6 | medium 6 | 0 | 0.01 | Implement WP01 scaffolds |
| implementation | WP01 | implementer-ivan | 3 | haiku-5-5 3 | medium 3 | 0 | 0.01 | Implement WP01 scaffolds |
| implementation | WP02 | implementer-ivan | 3 | haiku-5-5 3 | medium 3 | 0 | 0.00 | Implement WP02 kernel foundations |
| implementation | WP16 | curator-carla | 2 | haiku-5-5 2 | medium 2 | 0 | 0.00 | Implement WP16 foundation docs |
