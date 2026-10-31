import React from 'react';
import {COLORS} from '../utils/theme';

export type ClawdPose =
  | 'stand'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'sit'
  | 'lie'
  | 'ride'
  | 'pounce'
  | 'reach'
  | 'cry';

export interface ClawdProps {
  x: number;
  y: number;
  size?: number;
  pose?: ClawdPose;
  /** 0..1 walk / run cycle */
  phase?: number;
  /** 1 = facing right, -1 = facing left */
  face?: 1 | -1;
  /** 1 = untouched. >1 wider, <1 taller. */
  squash?: number;
  rot?: number;
  /** 0..360 front flip, rendered with perspective */
  flip?: number;
  headphones?: boolean;
  blink?: number;
  mouth?: 'none' | 'smile' | 'o' | 'flat';
  tear?: number;
  /** vertical offset of the tear drop in body units */
  tearDrop?: number;
  glow?: number;
  shadow?: number;
  opacity?: number;
  style?: React.CSSProperties;
}

const BODY_ROWS = [
  ' ####### ',
  '#########',
  '#########',
  '#########',
  '#########',
  '#########',
  '#########',
  '#########',
  ' ####### ',
];

const BX = 1.5;
const BY = 0.4;

const shading = (row: number, col: number, total: number) => {
  if (row === 0) return COLORS.clawdLight;
  if (row === total - 1) return COLORS.clawdDark;
  if (col === 8) return COLORS.clawdDark;
  if (col === 0) return '#E08A6A';
  return COLORS.clawd;
};

export const HeadphonesArt: React.FC<{
  size: number;
  worn?: boolean;
  glow?: number;
}> = ({size, worn = false, glow = 0}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    style={{
      overflow: 'visible',
      filter: glow
        ? `drop-shadow(0 0 ${4 + glow * 10}px rgba(217,119,87,${0.35 + glow * 0.45}))`
        : undefined,
    }}
  >
    <path
      d="M 2.0 3.35 C 2.0 -1.55, 10.0 -1.55, 10.0 3.35"
      fill="none"
      stroke="#191920"
      strokeWidth="1.05"
      strokeLinecap="round"
    />
    <path
      d="M 2.0 3.2 C 2.0 -1.25, 10.0 -1.25, 10.0 3.2"
      fill="none"
      stroke="#3A3A46"
      strokeWidth="0.42"
      strokeLinecap="round"
    />
    {[1.15, 9.35].map((cx, i) => (
      <g key={i}>
        <rect
          x={cx}
          y={2.9}
          width={1.5}
          height={2.85}
          rx={0.55}
          fill="#1D1D24"
          stroke="#43434F"
          strokeWidth="0.16"
        />
        <rect
          x={cx + 0.34}
          y={3.5}
          width={0.8}
          height={1.65}
          rx={0.4}
          fill={worn ? COLORS.clawd : '#2B2B34'}
          opacity={0.92}
        />
      </g>
    ))}
  </svg>
);

/**
 * Pixel Clawd: terracotta block body, two vertical-line eyes, stubby legs.
 * Drawn on a 12-unit grid so the silhouette stays identical at every size.
 */
export const Clawd: React.FC<ClawdProps> = ({
  x,
  y,
  size = 150,
  pose = 'stand',
  phase = 0,
  face = 1,
  squash = 1,
  rot = 0,
  flip = 0,
  headphones = false,
  blink = 0,
  mouth = 'none',
  tear = 0,
  tearDrop = 0,
  glow = 0,
  shadow = 0,
  opacity = 1,
  style,
}) => {
  const t = phase * Math.PI * 2;
  const bob =
    pose === 'walk' ? Math.abs(Math.sin(t)) * 0.16 : pose === 'run' ? Math.abs(Math.sin(t)) * 0.3 : 0;
  const airborne = pose === 'jump' || pose === 'fall' || pose === 'ride';
  const legSwing = pose === 'walk' ? Math.sin(t) * 0.55 : pose === 'run' ? Math.sin(t) * 0.95 : 0;

  const legL = pose === 'sit' ? 1.5 : pose === 'lie' ? 0.3 : airborne ? 0.55 : pose === 'pounce' ? 0.2 : 1;
  const legR = pose === 'sit' ? 1.5 : pose === 'lie' ? 0.3 : airborne ? 0.55 : pose === 'pounce' ? 1.3 : 1;
  const legOffL = pose === 'sit' ? 0.55 : legSwing;
  const legOffR = pose === 'sit' ? -0.55 : -legSwing;

  const armAngle =
    pose === 'jump'
      ? -125
      : pose === 'fall'
        ? -150
        : pose === 'ride'
          ? -40
          : pose === 'pounce'
            ? -80
            : pose === 'reach'
              ? -110
              : pose === 'cry'
                ? 20
                : pose === 'walk'
                  ? Math.sin(t) * 18
                  : 0;

  const eyeH = 1 - blink * 0.78;
  const sy = squash;
  const sx = 1 / Math.max(0.35, squash);

  const footY = size * (9.56 / 12);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -footY,
        opacity,
        zIndex: 50,
        ...style,
      }}
    >
      {shadow > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -size * 0.045,
            width: size * 0.62,
            height: size * 0.13,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0))',
            opacity: shadow,
            filter: 'blur(2px)',
          }}
        />
      ) : null}
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '50% 92%',
          transform: `translateY(${bob * 0.12 * size * -1}px) rotateX(${flip}deg) rotate(${rot + (pose === 'ride' ? 8 : pose === 'pounce' ? 16 : 0) * face}deg) scaleX(${face}) perspective(700px)`,
          transformStyle: 'preserve-3d',
          filter: glow
            ? `drop-shadow(0 0 ${6 + glow * 16}px rgba(217,119,87,${0.25 + glow * 0.4}))`
            : undefined,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 12 12"
          style={{overflow: 'visible', display: 'block'}}
          shapeRendering="crispEdges"
        >
          <g
            transform={`translate(6 ${11.2}) scale(${sx} ${sy}) translate(-6 ${-11.2})`}
          >
            {/* arms */}
            <g
              style={{
                transform: `rotate(${armAngle}deg)`,
                transformOrigin: '2.1px 6.0px',
              }}
            >
              <rect x={0.62} y={5.5} width={0.92} height={1.85} rx={0.42} fill={COLORS.clawdDark} />
            </g>
            <g
              style={{
                transform: `rotate(${-armAngle}deg)`,
                transformOrigin: '9.9px 6.0px',
              }}
            >
              <rect x={10.46} y={5.5} width={0.92} height={1.85} rx={0.42} fill="#A9543A" />
            </g>

            {/* four little legs, alternating pairs */}
            {[2.0, 4.1, 6.4, 8.5].map((lx, i) => {
              const pair = i < 2 ? 0 : 1;
              const swing = (pose === 'walk' || pose === 'run') ? Math.sin(t + pair * Math.PI) * 0.34 : 0;
              const len = pose === 'sit' ? 2.0 : pose === 'lie' ? 0.45 : airborne ? 0.6 : i < 2 ? legL : legR;
              return (
                <rect
                  key={lx}
                  x={lx + (pair === 0 ? legOffL * 0.6 : legOffR * 0.6) + swing}
                  y={8.55}
                  width={1.15}
                  height={len}
                  rx={0.3}
                  fill={i % 2 === 0 ? COLORS.clawdDark : '#A9543A'}
                />
              );
            })}

            {/* body */}
            {BODY_ROWS.map((row, ry) =>
              row.split('').map((c, cx) =>
                c === '#' ? (
                  <rect
                    key={`${ry}-${cx}`}
                    x={BX + cx}
                    y={BY + ry}
                    width={1.02}
                    height={1.02}
                    fill={shading(ry, cx, BODY_ROWS.length)}
                  />
                ) : null,
              ),
            )}

            {/* soft top highlight */}
            <rect x={2.6} y={0.5} width={5.6} height={0.32} rx={0.16} fill="#F2A98C" opacity={0.55} />

            {/* eyes: vertical lines */}
            {[3.55, 7.45].map((ex) => (
              <rect
                key={ex}
                x={ex}
                y={3.35 + (1 - eyeH) * 0.9}
                width={0.78}
                height={1.62 * eyeH}
                rx={0.26}
                fill={COLORS.ink}
              />
            ))}

            {mouth === 'o' ? (
              <rect x={5.35} y={6.25} width={1.3} height={1.15} rx={0.5} fill="#4A2317" />
            ) : null}
            {mouth === 'flat' ? (
              <rect x={5.1} y={6.6} width={1.8} height={0.42} rx={0.2} fill="#4A2317" />
            ) : null}
            {mouth === 'smile' ? (
              <path
                d="M 5 6.3 Q 6 7.05 7 6.3"
                fill="none"
                stroke="#4A2317"
                strokeWidth="0.4"
                strokeLinecap="round"
              />
            ) : null}
          </g>

          {headphones ? <HeadphonesArt size={12} worn glow={glow * 0.5} /> : null}

          {tear > 0 ? (
            <g opacity={tear}>
              <rect
                x={3.72}
                y={5.15 + tearDrop}
                width={0.55}
                height={0.95}
                rx={0.27}
                fill="#BFE6FF"
                style={{filter: 'drop-shadow(0 0 2px rgba(140,220,255,0.9))'}}
              />
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
};
