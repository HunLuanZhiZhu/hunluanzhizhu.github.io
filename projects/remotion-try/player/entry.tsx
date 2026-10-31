/* 播放页入口：把 Remotion 合成挂到 @remotion/player 上，浏览器实时逐帧渲染。
   构建命令（node_modules 不入库，指向源工作区的依赖）：

     NODE_PATH="<源工程>/node_modules" \
       <源工程>/node_modules/.bin/esbuild player/entry.tsx \
       --bundle --minify --format=iife --target=es2019 \
       --jsx=automatic --outfile=player/player.js

   产物 player.js 由 ../index.html 加载；页面通过 window.__htPlayer
   （PlayerRef）驱动自定义控制条。 */
import './static-base';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import audioData from '../src/data/audio.json';
import {HuanTingDjMV} from '../src/video/HuanTingDjMV';

const FPS = audioData.fps;
const FRAMES = Math.round(audioData.duration * FPS);

const container = document.getElementById('mount');
if (!container) throw new Error('#mount not found');

const root = createRoot(container);
root.render(
  <Player
    component={HuanTingDjMV}
    durationInFrames={FRAMES}
    fps={FPS}
    compositionWidth={1920}
    compositionHeight={1080}
    loop
    clickToPlay={false}
    acknowledgeRemotionLicense
    style={{width: '100%', height: '100%'}}
    ref={(ref) => {
      (window as unknown as {__htPlayer?: unknown}).__htPlayer = ref;
      container.dispatchEvent(new Event('playerready'));
    }}
  />
);
