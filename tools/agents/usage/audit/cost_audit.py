#!/usr/bin/env python3
"""API-equivalent cost from transcript usage (read-only).

Rates: bundled claude-api reference (cached 2026-10-06), $/MTok.
Haiku cache-read multiplier (0.1x) is the general rule, not a quoted Haiku figure.
"""
import json, glob, os, sys
from collections import defaultdict

ROOT = os.path.expanduser("~/.claude/projects/-Users-unknownhero-projects-unknownlab-telos")
RATES = {  # in, out, read, write5m, write1h
    "claude-opus-5-5": (4.0, 20.0, 0.20, 5.0, 8.0),
    "claude-sonnet-5-5": (2.0, 10.0, 0.20, 2.5, 4.0),
    "haiku_lo": (0.10, 0.50, 0.01, 0.125, 0.20),
    "haiku_hi": (0.50, 2.50, 0.05, 0.625, 1.00),
}

def req_cost(model, u):
    inp = u.get("input_tokens") or 0
    cr = u.get("cache_read_input_tokens") or 0
    cc = u.get("cache_creation") or {}
    w5 = cc.get("ephemeral_5m_input_tokens") or 0
    w1 = cc.get("ephemeral_1h_input_tokens") or 0
    if not (w5 or w1):
        w5 = u.get("cache_creation_input_tokens") or 0
    out = u.get("output_tokens") or 0
    prompt = inp + cr + w5 + w1
    if model == "claude-haiku-5-5":
        key = "haiku_hi" if prompt > 100_000 else "haiku_lo"
    elif model in RATES:
        key = model
    else:
        return None, {}
    r = RATES[key]
    parts = dict(inp=inp * r[0], out=out * r[1], read=cr * r[2], w5=w5 * r[3], w1=w1 * r[4])
    parts = {k: v / 1e6 for k, v in parts.items()}
    return key, parts

def scan(path):
    reqs = {}
    for line in open(path, errors="replace"):
        try:
            o = json.loads(line)
        except Exception:
            continue
        if o.get("type") != "assistant" or o.get("isSidechain") and "subagents" not in path:
            continue
        m = o.get("message") or {}
        if m.get("usage"):
            reqs[o.get("requestId") or m.get("id")] = (m.get("model"), m["usage"], o.get("timestamp", ""))
    return reqs.values()

rows = []
for main in glob.glob(os.path.join(ROOT, "*.jsonl")):
    sid = os.path.basename(main)[:8]
    for model, u, t in scan(main):
        k, p = req_cost(model, u)
        if k:
            rows.append(dict(sid=sid, who="ROOT(main thread)", key=k, t=t, **p))
    for sj in glob.glob(os.path.join(ROOT, os.path.basename(main)[:-6], "subagents", "*.jsonl")):
        meta = json.load(open(sj[:-6] + ".meta.json")) if os.path.exists(sj[:-6] + ".meta.json") else {}
        for model, u, t in scan(sj):
            k, p = req_cost(model, u)
            if k:
                rows.append(dict(sid=sid, who=meta.get("agentType") or "?", key=k, t=t, **p))

def table(filter_fn, title):
    agg = defaultdict(lambda: defaultdict(float))
    for r in rows:
        if not filter_fn(r):
            continue
        g = agg[(r["who"])]
        for f in ("inp", "out", "read", "w5", "w1"):
            g[f] += r[f]
        g["n"] += 1
        g["hi"] += r["key"] == "haiku_hi"
        g["haiku"] += r["key"].startswith("haiku")
    total = sum(sum(g[f] for f in ("inp", "out", "read", "w5", "w1")) for g in agg.values())
    sub_total = sum(sum(g[f] for f in ("inp", "out", "read", "w5", "w1")) for w, g in agg.items() if not w.startswith("ROOT"))
    print(f"\n== {title}: total ${total:,.0f} (subagents ${sub_total:,.0f}) ==")
    print(f"{'who':20} {'$total':>8} {'%all':>5} {'%sub':>5} {'$out':>7} {'$read':>7} {'$write':>7} {'reqs':>5} {'haiku>100K':>10}")
    for w, g in sorted(agg.items(), key=lambda kv: -sum(kv[1][f] for f in ("inp", "out", "read", "w5", "w1"))):
        c = sum(g[f] for f in ("inp", "out", "read", "w5", "w1"))
        hs = f"{int(g['hi'])}/{int(g['haiku'])}" if g["haiku"] else ""
        print(f"{w:20} {c:8.2f} {c/total:5.0%} {'' if w.startswith('ROOT') else format(c/sub_total,'5.0%'):>5} {g['out']:7.2f} {g['read']:7.2f} {g['w5']+g['w1']:7.2f} {int(g['n']):5} {hs:>10}")

table(lambda r: True, "ALL telos sessions")
table(lambda r: r["sid"] in ("48f2abba", "f2b2b2c3"), "semantic-foundation-rebuild mission (f2b2b2c3 + 48f2abba)")
table(lambda r: r["t"] >= "2026-10-18", "last 7 days")
