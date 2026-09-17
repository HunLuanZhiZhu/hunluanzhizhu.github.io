#!/usr/bin/env python3
"""Regenerate the @font-face block inlined into /index.html.

The homepage is a single file with no network dependency, so shipping real type
means subsetting it and inlining it as base64 woff2. The face is Cascadia Mono
(SIL OFL 1.1, https://github.com/microsoft/cascadia-code) -- the face the page's
font stack already asked for. Inlining it means every visitor actually sees it,
instead of whatever monospace their OS happens to have.

This is an asset generator, not a build step: it never runs at deploy time.

  python tools/subset-font.py --report          # which glyphs the face lacks
  python tools/subset-font.py --inject index.html   # rewrite the <style id="font"> block

The injected block is delimited by <style id="font">…</style>, so re-running is
idempotent. Adding copy to the page that uses new characters means re-running
this; the script reports anything the face cannot draw.
"""
import argparse
import base64
import re
import sys
from io import BytesIO
from pathlib import Path

FONT = Path(r"C:\Windows\Fonts\CascadiaMono.ttf")

# Every character the homepage renders in Latin/mono. Box-drawing and arrows are
# included because the terminal identity uses them as UI furniture.
#
# Cascadia Mono has NO U+21B5 (↵), U+2197 (↗), U+2318 (⌘) or U+2325-2328
# (⌥⌃⇧) -- verified with --report. The page's copy avoids all of them rather
# than falling back to a second face mid-line.
GLYPHS = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "·—–…‘’“”«»"
    + "↑↓←→↵↗↘↖↙"
    + "▲▼◀▶▸▹●○◉■□▪▫"
    + "█▉▊▋▌▍▎▏░▒▓"
    + "✓✗×÷±≈≠≤≥∞√∑∆"
    + "⌘⌥⌃⇧⏎"
    + "§¶†‡•‰°′″"
    + "┌┐└┘├┤┬┴┼─│"
    + "═║╔╗╚╝╠╣╦╩╬"
)

MARK_RE = re.compile(r'(<style id="font">).*?(</style>)', re.S)


def build(font_path: Path, report_ok=True):
    try:
        from fontTools import subset
        from fontTools.ttLib import TTFont
    except ImportError:
        sys.exit("needs fontTools + brotli:  python -m pip install fonttools brotli")

    src = TTFont(str(font_path))
    cmap = set(src.getBestCmap().keys())
    missing = [ch for ch in GLYPHS if ord(ch) not in cmap]
    keep = "".join(ch for ch in GLYPHS if ord(ch) in cmap)

    if report_ok and missing:
        print(f"# face lacks {len(missing)} requested glyphs, dropped: "
              f"{''.join(missing)}", file=sys.stderr)

    opts = subset.Options()
    opts.flavor = "woff2"
    opts.desubroutinize = True
    opts.layout_features = []
    opts.name_IDs = []
    opts.notdef_outline = False
    opts.recalc_bounds = True
    opts.drop_tables += ["DSIG"]

    font = subset.load_font(str(font_path), opts)
    sub = subset.Subsetter(options=opts)
    sub.populate(text=keep)
    sub.subset(font)
    buf = BytesIO()
    subset.save_font(font, buf, opts)
    return buf.getvalue(), keep, missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--inject", metavar="HTML", nargs="+",
                    help="one or more HTML files, each with a <style id=\"font\"> block")
    ap.add_argument("--font", default=str(FONT))
    a = ap.parse_args()

    font_path = Path(a.font)
    if not font_path.exists():
        sys.exit(f"font not found: {font_path}")

    if a.report:
        from fontTools.ttLib import TTFont
        cmap = set(TTFont(str(font_path)).getBestCmap().keys())
        missing = [ch for ch in GLYPHS if ord(ch) not in cmap]
        print(f"face: {font_path.name}")
        print(f"requested {len(GLYPHS)} glyphs, missing {len(missing)}: "
              f"{''.join(missing) or '(none)'}")
        return

    data, keep, missing = build(font_path)
    b64 = base64.b64encode(data).decode()
    css = (
        "/* Cascadia Mono, SIL OFL 1.1 -- subset to %d glyphs, %d bytes.\n"
        "   Regenerate with: python tools/subset-font.py --inject index.html */\n"
        "@font-face{font-family:'Cascadia Mono Subset';font-style:normal;"
        "font-weight:400;font-display:swap;"
        "src:url(data:font/woff2;base64,%s) format('woff2')}"
        % (len(keep), len(data), b64)
    )

    if not a.inject:
        print(f"# {len(data)} bytes woff2 / {len(b64)} base64", file=sys.stderr)
        print(css)
        return

    for name in a.inject:
        target = Path(name)
        html = target.read_text(encoding="utf-8")
        new, n = MARK_RE.subn(lambda m: m.group(1) + css + m.group(2), html)
        if n != 1:
            sys.exit(f'expected exactly 1 <style id="font"> block in {target}, found {n}')
        target.write_text(new, encoding="utf-8")
        print(f"injected {len(data)} B woff2 into {target} "
              f"({len(keep)} glyphs, {len(missing)} dropped)")
    if missing:
        print(f"# dropped (not in face): {''.join(missing)}", file=sys.stderr)


if __name__ == "__main__":
    main()
