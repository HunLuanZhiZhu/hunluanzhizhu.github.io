#!/usr/bin/env python3
"""Build arXiv Insights index from paper HTML metadata. Standard library only."""
import argparse
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAPERS = ROOT / "papers"
INDEX = ROOT / "data" / "papers.json"
ID = re.compile(r"^\d{4}\.\d{4,5}$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.active = False
        self.blocks = []

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("id") == "paper-meta":
            if dict(attrs).get("type") != "application/json":
                raise ValueError("paper-meta must have type application/json")
            self.active = True
            self.blocks.append("")

    def handle_data(self, data):
        if self.active:
            self.blocks[-1] += data

    def handle_endtag(self, tag):
        if tag == "script" and self.active:
            self.active = False


def timestamp(value):
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("added_at must be ISO 8601 UTC ending in Z")
    datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


def load_papers():
    if not PAPERS.is_dir():
        raise ValueError("papers directory missing")
    legacy = {}
    if INDEX.exists():
        old = json.loads(INDEX.read_text(encoding="utf-8"))
        legacy = {p["arxiv_id"]: p for p in old.get("papers", [])}
    result = []
    for path in sorted(PAPERS.glob("*/index.html")):
        paper_id = path.parent.name
        if not ID.fullmatch(paper_id):
            raise ValueError(f"invalid paper directory: {path}")
        parser = MetadataParser()
        parser.feed(path.read_text(encoding="utf-8"))
        if len(parser.blocks) != 1:
            raise ValueError(f"{path}: expected exactly one paper-meta script")
        data = json.loads(parser.blocks[0])
        if not isinstance(data, dict) or data.get("arxiv_id") != paper_id:
            raise ValueError(f"{path}: mismatched arxiv_id")
        for field in ("title", "title_zh", "summary", "heat_note", "published", "date", "added_at"):
            if not isinstance(data.get(field), str) or not data[field].strip():
                raise ValueError(f"{path}: missing {field}")
        for field in ("published", "date"):
            if not DATE.fullmatch(data[field]):
                raise ValueError(f"{path}: invalid {field}")
            datetime.strptime(data[field], "%Y-%m-%d")
        timestamp(data["added_at"])
        if not isinstance(data.get("topics"), list) or not data["topics"] or any(not isinstance(t, str) or not t.strip() for t in data["topics"]):
            raise ValueError(f"{path}: topics must be nonempty strings")
        # Keep previously published optional metadata; HTML is authoritative for required fields.
        item = {**legacy.get(paper_id, {}), **data}
        item["href"] = f"papers/{paper_id}/"
        result.append(item)
    if not result:
        raise ValueError("no papers found")
    ids = [p["arxiv_id"] for p in result]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate arxiv_id")
    result.sort(key=lambda p: (p["added_at"], p["arxiv_id"]), reverse=True)
    latest = max(p["added_at"] for p in result)
    return {"schema_version": 1, "updated_at": latest, "papers": result}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if index differs")
    args = parser.parse_args()
    output = json.dumps(load_papers(), ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if not INDEX.exists() or INDEX.read_text(encoding="utf-8") != output:
            raise SystemExit("papers.json is out of date; run build_paper_index.py")
        print("Index matches HTML metadata")
    else:
        INDEX.parent.mkdir(parents=True, exist_ok=True)
        INDEX.write_text(output, encoding="utf-8")
        print(f"Generated {INDEX}")


if __name__ == "__main__":
    main()
