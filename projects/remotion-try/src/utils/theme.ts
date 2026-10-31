/**
 * Design tokens for the macOS set.
 * The desktop is authored at 1280×720 logical pixels and blown up ×1.5,
 * so every metric below is the real macOS metric.
 */
export const W = 1920;
export const H = 1080;
export const S = 1.5;

export const COLORS = {
  // night desktop
  night0: '#05070F',
  night1: '#0A1024',
  night2: '#141B3C',
  violet: '#3B2A63',
  violetSoft: '#5A4185',

  // character
  clawd: '#D97757',
  clawdDark: '#B85F41',
  clawdLight: '#EE9A7B',
  clawdShadow: '#7E3C28',
  ink: '#1B0F0A',

  // type
  cream: '#F7EFE1',
  creamDim: '#B9AE9D',
  whisper: '#8FA6C8',

  // accents
  blueGlow: '#6FD3FF',
  pinkGlow: '#FF9BB6',
  gold: '#F3C77B',

  // terminal
  termBg: '#191A1E',
  termBar: '#232428',
  termText: '#D7D3CB',
  termDim: '#7C7A74',
  termGreen: '#8FD48A',
  termBlue: '#7FB6E8',

  // music app
  musicBg: '#1D1B2B',
  musicSide: '#171525',
  musicPink: '#FA2D48',
};

export const FONT = {
  ui: '"Noto Sans SC", "Microsoft YaHei", -apple-system, system-ui, sans-serif',
  mono: '"Cascadia Mono", "Consolas", ui-monospace, monospace',
  lyric: '"SimSun", "宋体", "Noto Serif SC", serif',
  hand: '"KaiTi", "楷体", serif',
};

export const METRICS = {
  menuH: 40,
  dockIcon: 74,
  dockGap: 12,
  dockPad: 12,
  dockBottom: 14,
  radius: 18,
};
