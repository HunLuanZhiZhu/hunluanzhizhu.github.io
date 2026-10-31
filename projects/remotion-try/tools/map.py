"""Print a compact vocal-band / percussive-band energy map at 50 ms resolution."""
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
y, sr = librosa.load(ROOT / "audio" / "ref.wav", sr=22050, mono=True)

hop = 1102  # 50 ms
S = np.abs(librosa.stft(y, n_fft=4096, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)


def band(lo, hi):
    m = (freqs >= lo) & (freqs < hi)
    e = S[m].mean(axis=0)
    e = np.log1p(e * 100)
    return (e - e.min()) / (e.max() - e.min() + 1e-9)


vocal = band(250, 3200)
mid = band(80, 1600)
hi = band(4000, 10000)
low = band(30, 120)

chars = " .:-=+*#%@"
for name, arr in (("VOX", vocal), ("LOW", low), ("HI ", hi)):
    print(f"--- {name} (50ms/char, 20 chars = 1s) ---")
    for row in range(0, len(arr), 100):
        seg = arr[row : row + 100]
        line = "".join(chars[min(len(chars) - 1, int(v * len(chars)))] for v in seg)
        print(f"{row * 0.05:5.2f}s |{line}|")
