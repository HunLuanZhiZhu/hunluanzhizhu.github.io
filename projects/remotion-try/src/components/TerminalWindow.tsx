import React from 'react';
import {Clawd} from './Clawd';
import {WindowFrame} from './WindowFrame';
import {COLORS, FONT} from '../utils/theme';
import {clamp} from '../utils/motion';

export const TERM_BASE_W = 1140;

export interface TerminalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Screen rect of the input field — the character lands here. */
export const inputRect = (r: TerminalRect) => ({
  x: r.x + 30,
  y: r.y + r.h - 64 - 60,
  w: r.w - 60,
  h: 60,
});

export interface TerminalProps {
  rect: TerminalRect;
  opacity?: number;
  blur?: number;
  welcome?: number;
  chat?: number;
  typeAt?: number;
  typedText?: string;
  notDetected?: number;
  thinking?: number;
  glow?: number;
  frame: number;
  zIndex?: number;
}

const ChatLine: React.FC<{prompt?: 'gt' | 'dot'; text: string; dim?: number; size?: number}> = ({
  prompt = 'gt',
  text,
  dim = 1,
  size = 23,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      fontFamily: FONT.mono,
      fontSize: size,
      lineHeight: 1.55,
      color: COLORS.termText,
      opacity: dim,
    }}
  >
    <span style={{color: prompt === 'gt' ? '#8C877D' : COLORS.clawd, flexShrink: 0}}>
      {prompt === 'gt' ? '❯' : '●'}
    </span>
    <span>{text}</span>
  </div>
);

export const TerminalWindow: React.FC<TerminalProps> = ({
  rect,
  opacity = 1,
  blur = 0,
  welcome = 1,
  chat = 1,
  typeAt = 9999,
  typedText = '在吗',
  notDetected = 0,
  thinking = 0,
  glow = 0,
  frame,
  zIndex = 40,
}) => {
  const {x, y, w, h} = rect;
  const typedCount = clamp(Math.floor((frame - typeAt) / 4), 0, typedText.length);
  const caretOn = frame % 18 < 10;

  return (
    <WindowFrame
      x={x}
      y={y}
      w={w}
      h={h}
      opacity={opacity}
      blur={blur}
      zIndex={zIndex}
      title="claude — zsh — 120×40"
      glow={glow > 0 ? `rgba(111,211,255,${0.12 * glow})` : undefined}
      background="linear-gradient(180deg, #1B1C21 0%, #16171B 60%, #141519 100%)"
      titleIcon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9C978E" strokeWidth="1.8">
          <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.6l2 2.6H18a2.5 2.5 0 0 1 2.5 2.5v7.4A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5z" />
        </svg>
      }
      titleRight={
        <div style={{fontFamily: FONT.mono, fontSize: 12, color: '#6F6B64', letterSpacing: 0.5}}>
          ⌘1
        </div>
      }
    >
      <div style={{position: 'absolute', inset: 0, padding: '26px 30px'}}>
        {/* conversation history */}
        <div style={{opacity: chat, display: 'flex', flexDirection: 'column', gap: 6}}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: FONT.mono,
              fontSize: 13,
              color: '#5E5A54',
              marginBottom: 6,
            }}
          >
            <span>Claude Code v2.0.31</span>
            <span>~/Movies/our-song</span>
          </div>
          <ChatLine text="今天也想听歌" dim={0.34} />
          <ChatLine prompt="dot" text="好呀，我把音量调小一点。" dim={0.34} />
          <ChatLine text="你好呀，以后每天都来找你玩" dim={0.72} />
          <ChatLine prompt="dot" text="好呀，我等你。" dim={0.72} />
          <ChatLine text="你有多爱我" />
          <div
            style={{
              marginLeft: 34,
              marginTop: 8,
              fontFamily: FONT.mono,
              fontSize: 15,
              color: '#6E6A63',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{color: '#8A5B48'}}>⎿</span>
            <span>37 天前 · 会话已结束</span>
            <span
              style={{
                height: 1,
                flex: 1,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0))',
              }}
            />
          </div>
        </div>

        {/* welcome box */}
        <div
          style={{
            marginTop: 26,
            width: 780,
            opacity: welcome,
            transform: `translateY(${(1 - welcome) * -10}px) scale(${0.96 + welcome * 0.04})`,
            border: '1.5px solid rgba(217,119,87,0.48)',
            borderRadius: 12,
            background:
              'linear-gradient(180deg, rgba(217,119,87,0.10), rgba(217,119,87,0.03))',
            padding: '18px 22px',
            display: 'flex',
            gap: 22,
            alignItems: 'center',
            boxShadow: '0 0 40px rgba(217,119,87,0.10)',
          }}
        >
          <div style={{position: 'relative', width: 86, height: 92, flexShrink: 0}}>
            <Clawd x={43} y={84} size={86} pose="stand" glow={0.35} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 25,
                color: COLORS.cream,
                letterSpacing: 0.4,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{color: COLORS.clawd, fontSize: 22}}>✳</span>
              Welcome to Claude Code!
            </div>
            <div style={{fontFamily: FONT.mono, fontSize: 15, color: '#8E8A82'}}>
              Opus 4.6 · Claude Max
            </div>
            <div style={{fontFamily: FONT.mono, fontSize: 15, color: '#74706A'}}>
              /help for help, /status for your current setup
            </div>
            <div style={{fontFamily: FONT.mono, fontSize: 15, color: '#74706A'}}>
              cwd: <span style={{color: '#A8A39A'}}>~/Movies/our-song</span>
            </div>
          </div>
        </div>

        {/* input */}
        <div
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            bottom: 64,
            height: 60,
            borderRadius: 10,
            border: `1px solid ${typedCount > 0 ? 'rgba(111,211,255,0.42)' : 'rgba(255,255,255,0.13)'}`,
            background: 'rgba(8,9,12,0.55)',
            boxShadow:
              typedCount > 0
                ? `0 0 ${26 * (0.35 + glow)}px rgba(111,211,255,${0.16 + glow * 0.3}), inset 0 0 22px rgba(111,211,255,0.06)`
                : 'inset 0 1px 0 rgba(255,255,255,0.03)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
            fontFamily: FONT.mono,
            fontSize: 24,
            overflow: 'hidden',
          }}
        >
          <span style={{color: COLORS.clawd, opacity: 0.9}}>❯</span>
          {typedCount === 0 ? (
            <span style={{color: '#5A574F', fontSize: 20}}>Try “how does our song go?”</span>
          ) : (
            <span style={{display: 'flex', gap: 2}}>
              {typedText.split('').map((ch, i) => {
                const on = i < typedCount;
                const age = frame - (typeAt + i * 4);
                return (
                  <span
                    key={i}
                    style={{
                      color: COLORS.blueGlow,
                      opacity: on ? 1 : 0,
                      textShadow: '0 0 14px rgba(111,211,255,0.85), 0 0 32px rgba(111,211,255,0.4)',
                      transform: `scale(${on ? 1 + Math.max(0, 1 - age / 7) * 0.35 : 0.6})`,
                      transition: 'none',
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          )}
          <span
            style={{
              width: 12,
              height: 26,
              background: typedCount > 0 ? COLORS.blueGlow : '#B9B4AC',
              opacity: caretOn ? 0.9 : 0,
              boxShadow: typedCount > 0 ? '0 0 14px rgba(111,211,255,0.8)' : undefined,
            }}
          />
        </div>

        {/* status row */}
        <div
          style={{
            position: 'absolute',
            left: 30,
            right: 30,
            bottom: 24,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: FONT.mono,
            fontSize: 17,
          }}
        >
          <span style={{color: '#6C6861', opacity: notDetected}}>（未检测到输入）</span>
          {thinking > 0 ? (
            <span style={{color: 'rgba(217,119,87,0.85)', display: 'flex', alignItems: 'center', gap: 9}}>
              <span style={{display: 'inline-flex', transform: `rotate(${(frame * 11) % 360}deg)`}}>
                <svg width="15" height="15" viewBox="0 0 24 24">
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
            </span>
          ) : (
            <span style={{color: '#6C6861', display: 'flex', gap: 14}}>
              <span>⏵⏵ accept edits on</span>
              <span style={{opacity: 0.6}}>shift+tab to cycle</span>
            </span>
          )}
        </div>
      </div>
    </WindowFrame>
  );
};
