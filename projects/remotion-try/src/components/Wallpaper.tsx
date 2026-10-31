import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, H, W} from '../utils/theme';
import {loopFrame, rand} from '../utils/motion';

const STARS = Array.from({length: 120}, (_, i) => ({
  x: rand(i * 3.1 + 1) * W,
  y: rand(i * 7.7 + 9) * H * 0.92,
  r: 0.6 + rand(i * 5.3 + 4) * 1.9,
  a: 0.25 + rand(i * 2.9 + 7) * 0.55,
  sp: 0.4 + rand(i * 8.1 + 2) * 1.6,
  ph: rand(i * 4.7 + 3) * 6.28,
}));

export const Wallpaper: React.FC = () => {
  const frame = Math.max(0, loopFrame(useCurrentFrame()));
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: COLORS.night0}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 90% at 22% -10%, #1B2452 0%, rgba(12,16,38,0.75) 42%, rgba(5,7,15,1) 100%)',
        }}
      />
      {/* aurora blobs */}
      <div
        style={{
          position: 'absolute',
          left: '-18%',
          top: '-26%',
          width: '85%',
          height: '95%',
          background:
            'radial-gradient(closest-side, rgba(74,74,170,0.42), rgba(74,74,170,0) 70%)',
          transform: `translate(${Math.sin(frame / 210) * 40}px, ${Math.cos(frame / 260) * 26}px)`,
          filter: 'blur(10px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '-16%',
          bottom: '-28%',
          width: '80%',
          height: '90%',
          background:
            'radial-gradient(closest-side, rgba(126,58,120,0.38), rgba(126,58,120,0) 70%)',
          transform: `translate(${Math.sin(frame / 240 + 2) * -34}px, ${Math.cos(frame / 190) * 22}px)`,
          filter: 'blur(12px)',
        }}
      />
      {/* moon-glow behind the music player */}
      <div
        style={{
          position: 'absolute',
          left: '58%',
          top: '18%',
          width: 900,
          height: 900,
          background:
            'radial-gradient(closest-side, rgba(243,214,150,0.14), rgba(243,214,150,0) 68%)',
        }}
      />
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: '50%',
            background: i % 7 === 0 ? '#FFE9C2' : '#DCE7FF',
            opacity: s.a * (0.55 + 0.45 * Math.sin(frame / (28 / s.sp) + s.ph)),
            boxShadow: s.r > 1.6 ? '0 0 6px rgba(220,235,255,0.7)' : undefined,
          }}
        />
      ))}
      {/* light pool from the player, keeps the desk feeling lit */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(70% 55% at 50% 105%, rgba(90,90,180,0.18), rgba(0,0,0,0) 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 110% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
};
