# 幻听（DJ版）· 横屏循环 MV

> 1920×1080 / 30fps / 920 帧 / 30.67s / 129.2 BPM
> 一块深夜的 macOS 桌面，一个小克劳德，一个再也不会回复的输入框。

## 成品

| 内容 | 说明 |
| --- | --- |
| `index.html` + `player/` | 在线成品：`@remotion/player` 实时渲染，页面里没有视频文件 |
| `out/xusong-huanting-dj-mv.mp4` | 最终成片 1080p（H.264，含音频，首尾帧无缝循环）——**渲染产物未入库**，本地 `npm run render` 生成 |
| `script/storyboard.md` | 分镜 / 节拍表 |

## 运行

```bash
npm run dev                 # Remotion Studio
npm run render              # 1080p 成片
```

或直接：

```bash
npx remotion render src/index.ts HuanTingDjMV out/xusong-huanting-dj-mv.mp4
```

## 结构

```
src/
├── Root.tsx                     # Composition 注册（尺寸 / 帧率 / 时长）
├── video/
│   ├── HuanTingDjMV.tsx         # 成片装配：镜头、图层、特效
│   └── director.ts              # 全部时间轴：角色路径、镜头、歌词、窗口
├── components/
│   ├── Clawd.tsx                # 像素小克劳德（网格绘制 + 12 种姿势 + 耳机）
│   ├── TerminalWindow.tsx       # Claude Code 终端（欢迎框、旧对话、输入框）
│   ├── MusicWindow.tsx          # 音乐 App（播放器 / 歌词 / 歌单三态）
│   ├── AlbumArt.tsx             # 四张程序化封面
│   ├── Dock.tsx / MenuBar.tsx   # 程序坞与菜单栏（SVG 手绘图标）
│   ├── EnergyBars.tsx           # 底部能量条（真实频谱驱动）
│   ├── Overlays.tsx             # 歌词、星座、流星、对话框、字流…
│   └── Wallpaper.tsx            # 极光 / 星尘 / 暗角
├── data/audio.json              # 离线分析：BPM、拍点、32 段频谱、响度
└── utils/motion.ts              # 轨道插值、spring、拍点脉冲、环绕时间
```

## 三个技术要点

**1. 一切挂在真实拍网上。** `tools/analyze.py` 用 librosa 分析参考音轨，导出
BPM 129.2、66 个拍点、每帧 32 段 mel 能量。`utils/motion.ts` 据此提供
`kick()` / `beatAt()`，角色每次起跳、每个窗口脉冲、底部每根能量条都落在拍点上。

**2. 一条连续镜头，不是九段拼接。** 所有窗口、角色、镜头都是 `director.ts`
里的关键帧轨道：窗口从播放器形态长成全屏歌词页、再从歌单收缩回桌面，
角色位置贯穿始终，中间没有硬切（唯一一次"重置"发生在 26.8s 的屏幕回卷）。

**3. 首尾帧真的相等。** 第 0 帧与第 919 帧共用同一组 `LOOP_POSE`；
环境层（星空、尘埃、能量条、程序坞）使用环绕时间，接缝处的取值被强制对齐。
像素级比对：首尾帧平均差异 0.22 / 255，>8 灰阶的像素占 0.1%。

## 关于音频

音轨从项目提供的参考片 `assets/reference.mp4` 中提取（许嵩《幻听》DJ 版副歌，
30.67s），仅用于本项目的节奏对位与本地预览。正式发布前请自行确认音乐版权授权。

> 本仓库未包含 `audio/ref.wav` 与 `assets/reference.mp4`（分析输入与参考片，均为
> 受版权保护的音视频）。`src/data/audio.json` 是已提交的分析结果，重跑
> `tools/analyze.py` 时请自行按上述来源准备这两份文件。

## 在线播放

本目录同时托管在 GitHub Pages 上：仓库首页项目列表里的 **Remotion Try** 卡片
指向本目录的 `index.html`。

- `index.html` 通过 `@remotion/player`（`player/player.js`，由 `player/entry.tsx`
  经 esbuild 打包，构建命令见该文件头部注释）在浏览器里**实时逐帧渲染**合成，
  不依赖视频文件；拖动进度条可定位 920 帧中的任意一帧；
- Pages 托管在子路径下，`player/static-base.ts` 把 `window.remotion_staticBase`
  设为相对基准，`staticFile()` 才能正确解析 `public/` 下的音频与贴图；
- Remotion 工程的文件结构与命令不变，`npm run dev` / `npm run render` 照常使用；
- `node_modules` 不入库；`player/player.js` 是提交的构建产物，改动 `src/` 后
  需按 `player/entry.tsx` 头部注释重新打包；
- 实时渲染在观众设备上现场计算 1080p@30fps，低性能设备可能掉帧；
  追求满帧回放请本地渲染 MP4。
