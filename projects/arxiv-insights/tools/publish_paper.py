#!/usr/bin/env python3
"""Validate and publish one arXiv Insights HTML from this repository.

All paths are resolved relative to this script, not the caller's cwd.
Never stages or modifies data/papers.json.
"""
import argparse
import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
REPO = PROJECT.parent.parent
PAPERS = PROJECT / "papers"
ID_PATTERN = re.compile(r"\d{4}\.\d{4,5}")
REQUIRED = ("arxiv_id", "title", "title_zh", "published", "date", "added_at", "summary", "topics", "heat_note")


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("id") == "paper-meta":
            if dict(attrs).get("type") != "application/json":
                raise ValueError("paper-meta must have type=application/json")
            self.active = True
            self.blocks.append("")

    def handle_data(self, data):
        if self.active:
            self.blocks[-1] += data

    def handle_endtag(self, tag):
        if tag == "script":
            self.active = False


def git(*args, check=True):
    return subprocess.run(["git", "-C", str(REPO), *args], text=True,
                          capture_output=True, check=check)


def validate(paper_id):
    if not ID_PATTERN.fullmatch(paper_id):
        raise ValueError("Use a stable arXiv ID, e.g. 2610.18829 (no version suffix)")
    html = PAPERS / paper_id / "index.html"
    if not html.is_file():
        raise ValueError(f"Missing HTML: {html.relative_to(REPO)}")
    parser = MetadataParser()
    parser.feed(html.read_text(encoding="utf-8"))
    if len(parser.blocks) != 1:
        raise ValueError("Exactly one paper-meta JSON block is required")
    meta = json.loads(parser.blocks[0])
    for field in REQUIRED:
        if not meta.get(field):
            raise ValueError(f"Missing paper-meta field: {field}")
    if meta["arxiv_id"] != paper_id:
        raise ValueError("paper-meta arxiv_id does not match directory")
    if not isinstance(meta["topics"], list) or not all(isinstance(t, str) and t.strip() for t in meta["topics"]):
        raise ValueError("topics must be a nonempty list of strings")
    return html.relative_to(REPO).as_posix()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("arxiv_id", help="Stable ID without v1/v2 suffix")
    ap.add_argument("--publish", action="store_true", help="Commit and push (requires authorized environment)")
    ap.add_argument("--branch", default="main")
    args = ap.parse_args()
    try:
        path = validate(args.arxiv_id)
        if git("rev-parse", "--show-toplevel").stdout.strip().replace("\\", "/").lower() != str(REPO).replace("\\", "/").lower():
            raise ValueError("Unexpected repository root")
        current = git("branch", "--show-current").stdout.strip()
        if current != args.branch:
            raise ValueError(f"Current branch {current!r}, expected {args.branch!r}")
        # Fetch and inspect remote only during publication; check mode is offline.
        if not args.publish:
            print(f"CHECK OK: {path}; no Git changes made")
            return 0
        git("fetch", "origin", args.branch)
        remote = git("ls-tree", "-r", "--name-only", f"origin/{args.branch}", "--", path).stdout.strip()
        if remote:
            raise ValueError("Paper already exists on remote; refusing to overwrite")
        if git("status", "--porcelain", "--", path).stdout.strip() == "":
            raise ValueError("No new paper file to publish")
        if git("diff", "--cached", "--name-only").stdout.strip():
            raise ValueError("Index already contains staged files; refusing to mix changes")
        git("add", "--", path)
        staged = git("diff", "--cached", "--name-only").stdout.strip().splitlines()
        if staged != [path]:
            raise ValueError(f"Unexpected staged paths: {staged}")
        git("diff", "--cached", "--check")
        git("commit", "-m", f"Add arXiv Insights paper {args.arxiv_id}")
        git("push", "origin", args.branch)
        print(f"PUBLISHED {args.arxiv_id}: {git('rev-parse', 'HEAD').stdout.strip()}")
        return 0
    except (ValueError, OSError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        if isinstance(exc, subprocess.CalledProcessError):
            print(f"ERROR: git command failed: {exc.stderr.strip()}", file=sys.stderr)
        else:
            print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
