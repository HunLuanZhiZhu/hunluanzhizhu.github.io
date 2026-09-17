#!/usr/bin/env python3
"""Generate the two raster assets the site needs: og.png and apple-touch-icon.png.

Both are DRAWING OUTPUT, not sourced artwork — the OG card is laid out here and
the lattice on it is drawn with the same isometric projection the homepage's
figure 01 uses. Neither is a screenshot of the page: an OG image is read at
~500px in a feed, so its type has to be far larger than any real page's.

Open Graph images must be raster (no platform reads an SVG preview), which is
why these are the only two bitmaps in the repository.

  python tools/make-images.py            # writes ./og.png and ./apple-touch-icon.png

Requires playwright + chromium. Run by hand; never at deploy time.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FACE = "'Cascadia Mono','Cascadia Mono Subset',ui-monospace,Consolas,monospace"
CJK = "'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif"

# ── the lattice on the OG card. Same projection as MARKS.voxel in index.html:
#    cells accrete upward, two visible side faces plus a lit top face.
OG_CARD = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden;background:#000}
body{font-family:@FACE@,@CJK@;color:#fffef4;position:relative}
.lat{position:absolute;inset:0;
  background-image:radial-gradient(circle at center,rgba(255,255,255,.055) 1.2px,transparent 1.6px);
  background-size:34px 34px}
.blob{position:absolute;left:-18%;top:-46%;width:1100px;height:1100px;
  background:radial-gradient(circle at center,rgba(198,255,0,.10) 0%,rgba(198,255,0,.03) 38%,transparent 64%)}
.beam{position:absolute;left:0;top:0;width:100%;height:3px;background:#c6ff00}
.wrap{position:absolute;left:72px;top:70px;right:72px;bottom:56px;
  display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;row-gap:22px}
.k{font-size:18px;letter-spacing:.26em;text-transform:uppercase;color:#7d7d7d;
  display:flex;align-items:center;gap:16px}
.k i{width:34px;height:2px;background:#c6ff00;display:block}
h1{font-size:104px;line-height:.96;letter-spacing:-.045em;font-weight:700}
h1 em{font-style:normal;color:#c6ff00}
.mid{min-height:0;display:flex;align-items:center;justify-content:flex-end}
canvas{height:100%;width:auto;max-width:100%}
.foot{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;
  border-top:1px solid rgba(255,255,255,.14);padding-top:22px}
.sub{font-size:20px;color:#9a9a9a;letter-spacing:.02em}
.url{font-size:20px;color:#c6ff00;letter-spacing:.12em}
</style></head><body>
<div class="lat"></div><div class="blob"></div><div class="beam"></div>
<div class="wrap">
  <p class="k"><i></i>~/projects — index</p>
  <h1><em>12</em> PROJECTS.<br>ZERO BUILD STEP</h1>
  <div class="mid"><canvas id="c" width="620" height="620"></canvas></div>
  <div class="foot">
    <p class="sub">浏览器实验 · 游戏 · 讲稿 · 工具 &nbsp;|&nbsp; no framework, no build</p>
    <p class="url">zyh.sryze.cc</p>
  </div>
</div>
<script>
var g = document.getElementById('c').getContext('2d');
var W = 620, H = 620, s = 54, N = 4, HT = 4;
var cx = W / 2, cy = H * .52;
var iso = function(x, y, z){ return [cx + (x - z) * .866 * s, cy + ((x + z) * .5 - y) * s]; };
g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.09)';
var i;
for(i = 0; i <= N; i++){
  g.beginPath(); var a = iso(i,0,0), b = iso(i,0,N); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
  g.beginPath(); a = iso(0,0,i); b = iso(N,0,i); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke();
}
g.strokeStyle = 'rgba(255,255,255,.15)';
for(i = 0; i <= N; i++){
  g.beginPath(); var a2 = iso(i,HT,0), b2 = iso(i,HT,N); g.moveTo(a2[0],a2[1]); g.lineTo(b2[0],b2[1]); g.stroke();
  g.beginPath(); a2 = iso(0,HT,i); b2 = iso(N,HT,i); g.moveTo(a2[0],a2[1]); g.lineTo(b2[0],b2[1]); g.stroke();
}
for(i = 0; i < 4; i++){
  var c = [[0,0],[N,0],[0,N],[N,N]][i];
  g.beginPath(); var p1 = iso(c[0],0,c[1]), p2 = iso(c[0],HT,c[1]); g.moveTo(p1[0],p1[1]); g.lineTo(p2[0],p2[1]); g.stroke();
}
function poly(pts, fill, stroke){
  g.beginPath();
  pts.forEach(function(p, j){ j ? g.lineTo(p[0],p[1]) : g.moveTo(p[0],p[1]); });
  g.closePath(); if(fill){ g.fillStyle = fill; g.fill(); } if(stroke){ g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
}
[[1,1,3],[2,1,2],[1,2,3],[2,2,1],[3,2,2],[2,3,1]].forEach(function(c){
  var x = c[0], z = c[1], top = Math.min(c[2], HT);
  poly([iso(x,0,z+1), iso(x+1,0,z+1), iso(x+1,top,z+1), iso(x,top,z+1)], 'rgba(198,255,0,.22)', 'rgba(198,255,0,.75)');
  poly([iso(x+1,0,z), iso(x+1,0,z+1), iso(x+1,top,z+1), iso(x+1,top,z)], 'rgba(198,255,0,.12)', 'rgba(198,255,0,.75)');
  poly([iso(x,top,z), iso(x+1,top,z), iso(x+1,top,z+1), iso(x,top,z+1)], 'rgba(198,255,0,.40)', 'rgba(198,255,0,.75)');
});
</script></body></html>""".replace("@FACE@", FACE).replace("@CJK@", CJK)

ICON = """<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:180px;height:180px;overflow:hidden;background:#000}
svg{display:block;width:180px;height:180px}
</style></head><body>
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#000"/>
  <rect x="5" y="13" width="4" height="12" fill="#c6ff00"/>
  <rect x="11" y="8" width="4" height="17" fill="#c6ff00"/>
  <rect x="17" y="16" width="4" height="9" fill="#c6ff00"/>
  <rect x="23" y="11" width="4" height="14" fill="#c6ff00"/>
</svg></body></html>"""


def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("needs playwright:  python -m pip install playwright")

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        pg.set_content(OG_CARD)
        pg.wait_for_timeout(400)
        pg.screenshot(path=str(ROOT / "og.png"), clip={"x": 0, "y": 0, "width": 1200, "height": 630})
        print("wrote og.png")

        pg2 = b.new_page(viewport={"width": 180, "height": 180}, device_scale_factor=1)
        pg2.set_content(ICON)
        pg2.wait_for_timeout(250)
        pg2.screenshot(path=str(ROOT / "apple-touch-icon.png"))
        print("wrote apple-touch-icon.png")
        b.close()

    for name in ("og.png", "apple-touch-icon.png"):
        f = ROOT / name
        print(f"  {name}: {f.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
