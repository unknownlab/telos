#!/usr/bin/env python3
"""Reconcile audit figures (read-only): denominators, root split, cache-miss causes,
tasks-agent work breakdown, and which weighting reproduces the dashboard shares."""
import json, glob, os
from collections import defaultdict
from datetime import datetime

PROJ = os.path.expanduser("~/.claude/projects")
TELOS = os.path.join(PROJ, "-Users-unknownhero-projects-unknownlab-telos")
MISSION = ("f2b2b2c3", "48f2abba")
RATES = {"claude-opus-5-5": (4.0, 20.0, 0.20, 5.0, 8.0),
         "claude-sonnet-5-5": (2.0, 10.0, 0.20, 2.5, 4.0),
         "haiku_lo": (0.10, 0.50, 0.01, 0.125, 0.20),
         "haiku_hi": (0.50, 2.50, 0.05, 0.625, 1.00)}

def ts(s):
    try: return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception: return None

def requests(path, main):
    reqs = {}
    for line in open(path, errors="replace"):
        try: o = json.loads(line)
        except Exception: continue
        if o.get("type") != "assistant" or (main and o.get("isSidechain")): continue
        m = o.get("message") or {}
        u = m.get("usage")
        if not u: continue
        cc = u.get("cache_creation") or {}
        w5, w1 = cc.get("ephemeral_5m_input_tokens") or 0, cc.get("ephemeral_1h_input_tokens") or 0
        if not (w5 or w1): w5 = u.get("cache_creation_input_tokens") or 0
        reqs[o.get("requestId") or m.get("id")] = dict(
            model=m.get("model"), t=o.get("timestamp", ""), effort=o.get("effort"),
            inp=u.get("input_tokens") or 0, cr=u.get("cache_read_input_tokens") or 0,
            w5=w5, w1=w1, out=u.get("output_tokens") or 0,
            think=(u.get("output_tokens_details") or {}).get("thinking_tokens") or 0)
    return sorted(reqs.values(), key=lambda r: r["t"])

def cost(r):
    prompt = r["inp"] + r["cr"] + r["w5"] + r["w1"]
    k = r["model"]
    if k == "claude-haiku-5-5": k = "haiku_hi" if prompt > 100_000 else "haiku_lo"
    if k not in RATES: return 0.0
    a = RATES[k]
    return (r["inp"]*a[0] + r["out"]*a[1] + r["cr"]*a[2] + r["w5"]*a[3] + r["w1"]*a[4]) / 1e6

def ctx(r): return r["inp"] + r["cr"] + r["w5"] + r["w1"]

def compactions(rs):
    return sum(1 for a, b in zip(rs, rs[1:]) if ctx(a) > 120_000 and ctx(b) < 0.5 * ctx(a))

# ---- A. mission ledger -------------------------------------------------------
print("== A. mission ledger (API-equivalent $) ==")
subs = []
for sid in MISSION:
    main = glob.glob(os.path.join(TELOS, sid + "*.jsonl"))[0]
    rs = requests(main, True)
    by = defaultdict(lambda: [0, 0.0])
    for r in rs: by[r["model"]][0] += 1; by[r["model"]][1] += cost(r)
    print(f"root {sid}:", {k: (n, round(c, 2)) for k, (n, c) in by.items()})
    for sj in glob.glob(os.path.join(TELOS, os.path.basename(main)[:-6], "subagents", "*.jsonl")):
        meta = json.load(open(sj[:-6] + ".meta.json")) if os.path.exists(sj[:-6] + ".meta.json") else {}
        r2 = requests(sj, False)
        if not r2: continue
        subs.append(dict(sid=sid, f=sj, type=meta.get("agentType"), desc=(meta.get("description") or "")[:60],
                         model=",".join(sorted({r["model"].replace("claude-", "") for r in r2 if r["model"]})),
                         effort=",".join(sorted({str(r["effort"]) for r in r2})),
                         n=len(r2), cost=sum(map(cost, r2)), comp=compactions(r2),
                         hrs=round(((ts(r2[-1]["t"]) - ts(r2[0]["t"])).total_seconds()) / 3600, 1)))
tot = sum(s["cost"] for s in subs)
print(f"subagents: {len(subs)} agents, ${tot:.2f}")
for s in sorted(subs, key=lambda s: -s["cost"]):
    if s["cost"] >= 0.8:
        print(f"  {s['cost']:6.2f} {s['cost']/tot:4.0%} {s['type'][:16]:16} {s['model'][:18]:18} {s['effort']:12} n={s['n']:4} comp={s['comp']:2} {s['hrs']:4}h  {s['desc']}")
small = [s for s in subs if s["cost"] < 0.8]
print(f"  + {len(small)} agents under $0.80: ${sum(s['cost'] for s in small):.2f} ({', '.join(sorted({s['type'] for s in small}))})")

# ---- B. root idle gaps ---------------------------------------------------------
print("\n== B. root gaps > 1h (48f2abba) ==")
rs = requests(glob.glob(os.path.join(TELOS, "48f2abba*.jsonl"))[0], True)
for a, b in zip(rs, rs[1:]):
    g = (ts(b["t"]) - ts(a["t"])).total_seconds()
    if g > 3600:
        print(f"  {a['t'][:16]} gap {g/3600:4.1f}h  {a['model']}->{b['model']}  rewrite {b['w5']+b['w1']:>7,}  ${cost(b):.2f} (whole request)")

# ---- C. tasks agent breakdown ------------------------------------------------
print("\n== C. largest planner agent: what filled its context ==")
big = max((s for s in subs if s["type"] == "planner-priti"), key=lambda s: s["cost"])
uses, seen = {}, set()
bucket = defaultdict(int)
for line in open(big["f"], errors="replace"):
    try: o = json.loads(line)
    except Exception: continue
    m = o.get("message") or {}
    if o.get("type") == "assistant":
        for c in m.get("content") or []:
            if isinstance(c, dict) and c.get("type") == "tool_use":
                i = c.get("input") or {}
                uses[c["id"]] = (c["name"], i.get("file_path", ""))
                if c["name"] == "Write": bucket["written: Write content"] += len(i.get("content", ""))
                if c["name"] in ("Edit", "MultiEdit"): bucket["written: Edit new text"] += len(json.dumps(i))
    elif o.get("type") == "user" and isinstance(m.get("content"), list):
        for c in m["content"]:
            if isinstance(c, dict) and c.get("type") == "tool_result":
                name, fp = uses.get(c.get("tool_use_id"), ("?", ""))
                body = c.get("content")
                n = len(body) if isinstance(body, str) else len(json.dumps(body))
                if name == "Read":
                    key = (fp, "")
                    kind = "repeat" if fp in seen else "first"
                    seen.add(fp)
                    area = "contracts" if "/contracts/" in fp else "WP files" if "/tasks/" in fp else "spec/plan/tasks.md" if "kitty-specs" in fp else "code/docs"
                    bucket[f"read {kind}: {area}"] += n
                else:
                    bucket[f"result: {name}"] += n
rs = requests(big["f"], False)
print(f"  agent {os.path.basename(big['f'])}: ${big['cost']:.2f}, {big['n']} req, {big['comp']} compactions (ctx-drop heuristic)")
print(f"  output {sum(r['out'] for r in rs):,} tok (thinking {sum(r['think'] for r in rs):,}); "
      f"cache read {sum(r['cr'] for r in rs)/1e6:.1f}M; cache write {sum(r['w5']+r['w1'] for r in rs)/1e6:.2f}M; mean ctx {sum(map(ctx, rs))/len(rs)/1e3:.0f}K")
for k, v in sorted(bucket.items(), key=lambda kv: -kv[1]):
    if v > 5000: print(f"  {v/1024:7.0f} KB  {k}")

# ---- D. which weighting reproduces the dashboard ------------------------------
print("\n== D. subagent shares, last 7 days, all projects, by weighting ==")
dash = {"planner-priti": 33, "general-purpose": 15, "implementer-ivan": 12, "reviewer-renata": 12,
        "analyst-annie": 7, "frontend-freddy": 5, "curator-carla": 4}
W = {"api$": cost, "all tok": lambda r: ctx(r) + r["out"], "no-read tok": lambda r: r["inp"] + r["w5"] + r["w1"] + r["out"],
     "out tok": lambda r: r["out"]}
agg = defaultdict(lambda: defaultdict(float)); main_agg = defaultdict(float)
for pdir in glob.glob(os.path.join(PROJ, "*")):
    for main in glob.glob(os.path.join(pdir, "*.jsonl")):
        for r in requests(main, True):
            if r["t"] >= "2026-10-18T":
                for w, f in W.items(): main_agg[w] += f(r)
        for sj in glob.glob(os.path.join(main[:-6], "subagents", "*.jsonl")):
            meta = json.load(open(sj[:-6] + ".meta.json")) if os.path.exists(sj[:-6] + ".meta.json") else {}
            for r in requests(sj, False):
                if r["t"] >= "2026-10-18T":
                    for w, f in W.items(): agg[meta.get("agentType") or "?"][w] += f(r)
print(f"  {'agent':18} {'dash':>5} " + " ".join(f"{w:>11}" for w in W))
for a in dash:
    print(f"  {a:18} {dash[a]:4}% " + " ".join(f"{agg[a][w]/sum(g[w] for g in agg.values()):11.0%}" for w in W))
print("  subagent share of all usage: " + " ".join(f"{w}={sum(g[w] for g in agg.values())/(sum(g[w] for g in agg.values())+main_agg[w]):.0%}" for w in W))
