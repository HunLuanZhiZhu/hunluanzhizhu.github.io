import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Clawd} from '../components/Clawd';
import {Dock} from '../components/Dock';
import {EnergyBars} from '../components/EnergyBars';
import {MenuBar} from '../components/MenuBar';
import {MusicWindow} from '../components/MusicWindow';
import {TerminalWindow, inputRect} from '../components/TerminalWindow';
import {Wallpaper} from '../components/Wallpaper';
import {
  ConstellationLayer,
  EnterKey,
  ExitDialog,
  ImpactFx,
  KineticGlyph,
  MeteorLayer,
  StreamLayer,
  ThreadLine,
  SkyLayer,
  SpeedLines,
} from '../components/Overlays';
import {HeadphonesArt} from '../components/Clawd';
import {COLORS, FONT, H, W} from '../utils/theme';
import {clamp, fadeIn, fadeOut, kick, lerp} from '../utils/motion';
import * as D from './director';

const Camera: React.FC<{cam: D.CamState; children: React.ReactNode}> = ({cam, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: W,
      height: H,
      transformOrigin: '0 0',
      transform: `translate(${cam.shakeX}px, ${cam.shakeY}px) translate(${cam.cx}px, ${
        cam.cy
      }px) rotate(${cam.rot}deg) scale(${cam.zoom}) translate(${-cam.cx}px, ${-cam.cy}px)`,
    }}
  >
    {children}
  </div>
);

/** Expanding sound rings after the headphones land. */
const SoundWaves: React.FC<{x: number; y: number; start: number; frame: number; opacity: number}> = ({
  x,
  y,
  start,
  frame,
  opacity,
}) => {
  if (opacity <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, zIndex: 72, pointerEvents: 'none'}}>
      {[0, 1, 2].map((i) => {
        const t = clamp((frame - start - i * 7) / 40);
        if (t <= 0 || t >= 1) return null;
        const r = 40 + t * 420;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -r,
              top: -r * 0.34,
              width: r * 2,
              height: r * 0.68,
              borderRadius: '50%',
              border: `1.4px solid rgba(255,232,200,${(1 - t) * 0.45 * opacity})`,
              boxShadow: `0 0 24px rgba(255,220,170,${(1 - t) * 0.2 * opacity})`,
            }}
          />
        );
      })}
    </div>
  );
};

export const HuanTingDjMV: React.FC = () => {
  const frame = useCurrentFrame();
  const hero = D.heroAt(frame);
  const cam = D.camAt(frame);
  const ph = D.phasesAt(frame);
  const people = D.peopleState(frame);
  const audioKick = kick(frame >= 900 ? 0 : frame, 6);

  // scene-local values
  const band = D.bandGlyphs(frame);
  const counter = D.loopCounter(frame);
  const whisperList = D.whispers(frame);
  const shatter = D.shatterD(frame);
  const constel = D.constellation(frame);
  const moon = D.moonRise(frame);
  const mete = D.meteor(frame);
  const flash = D.impactFlash(frame);
  const rings = D.impactRing(frame);
  const cover = D.coverState(frame);
  const stream = D.streamChars(frame);
  const streamOp = D.streamOpacity(frame);
  const dialog = D.dialogAt(frame);

  const termRect = D.TERM_HOME;
  const inRect = inputRect(termRect);
  const typeAt = D.P(6.55);
  const notDetected = fadeIn(frame, D.P(9.0), D.P(9.25)) * fadeOut(frame, 320, 336);
  const typeGlow = frame > typeAt ? 1 : 0;

  const lyricIndex = frame >= 836 ? 1 : frame < 570 ? 1 : frame < 676 ? 2 : frame < 716 ? 3 : 4;
  const loveGlow = fadeIn(frame, 574, 580) * fadeOut(frame, 588, 598);
  const loveGrey = fadeIn(frame, 590, 604);
  const rain = fadeIn(frame, 522, 542) * fadeOut(frame, 574, 592);
  const wave = frame > 462 && frame < 570 ? 0.55 : 0.25;

  // flying headphones after the fall into the input
  const hpFly = clamp((frame - 174) / 16);
  const hpRest = frame >= 190 && frame < 440;
  const hpLand = clamp((frame - 458) / 13);
  const hpLanding = frame >= 458 && frame < 474;

  const spotlight = fadeIn(frame, 462, 490) * fadeOut(frame, 676, 700);

  const speed = Math.abs(hero.y - D.heroAt(Math.max(0, frame - 1)).y) + Math.abs(hero.x - D.heroAt(Math.max(0, frame - 1)).x);
  const showTrail = speed > 26 && frame > 4 && frame < 900;

  const dim = ph.dim;
  const musicGlow = D.musicWindowGlow(frame);

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.night0, overflow: 'hidden'}}>
      <Audio src={staticFile('hunting-dj.mp3')} />

      <Camera cam={cam}>
        <Wallpaper />

        {/* ---------------- macOS windows ---------------- */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${ph.windowShift * 150}px) scale(${1 - ph.windowShift * 0.05})`,
            transformOrigin: '50% 40%',
            opacity: 1 - ph.windowShift * 0.4,
            filter: ph.windowShift > 0.01 ? `blur(${ph.windowShift * 4}px)` : undefined,
          }}
        >
        <TerminalWindow
          rect={termRect}
          opacity={ph.termOpacity}
          welcome={frame >= 812 ? 1 : clamp(1 - fadeIn(frame, 200, 216))}
          chat={1}
          typeAt={frame < 300 ? typeAt : 9999}
          typedText="在吗"
          notDetected={notDetected}
          thinking={frame < 812 ? D.thinkingSeconds(frame) : 0}
          glow={typeGlow * 0.7 + audioKick * 0.15}
          frame={frame}
          zIndex={40}
        />

        <MusicWindow
          rect={ph.musicRect}
          opacity={ph.musicOpacity}
          mode={ph.musicMode}
          people={people.people}
          avatarGrey={people.grey}
          avatarFall={people.fall}
          loopCount={D.loopCount(frame)}
          progress={D.musicProgress(frame)}
          coverIndex={cover.index}
          coverFlip={cover.flip}
          activeRow={cover.active}
          rain={rain}
          lyricIndex={lyricIndex}
          wave={wave}
          loveGlow={loveGlow}
          loveGrey={loveGrey}
          spotlight={spotlight}
          spotX={0.47}
          frame={frame}
          glow={musicGlow}
          thinking={frame > 436 ? D.thinkingSeconds(frame) : 0}
          zIndex={45}
        />
        </div>

        {/* dim veil when the imagination takes over */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(90% 80% at 50% 40%, rgba(6,8,18,0.25), rgba(4,6,14,0.92) 85%)',
            opacity: dim,
            zIndex: 50,
            pointerEvents: 'none',
          }}
        />

        {/* ---------------- scene B: lyric band ---------------- */}
        {frame >= D.P(1.4) && frame < 190
          ? band.map((g, i) => (
              <KineticGlyph
                key={i}
                ch={g.ch}
                x={g.x}
                y={g.y}
                size={g.size}
                opacity={g.opacity}
                blur={g.blur}
                rot={g.rot}
                scale={g.scale}
                glow={g.glow}
                z={60 + i}
              />
            ))
          : null}

        {counter.show ? (
          <div
            style={{
              position: 'absolute',
              left: counter.x,
              top: counter.y,
              transform: `translate(-50%,-50%) scale(${counter.scale})`,
              fontFamily: FONT.ui,
              fontSize: 22,
              letterSpacing: 1,
              color: 'rgba(255,226,190,0.85)',
              background: 'rgba(20,14,12,0.55)',
              border: '1px solid rgba(255,190,150,0.25)',
              borderRadius: 999,
              padding: '7px 16px',
              zIndex: 30,
              whiteSpace: 'nowrap',
              boxShadow: '0 0 30px rgba(255,150,100,0.18)',
            }}
          >
            ⟳ 单曲循环 · 第 {counter.count} 遍
          </div>
        ) : null}

        {/* ---------------- scene C: whispers ---------------- */}
        {frame >= 185 && frame < 320
          ? whisperList.map((w, i) => (
              <KineticGlyph
                key={i}
                ch={w.ch}
                x={w.x}
                y={w.y}
                size={64}
                opacity={w.opacity * 0.9}
                blur={w.blur}
                rot={w.rot}
                scale={w.scale}
                glow={0.5}
                color="#A9C3E8"
                hand
                z={64}
              />
            ))
          : null}

        {/* the 说 he lunges at */}
        {shatter.show ? (
          <div style={{position: 'absolute', left: 1400, top: 604, zIndex: 66}}>
            <KineticGlyph
              ch="说"
              x={0}
              y={0}
              size={128}
              opacity={shatter.opacity}
              blur={shatter.u * 4}
              rot={shatter.u * 24}
              scale={1 + shatter.u * 0.4}
              glow={0.9}
              color="#C8DCF7"
              hand
            />
            {shatter.u > 0.05
              ? Array.from({length: 16}, (_, i) => {
                  const a = (i / 16) * Math.PI * 2;
                  const r = 30 + shatter.u * 190;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: 64 + Math.cos(a) * r,
                        top: 64 + Math.sin(a) * r * 0.8,
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: '#BFD9F5',
                        opacity: (1 - shatter.u) * 0.9,
                        transform: `rotate(${a}rad)`,
                      }}
                    />
                  );
                })
              : null}
          </div>
        ) : null}

        {/* ---------------- scene D: sky ---------------- */}
        <SkyLayer opacity={D.constellationDim(frame)} frame={frame} />
        {frame > 278 && frame < 356 ? (
          <ConstellationLayer
            stars={constel.stars}
            progress={constel.progress}
            moon={moon}
          />
        ) : null}

        {/* ---------------- scene E: meteor + impact ---------------- */}
        <SpeedLines
          opacity={fadeIn(frame, 360, 372) * fadeOut(frame, 396, 406) * 0.8}
          frame={frame}
        />
        <MeteorLayer x={mete.x} y={mete.y} show={mete.show} u={mete.u} />
        {frame > 362 && frame < 404
          ? Array.from({length: 7}, (_, i) => {
              const back = D.meteor(Math.max(354, frame - 3 - i * 2));
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: back.x + Math.sin(i * 3.1) * 16,
                    top: back.y - 26 + Math.cos(i * 2.3) * 14,
                    width: 5 + (i % 3) * 3,
                    height: 5 + (i % 3) * 3,
                    borderRadius: 6,
                    background: i % 2 ? '#FFE6B4' : COLORS.clawd,
                    opacity: 0.7 - i * 0.09,
                    boxShadow: '0 0 12px rgba(255,210,150,0.8)',
                    zIndex: 73,
                  }}
                />
              );
            })
          : null}
        {frame > 404 && frame < 452 ? (
          <EnterKey
            x={D.INPUT_CX + 300}
            y={D.INPUT_Y + 50}
            press={clamp((frame - 430) / 6)}
            glow={1 - clamp((frame - 430) / 18)}
          />
        ) : null}

        {/* ---------------- scene I: stream ---------------- */}
        {streamOp > 0.001 ? <StreamLayer chars={stream} opacity={streamOp} /> : null}

        {/* ---------------- headphones as a physical prop ---------------- */}
        {frame >= 174 && frame < 442 ? (
          <div
            style={{
              position: 'absolute',
              left: lerp(inRect.x + inRect.w - 120, 1760, hpFly),
              top: lerp(inRect.y - 64, 880, hpFly) - Math.sin(hpFly * Math.PI) * 120,
              transform: `rotate(${(1 - hpFly) * 320 + (hpRest ? Math.sin(frame / 16) * 3 : 0)}deg) scale(0.62)`,
              opacity: fadeIn(frame, 174, 178) * fadeOut(frame, 434, 442),
              zIndex: 74,
            }}
          >
            <HeadphonesArt size={130} />
          </div>
        ) : null}
        {(hpLanding || (frame > 455 && frame < 472)) ? (
          <div
            style={{
              position: 'absolute',
              left: lerp(1180, 1120, hpLand),
              top: lerp(240, 668, hpLand * hpLand) - Math.sin(hpLand * Math.PI) * 40,
              transform: `rotate(${hpLand * 30}deg) scale(${0.4 + hpLand * 0.2})`,
              opacity: frame > 471 ? fadeOut(frame, 471, 476) : 1,
              zIndex: 78,
            }}
          >
            <HeadphonesArt size={130} glow={0.5} />
          </div>
        ) : null}

        <SoundWaves x={1120} y={716} start={471} frame={frame} opacity={spotlight} />

        {frame >= 716 && frame < 812 ? (
          <div
            style={{
              position: 'absolute',
              left: hero.x + 4,
              top: hero.y + 8,
              zIndex: 74,
              transform: 'translateX(-50%)',
              opacity: D.streamOpacity(frame),
            }}
          >
            <KineticGlyph ch="动" x={0} y={0} size={128} glow={0.9} rot={-14} />
          </div>
        ) : null}

        {/* ---------------- character ---------------- */}
        {showTrail
          ? [1, 2].map((k) => {
              const ghost = D.heroAt(Math.max(0, frame - k));
              return (
                <Clawd
                  key={k}
                  {...ghost}
                  opacity={0.14 / k}
                  glow={0}
                  shadow={0}
                  style={{filter: 'blur(3px)', zIndex: 84}}
                />
              );
            })
          : null}

        <Clawd {...hero} style={{zIndex: 90}} />

        {/* ---------------- dialog + thread ---------------- */}
        <ExitDialog
          opacity={dialog.opacity}
          scale={dialog.scale}
          pressExit={dialog.pressExit}
          pressCancel={dialog.pressCancel}
        />
        <ThreadLine
          from={{x: 1500, y: 250}}
          to={{x: hero.x, y: hero.y - 40}}
          progress={clamp((frame - 615) / 6)}
          opacity={dialog.thread}
        />

        <ImpactFx
          flash={flash}
          ring={rings.a}
          ring2={rings.b}
          show={frame > 400 && frame < 456}
          ox={D.INPUT_CX + 300}
          oy={D.INPUT_Y + 40}
        />

        {/* scenery vignette inside the camera */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(115% 105% at 50% 45%, rgba(0,0,0,0) 48%, rgba(2,3,8,0.6) 100%)',
            zIndex: 92,
            pointerEvents: 'none',
          }}
        />
      </Camera>

      {/* ---------------- fixed screen furniture ---------------- */}
      <EnergyBars />
      <Dock opacity={1} />
      <MenuBar />

      {/* film grain + scan bloom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${staticFile('grain.png')})`,
          backgroundRepeat: 'repeat',
          opacity: 0.045,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 500,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(60% 45% at 50% 88%, rgba(90,120,220,0.10), rgba(0,0,0,0) 70%)',
          pointerEvents: 'none',
          zIndex: 499,
        }}
      />
    </AbsoluteFill>
  );
};
