#!/usr/bin/env python3
"""Per-agent tool usage, tool-result volume, repeated reads, skill loads, idle gaps (read-only)."""
import json, glob, os, sys, re
from collections import defaultdict, Counter
from datetime import datetime

ROOT = os.path.expanduser("~/.claude/projects/-Users-unknownhero-projects-unknownlab-telos")
SESSIONS = sys.argv[1].split(",")

def ts(s):
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

def result_len(c):
    if isinstance(c, str):
        return len(c)
    if isinstance(c, list):
        return sum(len(x.get("text", "")) if isinstance(x, dict) else len(str(x)) for x in c)
    return len(str(c))

def analyze(path, ttl_s):
    uses = {}                      # tool_use_id -> (name, input)
    by_tool_calls = Counter()
    by_tool_bytes = Counter()
    reads = Counter()
    skills = Counter()
    bash_cmds = Counter()
    hook_rejects = 0
    reqs = {}
    for line in open(path, errors="replace"):
        try:
            o = json.loads(line)
        except Exception:
            continue
        m = o.get("message") or {}
        if o.get("type") == "assistant":
            u = m.get("usage")
            if u:
                reqs[o.get("requestId") or m.get("id")] = (ts(o.get("timestamp", "")), u)
            for c in m.get("content") or []:
                if isinstance(c, dict) and c.get("type") == "tool_use":
                    uses[c["id"]] = (c["name"], c.get("input") or {})
                    by_tool_calls[c["name"]] += 1
                    inp = c.get("input") or {}
                    if c["name"] == "Read":
                        reads[inp.get("file_path", "?")] += 1
                    if c["name"] == "Skill":
                        skills[inp.get("skill", "?")] += 1
                    if c["name"] == "Bash":
                        cmd = inp.get("command", "")
                        key = re.sub(r"\s+", " ", cmd)[:60]
                        bash_cmds[key] += 1
        elif o.get("type") == "user":
            for c in (m.get("content") if isinstance(m.get("content"), list) else []) or []:
                if isinstance(c, dict) and c.get("type") == "tool_result":
                    name = uses.get(c.get("tool_use_id"), ("?", {}))[0]
                    n = result_len(c.get("content"))
                    by_tool_bytes[name] += n
                    txt = json.dumps(c.get("content"))[:4000]
                    if "commit-msg" in txt and ("rejected" in txt.lower() or "error" in txt.lower() or "co-author" in txt.lower()):
                        hook_rejects += 1
    # idle-gap cache rewrites
    seq = sorted((v for v in reqs.values() if v[0]), key=lambda x: x[0])
    gaps = []
    for (t0, _), (t1, u1) in zip(seq, seq[1:]):
        g = (t1 - t0).total_seconds()
        if g > ttl_s:
            gaps.append((g, (u1.get("cache_creation_input_tokens") or 0)))
    return dict(calls=by_tool_calls, bytes=by_tool_bytes, reads=reads, skills=skills,
                bash=bash_cmds, hook_rejects=hook_rejects, gaps=gaps, nreq=len(seq))

out = {}
for sid in SESSIONS:
    main = os.path.join(ROOT, sid + ".jsonl")
    out[sid] = {"main": analyze(main, 3600), "subs": {}}
    for sj in glob.glob(os.path.join(ROOT, sid, "subagents", "*.jsonl")):
        meta_p = sj[:-6] + ".meta.json"
        meta = json.load(open(meta_p)) if os.path.exists(meta_p) else {}
        out[sid]["subs"][os.path.basename(sj)] = dict(meta=meta, **analyze(sj, 300))
json.dump(out, open(sys.argv[2], "w"), default=lambda x: dict(x) if isinstance(x, Counter) else str(x), indent=1)
print("ok")
