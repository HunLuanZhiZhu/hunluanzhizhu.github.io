import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONT, METRICS, W} from '../utils/theme';
import {kick, loopFrame, pulse} from '../utils/motion';

type IconProps = {size: number};

const Finder: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="fndR" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2CB4F7" />
        <stop offset="1" stopColor="#0A6FD8" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#fndR)" />
    <path d="M0 22a22 22 0 0 1 22-22h28v100H22A22 22 0 0 1 0 78z" fill="#EAF7FF" />
    <path d="M50 0h0v100h0z" fill="none" />
    <g stroke="#0A5FB0" strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M31 36v12" />
      <path d="M69 36v12" />
      <path d="M26 66c8 9 40 9 48 0" />
    </g>
  </svg>
);

const ClaudeCode: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect width="100" height="100" rx="22" fill={COLORS.clawd} />
    <rect width="100" height="46" rx="22" fill="#E48C6C" opacity="0.35" />
    <g stroke="#1E120C" strokeWidth="7.4" strokeLinecap="round" opacity="0.9">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1={50 + Math.cos((a * Math.PI) / 180) * 13}
          y1={50 + Math.sin((a * Math.PI) / 180) * 13}
          x2={50 + Math.cos((a * Math.PI) / 180) * 31}
          y2={50 + Math.sin((a * Math.PI) / 180) * 31}
        />
      ))}
    </g>
    <circle cx="50" cy="50" r="6" fill="#1E120C" opacity="0.9" />
  </svg>
);

const Music: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="musG" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stopColor="#FF7A8E" />
        <stop offset="1" stopColor="#E9123F" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#musG)" />
    <g fill="#fff">
      <ellipse cx="34" cy="72" rx="10.5" ry="8.6" transform="rotate(-18 34 72)" />
      <ellipse cx="70" cy="63" rx="10.5" ry="8.6" transform="rotate(-18 70 63)" />
      <rect x="41.6" y="27" width="5.2" height="42" rx="2.6" />
      <rect x="77.6" y="18" width="5.2" height="42" rx="2.6" />
      <path d="M41.6 27 82.8 18v10.4L41.6 37.4z" />
    </g>
  </svg>
);

const TerminalIcon: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="trmG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2E2E36" />
        <stop offset="1" stopColor="#131317" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#trmG)" />
    <rect x="9" y="9" width="82" height="14" rx="7" fill="#3A3A44" opacity="0.5" />
    <g fontFamily={FONT.mono} fontSize="30" fill="#F2F2F2">
      <text x="16" y="66">›_</text>
    </g>
    <rect x="54" y="45" width="9" height="24" rx="1.5" fill="#7DE08A" />
  </svg>
);

const Notes: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect width="100" height="100" rx="22" fill="#FFD543" />
    <rect width="100" height="26" rx="22" fill="#FFE9A3" />
    <rect y="14" width="100" height="12" fill="#FFE9A3" />
    <g stroke="#B9962A" strokeWidth="4" strokeLinecap="round" opacity="0.65">
      <path d="M20 44h60" />
      <path d="M20 58h48" />
      <path d="M20 72h56" />
    </g>
  </svg>
);

const Settings: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="setG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9A9AA6" />
        <stop offset="1" stopColor="#4C4C56" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#setG)" />
    {Array.from({length: 8}, (_, i) => (
      <rect
        key={i}
        x="46"
        y="12"
        width="8"
        height="76"
        rx="4"
        fill="#E8E8EE"
        opacity="0.92"
        transform={`rotate(${i * 22.5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="25" fill="#5E5E69" />
    <circle cx="50" cy="50" r="15" fill="#25252B" />
  </svg>
);

const Trash: React.FC<IconProps> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect width="100" height="100" rx="22" fill="rgba(190,200,220,0.18)" />
    <rect x="30" y="14" width="40" height="6" rx="3" fill="#C9D4E6" opacity="0.85" />
    <path d="M33 24h34l-4 58a6 6 0 0 1-6 5.4H43a6 6 0 0 1-6-5.4z" fill="#BAC6D8" opacity="0.45" />
    <path d="M33 24h34l-4 58a6 6 0 0 1-6 5.4H43a6 6 0 0 1-6-5.4z" fill="none" stroke="#DCE6F5" strokeWidth="3.4" opacity="0.9" />
    <g stroke="#DCE6F5" strokeWidth="3" opacity="0.65">
      <path d="M45 34v46" />
      <path d="M55 34v46" />
    </g>
  </svg>
);

const ICONS: {key: string; node: (p: IconProps) => React.ReactNode; running?: boolean}[] = [
  {key: 'finder', node: (p) => <Finder {...p} />, running: true},
  {key: 'claude', node: (p) => <ClaudeCode {...p} />, running: true},
  {key: 'terminal', node: (p) => <TerminalIcon {...p} />, running: true},
  {key: 'music', node: (p) => <Music {...p} />, running: true},
  {key: 'notes', node: (p) => <Notes {...p} />},
  {key: 'settings', node: (p) => <Settings {...p} />},
  {key: 'trash', node: (p) => <Trash {...p} />},
];

export const DOCK_WIDTH = ICONS.length * METRICS.dockIcon + (ICONS.length - 1) * METRICS.dockGap + 30;

export const Dock: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const rawFrame = useCurrentFrame();
  const frame = Math.max(0, loopFrame(rawFrame));
  const bounce = Math.max(0, Math.sin(Math.min(1, kick(frame - 2, 8)) * Math.PI)) * 10;
  const musicIndex = ICONS.findIndex((i) => i.key === 'music');
  return (
    <div
      style={{
        position: 'absolute',
        left: W / 2,
        bottom: 26,
        transform: 'translateX(-50%)',
        zIndex: 320,
        opacity,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: METRICS.dockGap,
          padding: `10px ${METRICS.dockPad + 3}px 11px`,
          borderRadius: 22,
          background: 'rgba(26,28,40,0.42)',
          backdropFilter: 'blur(26px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)',
        }}
      >
        {ICONS.map((icon, i) => (
          <div key={icon.key} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div
              style={{
                width: METRICS.dockIcon,
                height: METRICS.dockIcon,
                transform: `translateY(${i === musicIndex ? -bounce : 0}px) scale(${
                  1 + (i === musicIndex ? pulse(frame, 1, 10) * 0.05 : 0)
                })`,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
              }}
            >
              {icon.node({size: METRICS.dockIcon})}
            </div>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                marginTop: 3,
                background: icon.running ? 'rgba(255,255,255,0.62)' : 'transparent',
              }}
            />
          </div>
        ))}
      </div>
      {/* glass reflection */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          top: '100%',
          height: 46,
          marginTop: 3,
          background:
            'linear-gradient(180deg, rgba(120,150,220,0.15), rgba(120,150,220,0))',
          transform: 'scaleY(-1)',
          filter: 'blur(6px)',
          borderRadius: 20,
          opacity: 0.7,
        }}
      />
    </div>
  );
};
