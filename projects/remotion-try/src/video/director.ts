import {clamp, kick, lerp, track, EASE, rand, fadeIn, fadeOut, pulse} from '../utils/motion';
import {ClawdPose} from '../components/Clawd';

export const FPS = 30;
export const P = (t: number) => Math.round(t * FPS);

/** Window placements. The whole film happens on one desktop. */
export const MUSIC_HOME = {x: 110, y: 180, w: 740, h: 600};
export const TERM_HOME = {x: 900, y: 120, w: 970, h: 800};
export const MUSIC_FULL = {x: 96, y: 96, w: 1728, h: 888};

export const INPUT_Y = TERM_HOME.y + TERM_HOME.h - 124;
export const INPUT_CX = TERM_HOME.x + TERM_HOME.w / 2;

/** Lyric schedule (seconds) derived from the reference cut + the beat grid. */
export const LINES = [
  {text: '如今一个人听歌总是会觉得失落', start: 1.45, end: 6.0},
  {text: '幻听你在我的耳边轻轻诉说', start: 6.45, end: 9.35},
  {text: '夜色多温柔', start: 9.55, end: 11.45},
  {text: '你有多爱我', start: 12.0, end: 15.0},
  {text: '如今一个人听歌总是会觉得难过', start: 15.0, end: 19.0},
  {text: '爱已不在这里我却还没走脱', start: 19.0, end: 22.5},
  {text: '列表里的歌', start: 22.5, end: 24.2},
  {text: '随过往流动', start: 24.2, end: 26.9},
];

export const charTime = (line: number, index: number) => {
  const {text, start, end} = LINES[line];
  const n = text.length;
  const hold = Math.min(0.5, (end - start) * 0.16);
  return start + (index / (n - 1)) * (end - start - hold);
};

// ---------------------------------------------------------------- layout ---
/** Scene B: the lyric band that crosses both windows. */
export const BAND_Y = 516;
export const bandX = (i: number) => 300 + i * 100;
export const bandY = (i: number) => BAND_Y - Math.sin((i / 13) * Math.PI) * 42;

export const GLYPH = 96;
/** glyph.y is the visual top; feet stand right on it */
export const platformTop = (y: number) => y - 2;

export const STARS_D = [
  {ch: '夜', x: 470, y: 300},
  {ch: '色', x: 730, y: 236},
  {ch: '多', x: 1000, y: 292},
  {ch: '温', x: 1260, y: 228},
  {ch: '柔', x: 1490, y: 372},
];

// ------------------------------------------------------------------ hero ---
export interface HeroState {
  x: number;
  y: number;
  size: number;
  pose: ClawdPose;
  phase: number;
  face: 1 | -1;
  squash: number;
  rot: number;
  flip: number;
  headphones: boolean;
  blink: number;
  mouth: 'none' | 'smile' | 'o' | 'flat';
  tear: number;
  tearDrop: number;
  glow: number;
  shadow: number;
  opacity: number;
}

export const LOOP_POSE: HeroState = {
  x: 480,
  y: 180,
  size: 150,
  pose: 'sit',
  phase: 0,
  face: 1,
  squash: 1,
  rot: 0,
  flip: 0,
  headphones: true,
  blink: 0,
  mouth: 'none',
  tear: 0,
  tearDrop: 0,
  glow: 0.4,
  shadow: 0.6,
  opacity: 1,
};

const hop = (
  f: number,
  t0: number,
  t1: number,
  a: {x: number; y: number},
  b: {x: number; y: number},
  h: number,
) => {
  const u = clamp((f - t0) / Math.max(1, t1 - t0));
  const arc = Math.sin(u * Math.PI);
  return {
    u,
    x: lerp(a.x, b.x, u),
    y: lerp(a.y, b.y, u) - arc * h,
    air: u > 0.02 && u < 0.98,
    arc,
  };
};

const blinkAt = (f: number) => {
  const p = f % 74;
  return p > 68 ? Math.sin(((p - 68) / 5) * Math.PI) : 0;
};

const st = (i: number, f = 999) => Math.max(platformTop(bandY(i)), bandTop(i, f));

export function heroAt(f: number): HeroState {
  // exact loop pose on both ends of the timeline
  if (f < 4 || f >= 905) return {...LOOP_POSE};

  const s: HeroState = {...LOOP_POSE, blink: blinkAt(f), pose: 'stand', shadow: 0.5};

  // ---- A: sitting on the player, pops up on the first beats ---------------
  if (f < 43) {
    s.glow = 0.4 + kick(f, 5) * 0.2;
    s.pose = f < 7 ? 'sit' : 'stand';
    if (f >= 7 && f <= 24) {
      const u = clamp((f - 7) / 17);
      const arc = Math.sin(u * Math.PI);
      s.y = 180 - arc * 112;
      s.pose = 'jump';
      s.squash = 1 + arc * 0.1;
      s.rot = 0;
    } else if (f > 24 && f < 31) {
      s.pose = 'land';
      s.squash = 1 - (1 - clamp((f - 24) / 7)) * 0.16;
    } else if (f >= 31) {
      s.squash = 1 + kick(f, 5) * 0.05;
      s.y = 180 - kick(f, 5) * 5;
      s.pose = 'walk';
      s.phase = f / 34;
    }
    s.shadow = 0.55;
    s.face = f > 34 ? -1 : 1;
    return s;
  }

  // ---- B: the lyric band (1.45 → 6.0s) -----------------------------------
  if (f < 180) {
    s.size = lerp(150, 132, fadeIn(f, 43, 60));
    s.headphones = true;
    s.shadow = 0.35;
    s.glow = 0.45;
    s.face = 1;

    if (f < 50) {
      const a = hop(f, 45, 50, {x: 480, y: 180}, {x: bandX(0), y: st(0, f)}, 40);
      s.x = a.x;
      s.y = a.y;
      s.pose = 'fall';
      s.flip = a.u * 220;
      s.squash = 1.06;
      return s;
    }

    const hops = [
      {t: 54, dur: 10, from: 0, to: 2, h: 78, flip: 360},
      {t: 66, dur: 9, from: 2, to: 3, h: 48, flip: 0},
      {t: 78, dur: 12, from: 3, to: 5, h: 96, flip: 0},
      {t: 92, dur: 9, from: 5, to: 6, h: 40, flip: 0},
      {t: 104, dur: 13, from: 6, to: 7, h: 88, flip: 360},
      {t: 120, dur: 9, from: 7, to: 8, h: 36, flip: 0},
      {t: 132, dur: 11, from: 8, to: 10, h: 76, flip: 0},
      {t: 146, dur: 12, from: 10, to: 12, h: 66, flip: 360},
      {t: 160, dur: 9, from: 12, to: 13, h: 40, flip: 0},
    ];
    const active = hops.find((h) => f >= h.t && f < h.t + h.dur);
    if (active) {
      const a = hop(
        f,
        active.t,
        active.t + active.dur,
        {x: bandX(active.from), y: st(active.from, f)},
        {x: bandX(active.to), y: st(active.to, f)},
        active.h,
      );
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.phase = a.u;
      s.squash = 1 + a.arc * 0.12;
      s.flip = active.flip ? a.u * active.flip : 0;
      s.face = active.to > active.from ? 1 : -1;
      s.rot = a.u * 8;
      if (active.flip) s.mouth = 'o';
      return s;
    }

    // ride 落 down into the input box
    if (f >= 173) {
      const u = clamp((f - 173) / 7);
      s.x = lerp(bandX(13), INPUT_CX + 26, u * u);
      s.y = lerp(st(13, f), INPUT_Y + 44, u * u);
      s.size = lerp(132, 104, u);
      s.rot = u * 30;
      s.pose = 'fall';
      s.headphones = u < 0.5;
      s.mouth = 'o';
      s.shadow = 0;
      s.glow = 0.6 + u * 0.3;
      return s;
    }

    const lastHop = [...hops].reverse().find((h) => f >= h.t);
    if (!lastHop) {
      s.x = bandX(0);
      s.y = st(0, f) - kick(f, 5) * 3;
      s.pose = 'land';
      s.squash = 0.85;
      return s;
    }
    const grounded = f >= lastHop.t + lastHop.dur;
    const idx = grounded ? lastHop.to : lastHop.from;
    s.x = bandX(idx);
    s.y = st(idx, f) - kick(f, 5) * 4;
    s.pose = f > 146 && f < 160 ? 'reach' : 'stand';
    s.squash = f < 173 && f > 169 ? 0.9 : 1 + kick(f, 5) * 0.06;
    s.phase = f / 20;
    if (f > 130 && f < 146) s.face = -1; // looks at the "1 人在听" flip
    return s;
  }

  // ---- C: inside the input, chasing the voice ----------------------------
  if (f < 282) {
    s.size = 104;
    s.headphones = false;
    s.shadow = 0.25;
    s.glow = 0.2;
    const floor = INPUT_Y + 48;
    const lands = [190, 200, 210, 220, 230, 240, 252, 264];
    const xs = [1470, 1180, 1420, 1150, 1500, 1200, 1460, 1250];
    if (f < 190) {
      s.x = INPUT_CX + 26;
      s.y = floor;
      s.pose = 'land';
      s.squash = 0.72;
      s.mouth = 'o';
      return s;
    }
    if (f >= 274) {
      if (f < 278) {
        const a = hop(f, 274, 278, {x: 1460, y: floor}, {x: 1400, y: floor - 70}, 52);
        s.x = a.x;
        s.y = a.y;
        s.pose = 'pounce';
        s.rot = -20;
        s.squash = 1.1;
        s.mouth = 'o';
        return s;
      }
      const u = clamp((f - 278) / 4);
      s.x = lerp(1400, 1420, u);
      s.y = lerp(floor - 70, floor + 2, u * u);
      s.rot = lerp(-20, 86, u);
      s.pose = 'lie';
      s.mouth = 'flat';
      s.shadow = 0.32;
      return s;
    }
    const prev = lands.filter((l) => l <= f).pop() ?? 190;
    const i = lands.indexOf(prev);
    if (f < prev + 8) {
      const from = i > 0 ? xs[i - 1] : INPUT_CX + 26;
      const a = hop(f, prev, prev + 8, {x: from, y: floor}, {x: xs[i], y: floor}, 54);
      s.x = a.x;
      s.y = a.y;
      s.pose = 'pounce';
      s.rot = a.u * 16 * (xs[i] > from ? 1 : -1);
      s.squash = 1 + a.arc * 0.14;
      s.face = xs[i] > from ? 1 : -1;
      s.mouth = 'o';
      return s;
    }
    s.x = xs[i];
    s.y = floor - Math.max(0, 1 - (f - prev - 8) / 5) * 6;
    s.pose = f < prev + 13 ? 'land' : 'stand';
    s.squash = 1 - Math.max(0, 1 - (f - prev - 8) / 6) * 0.2;
    s.face = 1;
    s.phase = f / 12;
    s.glow = 0.2 + kick(f, 4) * 0.2;
    return s;
  }

  // ---- D: the constellation ----------------------------------------------
  if (f < 344) {
    s.size = 132;
    s.headphones = false;
    s.shadow = 0;
    s.glow = 0.55;
    const star = (i: number) => ({x: STARS_D[i].x, y: STARS_D[i].y - 2});
    if (f < 292) {
      const a = hop(f, 282, 292, {x: 1420, y: INPUT_Y + 50}, star(0), 170);
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.flip = a.u * 360;
      s.rot = 6;
      s.mouth = 'o';
      return s;
    }
    const steps = [
      {t: 292, i: 1},
      {t: 303, i: 2},
      {t: 314, i: 3},
      {t: 325, i: 4},
    ];
    const seg = [...steps].reverse().find((h) => f >= h.t) ?? steps[0];
    const a = hop(f, seg.t, seg.t + 9, star(seg.i - 1), star(seg.i), 66);
    if (f < seg.t + 9) {
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.phase = a.u;
      s.flip = a.u * 360;
      s.squash = 1 + a.arc * 0.1;
      return s;
    }
    s.x = star(seg.i).x;
    s.y = star(seg.i).y - kick(f, 6) * 6;
    s.pose = 'stand';
    s.squash = 1 + kick(f, 5) * 0.06;
    s.phase = f / 16;
    s.face = 1;
    s.rot = Math.sin(f / 14) * 4;
    return s;
  }

  // ---- E: meteor ride + Enter slam ---------------------------------------
  if (f < 450) {
    s.headphones = false;
    s.shadow = 0;
    s.glow = 0.5;
    const m = meteor(f);
    if (f < 358) {
      s.x = 1520;
      s.y = 310 - kick(f, 5) * 5;
      s.size = 132;
      s.pose = 'stand';
      s.rot = Math.sin(f / 8) * 3;
      s.face = 1;
      return s;
    }
    if (f < 366) {
      const a = hop(f, 358, 366, {x: 1520, y: 310}, {x: m.x, y: m.y - 6}, 40);
      s.x = a.x;
      s.y = a.y;
      s.size = 132;
      s.pose = 'jump';
      s.flip = a.u * 180;
      s.mouth = 'o';
      return s;
    }
    if (f < 400) {
      s.x = m.x;
      s.y = m.y - 8;
      s.size = lerp(132, 110, clamp((f - 366) / 34));
      s.pose = 'ride';
      s.rot = -14;
      s.face = -1;
      s.mouth = 'o';
      s.glow = 0.75;
      return s;
    }
    if (f < 414) {
      s.size = 110;
      s.x = INPUT_CX + 40;
      s.y = INPUT_Y + 52 - Math.sin(clamp((f - 400) / 8) * Math.PI) * 20;
      s.pose = 'land';
      s.squash = 0.7;
      s.rot = 0;
      s.mouth = 'flat';
      s.shadow = 0.4;
      return s;
    }
    const key = {x: INPUT_CX + 300, y: INPUT_Y + 52 - 60};
    if (f < 422) {
      const a = hop(f, 414, 422, {x: INPUT_CX + 40, y: INPUT_Y + 52}, key, 70);
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.size = 110;
      return s;
    }
    if (f < 446) {
      s.x = key.x;
      s.y = key.y + (f > 430 ? 6 : 0);
      s.size = 110;
      s.pose = f >= 430 ? 'land' : 'stand';
      s.squash = f >= 430 ? 0.7 : 1;
      s.mouth = 'o';
      s.face = 1;
      s.glow = 0.7 + kick(f, 6) * 0.3;
      return s;
    }
    // thrown left by the shockwave into the lyric window
    const a = hop(f, 446, 458, {x: key.x, y: key.y}, {x: 1120, y: 812}, 120);
    s.x = a.x;
    s.y = a.y;
    s.size = lerp(110, 148, a.u);
    s.pose = 'fall';
    s.flip = a.u * 360;
    s.rot = -12;
    s.mouth = 'o';
    s.headphones = false;
    s.glow = 0.8;
    return s;
  }

  // ---- F: lyrics view, spotlight -----------------------------------------
  if (f < 570) {
    const floor = 812;
    s.size = 148;
    s.headphones = f > 471;
    s.shadow = 0.4;
    s.glow = 0.6;
    s.x = 1120 + Math.sin((f - 458) / 40) * 7;
    s.y = floor - Math.abs(Math.sin((f - 458) / 22)) * 4 - kick(f, 6) * 4;
    s.pose = 'stand';
    s.squash = 1 + kick(f, 5) * 0.06;
    s.phase = f / 24;
    s.face = 1;
    s.rot = Math.sin((f - 458) / 34) * 3;
    if (f < 468) {
      s.squash = 0.78 + clamp((f - 458) / 10) * 0.22;
      s.pose = f < 466 ? 'land' : 'stand';
      s.x = 1120;
      s.y = floor;
      s.rot = 0;
      return s;
    }
    s.mouth = f > 500 && f < 508 ? 'o' : 'none';
    if (f > 552 && f < 566) {
      const u = clamp((f - 552) / 12);
      s.tear = 1;
      s.tearDrop = u * u * 34;
      s.mouth = 'flat';
      s.rot = Math.sin(f / 14) * 2;
    }
    if (f >= 566) s.tear = 0;
    if (f > 530 && f < 548) s.face = -1;
    return s;
  }

  // ---- G: the quit dialog ------------------------------------------------
  if (f < 675) {
    s.size = 142;
    s.headphones = true;
    s.shadow = 0.4;
    s.glow = 0.5;
    const floor = 812;
    const btnY = 742;
    if (f < 600) {
      s.x = 1120;
      s.y = floor - kick(f, 5) * 4;
      s.pose = 'stand';
      s.rot = Math.sin(f / 9) * 2;
      s.face = 1;
      return s;
    }
    if (f < 612) {
      const a = hop(f, 600, 612, {x: 1120, y: floor}, {x: 1505, y: btnY}, 92);
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.flip = a.u * 180;
      s.mouth = 'o';
      return s;
    }
    if (f < 624) {
      s.x = 1505;
      s.y = btnY - kick(f, 5) * 5;
      s.pose = f < 617 ? 'land' : 'stand';
      s.squash = f < 617 ? 0.8 : 1;
      s.face = 1;
      return s;
    }
    if (f < 634) {
      const u = clamp((f - 624) / 10);
      const e = u * u * (3 - 2 * u);
      s.x = lerp(1505, 1323, e);
      s.y = lerp(btnY, btnY - 42, Math.sin(u * Math.PI));
      s.pose = 'reach';
      s.rot = lerp(0, -32, e);
      s.face = -1;
      s.mouth = 'o';
      s.glow = 0.8;
      return s;
    }
    if (f < 646) {
      s.x = 1323;
      s.y = btnY - kick(f, 4) * 3;
      s.pose = 'stand';
      s.face = -1;
      return s;
    }
    const a = hop(f, 646, 664, {x: 1323, y: btnY}, {x: 1250, y: floor}, 40);
    s.x = a.x;
    s.y = a.y;
    s.pose = f < 658 ? 'fall' : 'land';
    s.face = 1;
    s.rot = f < 658 ? 8 : 0;
    return s;
  }

  // ---- H: playlist hop ---------------------------------------------------
  if (f < 726) {
    s.size = 138;
    s.headphones = true;
    s.shadow = 0.4;
    s.glow = 0.45;
    const rows = [432, 514, 596, 678];
    if (f < 687) {
      const a = hop(f, 675, 687, {x: 1250, y: 812}, {x: 1280, y: rows[0]}, 84);
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.flip = a.u * 180;
      return s;
    }
    if (f < 690) {
      s.x = 1280;
      s.y = rows[0] - kick(f, 5) * 3;
      s.pose = 'land';
      s.squash = 0.84;
      s.face = 1;
      return s;
    }
    const jumps = [
      {t: 690, i: 1},
      {t: 702, i: 2},
      {t: 714, i: 3},
    ];
    const seg = [...jumps].reverse().find((j) => f >= j.t)!;
    const a = hop(f, seg.t, seg.t + 8, {x: 1300, y: rows[seg.i - 1]}, {x: 1300, y: rows[seg.i]}, 48);
    if (f < seg.t + 8) {
      s.x = a.x;
      s.y = a.y;
      s.pose = 'jump';
      s.squash = 1 + a.arc * 0.12;
      return s;
    }
    s.x = 1300;
    s.y = rows[seg.i] - kick(f, 5) * 4;
    s.pose = 'stand';
    s.squash = 1 + kick(f, 5) * 0.05;
    s.face = 1;
    s.phase = f / 14;
    return s;
  }

  // ---- I: riding the stream ----------------------------------------------
  if (f < 807) {
    s.size = 140;
    s.headphones = false;
    s.shadow = 0;
    s.glow = 0.6;
    const u = clamp((f - 726) / 66);
    const e = u * u;
    s.x = lerp(1300, 980, e) + Math.sin(f / 9) * 9;
    s.y = lerp(674, -180, e);
    s.pose = 'ride';
    s.rot = lerp(0, -20, u) + Math.sin(f / 8) * 2;
    s.face = -1;
    s.mouth = u > 0.2 && u < 0.9 ? 'o' : 'none';
    s.flip = Math.sin(f / 14) * 8;
    return s;
  }

  // ---- J: home again -----------------------------------------------------
  if (f < 866) {
    s.opacity = 0;
    s.x = 480;
    s.y = 180;
    return s;
  }
  const landing = 893;
  if (f < landing) {
    const u = clamp((f - 866) / (landing - 866));
    s.opacity = fadeIn(f, 866, 874);
    s.x = lerp(360, 480, u);
    s.y = lerp(-140, 180, u * u);
    s.pose = 'fall';
    s.rot = lerp(-26, 0, u);
    s.squash = 1.05;
    s.shadow = 0;
    s.glow = 0.5;
    return s;
  }
  const u = (f - landing) / 12;
  s.x = 480;
  s.y = 180;
  s.pose = 'land';
  s.squash = lerp(0.78, 1, clamp(u));
  s.rot = 0;
  return s;
}

// ---------------------------------------------------------------- camera ---
export interface CamState {
  cx: number;
  cy: number;
  zoom: number;
  rot: number;
  shakeX: number;
  shakeY: number;
}

export function camAt(f: number): CamState {
  const zoom = track(
    f,
    [
      [0, 1.0],
      [43, 1.01],
      [70, 1.04],
      [150, 1.04],
      [178, 1.0],
      [196, 1.78],
      [240, 1.86],
      [278, 1.7],
      [292, 1.0],
      [344, 1.0],
      [352, 1.02],
      [358, 1.12],
      [366, 1.24],
      [400, 1.32],
      [414, 1.28],
      [430, 1.46],
      [448, 1.3],
      [462, 1.0],
      [520, 1.03],
      [570, 1.0],
      [600, 1.08],
      [675, 1.0],
      [726, 1.0],
      [807, 1.0],
    ],
    EASE.inOut,
  );
  const cx = track(
    f,
    [
      [0, 960],
      [43, 945],
      [70, 945],
      [170, 950],
      [196, 1310],
      [240, 1310],
      [278, 1300],
      [300, 960],
      [344, 960],
      [358, 1540],
      [366, 1720],
      [400, 1450],
      [414, 1430],
      [430, 1600],
      [448, 1590],
      [462, 960],
      [570, 960],
      [600, 1000],
      [675, 1000],
      [726, 980],
      [807, 960],
    ],
    EASE.inOut,
  );
  const cy = track(
    f,
    [
      [0, 540],
      [43, 540],
      [70, 548],
      [170, 548],
      [196, 795],
      [240, 802],
      [278, 796],
      [300, 470],
      [344, 470],
      [358, 360],
      [366, 470],
      [400, 700],
      [414, 780],
      [430, 790],
      [448, 790],
      [462, 540],
      [570, 540],
      [600, 520],
      [675, 532],
      [726, 530],
      [807, 540],
    ],
    EASE.inOut,
  );

  const hit = (at: number, amp: number, len = 14) => {
    if (f < at || f > at + len) return {x: 0, y: 0};
    const d = 1 - (f - at) / len;
    return {x: Math.sin(f * 2.7) * amp * d, y: Math.cos(f * 3.3) * amp * d};
  };
  const a = hit(180, 14, 11);
  const b = hit(402, 30, 18);
  const c = hit(430, 24, 16);
  const d = hit(600, 7, 10);
  const rot = track(
    f,
    [
      [180, 0],
      [200, 1.4],
      [278, 1.0],
      [300, 0],
      [400, 2.6],
      [415, 0],
      [726, 0],
      [760, -3],
      [807, 2.5],
      [860, 0],
    ],
    EASE.inOut,
  );
  return {
    cx,
    cy,
    zoom,
    rot,
    shakeX: a.x + b.x + c.x + d.x,
    shakeY: a.y + b.y + c.y + d.y,
  };
}

// --------------------------------------------------------------- windows ---
export interface PhaseState {
  termOpacity: number;
  musicOpacity: number;
  windowShift: number;
  musicRect: {x: number; y: number; w: number; h: number};
  musicMode: 'player' | 'lyrics' | 'playlist';
  dim: number;
}

const rectLerp = (f: number, keys: [number, {x: number; y: number; w: number; h: number}][]) => ({
  x: track(f, keys.map(([t, r]) => [t, r.x]) as [number, number][], EASE.inOut),
  y: track(f, keys.map(([t, r]) => [t, r.y]) as [number, number][], EASE.inOut),
  w: track(f, keys.map(([t, r]) => [t, r.w]) as [number, number][], EASE.inOut),
  h: track(f, keys.map(([t, r]) => [t, r.h]) as [number, number][], EASE.inOut),
});

export function phasesAt(f: number): PhaseState {
  const termHidden = fadeIn(f, 444, 462) * (1 - fadeIn(f, 844, 864));
  const musicHidden = fadeIn(f, 798, 814) * (1 - fadeIn(f, 836, 858));
  return {
    termOpacity: 1 - termHidden,
    musicOpacity: (1 - musicHidden) * (f > 188 && f < 292 ? 0.4 : 1),
    windowShift: track(
      f,
      [
        [0, 0],
        [284, 0],
        [300, 1],
        [338, 0.95],
        [352, 0],
        [798, 0],
        [814, 1],
        [840, 0],
      ],
      EASE.inOut,
    ),
    musicRect: rectLerp(f, [
      [0, MUSIC_HOME],
      [348, MUSIC_HOME],
      [404, {x: -430, y: 170, w: 740, h: 600}],
      [444, {x: -430, y: 170, w: 740, h: 600}],
      [458, {x: 120, y: 220, w: 1400, h: 790}],
      [468, MUSIC_FULL],
      [800, MUSIC_FULL],
      [812, {x: 300, y: 260, w: 900, h: 700}],
      [836, MUSIC_HOME],
    ]),
    musicMode: f < 456 ? 'player' : f < 676 ? 'lyrics' : f < 716 ? 'playlist' : f < 836 ? 'lyrics' : 'player',
    dim: track(
      f,
      [
        [0, 0],
        [44, 0],
        [62, 0.34],
        [170, 0.34],
        [184, 0.1],
        [198, 0],
        [286, 0],
        [298, 0.74],
        [338, 0.7],
        [352, 0],
        [358, 0.5],
        [400, 0.45],
        [404, 0],
        [440, 0],
        [450, 0.3],
        [458, 0],
        [798, 0],
        [812, 0.6],
        [840, 0],
      ],
      EASE.inOut,
    ),
  };
}

export const musicWindowGlow = (f: number) => {
  if (f >= 900) return 0.44;
  if (f < 180) return 0.22 + kick(f, 6) * 0.22;
  if (f < 282) return 0.14;
  if (f < 450) return 0.1;
  if (f < 570) return 0.32 + kick(f, 7) * 0.2;
  if (f < 675) return 0.38;
  return 0.18;
};

// ---------------------------------------------------------------- lyrics ---
export interface GlyphState {
  ch: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  blur: number;
  rot: number;
  scale: number;
  glow: number;
}

const glyphSpawn = (line: number, i: number) => P(charTime(line, i));

/** Current visual top of a scene-B glyph (it may still be rising). */
export const bandTop = (i: number, f: number) => {
  const t = glyphSpawn(0, i);
  const rise = clamp((f - t) / 22);
  return lerp(1120, bandY(i), EASE.out(rise));
};

export function bandGlyphs(f: number): GlyphState[] {
  const text = LINES[0].text;
  return text.split('').map((ch, i) => {
    const t = glyphSpawn(0, i);
    const rise = clamp((f - t) / 22);
    const e = EASE.out(rise);
    const appear = clamp((f - t) / 5);
    const spin = i === 7 || i === 8 ? clamp((f - t) / 26) * 360 : 0;
    const fall = i === 13 ? clamp((f - 173) / 7) : 0;
    return {
      ch,
      x: bandX(i) + fall * 240,
      y: lerp(1120, bandY(i), e),
      size: GLYPH,
      opacity: appear * (f > 180 ? fadeOut(f, 180, 188) : 1),
      blur: (1 - rise) * 6,
      rot: spin + fall * 34,
      scale: 0.92 + 0.08 * e,
      glow: i === 13 ? 0.4 + fall * 0.6 : 0.2,
    };
  });
}

export const loopCounter = (f: number) => {
  const t = glyphSpawn(0, 7);
  const u = clamp((f - t) / 40);
  return {
    show: f > t + 6 && f < 178 ? 1 : 0,
    count: Math.round(lerp(799, 812, u)),
    x: bandX(7) + 44,
    y: bandY(7) - 96,
    scale: 0.88 + 0.12 * EASE.back(clamp(u * 3)),
  };
};

// -------------------------------------------------------------- whispers ---
export interface WhisperState {
  ch: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rot: number;
  blur: number;
}

const WHISPER_TEXT = LINES[1].text;
const WHISPER_X = [1470, 1180, 1420, 1150, 1500, 1200, 1460, 1250];

export function whispers(f: number): WhisperState[] {
  const events = [190, 200, 210, 220, 230, 240, 252, 264];
  const out: WhisperState[] = [];
  events.forEach((t, i) => {
    const age = f - t;
    if (age < 0 || age > 52) return;
    const life = clamp(age / 46);
    out.push({
      ch: WHISPER_TEXT[i],
      x: WHISPER_X[i] + Math.sin(i * 2.1) * 20,
      y: INPUT_Y - 54 - life * 170,
      opacity: fadeIn(age, 0, 7) * fadeOut(age, 26, 50),
      scale: 1 + life * 0.35,
      rot: Math.sin(i * 3.3) * 12 + life * (i % 2 ? 20 : -20),
      blur: life * 3.2,
    });
  });
  return out;
}

export const shatterD = (f: number) => ({
  u: clamp((f - 274) / 18),
  show: f > 258 && f < 300,
  opacity: fadeIn(f, 258, 266) * fadeOut(f, 274, 288),
});

// ----------------------------------------------------------- constellation ---
export function constellation(f: number) {
  const stars = STARS_D.map((s, i) => {
    const at = [282, 292, 303, 314, 325][i];
    return {...s, u: clamp((f - at) / 14)};
  });
  return {stars, progress: clamp((f - 292) / 34)};
}

export const moonRise = (f: number) => clamp((f - 286) / 46);
export const constellationDim = (f: number) => fadeIn(f, 282, 300) * fadeOut(f, 340, 352);

// -------------------------------------------------------------- meteor -----
export function meteor(f: number) {
  const u = clamp((f - 354) / 48);
  const e = Math.pow(u, 0.85);
  const x = lerp(1920, INPUT_CX + 40, e);
  const y = lerp(26, INPUT_Y + 52, e);
  return {u, x, y, show: f > 348 && f < 408};
}

// --------------------------------------------------------------- impact ----
export const impactFlash = (f: number) => clamp(pulse(f, 402, 5) * 0.85 + pulse(f, 430, 4));
export const impactRing = (f: number) => ({
  a: clamp((f - 402) / 24),
  b: clamp((f - 430) / 22),
});

// -------------------------------------------------------------- music UI ---
export const peopleState = (f: number) => {
  const flipAt = 130;
  if (f < flipAt) return {people: 2, grey: 0, fall: 0};
  if (f >= 810) return {people: 2, grey: 0, fall: 0};
  return {
    people: f < flipAt + 6 ? 2 : 1,
    grey: clamp((f - flipAt - 2) / 8),
    fall: clamp((f - flipAt - 4) / 26),
  };
};

export const loopCount = (f: number) =>
  f >= 810 ? 799 : Math.round(lerp(799, 812, clamp((f - 108) / 60)));

export const musicProgress = (f: number) =>
  f >= 836 ? 0.39 : clamp(0.39 + f * 0.00035);

// ------------------------------------------------------------ playlist ---
export const PLAYLIST_ROW_TOP = 258;
export const PLAYLIST_ROW_H = 82;
export const playlistRowY = (i: number) => 96 + PLAYLIST_ROW_TOP + i * PLAYLIST_ROW_H;

export const coverState = (f: number) => {
  if (f >= 810) return {index: 0, flip: 0, active: 0};
  const steps = [
    {t: 690, index: 2},
    {t: 702, index: 1},
    {t: 714, index: 3},
  ];
  const seg = [...steps].reverse().find((s) => f >= s.t);
  if (!seg) return {index: 0, flip: 0, active: 0};
  const u = clamp((f - seg.t) / 8);
  const idx = steps.indexOf(seg);
  return {
    index: u < 0.5 ? (idx === 0 ? 0 : steps[idx - 1].index) : seg.index,
    flip: u,
    active: idx + 1,
  };
};

// ------------------------------------------------------------- stream -----
export const streamChars = (f: number, count = 52) =>
  Array.from({length: count}, (_, i) => {
    const seed = rand(i * 3.77 + 1);
    const seed2 = rand(i * 8.13 + 5);
    const lane = rand(i * 2.41 + 7);
    const delay = seed * 26;
    const p = clamp((f - 700 - delay) / 96);
    return {
      i,
      x: 260 + lane * 1300 + Math.sin(f / 20 + i) * 22 + p * 120,
      y: lerp(1060, -180, p),
      ch: ['随', '过', '往', '流', '动', '幻', '听', '你'][i % 8],
      size: 26 + seed * 34,
      opacity: Math.sin(p * Math.PI) * (0.22 + seed2 * 0.5),
      rot: seed * 30 - 15 + p * 26,
      blur: p > 0.7 ? (p - 0.7) * 16 : 0,
    };
  });

export const streamOpacity = (f: number) => fadeIn(f, 702, 726) * fadeOut(f, 790, 810);

// --------------------------------------------------------------- dialog ----
export const dialogAt = (f: number) => ({
  opacity: fadeIn(f, 590, 600) * fadeOut(f, 646, 656),
  scale: fadeIn(f, 590, 604, EASE.back),
  pressExit: pulse(f, 612, 3) * 0.6 + pulse(f, 600, 4) * 0.4,
  pressCancel: pulse(f, 634, 4) * 0.7,
  thread: fadeIn(f, 624, 630) * fadeOut(f, 634, 642),
});

export const thinkingSeconds = (f: number) => (f >= 436 ? (f - 436) / 30 : 0);
