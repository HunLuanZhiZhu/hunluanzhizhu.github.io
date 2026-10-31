import React from 'react';
import {COLORS, FONT, METRICS} from '../utils/theme';

export const AppleGlyph: React.FC<{size?: number; color?: string}> = ({
  size = 19,
  color = '#EDE8DF',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{display: 'block'}}>
    <path d="M16.9 12.6c0-2.4 1.9-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.9-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.6z" />
    <path d="M14.6 5.5c.6-.8 1.1-1.9 1-3-.9.1-2 .7-2.7 1.5-.6.7-1.1 1.8-1 2.9 1 0 2-.6 2.7-1.4z" />
  </svg>
);

const Wifi: React.FC = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EDE8DF">
    <path d="M3.5 8.6a13.4 13.4 0 0 1 17 0" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M6.7 12.2a8.6 8.6 0 0 1 10.6 0" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M9.8 15.7a4 4 0 0 1 4.4 0" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="12" cy="18.6" r="1.5" fill="#EDE8DF" stroke="none" />
  </svg>
);

const Battery: React.FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
    <span style={{fontSize: 17, color: COLORS.cream, opacity: 0.92}}>87%</span>
    <svg width={32} height={16} viewBox="0 0 34 16">
      <rect x="0.8" y="2.2" width="27" height="11.6" rx="3.4" stroke="#EDE8DF" strokeOpacity="0.65" fill="none" />
      <rect x="3" y="4.4" width="20.5" height="7.2" rx="1.8" fill="#EDE8DF" />
      <path d="M30.4 6.1v3.8c1.2-.3 1.9-1.1 1.9-1.9s-.7-1.6-1.9-1.9z" fill="#EDE8DF" fillOpacity="0.65" />
    </svg>
  </div>
);

const ControlCenter: React.FC = () => (
  <svg width={21} height={21} viewBox="0 0 24 24" fill="none" stroke="#EDE8DF" strokeWidth="1.7">
    <rect x="3" y="3" width="7.4" height="18" rx="3.7" />
    <rect x="13.6" y="3" width="7.4" height="18" rx="3.7" />
    <circle cx="6.7" cy="8.2" r="1.6" fill="#EDE8DF" stroke="none" />
    <circle cx="17.3" cy="15.8" r="1.6" fill="#EDE8DF" stroke="none" />
  </svg>
);

const Search: React.FC = () => (
  <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke="#EDE8DF" strokeWidth="2">
    <circle cx="10.6" cy="10.6" r="6.4" />
    <path d="m15.6 15.6 4.4 4.4" strokeLinecap="round" />
  </svg>
);

export const MenuBar: React.FC<{opacity?: number; title?: string}> = ({
  opacity = 1,
  title = '访达',
}) => {
  const menus = ['文件', '编辑', '显示', '前往', '窗口', '帮助'];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: METRICS.menuH,
        display: 'flex',
        alignItems: 'center',
        padding: '0 22px',
        gap: 26,
        background: 'rgba(10,12,22,0.58)',
        backdropFilter: 'blur(26px) saturate(150%)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        zIndex: 300,
        opacity,
        fontFamily: FONT.ui,
        fontSize: 19,
        color: COLORS.cream,
      }}
    >
      <AppleGlyph size={20} />
      <span style={{fontWeight: 600, marginLeft: 2}}>{title}</span>
      {menus.map((m) => (
        <span key={m} style={{opacity: 0.9}}>
          {m}
        </span>
      ))}
      <div style={{flex: 1}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: 0.95}}>
        <Search />
        <Wifi />
        <Battery />
        <ControlCenter />
        <span style={{fontSize: 18, letterSpacing: 0.2, opacity: 0.95}}>10月31日 周六 0:24</span>
      </div>
    </div>
  );
};
