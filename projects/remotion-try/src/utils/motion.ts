import {Easing, interpolate} from 'remotion';
import audioData from '../data/audio.json';

export const FPS = audioData.fps;
export const DURATION = audioData.duration;
export const TOTAL_FRAMES = Math.round(DURATION * FPS);

export type AudioData = {
  duration: number;
  fps: number;
  frames: number;
  tempo: number;
  beats: number[];
  onsets: number[];
  rms: number[];
  vocal: number[];
  bands: number[][];
};
export const AUDIO = audioData as AudioData;

/** Beat grid in frames (129.2 BPM ≈ 13.93 frames per beat). */
export const BEATS = AUDIO.beats.map((b) => b * FPS);
export const BPM = AUDIO.tempo;
export const BEAT = (60 / BPM) * FPS;

export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (v: number, a: number, b: number) => clamp((v - a) / (b - a));

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  linear: (t: number) => t,
};

export type Track = [frame: number, value: number][];

/**
 * Piecewise keyframe track with eased segments.
 * Values before the first key / after the last key are clamped.
 */
export const track = (
  frame: number,
  keys: Track,
  ease: (t: number) => number = EASE.inOut,
): number => {
  if (keys.length === 0) return 0;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame <= f1) {
      const t = (frame - f0) / Math.max(1e-6, f1 - f0);
      return lerp(v0, v1, ease(t));
    }
  }
  return keys[keys.length - 1][1];
};

/** Track that springs into each key (nice for pops and landings). */
export const trackSpring = (
  frame: number,
  keys: Track,
  cfg: {stiffness?: number; damping?: number; mass?: number} = {},
): number => {
  const {stiffness = 170, damping = 16, mass = 1} = cfg;
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame <= f1) {
      const dt = (frame - f0) / FPS;
      const w0 = Math.sqrt(stiffness / mass);
      const zeta = damping / (2 * Math.sqrt(stiffness * mass));
      const wd = w0 * Math.sqrt(Math.max(0.0001, 1 - zeta * zeta));
      const env = Math.exp(-zeta * w0 * dt);
      const prog = 1 - env * (Math.cos(wd * dt) + ((zeta * w0) / wd) * Math.sin(wd * dt));
      return lerp(v0, v1, clamp(prog, -0.6, 1.6));
    }
  }
  return keys[keys.length - 1][1];
};

/** Index of the last beat at or before `frame`, plus distance since it. */
export const beatAt = (frame: number) => {
  let lo = 0;
  let hi = BEATS.length - 1;
  if (frame < BEATS[0]) return {index: 0, since: 0, next: BEATS[0] - frame};
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (BEATS[mid] <= frame) lo = mid;
    else hi = mid - 1;
  }
  return {index: lo, since: frame - BEATS[lo], next: (BEATS[lo + 1] ?? 1e9) - frame};
};

/** 1 → 0 impact curve after each beat. */
export const kick = (frame: number, decay = 5.5) => {
  const {since} = beatAt(frame);
  return Math.exp(-since / decay);
};

/** Sharp transient a fixed number of frames after a beat. */
export const pulse = (frame: number, at: number, decay = 6) => {
  if (frame < at) return 0;
  return Math.exp(-(frame - at) / decay);
};

/** Crossfade helper: 0 before a, 1 after b. */
export const fadeIn = (frame: number, a: number, b: number, ease = EASE.out) =>
  interpolate(frame, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const fadeOut = (frame: number, a: number, b: number, ease = EASE.in) =>
  interpolate(frame, [a, b], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

/** Seeded pseudo random — deterministic across renders. */
export const rand = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Wrapped ambient clock so the loop seam is invisible. */
export const loopFrame = (frame: number) =>
  frame > TOTAL_FRAMES - 20 ? frame - TOTAL_FRAMES : frame;

/** Audio band sample for a frame, 0..1 (8 mel bands merged → 3 groups). */
export const bandAt = (frame: number, index: number) => {
  const f = clamp(Math.round(frame), 0, AUDIO.bands.length - 1);
  return AUDIO.bands[f][clamp(index, 0, 31)];
};
export const rmsAt = (frame: number) => {
  const f = clamp(Math.round(frame), 0, AUDIO.rms.length - 1);
  return AUDIO.rms[f];
};

/** Tiny 3D-ish tilt helper for layers that should feel like planes. */
export const plane = (rotX: number, rotY: number, rotZ = 0) =>
  `perspective(1400px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`;
