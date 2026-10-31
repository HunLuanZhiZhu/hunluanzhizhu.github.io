"""Build labelled contact sheets from the reference frames (1 fps)."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
fr = sorted((ROOT / "assets" / "ref_frames").glob("r_*.jpg"))
print(len(fr))
cell_w, cell_h = 480, 270
cols, rows = 4, 4
per = cols * rows
for page in range((len(fr) + per - 1) // per):
    sheet = Image.new("RGB", (cols * cell_w, rows * (cell_h + 18)), (18, 18, 22))
    d = ImageDraw.Draw(sheet)
    for i, p in enumerate(fr[page * per : (page + 1) * per]):
        idx = page * per + i
        im = Image.open(p).resize((cell_w, cell_h))
        x = (i % cols) * cell_w
        y = (i // cols) * (cell_h + 18)
        sheet.paste(im, (x, y))
        d.text((x + 6, y + cell_h + 3), f"{idx}s", fill=(255, 220, 120))
    out = ROOT / "assets" / f"sheet_{page + 1}.jpg"
    sheet.save(out, quality=88)
    print(out)
