import React from 'react';
import {COLORS, FONT} from '../utils/theme';
import {rand} from '../utils/motion';

export type ArtVariant = 0 | 1 | 2 | 3;

const STARS = Array.from({length: 34}, (_, i) => ({
  x: rand(i * 2.7 + 5) * 300,
  y: rand(i * 5.1 + 3) * 300,
  r: 0.7 + rand(i * 1.3) * 1.5,
  o: 0.25 + rand(i * 3.3) * 0.6,
}));

export const AlbumArt: React.FC<{
  size: number;
  variant?: ArtVariant;
  radius?: number;
  style?: React.CSSProperties;
}> = ({size, variant = 0, radius = 12, style}) => {
  const id = `art${variant}`;
  const palettes = [
    ['#0B1530', '#1B2A5B', '#2C2A55'],
    ['#1E5FA8', '#57A8DC', '#BFE4F7'],
    ['#B9752B', '#E0A94F', '#F6D89B'],
    ['#4A1F4E', '#C2557A', '#F2A46B'],
  ][variant];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 18px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)',
        background: `linear-gradient(165deg, ${palettes[0]} 0%, ${palettes[1]} 55%, ${palettes[2]} 100%)`,
        flexShrink: 0,
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 300 300" style={{display: 'block'}}>
        <defs>
          <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={palettes[0]} />
            <stop offset="0.55" stopColor={palettes[1]} />
            <stop offset="1" stopColor={palettes[2]} />
          </linearGradient>
          <linearGradient id={`${id}moon`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#FFF7DC" />
            <stop offset="1" stopColor="#E8CE93" />
          </linearGradient>
          <radialGradient id={`${id}haze`} cx="0.5" cy="0.5">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="300" height="300" fill={`url(#${id}sky)`} />

        {variant === 0 ? (
          <>
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#EAF1FF" opacity={s.o} />
            ))}
            <circle cx="186" cy="104" r="86" fill={`url(#${id}haze)`} />
            <circle cx="186" cy="104" r="58" fill={`url(#${id}moon)`} />
            <circle cx="160" cy="86" r="54" fill={palettes[0]} opacity="0.96" />
            <g stroke="#DCE6FF" fill="none" opacity="0.35">
              {[26, 40, 54, 68].map((r) => (
                <path
                  key={r}
                  d={`M 44 214 m -${r} 0 a ${r} ${r} 0 0 1 ${r * 2} 0`}
                  strokeDasharray="3 7"
                />
              ))}
            </g>
            <g transform="translate(46 62)">
              <text
                fontSize="38"
                fill={COLORS.cream}
                fontFamily={FONT.lyric}
                letterSpacing="6"
                textAnchor="middle"
              >
                <tspan x="0" y="0">
                  幻
                </tspan>
                <tspan x="0" y="46">
                  听
                </tspan>
              </text>
              <rect x="-14" y="-34" width="1.4" height="84" fill="rgba(247,239,225,0.35)" />
            </g>
            <text x="46" y="196" fontSize="13" fill="rgba(247,239,225,0.55)" fontFamily={FONT.ui}>
              许嵩 · 梦游计
            </text>
          </>
        ) : null}

        {variant === 1 ? (
          <>
            <circle cx="222" cy="78" r="34" fill="#FFF3C9" opacity="0.95" />
            <circle cx="222" cy="78" r="60" fill="#FFF3C9" opacity="0.22" />
            <g fill="#FFFFFF" opacity="0.9">
              <ellipse cx="96" cy="176" rx="58" ry="24" />
              <ellipse cx="132" cy="166" rx="40" ry="22" />
              <ellipse cx="70" cy="164" rx="30" ry="18" />
            </g>
            <g fill="#FFFFFF" opacity="0.65">
              <ellipse cx="206" cy="206" rx="44" ry="17" />
              <ellipse cx="238" cy="199" rx="28" ry="14" />
            </g>
            <text x="30" y="266" fontSize="26" fill="#123C63" fontFamily={FONT.lyric} letterSpacing="4">
              晴天
            </text>
          </>
        ) : null}

        {variant === 2 ? (
          <>
            <circle cx="150" cy="196" r="70" fill="#FFE9AE" opacity="0.55" />
            <circle cx="150" cy="188" r="44" fill="#FFF4CE" />
            <g stroke="#8C5A1E" strokeWidth="2.2" opacity="0.55">
              {Array.from({length: 18}, (_, i) => (
                <path key={i} d={`M ${-10 + i * 18} 300 q 4 -34 -2 -62`} fill="none" />
              ))}
            </g>
            <text x="30" y="60" fontSize="26" fill="#4A2A0C" fontFamily={FONT.lyric} letterSpacing="4">
              稻香
            </text>
          </>
        ) : null}

        {variant === 3 ? (
          <>
            <rect y="188" width="300" height="112" fill="#2A1230" opacity="0.72" />
            <circle cx="150" cy="188" r="52" fill="#FFC98A" />
            <circle cx="150" cy="188" r="82" fill="#FFC98A" opacity="0.22" />
            <g stroke="#FFD9B0" opacity="0.35" strokeWidth="1.2">
              <path d="M0 214h300" />
              <path d="M0 232h300" />
              <path d="M0 252h300" />
            </g>
            <text x="30" y="284" fontSize="26" fill="#FFE7D9" fontFamily={FONT.lyric} letterSpacing="4">
              后来
            </text>
          </>
        ) : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 100% at 30% 10%, rgba(255,255,255,0.10), rgba(0,0,0,0) 55%), radial-gradient(100% 80% at 50% 110%, rgba(0,0,0,0.45), rgba(0,0,0,0) 60%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
