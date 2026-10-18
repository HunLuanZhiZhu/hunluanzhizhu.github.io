#!/usr/bin/env python3
"""Background watcher: publish new arXiv paper HTMLs and log every attempt."""
import argparse
import logging
from logging.handlers import RotatingFileHandler
import os
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
LOG_DIR = Path(os.environ.get("LOCALAPPDATA") or (Path.home() / ".local" / "share")) / "ArxivInsights"
LOG_FILE = LOG_DIR / "publisher.log"


def configure_logging():
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("arxiv-publisher")
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler = RotatingFileHandler(LOG_FILE, maxBytes=5_000_000, backupCount=5, encoding="utf-8")
    handler.setFormatter(fmt)
    logger.addHandler(handler)
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(fmt)
    logger.addHandler(console)
    return logger


def untracked_papers():
    for html in sorted(PAPERS.glob("*/index.html")):
        if not ID.fullmatch(html.parent.name):
            continue
        rel = html.relative_to(REPO).as_posix()
        check = subprocess.run(["git", "-C", str(REPO), "ls-files", "--error-unmatch", "--", rel],
                               capture_output=True, text=True)
        if check.returncode != 0:
            yield html


def run_once(observed, publish, logger, immediate=False):
    for html in untracked_papers():
        try:
            stamp = (html.stat().st_size, html.stat().st_mtime_ns)
        except FileNotFoundError:
            continue
        key = str(html)
        previous = observed.get(key)
        observed[key] = stamp
        if previous != stamp and not immediate:
            logger.info("WAIT id=%s reason=file-not-stable", html.parent.name)
            continue
        paper_id = html.parent.name
        command = [sys.executable, str(PUBLISHER), paper_id]
        if publish:
            command.append("--publish")
        logger.info("ATTEMPT id=%s mode=%s", paper_id, "publish" if publish else "check")
        result = subprocess.run(command, cwd=REPO, capture_output=True, text=True, encoding="utf-8", errors="replace")
        output = (result.stdout + "\n" + result.stderr).strip()
        if result.returncode == 0:
            logger.info("SUCCESS id=%s output=%s", paper_id, output)
            if publish:
                observed.pop(key, None)
        else:
            logger.error("FAIL id=%s exit=%s output=%s; HTML retained", paper_id, result.returncode, output)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--interval", type=int, default=60)
    ap.add_argument("--once", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    if args.interval < 5:
        ap.error("--interval must be at least 5 seconds")
    logger = configure_logging()
    observed = {}
    logger.info("START repo=%s interval=%ss publish=%s log=%s", REPO, args.interval, not args.dry_run, LOG_FILE)
    try:
        if args.once:
            run_once(observed, not args.dry_run, logger, immediate=True)
            return 0
        while True:
            try:
                run_once(observed, not args.dry_run, logger)
            except Exception:
                logger.exception("SCAN FAILED; will retry")
            time.sleep(args.interval)
    except KeyboardInterrupt:
        logger.info("STOP")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
