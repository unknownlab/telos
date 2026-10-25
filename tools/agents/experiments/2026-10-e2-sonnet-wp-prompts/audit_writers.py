#!/usr/bin/env python3
"""Usage and isolation audit of the E2 prompt writers.

Usage: python3 audit_writers.py <root session id> <agent id> [<agent id> ...]

For each writer subagent it prints model, effort, request and token counts, the
API-equivalent cost (rates from tools/agents/usage/ledger.py), the wall time, and
every tool call whose input names a path outside the E2 snapshot or runs git.
"""
import json, os, re, sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "usage"))
from ledger import PROJECTS, REPO, cost, load  # noqa: E402

# The writers worked on a copy of the repository at 5a05e9d in this session's scratchpad.
SNAPSHOT_MARK = "/scratchpad/e2"


def outside_calls(path):
    """Tool calls that name a path outside the snapshot, or run git."""
    found = []
    for line in open(path, errors="replace"):
        o = json.loads(line)
        if o.get("type") != "assistant":
            continue
        for c in (o.get("message") or {}).get("content") or []:
            if c.get("type") != "tool_use":
                continue
            # File contents a writer produces are not access; check only where it reads, writes or runs.
            args = {k: v for k, v in (c.get("input") or {}).items() if k not in ("content", "old_string", "new_string")}
            text = json.dumps(args)
            paths = re.findall(r"/(?:Users|private|tmp|var|opt)/[^\s\"']*", text)
            # git as a command, not a path such as --exclude-dir=.git
            if any(SNAPSHOT_MARK not in p for p in paths) or re.search(r"(?<![\w./=-])git\s+[a-z-]", text):
                found.append(f"{c['name']}: {text[:160]}")
    return found


def main():
    root, agents = sys.argv[1], sys.argv[2:]
    project_dir = os.path.join(PROJECTS, re.sub(r"[^A-Za-z0-9]", "-", REPO))
    for agent in agents:
        path = os.path.join(project_dir, root, "subagents", f"agent-{agent}.jsonl")
        meta = json.load(open(path[:-6] + ".meta.json"))
        reqs, compactions = load(path)
        t0, t1 = (datetime.fromisoformat(reqs[i]["t"].replace("Z", "+00:00")) for i in (0, -1))
        models = sorted({(r["model"], r["effort"]) for r in reqs})
        print(f"## {meta.get('description')} ({agent})")
        print(f"- requested: model {meta.get('model')}, effort {meta.get('effort')}; observed: {models}")
        print(f"- requests {len(reqs)}, compactions {compactions}, wall time {(t1 - t0).total_seconds() / 60:.1f} min")
        print(f"- output tokens {sum(r['out'] for r in reqs):,}, cache read {sum(r['read'] for r in reqs):,}, "
              f"cache write {sum(r['w5'] + r['w1'] for r in reqs):,}")
        print(f"- API-equivalent $ {sum(cost(r) or 0 for r in reqs):.2f}")
        calls = outside_calls(path)
        print(f"- tool calls outside the snapshot or running git: {len(calls)}")
        for c in calls:
            print(f"  - {c}")
        print()


if __name__ == "__main__":
    main()
