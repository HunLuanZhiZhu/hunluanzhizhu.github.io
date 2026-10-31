"""Contact sheets for the 2 fps reference frames, labelled with timecode."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
fr = sorted((ROOT / "assets" / "ref2").glob("t_*.jpg"))
print("frames", len(fr))
cell_w, cell_h = 430, 242
cols, rows = 4, 4
per = cols * rows
for page in range((len(fr) + per - 1) // per):
    sheet = Image.new("RGB", (cols * cell_w, rows * (cell_h + 16)), (14, 14, 18))
    d = ImageDraw.Draw(sheet)
    for i, p in enumerate(fr[page * per : (page + 1) * per]):
        idx = page * per + i
        im = Image.open(p).resize((cell_w, cell_h))
        x = (i % cols) * cell_w
        y = (i // cols) * (cell_h + 16)
        sheet.paste(im, (x, y))
        d.text((x + 5, y + cell_h + 2), f"{idx * 0.5:04.1f}s", fill=(255, 215, 120))
    out = ROOT / "assets" / f"t_sheet_{page + 1}.jpg"
    sheet.save(out, quality=90)
    print(out)
