#!/usr/bin/env python3
"""Aggregate Claude Code transcript usage for the telos project (read-only)."""
import json, glob, os, sys
from collections import defaultdict
from datetime import datetime

ROOT = os.path.expanduser("~/.claude/projects/-Users-unknownhero-projects-unknownlab-telos")

def ts(s):
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

def scan(path):
    """Return per-request usage records (deduped by requestId/message id)."""
    reqs = {}
    first_user = None
    sidechain_in_main = 0
    for line in open(path, errors="replace"):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if first_user is None and o.get("type") == "user":
            first_user = o
        if o.get("type") != "assistant":
            continue
        m = o.get("message") or {}
        u = m.get("usage")
        if not u:
            continue
        key = o.get("requestId") or m.get("id")
        if o.get("isSidechain") and "subagents" not in path:
            sidechain_in_main += 1
        cc = u.get("cache_creation") or {}
        reqs[key] = dict(
            model=m.get("model"), effort=o.get("effort"), agent=o.get("attributionAgent"),
            t=ts(o.get("timestamp", "")),
            inp=u.get("input_tokens", 0) or 0,
            cw=u.get("cache_creation_input_tokens", 0) or 0,
            cw5=cc.get("ephemeral_5m_input_tokens", 0) or 0,
            cw1h=cc.get("ephemeral_1h_input_tokens", 0) or 0,
            cr=u.get("cache_read_input_tokens", 0) or 0,
            out=u.get("output_tokens", 0) or 0,
            think=(u.get("output_tokens_details") or {}).get("thinking_tokens", 0) or 0,
            sidechain=bool(o.get("isSidechain")),
        )
    return list(reqs.values()), sidechain_in_main

def summarize(recs):
    s = defaultdict(int)
    for r in recs:
        for k in ("inp", "cw", "cw5", "cw1h", "cr", "out", "think"):
            s[k] += r[k]
    s["n"] = len(recs)
    times = [r["t"] for r in recs if r["t"]]
    s["dur_h"] = round(((max(times) - min(times)).total_seconds() / 3600), 2) if times else 0
    s["first_ctx"] = (recs[0]["inp"] + recs[0]["cw"] + recs[0]["cr"]) if recs else 0
    s["max_ctx"] = max((r["inp"] + r["cw"] + r["cr"]) for r in recs) if recs else 0
    return s

out = {"sessions": [], "subagents": []}
for main in sorted(glob.glob(os.path.join(ROOT, "*.jsonl"))):
    sid = os.path.basename(main)[:-6]
    recs, side = scan(main)
    mains = [r for r in recs if not r["sidechain"]]
    models = defaultdict(int)
    for r in mains:
        models[r["model"]] += 1
    s = summarize(sorted(mains, key=lambda r: r["t"] or datetime.min.replace(tzinfo=None) if False else (r["t"].timestamp() if r["t"] else 0)))
    out["sessions"].append(dict(sid=sid, models=dict(models), sidechain_recs_in_main=side, **s))
    for sj in sorted(glob.glob(os.path.join(ROOT, sid, "subagents", "*.jsonl"))):
        meta_p = sj[:-6] + ".meta.json"
        meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
        r2, _ = scan(sj)
        r2.sort(key=lambda r: r["t"].timestamp() if r["t"] else 0)
        models2 = defaultdict(int)
        efforts = defaultdict(int)
        for r in r2:
            models2[r["model"]] += 1
            efforts[r["effort"]] += 1
        out["subagents"].append(dict(
            sid=sid, file=os.path.basename(sj), agentType=meta.get("agentType"),
            metaModel=meta.get("model"), desc=meta.get("description"),
            models=dict(models2), efforts=dict(efforts), **summarize(r2)))

json.dump(out, open(sys.argv[1], "w"), default=str, indent=1)
print("sessions", len(out["sessions"]), "subagents", len(out["subagents"]))
