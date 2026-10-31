import React from 'react';
import {COLORS, FONT} from '../utils/theme';

export const TrafficLights: React.FC<{size?: number}> = ({size = 13}) => (
  <div style={{display: 'flex', gap: 8}}>
    {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
      <div
        key={c}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: c,
          boxShadow: `inset 0 0 0 0.5px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.18)`,
        }}
      />
    ))}
  </div>
);

export interface WindowFrameProps {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  blur?: number;
  title: string;
  titleIcon?: React.ReactNode;
  titleRight?: React.ReactNode;
  background?: string;
  children: React.ReactNode;
  zIndex?: number;
  glow?: string;
  inert?: boolean;
  style?: React.CSSProperties;
}

/** A macOS window: vibrancy titlebar, rounded corners, layered shadow. */
export const WindowFrame: React.FC<WindowFrameProps> = ({
  x,
  y,
  w,
  h,
  opacity = 1,
  blur = 0,
  title,
  titleIcon,
  titleRight,
  background = '#141518',
  children,
  zIndex = 40,
  glow,
  style,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        opacity,
        zIndex,
        filter: blur ? `blur(${blur}px)` : undefined,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: glow
          ? `0 40px 90px rgba(0,0,0,0.62), 0 4px 14px rgba(0,0,0,0.4), 0 0 60px ${glow}`
          : '0 40px 90px rgba(0,0,0,0.60), 0 4px 14px rgba(0,0,0,0.38)',
        ...style,
      }}
    >
      <div
        style={{
          height: 46,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          background: 'linear-gradient(180deg, #313238 0%, #26272B 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.55)',
          position: 'relative',
        }}
      >
        <TrafficLights />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: FONT.ui,
            fontSize: 17,
            color: '#A9A49B',
            letterSpacing: 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          {titleIcon}
          <span>{title}</span>
        </div>
        <div style={{flex: 1}} />
        {titleRight}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 46,
          bottom: 0,
          background,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Small spinning Claude asterisk used in status lines. */
export const SparkSpin: React.FC<{frame: number; size?: number; color?: string}> = ({
  frame,
  size = 18,
  color = COLORS.clawd,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{transform: `rotate(${(frame * 9) % 360}deg)`, flexShrink: 0}}
  >
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <line
        key={a}
        x1={12 + Math.cos((a * Math.PI) / 180) * 3}
        y1={12 + Math.sin((a * Math.PI) / 180) * 3}
        x2={12 + Math.cos((a * Math.PI) / 180) * 9.5}
        y2={12 + Math.sin((a * Math.PI) / 180) * 9.5}
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    ))}
  </svg>
);
