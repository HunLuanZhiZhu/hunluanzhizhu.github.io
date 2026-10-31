"""Analyze the reference audio: tempo, beat grid, loudness envelope, mel bands.

Outputs JSON used by the Remotion composition so that every animation is
locked to the real audio instead of a guessed BPM.
"""
import json
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "audio" / "ref.wav"
OUT = ROOT / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)

y, sr = librosa.load(AUDIO, sr=22050, mono=True)
dur = len(y) / sr
print(f"duration {dur:.3f}s  sr {sr}")

# ---- tempo / beats -------------------------------------------------------
onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
tempo, beats = librosa.beat.beat_track(
    onset_envelope=onset_env, sr=sr, hop_length=512, trim=False
)
beat_times = librosa.frames_to_time(beats, sr=sr, hop_length=512)
tempo = float(np.atleast_1d(tempo)[0])
print(f"tempo {tempo:.2f}  beats {len(beat_times)}")
print("first beats:", np.round(beat_times[:16], 3))

# ---- onsets --------------------------------------------------------------
onset_frames = librosa.onset.onset_detect(
    onset_envelope=onset_env, sr=sr, hop_length=512, backtrack=True
)
onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=512)

# ---- loudness / energy envelope (per video frame @30fps) -----------------
fps = 30
n_frames = int(np.ceil(dur * fps))
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
rms_t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
frame_rms = np.interp((np.arange(n_frames) + 0.5) / fps, rms_t, rms)
frame_rms = frame_rms / (frame_rms.max() + 1e-9)

# 32 band spectrum per frame for the equalizer bars
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
bands = librosa.feature.melspectrogram(S=S**2, sr=sr, n_mels=32, fmax=8000)
bands = librosa.power_to_db(bands, ref=np.max)
band_t = librosa.frames_to_time(np.arange(bands.shape[1]), sr=sr, hop_length=512)
frame_bands = np.stack(
    [np.interp((np.arange(n_frames) + 0.5) / fps, band_t, row) for row in bands]
)
# normalise each band to 0..1 (clip -60dB floor)
frame_bands = np.clip((frame_bands + 60) / 60, 0, 1)

# smooth a touch so bars look musical, not noisy
def smooth(a, k=3):
    ker = np.ones(k) / k
    return np.convolve(a, ker, mode="same")

frame_bands = np.stack([smooth(row) for row in frame_bands])
frame_rms = smooth(frame_rms, 3)

# ---- vocal presence estimate (low-mid band energy) -----------------------
# 200-3500 Hz is where the vocal sits; useful to distinguish singing from drums
melfb = librosa.filters.mel(sr=sr, n_fft=2048, n_mels=64)
vocal_bins = slice(8, 40)
vocal = melfb[vocal_bins] @ S
vocal = np.log1p(vocal).mean(axis=0)
vocal = (vocal - vocal.min()) / (vocal.max() - vocal.min() + 1e-9)
vocal_t = librosa.frames_to_time(np.arange(len(vocal)), sr=sr, hop_length=512)
frame_vocal = np.interp((np.arange(n_frames) + 0.5) / fps, vocal_t, vocal)

data = {
    "duration": round(dur, 4),
    "fps": fps,
    "frames": n_frames,
    "tempo": round(tempo, 2),
    "beats": [round(float(t), 4) for t in beat_times],
    "onsets": [round(float(t), 4) for t in onset_times],
    "rms": [round(float(v), 4) for v in frame_rms],
    "vocal": [round(float(v), 4) for v in frame_vocal],
    "bands": [[round(float(v), 3) for v in row] for row in frame_bands],
}
(OUT / "audio.json").write_text(json.dumps(data, separators=(",", ":")))

# ---- report --------------------------------------------------------------
rms_db = 20 * np.log10(np.maximum(rms, 1e-9))
print(f"loudness mean {rms_db.mean():.1f} dB  max {rms_db.max():.1f} dB")
print(f"quiet frames (<-40dB): {(rms_db < -40).sum()} / {len(rms_db)}")
print(f"onsets: {len(onset_times)}")
# per-second energy table helps to spot the vocal line boundaries
for s in range(int(dur) + 1):
    seg = frame_rms[s * fps : (s + 1) * fps]
    segv = frame_vocal[s * fps : (s + 1) * fps]
    bar = "#" * int((seg.mean() if len(seg) else 0) * 40)
    print(f"{s:02d}s  rms {seg.mean() if len(seg) else 0:.2f} {bar:<40} vox {segv.mean() if len(segv) else 0:.2f}")
