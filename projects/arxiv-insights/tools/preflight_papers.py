#!/usr/bin/env python3
"""Read-only pre-publication metadata validation for arXiv Insights HTML.

Usage:
  python projects/arxiv-insights/tools/preflight_papers.py --mode publish /tmp/2610.19159/index.html
  python projects/arxiv-insights/tools/preflight_papers.py --mode draft /tmp/draft.html
  python projects/arxiv-insights/tools/preflight_papers.py --mode publish --all
Exit 0 on success, 1 on validation failure. Does not write files or GitHub data.
"""
import argparse
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
ID = re.compile(r"^\d{4}\.\d{4,5}$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
FIELDS = ("arxiv_id", "title", "title_zh", "published", "date", "added_at", "summary", "topics", "heat_note")


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.head = False
        self.active = False
        self.blocks = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "head":
            self.head = True
        if tag == "script" and a.get("id") == "paper-meta":
            if not self.head:
                self.errors.append("paper-meta must be in <head>")
            if a.get("type") != "application/json":
                self.errors.append("paper-meta must have type application/json")
            self.blocks.append("")
            self.active = True

    def handle_data(self, data):
        if self.active:
            self.blocks[-1] += data

    def handle_endtag(self, tag):
        if tag == "script":
            self.active = False
        if tag == "head":
            self.head = False


def calendar_date(value):
    if not isinstance(value, str) or not DATE.fullmatch(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def utc_timestamp(value):
    if not isinstance(value, str) or not value.endswith("Z"):
        return False
    try:
        return datetime.fromisoformat(value[:-1] + "+00:00").utcoffset().total_seconds() == 0
    except ValueError:
        return False


def validate(path, mode, seen):
    errors = []
    try:
        parser = Parser()
        parser.feed(path.read_text(encoding="utf-8"))
        parser.close()
    except (OSError, UnicodeError, ValueError) as exc:
        return [f"cannot read/parse HTML: {exc}"]
    errors.extend(parser.errors)
    if len(parser.blocks) != 1:
        return errors + [f"expected one paper-meta, found {len(parser.blocks)}"]
    try:
        data = json.loads(parser.blocks[0])
    except ValueError as exc:
        return errors + [f"invalid paper-meta JSON: {exc}"]
    if not isinstance(data, dict):
        return errors + ["paper-meta must be a JSON object"]
    for field in FIELDS:
        if mode == "draft" and field == "added_at":
            if field in data:
                errors.append("draft must not set added_at")
            continue
        if mode == "draft" and field == "date" and data.get(field) == "YYYY-MM-DD":
            continue
        if field == "topics":
            if not isinstance(data.get(field), list) or not data[field] or any(not isinstance(t, str) or not t.strip() for t in data[field]):
                errors.append("topics must be a nonempty list of nonempty strings")
        elif not isinstance(data.get(field), str) or not data[field].strip():
            errors.append(f"missing or empty {field}")
    paper_id = data.get("arxiv_id")
    if not isinstance(paper_id, str) or not ID.fullmatch(paper_id):
        errors.append("arxiv_id must be a stable ID without version suffix")
    elif paper_id in seen:
        errors.append(f"duplicate arxiv_id {paper_id} (also {seen[paper_id]})")
    else:
        seen[paper_id] = path
    if path.name == "index.html" and isinstance(paper_id, str) and path.parent.name != paper_id:
        errors.append(f"directory {path.parent.name} differs from arxiv_id {paper_id}")
    if not calendar_date(data.get("published")):
        errors.append("published must be a valid YYYY-MM-DD date (not timestamp)")
    if mode == "publish":
        if not calendar_date(data.get("date")):
            errors.append("date must be a valid YYYY-MM-DD archive date")
        if not utc_timestamp(data.get("added_at")):
            errors.append("added_at must be valid UTC ISO 8601 ending in Z")
    elif data.get("date") != "YYYY-MM-DD" and not calendar_date(data.get("date")):
        errors.append("draft date must be YYYY-MM-DD placeholder or a valid date")
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="*", type=Path)
    ap.add_argument("--mode", choices=("draft", "publish"), required=True)
    ap.add_argument("--all", action="store_true", help="validate all repository papers")
    args = ap.parse_args()
    paths = list(args.files)
    if args.all:
        paths += sorted(PAPERS.glob("*/index.html"))
    paths = list(dict.fromkeys(paths))
    if not paths:
        ap.error("supply HTML files or --all")
    seen = {}
    failed = 0
    for path in paths:
        errors = validate(path, args.mode, seen)
        print(f'{"FAIL" if errors else "PASS"} {path}')
        for error in errors:
            print(f"  - {error}")
        failed += bool(errors)
    print(f"checked={len(paths)} passed={len(paths)-failed} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
