import React from 'react';
import {AlbumArt, ArtVariant} from './AlbumArt';
import {WindowFrame} from './WindowFrame';
import {COLORS, FONT} from '../utils/theme';
import {clamp, rand} from '../utils/motion';

export type MusicMode = 'player' | 'lyrics' | 'playlist';

export interface MusicProps {
  rect: {x: number; y: number; w: number; h: number};
  mode: MusicMode;
  opacity?: number;
  blur?: number;
  people?: number;
  avatarGrey?: number;
  avatarFall?: number;
  loopCount?: number;
  progress?: number;
  coverIndex?: number;
  coverFlip?: number;
  rain?: number;
  lyricIndex?: number;
  lyricLines?: string[];
  wave?: number;
  loveGlow?: number;
  loveGrey?: number;
  spotlight?: number;
  spotX?: number;
  frame: number;
  zIndex?: number;
  activeRow?: number;
  glow?: number;
  thinking?: number;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const AvatarClawd: React.FC<{size: number; grey: number; fall: number}> = ({
  size,
  grey,
  fall,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(160deg,#E48C6C,#B85F41)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      filter: `grayscale(${clamp(grey)}) brightness(${1 - grey * 0.35})`,
      transform: `translateY(${fall * 26}px) rotate(${fall * 55}deg) scale(${1 - fall * 0.5})`,
      opacity: 1 - fall,
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 12 12">
      <rect x="1.5" y="1.6" width="9" height="7.6" rx="1.1" fill="#22140D" opacity="0.86" />
      <rect x="3.5" y="4.2" width="1.3" height="2.6" rx="0.5" fill="#E48C6C" />
      <rect x="7.2" y="4.2" width="1.3" height="2.6" rx="0.5" fill="#E48C6C" />
    </svg>
  </div>
);

const AvatarYou: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(160deg,#9FB6DA,#6B82A8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="#26354D">
      <circle cx="12" cy="9" r="4.2" />
      <path d="M4.5 21c0-4.4 3.3-7 7.5-7s7.5 2.6 7.5 7z" />
    </svg>
  </div>
);

const PeopleRow: React.FC<{
  people: number;
  avatarGrey: number;
  avatarFall: number;
  size?: number;
}> = ({people, avatarGrey, avatarFall, size = 26}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
    <div style={{display: 'flex', gap: 0}}>
      <AvatarClawd size={size} grey={0} fall={0} />
      <div
        style={{
          marginLeft: -5,
          filter: `grayscale(${clamp(avatarGrey)}) brightness(${1 - avatarGrey * 0.3})`,
          transform: `translateY(${avatarFall * 30}px) rotate(${avatarFall * 60}deg)`,
          opacity: 1 - avatarFall,
        }}
      >
        <AvatarYou size={size} />
      </div>
    </div>
    <span style={{fontSize: 17, color: 'rgba(240,236,228,0.7)'}}>{people} 人在听</span>
  </div>
);

const ROWS = [
  {t: '幻听', a: '许嵩', n: '你最常循环', d: '3:04'},
  {t: '晴天', a: '周杰伦', n: '你分享的', d: '4:29'},
  {t: '稻香', a: '周杰伦', n: '你分享的', d: '3:43'},
  {t: '夜曲', a: '周杰伦', n: '你分享的', d: '3:47'},
  {t: '后来', a: '刘若英', n: '你分享的', d: '5:41'},
];

const RAIN = Array.from({length: 70}, (_, i) => ({
  x: rand(i * 3.7 + 11),
  y: rand(i * 6.1 + 2),
  l: 12 + rand(i * 2.3) * 26,
  s: 0.6 + rand(i * 4.9) * 1.1,
  o: 0.12 + rand(i * 1.7) * 0.35,
}));

export const MusicWindow: React.FC<MusicProps> = ({
  rect,
  mode,
  opacity = 1,
  blur = 0,
  people = 2,
  avatarGrey = 0,
  avatarFall = 0,
  loopCount = 799,
  progress = 0.39,
  coverIndex = 0,
  coverFlip = 0,
  rain = 0,
  lyricIndex = 1,
  lyricLines = ['你有多爱我', '如今一个人听歌总是会觉得难过', '爱已不在这里我却还没走脱', '列表里的歌', '随过往流动'],
  wave = 0,
  loveGlow = 0,
  loveGrey = 0,
  spotlight = 0,
  spotX = 0.42,
  frame,
  zIndex = 45,
  activeRow = 2,
  glow = 0,
  thinking = 0,
}) => {
  const {w, h} = rect;
  const artSize = mode === 'player' ? Math.min(300, w * 0.37) : 300;

  return (
    <WindowFrame
      x={rect.x}
      y={rect.y}
      w={w}
      h={h}
      opacity={opacity}
      blur={blur}
      zIndex={zIndex}
      title="音乐"
      glow={glow > 0 ? `rgba(255,155,182,${0.10 * glow})` : undefined}
      background="linear-gradient(165deg,#241F36 0%,#1B1830 45%,#151327 100%)"
      titleRight={
        <div style={{fontFamily: FONT.ui, fontSize: 12, color: '#8A8496'}}>
          {mode === 'lyrics' ? '歌词' : mode === 'playlist' ? '我们的歌单' : '正在播放'}
        </div>
      }
    >
      {mode !== 'player' && thinking > 0 ? (
        <div
          style={{
            position: 'absolute',
            right: 34,
            bottom: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '7px 14px',
            borderRadius: 999,
            background: 'rgba(10,10,16,0.55)',
            border: '1px solid rgba(217,119,87,0.28)',
            fontFamily: FONT.mono,
            fontSize: 15,
            color: 'rgba(232,196,170,0.9)',
            boxShadow: '0 0 26px rgba(217,119,87,0.14)',
            zIndex: 5,
          }}
        >
          <span style={{display: 'inline-flex', transform: `rotate(${(frame * 11) % 360}deg)`}}>
            <svg width="14" height="14" viewBox="0 0 24 24">
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <line
                  key={a}
                  x1={12 + Math.cos((a * Math.PI) / 180) * 3}
                  y1={12 + Math.sin((a * Math.PI) / 180) * 3}
                  x2={12 + Math.cos((a * Math.PI) / 180) * 9}
                  y2={12 + Math.sin((a * Math.PI) / 180) * 9}
                  stroke={COLORS.clawd}
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </span>
          正在思考… ({Math.floor(thinking)}s · esc to interrupt)
        </div>
      ) : null}

      {mode === 'player' ? (
        <div style={{position: 'absolute', inset: 0, padding: 26, display: 'flex', gap: 26}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <AlbumArt size={artSize} variant={coverIndex as ArtVariant} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: FONT.ui,
                fontSize: 15,
                color: 'rgba(236,230,245,0.55)',
              }}
            >
              <span style={{color: COLORS.clawd, fontSize: 13}}>⟳</span>
              <span>单曲循环 · 第 {Math.round(loopCount)} 遍</span>
            </div>
          </div>

          <div style={{flex: 1, minWidth: 0, paddingTop: 4, display: 'flex', flexDirection: 'column'}}>
            <div
              style={{
                fontFamily: FONT.ui,
                fontSize: 46,
                fontWeight: 700,
                color: '#F4EFE6',
                letterSpacing: 1,
                lineHeight: 1.1,
              }}
            >
              幻听
            </div>
            <div style={{fontFamily: FONT.ui, fontSize: 18, color: 'rgba(230,224,238,0.55)', marginTop: 5}}>
              许嵩 — 梦游计
            </div>

            <div style={{marginTop: 14}}>
              <PeopleRow people={people} avatarGrey={avatarGrey} avatarFall={avatarFall} size={30} />
            </div>

            <div style={{marginTop: 18}}>
              <div style={{height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.16)', position: 'relative'}}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${clamp(progress) * 100}%`,
                    background: 'linear-gradient(90deg,#E9E2D6,#FFFFFF)',
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(${clamp(progress) * 100}% - 6px)`,
                    top: -4,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: '#fff',
                    boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: FONT.mono,
                  fontSize: 13,
                  color: 'rgba(230,224,238,0.5)',
                  marginTop: 6,
                }}
              >
                <span>{fmt(184 * progress)}</span>
                <span>-{fmt(184 * (1 - progress))}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 32,
                marginTop: 6,
                color: '#EDE7F2',
              }}
            >
              <span style={{fontSize: 24, opacity: 0.85}}>⏮</span>
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                ❙❙
              </span>
              <span style={{fontSize: 24, opacity: 0.85}}>⏭</span>
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <div style={{fontFamily: FONT.ui, fontSize: 16, color: 'rgba(240,235,246,0.78)'}}>
                我们的歌单 · {ROWS.length} 首
              </div>
              <div style={{marginTop: 4, display: 'flex', flexDirection: 'column'}}>
                {ROWS.slice(0, 3).map((r, i) => (
                  <div
                    key={r.t}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontFamily: FONT.ui,
                      fontSize: 14,
                      color: i === 0 ? 'rgba(240,235,246,0.92)' : 'rgba(240,235,246,0.42)',
                      padding: '5px 0',
                    }}
                  >
                    <span style={{width: 12, opacity: 0.5, fontSize: 10}}>{i === 0 ? '▶' : ''}</span>
                    <span style={{width: 40}}>{r.t}</span>
                    <span style={{opacity: 0.7}}>{r.a}</span>
                    <span style={{marginLeft: 'auto', opacity: 0.5, fontSize: 13}}>{r.n}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: FONT.lyric,
                fontSize: 21,
                color: 'rgba(247,239,225,0.72)',
                letterSpacing: 1.5,
                textShadow: '0 0 18px rgba(255,226,180,0.25)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{fontSize: 12, fontFamily: FONT.ui, opacity: 0.5, letterSpacing: 2}}>歌词</span>
              {lyricLines[lyricIndex].split('').slice(0, 13).map((c, i) => (
                <span
                  key={i}
                  style={{
                    opacity: 0.25 + (i / 13) * 0.75,
                    transform: `translateY(${Math.sin(frame * 0.1 + i * 0.7) * 2}px)`,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'lyrics' ? (
        <div style={{position: 'absolute', inset: 0, padding: '52px 64px', display: 'flex', gap: 54}}>
          {/* left column */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 22, width: 340, flexShrink: 0}}>
            <div
              style={{
                transform: `perspective(1200px) rotateY(${coverFlip * 180}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <AlbumArt size={artSize} variant={0 as ArtVariant} />
            </div>
            <div>
              <div style={{fontFamily: FONT.ui, fontSize: 40, fontWeight: 700, color: '#F4EFE6'}}>
                幻听
              </div>
              <div style={{fontFamily: FONT.ui, fontSize: 19, color: 'rgba(230,224,238,0.55)', marginTop: 4}}>
                许嵩 — 梦游计
              </div>
            </div>
            <PeopleRow people={people} avatarGrey={avatarGrey} avatarFall={avatarFall} size={30} />
            <div
              style={{
                marginTop: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                color: 'rgba(240,235,246,0.8)',
                fontFamily: FONT.ui,
                fontSize: 22,
              }}
            >
              <span>⏮</span>
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: 'rgba(255,255,255,0.09)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                ❙❙
              </span>
              <span>⏭</span>
            </div>
          </div>

          {/* lyrics */}
          <div style={{flex: 1, position: 'relative'}}>
            {spotlight > 0 ? (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: `${spotX * 100}%`,
                    top: -52,
                    width: 620,
                    height: 900,
                    marginLeft: -310,
                    background:
                      'radial-gradient(42% 50% at 50% 10%, rgba(255,241,208,0.34), rgba(255,241,208,0.07) 52%, rgba(255,241,208,0) 76%)',
                    opacity: spotlight,
                    filter: 'blur(10px)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${spotX * 100}%`,
                    top: -60,
                    width: 620,
                    height: 980,
                    marginLeft: -310,
                    background:
                      'linear-gradient(180deg, rgba(255,244,214,0.20) 0%, rgba(255,244,214,0.09) 34%, rgba(255,244,214,0.03) 68%, rgba(255,244,214,0) 100%)',
                    clipPath: 'polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%)',
                    opacity: spotlight * 0.85,
                    filter: 'blur(30px)',
                    maskImage:
                      'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, black 26%, black 78%, transparent 100%)',
                    WebkitMaskImage:
                      'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, black 26%, black 78%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${spotX * 100}%`,
                    top: 660,
                    width: 700,
                    height: 250,
                    marginLeft: -350,
                    background:
                      'radial-gradient(closest-side, rgba(255,232,190,0.22), rgba(255,232,190,0) 70%)',
                    opacity: spotlight,
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                  }}
                />
              </>
            ) : null}

            {[
              {li: lyricIndex - 1, top: 104, size: 42, op: 0.22},
              {li: lyricIndex, top: 196, size: 78, op: 1},
              {li: lyricIndex + 1, top: 352, size: 42, op: 0.28},
              {li: lyricIndex + 2, top: 452, size: 34, op: 0.12},
            ]
              .filter((x) => x.li >= 0 && x.li < lyricLines.length)
              .map(({li, top, size, op}) => {
                const line = lyricLines[li];
                const active = li === lyricIndex;
                return (
                  <div
                    key={`${li}-${line}`}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top,
                      display: 'flex',
                      justifyContent: 'center',
                      flexWrap: 'nowrap',
                      fontFamily: FONT.lyric,
                      fontSize: size,
                      lineHeight: 1.3,
                      letterSpacing: active ? 3 : 2,
                      opacity: op,
                      filter: active ? 'none' : 'blur(0.7px)',
                      color: COLORS.cream,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {line.split('').map((ch, ci) => {
                      const isLove = active && lyricIndex === 2 && ci === 0;
                      const wobble = Math.sin(frame * 0.13 + ci * 0.85) * wave * (active ? 11 : 4);
                      const drip = rain > 0 ? Math.max(0, Math.sin(frame * 0.22 + ci * 1.7)) : 0;
                      return (
                        <span
                          key={ci}
                          style={{
                            display: 'inline-block',
                            transform: `translateY(${wobble}px) rotate(${Math.sin(frame * 0.08 + ci) * wave * 1.2}deg)`,
                            color: isLove && loveGlow > 0 ? '#FF9BB6' : undefined,
                            textShadow:
                              isLove && loveGlow > 0
                                ? `0 0 ${34 * loveGlow}px rgba(255,155,182,${0.9 * loveGlow}), 0 0 ${90 * loveGlow}px rgba(255,120,160,${0.5 * loveGlow})`
                                : active
                                  ? '0 0 34px rgba(255,238,205,0.22)'
                                  : undefined,
                            filter:
                              isLove && loveGrey > 0
                                ? `grayscale(${loveGrey}) brightness(${1 - loveGrey * 0.25})`
                                : undefined,
                            position: 'relative',
                          }}
                        >
                          {ch}
                          {rain > 0 && drip > 0.9 ? (
                            <span
                              style={{
                                position: 'absolute',
                                left: '46%',
                                bottom: -6 - ((frame * 2.2 + ci * 13) % 40),
                                width: 4,
                                height: 12,
                                borderRadius: 2,
                                background:
                                  'linear-gradient(180deg, rgba(190,225,255,0.9), rgba(190,225,255,0))',
                                opacity: rain * 0.8,
                              }}
                            />
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                );
              })}

            {rain > 0 ? (
              <div style={{position: 'absolute', inset: -60, overflow: 'hidden', pointerEvents: 'none'}}>
                {RAIN.map((r, i) => {
                  const y = ((r.y * 960 + frame * 9 * r.s) % 960) - 30;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${r.x * 100}%`,
                        top: y,
                        width: 1.4,
                        height: r.l,
                        background:
                          'linear-gradient(180deg, rgba(200,228,255,0), rgba(200,228,255,0.55))',
                        opacity: r.o * rain,
                      }}
                    />
                  );
                })}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(20,30,60,0.0), rgba(14,22,48,0.4))',
                    opacity: rain,
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === 'playlist' ? (
        <div style={{position: 'absolute', inset: 0, padding: '52px 64px'}}>
          <div style={{display: 'flex', gap: 54}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 20, width: 340, flexShrink: 0}}>
              <div
                style={{
                  transform: `perspective(1200px) rotateY(${coverFlip * 180}deg)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                <AlbumArt size={320} variant={coverIndex as ArtVariant} />
              </div>
              <div>
                <div style={{fontFamily: FONT.ui, fontSize: 34, fontWeight: 700, color: '#F4EFE6'}}>
                  {ROWS[activeRow]?.t ?? '列表里的歌'}
                </div>
                <div style={{fontFamily: FONT.ui, fontSize: 18, color: 'rgba(230,224,238,0.55)', marginTop: 4}}>
                  {ROWS[activeRow]?.a ?? '许嵩'} — {ROWS[activeRow]?.n ?? ''}
                </div>
              </div>
              <div style={{marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 16, color: 'rgba(240,235,246,0.8)', fontSize: 22}}>
                <span>⏮</span>
                <span
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    background: 'rgba(255,255,255,0.09)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  ❙❙
                </span>
                <span>⏭</span>
              </div>
            </div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: FONT.ui, fontSize: 44, fontWeight: 700, color: '#F4EFE6'}}>
                列表里的歌
              </div>
              <div
                style={{
                  fontFamily: FONT.ui,
                  fontSize: 18,
                  color: 'rgba(230,224,238,0.5)',
                  marginTop: 6,
                }}
              >
                我们的歌单 · {people} 人在听 · 5 首 · 18 分钟
              </div>
            </div>
          </div>

          {ROWS.map((r, i) => {
            const on = i === activeRow;
            return (
              <div
                key={r.t}
                style={{
                  position: 'absolute',
                  left: 492,
                  right: 64,
                  top: 336 + i * 82,
                  height: 72,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '0 16px',
                  borderRadius: 10,
                  background: on ? 'rgba(140,170,255,0.16)' : 'rgba(255,255,255,0.02)',
                  border: on ? '1px solid rgba(150,180,255,0.24)' : '1px solid rgba(255,255,255,0.04)',
                  fontFamily: FONT.ui,
                  color: on ? '#F6F1E8' : 'rgba(240,235,246,0.55)',
                  fontSize: 24,
                  boxShadow: on ? '0 8px 30px rgba(80,110,200,0.18)' : undefined,
                }}
              >
                <div style={{width: 54, height: 54, borderRadius: 8, overflow: 'hidden', flexShrink: 0}}>
                  <AlbumArt size={54} variant={(i % 4) as ArtVariant} radius={8} />
                </div>
                <span style={{width: 26, opacity: 0.5, fontSize: 16}}>{on ? '▶' : i + 1}</span>
                <span style={{width: 150}}>{r.t}</span>
                <span style={{opacity: 0.7, width: 120}}>{r.a}</span>
                <span style={{marginLeft: 'auto', opacity: 0.5, fontSize: 18}}>{r.n}</span>
                <span style={{opacity: 0.5, fontSize: 18, width: 52, textAlign: 'right'}}>{r.d}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </WindowFrame>
  );
};
