#!/usr/bin/env python3
"""Poll for new local paper HTML files and publish them one at a time.

Run in a persistent local session or a process manager. No external dependencies.
Paths are relative to this script; this service never creates paper HTML.
"""
import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
REPO = PROJECT.parent.parent
PAPERS = PROJECT / "papers"
PUBLISHER = Path(__file__).with_name("publish_paper.py")
ID = re.compile(r"\d{4}\.\d{4,5}")


def git(*args):
    return subprocess.run(["git", "-C", str(REPO), *args], capture_output=True,
                          text=True, check=True).stdout


def untracked_papers():
    for html in sorted(PAPERS.glob("*/index.html")):
        if not ID.fullmatch(html.parent.name):
            continue
        rel = html.relative_to(REPO).as_posix()
        check = subprocess.run(["git", "-C", str(REPO), "ls-files", "--error-unmatch", "--", rel],
                               capture_output=True, text=True)
        if check.returncode != 0:
            yield html


def run_once(observed, publish):
    found = 0
    for html in untracked_papers():
        try:
            stamp = (html.stat().st_size, html.stat().st_mtime_ns)
        except FileNotFoundError:
            continue
        key = str(html)
        previous = observed.get(key)
        observed[key] = stamp
        if previous != stamp:
            print(f"WAIT file stability: {html.parent.name}", flush=True)
            continue
        paper_id = html.parent.name
        command = [sys.executable, str(PUBLISHER), paper_id]
        if publish:
            command.append("--publish")
        print(f"CHECK {paper_id}", flush=True)
        result = subprocess.run(command, cwd=REPO)
        if result.returncode == 0:
            found += 1
            if publish:
                observed.pop(key, None)
        else:
            print(f"FAILED {paper_id}; HTML retained for retry", file=sys.stderr, flush=True)
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--interval", type=int, default=60, help="Polling seconds (default: 60)")
    ap.add_argument("--once", action="store_true", help="Check once, without waiting for stable files")
    ap.add_argument("--dry-run", action="store_true", help="Validate but do not commit/push")
    args = ap.parse_args()
    if args.interval < 5:
        ap.error("--interval must be at least 5 seconds")
    observed = {}
    try:
        if args.once:
            for html in untracked_papers():
                observed[str(html)] = (html.stat().st_size, html.stat().st_mtime_ns)
            run_once(observed, not args.dry_run)
            return 0
        print(f"Watching {PAPERS} every {args.interval}s; publish={not args.dry_run}", flush=True)
        while True:
            run_once(observed, not args.dry_run)
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("Stopped.")
        return 0
    except (OSError, subprocess.CalledProcessError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
