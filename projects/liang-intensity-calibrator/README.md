# AI 连续版 · 滑动变祖器 · Liang Intensity Calibrator

拖动滑杆，观察「梁系强度」从 `小难梁` 一路进化到 `梁祖`。技术路线：
**OpenAI Image2 生成首尾帧 + MiniMax H3（FL2VA）连续插帧**，页面为逐帧精准 seek + Canvas 绘制。

> 当前运行素材为 **正式版**（2048×2048，OpenAI Image2 首尾帧 → MiniMax H3 FL2VA，
> 已按下方流程重编码加密关键帧）。开发试跑素材（320×320 test1-3）见 `vidios/`，不入库。

## 文件结构

```
projects/liang-intensity-calibrator/
├── index.html        # 页面骨架（顶栏 + 挂载点）
├── css/style.css     # 移植自参考项目 src/styles.css
├── js/app.js         # 移植自参考项目 src/*.ts（progression/app/video-renderer/main）
├── video/
│   └── liang-evolution.mp4   # 运行素材（正式版 2048²，已加密关键帧）
├── docs/             # H3 生成 prompt（v5）与检查记录
├── imgs/             # OpenAI Image2 首尾帧输入（frist.png / last.png）
├── references/       # 原项目参考图
└── vidios/           # test*.mp4 测试素材（不入库）
```

## 替换正式素材（一次到位）

1. 将正式视频转码为 H.264 MP4（H3 FL2VA 输出：**24fps、约 10.125s = 243 帧**），覆盖 `video/liang-evolution.mp4`
2. **关键帧间隔 ≤ 1s（必做）**：H3 输出的素材常只有 1 个关键帧（仅首帧），
   会导致后半段 seek 需解码 10 秒整链而明显卡顿。用 ffmpeg 重编码加密关键帧
   （每 1s 一个，`-g 24`，画质损失可忽略）：
   ```bash
   ffmpeg -y -i 输入.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
     -g 24 -keyint_min 24 -sc_threshold 0 -vsync cfr -r 24 -an -movflags +faststart \
     video/liang-evolution.mp4
   ```
   验证关键帧分布：解析 stss 盒，确认 24fps 下关键帧落在整秒边界（本素材为
   帧 0/24/48/…/240，共 11 个）。重编码必须保持帧数与帧率不变（243 帧 @24fps）
3. （可选）同时生成 VP9 WebM 放入 `video/liang-evolution.webm`，并在 `js/app.js` 的
   `VIDEO_SOURCES` 中取消 webm 条目注释 —— 页面会自动优先 WebM、回退 MP4
4. 若改了文件名，同步更新 `js/app.js` 中 `VIDEO_SOURCES` 的 `src`
5. **帧映射**：页面按帧号线性取帧（档位 k → 帧 k+1，跳过首尾各 1 帧，展示帧 1..241）。
   若新素材帧率/帧数不同，同步修改 `js/app.js` 顶部的 `VIDEO_FPS` / `HEAD_SKIP` / `TAIL_SKIP`
6. **不要为 MP4 source 声明 `codecs`**：声明与实际编码不符时 Chrome 的 seek 会失效
   （`seekable` 变 `[0,0]`、画面卡死），让浏览器嗅探实际 codec 最稳健
7. 验证：本地起服务后**按住**方向键或拖动滑杆，画面应全程实时跟进（不停顿、不卡到松手）；
   拖动应逐帧连续。与 `docs/h3-fl2va-prompt.md` 检查清单比对画面一致性

## 本地预览

**必须使用支持 Range 请求的静态服务器**：页面靠 `<video>` 的 seek 逐帧取帧，
若服务器不支持 Range（如 `python -m http.server` 的 HTTP/1.0 模式），Chrome 会把
`seekable` 判为 `[0,0]`，所有 seek 静默失败、画面永远停在第一帧。
项目根目录已提供 `serve8000.py`（完整 Range 支持）：

```bash
cd hunluanzhizhu.github.io
python serve8000.py 8000
# 打开 http://localhost:8000/projects/liang-intensity-calibrator/
```

（GitHub Pages 等支持 Range 的托管平台无此限制。）

## 提交约定

- `vidios/` 与 `test*.mp4` 已被根 `.gitignore` 排除，**永不入库**
- 入库的只有 `video/liang-evolution.mp4` 这一个运行素材副本