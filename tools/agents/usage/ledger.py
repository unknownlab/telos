#!/usr/bin/env python3
"""Usage ledger for one Spec Kitty mission, read from Claude Code transcripts.

Usage: python3 tools/agents/usage/ledger.py --mission <slug> [--sessions id,id]
       [--since ISO] [--until ISO] [--out path]

Reads ~/.claude/projects/<repo key>/ (root sessions and their subagents) and the
mission's status.events.jsonl. Writes tools/agents/usage/ledgers/<slug>.md and
keeps measured values, estimates and unknowns in separate sections.
"""
import argparse, glob, json, os, re
from collections import defaultdict
from datetime import datetime, timezone

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
PROJECTS = os.path.expanduser("~/.claude/projects")
# API list prices in $/MTok: input, output, cache read, cache write 5m, cache write 1h.
# Source: Anthropic pricing reference cached 2026-10-06. Haiku has a higher tier above 100K prompt tokens.
RATES = {"claude-opus-5-5": (4.0, 20.0, 0.20, 5.0, 8.0),
         "claude-sonnet-5-5": (2.0, 10.0, 0.20, 2.5, 4.0),
         "haiku<=100K": (0.10, 0.50, 0.01, 0.125, 0.20),
         "haiku>100K": (0.50, 2.50, 0.05, 0.625, 1.00)}
# Role inference from the agent's profile and description, first match wins.
# Descriptions follow tools/agents/delegation.md ("WP prompts ...", "clarify WP03", "rework WP05").
ROLE_RULES = [("mission review", None, r"mission review"),
              ("review", r"^reviewer-", None),
              ("clarification", None, r"\bclarif"),
              ("prompt writing", None, r"\bwp prompts?\b"),
              ("preparation", r"^(planner|architect|analyst)-", r"\b(specify|plan|tasks|outline|analysis|replan)\b"),
              ("rework", None, r"\brework\b"),
              ("implementation", r"^(implementer|frontend|node|python|java|generic)-", None),
              ("recovery", None, r"\b(conflict|lane|status|merge|gate|hook|tooling|recover)")]
WP_COLUMNS = ["preparation", "prompt writing", "clarification", "implementation", "rework", "review", "escalation"]


def load(path, since="", until="9999"):
    """Requests (deduplicated by request id) and compaction count of one transcript, within [since, until)."""
    reqs, compactions = {}, 0
    for line in open(path, errors="replace"):
        try:
            o = json.loads(line)
        except ValueError:
            continue
        if not since <= o.get("timestamp", since) < until:
            continue
        if o.get("type") == "system" and o.get("subtype") == "compact_boundary":
            compactions += 1
        m = o.get("message") or {}
        u = m.get("usage")
        if (o.get("type") != "assistant" or not u or m.get("model") == "<synthetic>"
                or ("/subagents/" not in path and o.get("isSidechain"))):
            continue
        cc = u.get("cache_creation") or {}
        w5, w1 = cc.get("ephemeral_5m_input_tokens") or 0, cc.get("ephemeral_1h_input_tokens") or 0
        if not (w5 or w1):
            w5 = u.get("cache_creation_input_tokens") or 0
        reqs[o.get("requestId") or m.get("id")] = dict(
            model=m.get("model") or "?", effort=o.get("effort"), t=o.get("timestamp", ""),
            inp=u.get("input_tokens") or 0, read=u.get("cache_read_input_tokens") or 0,
            w5=w5, w1=w1, out=u.get("output_tokens") or 0)
    return sorted(reqs.values(), key=lambda r: r["t"]), compactions


def cost(r):
    prompt = r["inp"] + r["read"] + r["w5"] + r["w1"]
    key = r["model"]
    if key.startswith("claude-haiku"):
        key = "haiku>100K" if prompt > 100_000 else "haiku<=100K"
    if key not in RATES:
        return None
    a = RATES[key]
    return (r["inp"] * a[0] + r["out"] * a[1] + r["read"] * a[2] + r["w5"] * a[3] + r["w1"] * a[4]) / 1e6


def totals(rows):
    """Aggregate a list of (requests, compactions) into one summary dict."""
    s = defaultdict(float)
    models, efforts = defaultdict(int), defaultdict(int)
    for reqs, comp in rows:
        s["compactions"] += comp
        for r in reqs:
            s["requests"] += 1
            for k in ("out", "read"):
                s[k] += r[k]
            s["write"] += r["w5"] + r["w1"]
            c = cost(r)
            s["usd"] += c or 0
            s["unpriced"] += c is None
            models[r["model"].replace("claude-", "")] += 1
            efforts[r["effort"] or "not recorded"] += 1
    s["models"] = ", ".join(f"{k} {v}" for k, v in sorted(models.items()))
    s["efforts"] = ", ".join(f"{k} {v}" for k, v in sorted(efforts.items()))
    return s


def mtok(n):
    return f"{n / 1e6:.2f}M"


def find_sessions(project_dir, slug):
    found = []
    for path in glob.glob(os.path.join(project_dir, "*.jsonl")):
        with open(path, errors="replace") as f:
            if any(slug in line for line in f):
                found.append(os.path.basename(path)[:-6])
    return sorted(found)


def single_wp(text):
    ids = set(re.findall(r"\bWP\d{2}\b", text or ""))
    return ids.pop() if len(ids) == 1 else None


def subagent_role(meta):
    profile, desc = meta.get("agentType") or "", (meta.get("description") or "").lower()
    for role, profile_re, desc_re in ROLE_RULES:
        if (profile_re and re.search(profile_re, profile)) or (desc_re and re.search(desc_re, desc)):
            return role
    return "implementation" if single_wp(desc.upper()) else "other"


def rejections(slug):
    path = os.path.join(REPO, "kitty-specs", slug, "status.events.jsonl")
    out = defaultdict(int)
    if os.path.exists(path):
        for line in open(path):
            e = json.loads(line) if line.strip() else {}
            if e.get("from_lane") in ("for_review", "in_review") and e.get("to_lane") in ("planned", "in_progress"):
                out[e["wp_id"]] += 1
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mission", required=True)
    ap.add_argument("--sessions", help="comma-separated root session ids; default: every session that names the mission")
    ap.add_argument("--since", default="", help="ISO timestamp (UTC); count only requests from then on")
    ap.add_argument("--until", default="9999", help="ISO timestamp (UTC); count only requests before it")
    ap.add_argument("--out")
    a = ap.parse_args()
    project_dir = os.path.join(PROJECTS, re.sub(r"[^A-Za-z0-9]", "-", REPO))
    sessions = a.sessions.split(",") if a.sessions else find_sessions(project_dir, a.mission)

    roots, by_role, by_wp, agents = [], defaultdict(list), defaultdict(lambda: defaultdict(list)), []
    for sid in sessions:
        roots.append((sid, load(os.path.join(project_dir, sid + ".jsonl"), a.since, a.until)))
        for path in sorted(glob.glob(os.path.join(project_dir, sid, "subagents", "*.jsonl"))):
            meta_path = path[:-6] + ".meta.json"
            meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
            data = load(path, a.since, a.until)
            if not data[0]:
                continue
            role = subagent_role(meta)
            wp = single_wp(meta.get("description"))
            by_role[role].append(data)
            if wp:
                is_escalation = role in ("implementation", "rework") and any(r["model"].startswith("claude-opus") for r in data[0])
                by_wp[wp]["escalation" if is_escalation else role].append(data)
            agents.append((meta, role, wp, totals([data])))

    rej = rejections(a.mission)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    L = [f"# Usage ledger: {a.mission}", "",
         f"Generated {now} by `tools/agents/usage/ledger.py` from {len(sessions)} root session(s): "
         + ", ".join(f"`{s[:8]}`" for s in sessions)
         + (f", requests from {a.since or 'the start'} until {a.until}" if a.since or a.until != "9999" else "") + ".", "",
         "## Measured", "",
         "Read from Claude Code transcripts (model, effort, tokens, compaction markers) and Spec Kitty status events (rejections).", "",
         "### Root sessions", "",
         "| Session | Requests | Models (requests) | Effort (requests) | Output tok | Cache read | Cache write | Compactions | First → last |",
         "| --- | --: | --- | --- | --: | --: | --: | --: | --- |"]
    for sid, data in roots:
        s, reqs = totals([data]), data[0]
        span = f"{reqs[0]['t'][:16]} → {reqs[-1]['t'][:16]}" if reqs else ""
        L.append(f"| `{sid[:8]}` | {int(s['requests'])} | {s['models']} | {s['efforts']} | {mtok(s['out'])} | {mtok(s['read'])} | {mtok(s['write'])} | {int(s['compactions'])} | {span} |")
    L += ["", "### Subagents by role", "",
          "| Role | Agents | Requests | Models (requests) | Effort (requests) | Output tok | Cache read | Cache write | Compactions |",
          "| --- | --: | --: | --- | --- | --: | --: | --: | --: |"]
    for role in sorted(by_role):
        s = totals(by_role[role])
        L.append(f"| {role} | {len(by_role[role])} | {int(s['requests'])} | {s['models']} | {s['efforts']} | {mtok(s['out'])} | {mtok(s['read'])} | {mtok(s['write'])} | {int(s['compactions'])} |")
    L += ["", "### Per work package", "",
          "Agents are attributed to a WP only when their description names exactly one WP.", "",
          "Cells count agents. Escalation means an implementation or rework agent that ran on Opus.", "",
          "| WP | " + " | ".join(c.capitalize() for c in WP_COLUMNS) + " | Rejections |",
          "| --- |" + " --: |" * (len(WP_COLUMNS) + 1)]
    for wp in sorted(set(by_wp) | set(rej)):
        d = by_wp[wp]
        L.append(f"| {wp} | " + " | ".join(str(len(d[c])) for c in WP_COLUMNS) + f" | {rej.get(wp, 0)} |")

    L += ["", "## Estimated", "",
          "API-equivalent dollars at list prices (rates in `ledger.py`). This is not subscription usage and not a bill.", "",
          "| Scope | API-equivalent $ |", "| --- | --: |"]
    for sid, data in roots:
        L.append(f"| root `{sid[:8]}` | {totals([data])['usd']:.2f} |")
    for role in sorted(by_role):
        L.append(f"| subagents: {role} | {totals(by_role[role])['usd']:.2f} |")
    for wp in sorted(by_wp):
        L.append(f"| {wp} (attributed agents) | {totals([x for v in by_wp[wp].values() for x in v])['usd']:.2f} |")
    unpriced = sum(totals([d])["unpriced"] for _, d in roots) + sum(totals(v)["unpriced"] for v in by_role.values())
    L += ["", "## Unknown", "",
          "- Subscription usage. Only the owner can see it.",
          "- Effort on requests the transcript does not record (counted as `not recorded` above).",
          "- Preparation cost per WP when one planner wrote several WPs in a single context.",
          "- Agents whose description names no single WP (see Subagents by role).",
          "- Defects found after merge, and owner time.",
          f"- Requests with a model missing from the rate table: {int(unpriced)}.", ""]
    L += ["## Agents", "",
          "| Role | WP | Profile | Requests | Models | Effort | Compactions | API-equivalent $ | Description |",
          "| --- | --- | --- | --: | --- | --- | --: | --: | --- |"]
    for meta, role, wp, s in sorted(agents, key=lambda x: -x[3]["usd"]):
        desc = (meta.get("description") or "").replace("|", "/")[:60]
        L.append(f"| {role} | {wp or ''} | {meta.get('agentType') or '?'} | {int(s['requests'])} | {s['models']} | {s['efforts']} | {int(s['compactions'])} | {s['usd']:.2f} | {desc} |")

    out = a.out or os.path.join(REPO, "tools", "agents", "usage", "ledgers", a.mission + ".md")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write("\n".join(L) + "\n")
    print(out)


if __name__ == "__main__":
    main()
