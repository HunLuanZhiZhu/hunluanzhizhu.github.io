import React from 'react';
import {COLORS, FONT} from '../utils/theme';
import {clamp, lerp, rand} from '../utils/motion';

const extrusion = (depth: number, rgb: string) =>
  Array.from({length: depth}, (_, i) => `${i + 1}px ${i + 1}px 0 ${rgb}`).join(', ');

export const KineticGlyph: React.FC<{
  ch: string;
  x: number;
  y: number;
  size: number;
  opacity?: number;
  blur?: number;
  rot?: number;
  scale?: number;
  glow?: number;
  color?: string;
  z?: number;
  hand?: boolean;
}> = ({
  ch,
  x,
  y,
  size,
  opacity = 1,
  blur = 0,
  rot = 0,
  scale = 1,
  glow = 0,
  color = COLORS.cream,
  z = 10,
  hand = false,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translateX(-50%) rotate(${rot}deg) scale(${scale})`,
      transformOrigin: '50% 50%',
      fontFamily: hand ? FONT.hand : FONT.lyric,
      fontSize: size,
      lineHeight: 1,
      color,
      opacity,
      filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
      textShadow: [
        `0 0 ${10 + glow * 46}px rgba(255,214,150,${0.18 + glow * 0.5})`,
        extrusion(9, 'rgba(74,42,22,0.85)'),
      ].join(', '),
      zIndex: z,
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }}
  >
    {ch}
  </div>
);

export const ConstellationLayer: React.FC<{
  stars: {ch: string; x: number; y: number; u: number}[];
  progress: number;
  moon: number;
}> = ({stars, progress, moon}) => {
  const pts = stars.map((s) => ({x: s.x, y: s.y + 74}));
  const seg = Math.max(0, (pts.length - 1) * progress);
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'none'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="constLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,230,180,0.0)" />
            <stop offset="0.5" stopColor="rgba(255,238,196,0.85)" />
            <stop offset="1" stopColor="rgba(180,210,255,0.15)" />
          </linearGradient>
        </defs>
        {pts.slice(0, -1).map((p, i) => {
          const q = pts[i + 1];
          const part = clamp(seg - i);
          if (part <= 0) return null;
          return (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={lerp(p.x, q.x, part)}
              y2={lerp(p.y, q.y, part)}
              stroke="url(#constLine)"
              strokeWidth={2.2}
              strokeDasharray="3 9"
            />
          );
        })}
      </svg>
      {/* moon */}
      <div
        style={{
          position: 'absolute',
          left: 1600 + (1 - moon) * 320,
          top: 20 + (1 - moon) * 320,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 34%, #FFF8DF 0%, #F3DFAB 52%, #D9BE85 100%)',
          boxShadow:
            '0 0 90px rgba(255,233,180,0.45), 0 0 220px rgba(255,220,150,0.22), inset -14px -18px 40px rgba(160,120,60,0.35)',
          opacity: moon,
          transform: `scale(${0.7 + moon * 0.3})`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 34,
            top: 52,
            width: 52,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(190,158,102,0.28)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 112,
            top: 118,
            width: 38,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(190,158,102,0.22)',
          }}
        />
      </div>
      {stars.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: s.x, top: s.y, opacity: s.u}}>
          <KineticGlyph ch={s.ch} x={0} y={0} size={148} glow={0.9} opacity={s.u} z={61} />
          <div
            style={{
              position: 'absolute',
              left: -2,
              top: 58,
              width: 6,
              height: 6,
              borderRadius: 3,
              background: '#FFF3D0',
              boxShadow: '0 0 18px 6px rgba(255,232,180,0.6)',
              opacity: s.u * (0.6 + 0.4 * Math.sin(i * 2.4)),
            }}
          />
        </div>
      ))}
    </div>
  );
};

export const MoonLayer: React.FC<{moon: number}> = ({moon}) => null;

export const MeteorLayer: React.FC<{x: number; y: number; show: boolean; u: number}> = ({
  x,
  y,
  show,
  u,
}) => {
  if (!show) return null;
  const scale = 1 - u * 0.25;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `rotate(28deg) scale(${scale})`,
        zIndex: 70,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: -4,
          width: 520,
          height: 9,
          borderRadius: 5,
          background:
            'linear-gradient(90deg, rgba(255,220,150,0) 0%, rgba(255,200,120,0.25) 35%, rgba(255,240,210,0.9) 92%, #FFFFFF 100%)',
          filter: 'blur(1px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -10,
          top: -18,
          width: 62,
          height: 62,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #FFFDF3 0%, #FFDFA0 45%, rgba(255,170,80,0) 72%)',
          boxShadow: '0 0 60px 12px rgba(255,200,120,0.55)',
        }}
      />
      {Array.from({length: 7}, (_, i) => {
        const r = rand(i * 5.1);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: 40 + i * 62,
              top: Math.sin(i * 2.3 + u * 6) * 16,
              width: 3 + r * 3,
              height: 3 + r * 3,
              borderRadius: 4,
              background: '#FFE6B0',
              opacity: 0.25 + r * 0.5,
              filter: 'blur(0.5px)',
            }}
          />
        );
      })}
    </div>
  );
};

export const ImpactFx: React.FC<{
  flash: number;
  ring: number;
  ring2: number;
  show: boolean;
  ox?: number;
  oy?: number;
}> = ({flash, ring, ring2, show, ox = 960, oy = 670}) => {
  if (!show) return null;
  const r1 = 40 + ring * 620;
  const r2 = 40 + ring2 * 760;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 95, pointerEvents: 'none'}}>
      {[r1, r1 * 0.55].map((r, i) =>
        ring < 1 ? (
          <div
            key={`a${i}`}
            style={{
              position: 'absolute',
              left: ox,
              top: oy,
              width: r * 2,
              height: r * 0.62,
              marginLeft: -r,
              marginTop: -r * 0.31,
              borderRadius: '50%',
              border: `${i === 0 ? 2 : 1.2}px solid rgba(255,236,200,${(1 - ring) * (i === 0 ? 0.5 : 0.3)})`,
              boxShadow: `0 0 30px rgba(255,220,170,${(1 - ring) * 0.35})`,
            }}
          />
        ) : null,
      )}
      {ring2 < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: ox,
            top: oy,
            width: r2 * 2,
            height: r2 * 0.62,
            marginLeft: -r2,
            marginTop: -r2 * 0.31,
            borderRadius: '50%',
            border: `1.4px solid rgba(160,220,255,${(1 - ring2) * 0.45})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${ox}px ${oy}px, rgba(255,252,240,0.95), rgba(255,240,214,0.45) 28%, rgba(255,230,190,0) 62%)`,
          opacity: flash,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export const EnterKey: React.FC<{x: number; y: number; press: number; glow: number}> = ({
  x,
  y,
  press,
  glow,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 64,
      height: 64,
      transform: `translate(-50%,-100%) translateY(${press * 8}px) scaleY(${1 - press * 0.16})`,
      transformOrigin: '50% 100%',
      borderRadius: 12,
      background: 'linear-gradient(180deg, #3A3B42 0%, #26272C 100%)',
      border: '1px solid rgba(255,255,255,0.18)',
      boxShadow: `0 ${10 - press * 6}px 0 #15161A, 0 0 ${20 + glow * 40}px rgba(255,214,150,${0.2 + glow * 0.4})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 45,
    }}
  >
    <span style={{fontFamily: FONT.mono, fontSize: 26, color: '#E9E3D6'}}>⏎</span>
  </div>
);

export const ExitDialog: React.FC<{
  opacity: number;
  scale: number;
  pressExit: number;
  pressCancel: number;
}> = ({opacity, scale, pressExit, pressCancel}) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 940,
        top: 496,
        width: 680,
        height: 330,
        borderRadius: 14,
        background: 'linear-gradient(180deg, rgba(58,58,64,0.96), rgba(40,40,45,0.97))',
        boxShadow: '0 50px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.12)',
        opacity,
        transform: `scale(${0.9 + scale * 0.1})`,
        transformOrigin: '50% 40%',
        zIndex: 88,
        padding: 30,
        display: 'flex',
        gap: 22,
      }}
    >
      <div
        style={{
          width: 62,
          height: 62,
          borderRadius: 14,
          background: 'linear-gradient(160deg,#FF7A8E,#E9123F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="34" height="34" viewBox="0 0 100 100" fill="#fff">
          <ellipse cx="34" cy="72" rx="10.5" ry="8.6" transform="rotate(-18 34 72)" />
          <ellipse cx="70" cy="63" rx="10.5" ry="8.6" transform="rotate(-18 70 63)" />
          <rect x="41.6" y="27" width="5.2" height="42" rx="2.6" />
          <rect x="77.6" y="18" width="5.2" height="42" rx="2.6" />
          <path d="M41.6 27 82.8 18v10.4L41.6 37.4z" />
        </svg>
      </div>
      <div style={{flex: 1}}>
        <div style={{fontFamily: FONT.ui, fontSize: 25, color: '#F2EEE6', fontWeight: 600}}>
          要退出“音乐”吗？
        </div>
        <div
          style={{
            fontFamily: FONT.ui,
            fontSize: 15,
            color: 'rgba(238,234,226,0.6)',
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          正在播放的歌曲将立即停止，
          <br />
          “我们的歌单”会继续保持同步。
        </div>
      </div>
      {/* buttons */}
      <div
        style={{
          position: 'absolute',
          right: 30,
          bottom: 28,
          display: 'flex',
          gap: 12,
        }}
      >
        {[
          {label: '取消', x: 0, press: pressCancel, primary: false},
          {label: '退出', x: 0, press: pressExit, primary: true},
        ].map((b) => (
          <div
            key={b.label}
            style={{
              width: 170,
              height: 56,
              borderRadius: 10,
              background: b.primary
                ? 'linear-gradient(180deg,#4C9DFF,#0A6DE0)'
                : 'rgba(255,255,255,0.12)',
              border: b.primary
                ? '1px solid rgba(255,255,255,0.24)'
                : '1px solid rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.ui,
              fontSize: 20,
              color: '#FFFFFF',
              transform: `translateY(${b.press * 3}px) scale(${1 - b.press * 0.03})`,
              boxShadow: b.primary ? '0 6px 18px rgba(10,109,224,0.45)' : undefined,
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ThreadLine: React.FC<{
  from: {x: number; y: number};
  to: {x: number; y: number};
  progress: number;
  opacity: number;
}> = ({from, to, progress, opacity}) => {
  if (opacity <= 0.001) return null;
  return (
    <svg
      width="100%"
      height="100%"
      style={{position: 'absolute', inset: 0, zIndex: 87, pointerEvents: 'none'}}
    >
      <path
        d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - 90} ${lerp(
          from.x,
          to.x,
          progress,
        )} ${lerp(from.y, to.y, progress)}`}
        fill="none"
        stroke="rgba(255,180,205,0.55)"
        strokeWidth="1.6"
        strokeDasharray="6 5"
        style={{filter: 'drop-shadow(0 0 6px rgba(255,150,190,0.7))'}}
        opacity={opacity}
      />
    </svg>
  );
};

export const StreamLayer: React.FC<{
  chars: {x: number; y: number; ch: string; size: number; opacity: number; rot: number; blur: number}[];
  opacity: number;
}> = ({chars, opacity}) => (
  <div style={{position: 'absolute', inset: 0, zIndex: 62, pointerEvents: 'none', opacity}}>
    {chars.map((c, i) => (
      <KineticGlyph
        key={i}
        ch={c.ch}
        x={c.x}
        y={c.y}
        size={c.size}
        opacity={c.opacity}
        rot={c.rot}
        blur={c.blur}
        glow={0.5}
        z={62}
      />
    ))}
  </div>
);

export const RainSplash: React.FC<{opacity: number}> = ({opacity}) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 700,
        top: 700,
        width: 900,
        height: 260,
        background:
          'radial-gradient(closest-side, rgba(150,200,255,0.16), rgba(150,200,255,0) 70%)',
        opacity,
        filter: 'blur(8px)',
        zIndex: 61,
      }}
    />
  );
};


export const SkyLayer: React.FC<{opacity: number; frame: number}> = ({opacity, frame}) => {
  if (opacity <= 0.001) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 55, pointerEvents: 'none', opacity}}>
      <div
        style={{
          position: 'absolute',
          left: '-12%',
          top: '-30%',
          width: '130%',
          height: '90%',
          background:
            'linear-gradient(104deg, rgba(60,90,180,0) 22%, rgba(96,120,220,0.13) 44%, rgba(180,150,230,0.16) 54%, rgba(60,90,180,0) 74%)',
          filter: 'blur(30px)',
          transform: `rotate(-12deg) translateY(${Math.sin(frame / 90) * 8}px)`,
        }}
      />
      {Array.from({length: 90}, (_, i) => {
        const x = rand(i * 4.3 + 2) * 1920;
        const y = rand(i * 9.1 + 7) * 760;
        const r = 0.8 + rand(i * 2.7) * 2.1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              background: i % 9 === 0 ? '#FFE9C0' : '#DCE8FF',
              opacity: 0.25 + 0.55 * Math.abs(Math.sin(frame / 26 + i)),
              boxShadow: r > 2 ? '0 0 8px rgba(220,235,255,0.8)' : undefined,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(85% 70% at 50% 30%, rgba(40,55,120,0.25), rgba(6,8,20,0) 70%)',
        }}
      />
    </div>
  );
};


/** Whip-ride speed streaks. */
export const SpeedLines: React.FC<{opacity: number; frame: number}> = ({opacity, frame}) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 68,
        opacity,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {Array.from({length: 46}, (_, i) => {
        const y0 = rand(i * 5.7 + 3) * 1180;
        const len = 90 + rand(i * 3.1) * 320;
        const x = ((rand(i * 7.3 + 1) * 2400 - frame * 26 * (0.7 + rand(i))) % 2400) - 200;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y0,
              width: len,
              height: 1.4 + rand(i * 2.2) * 1.6,
              background:
                'linear-gradient(90deg, rgba(255,245,220,0), rgba(255,245,220,0.75))',
              transform: 'rotate(-22deg)',
              transformOrigin: '0 50%',
              opacity: 0.25 + rand(i * 9.1) * 0.55,
              filter: 'blur(0.4px)',
            }}
          />
        );
      })}
    </div>
  );
};
