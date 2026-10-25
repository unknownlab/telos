#!/usr/bin/env python3
"""Install, check or remove the repository's Claude Code routing settings.

Usage: python3 tools/agents/settings/routing.py apply|check|remove [--target DIR]

The keys come from claude-settings.json next to this script, with ${REPO} replaced
by the main checkout's absolute path. They go into DIR/.claude/settings.json
(default DIR: the checkout or worktree the command runs in). Every other key, such as
Spec Kitty's hooks, is kept.
"""
import argparse, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def main_checkout():
    """The main checkout, also when this script runs from a linked worktree."""
    common = subprocess.check_output(
        ["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], cwd=HERE, text=True).strip()
    return os.path.dirname(common)


def current_checkout():
    """The checkout or worktree the command runs in, where a session started here reads its settings."""
    return subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["apply", "check", "remove"])
    ap.add_argument("--target", help="directory whose .claude/settings.json to use; default: the current checkout")
    a = ap.parse_args()
    repo = main_checkout()
    keys = json.loads(open(os.path.join(HERE, "claude-settings.json")).read().replace("${REPO}", repo))
    path = os.path.join(os.path.abspath(a.target or current_checkout()), ".claude", "settings.json")
    current = json.load(open(path)) if os.path.exists(path) else {}

    if a.action == "check":
        differ = [k for k in keys if current.get(k) != keys[k]]
        for k in keys:
            print(f"{'DIFFERS' if k in differ else 'ok'} {k}")
        print(path)
        sys.exit(1 if differ else 0)
    if a.action == "apply":
        if os.path.exists(path):
            shutil.copy2(path, path + ".before-routing")
            print(f"previous file saved as {path}.before-routing")
        current.update(keys)
    else:
        for k in keys:
            current.pop(k, None)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(current, f, indent=2)
        f.write("\n")
    print(f"{a.action}: {', '.join(keys)} in {path}")


if __name__ == "__main__":
    main()
