import React from 'react';
import {useCurrentFrame} from 'remotion';
import {bandAt, clamp, kick, lerp, loopFrame, rmsAt, TOTAL_FRAMES} from '../utils/motion';
import {W} from '../utils/theme';

const COUNT = 58;
const BAR_W = 16;
const GAP = 12;
const MAX_H = 96;
const BASELINE = 1074;

const lerpHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(t)))).join(',')})`;
};

const colorFor = (v: number) => {
  if (v < 0.34) return lerpHex('#2E3E74', '#5D8FD8', v / 0.34);
  if (v < 0.68) return lerpHex('#5D8FD8', '#9FD8FF', (v - 0.34) / 0.34);
  return lerpHex('#9FD8FF', '#FFD79A', (v - 0.68) / 0.32);
};

/**
 * The bottom EQ strip: mirrored bars driven by the real mel bands.
 * Near the loop seam it blends into a fixed idle pattern so frame 0 and the
 * last frame are pixel-identical.
 */
export const EnergyBars: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const raw = useCurrentFrame();
  const frame = loopFrame(raw);
  const audioKick = kick(frame, 7);
  const totalW = COUNT * BAR_W + (COUNT - 1) * GAP;
  const seam = Math.max(clamp((raw - (TOTAL_FRAMES - 26)) / 25), clamp((6 - raw) / 6));

  const bars = Array.from({length: COUNT}, (_, i) => {
    const t = i / (COUNT - 1);
    const band = Math.round(Math.pow(t, 1.3) * 31);
    const lo = bandAt(frame, band);
    const hi = bandAt(frame, Math.min(31, band + 3));
    const idle = 0.08 + Math.abs(Math.sin(i * 0.55)) * 0.09;
    const raw2 = clamp(lo * 0.62 + hi * 0.38);
    const live = Math.pow(raw2, 1.45) * 0.95 + audioKick * 0.16 * (1 - t * 0.55);
    const v = lerp(live, idle, seam);
    return {h: Math.max(5, v * MAX_H + rmsAt(frame) * 10), v: clamp(v * 1.45)};
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2,
        top: BASELINE - MAX_H,
        width: totalW,
        height: MAX_H,
        marginLeft: -totalW / 2,
        display: 'flex',
        alignItems: 'flex-end',
        gap: GAP,
        zIndex: 150,
        opacity,
        maskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      {bars.map((b, i) => (
        <div key={i} style={{position: 'relative', width: BAR_W, height: MAX_H}}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: BAR_W,
              height: b.h,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${colorFor(b.v)} 0%, rgba(40,58,116,0.35) 100%)`,
              boxShadow:
                b.h > MAX_H * 0.66
                  ? `0 0 18px ${colorFor(b.v)}, 0 0 4px rgba(255,255,255,0.5) inset`
                  : '0 0 10px rgba(93,143,216,0.28)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: MAX_H + 3,
              left: 0,
              width: BAR_W,
              height: Math.min(22, b.h * 0.24),
              borderRadius: 4,
              background: `linear-gradient(180deg, ${colorFor(b.v)}, rgba(0,0,0,0))`,
              opacity: 0.22,
              filter: 'blur(2px)',
            }}
          />
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background:
            'linear-gradient(90deg, rgba(120,170,255,0), rgba(160,210,255,0.35), rgba(120,170,255,0))',
        }}
      />
    </div>
  );
};
