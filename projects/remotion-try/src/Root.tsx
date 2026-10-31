import React from 'react';
import {Composition} from 'remotion';
import audioData from './data/audio.json';
import {HuanTingDjMV} from './video/HuanTingDjMV';

const FPS = audioData.fps;
const FRAMES = Math.round(audioData.duration * FPS);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HuanTingDjMV"
      component={HuanTingDjMV}
      durationInFrames={FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
