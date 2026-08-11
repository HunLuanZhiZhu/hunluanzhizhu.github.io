# hunluanzhizhu.github.io

个人静态网页项目合集。每个子项目独立文件夹，首页负责导航。纯前端，无框架、无构建。

## 目录结构

```
hunluanzhizhu.github.io/
├── index.html              # 门户首页（导航页）
├── favicon.ico
└── projects/               # 所有子项目
    ├── minecraft-web/      # Minecraft Web（Rust + Bevy · WASM 3D 沙盒）
    │   ├── index.html
    │   ├── minecraft_web.js
    │   └── minecraft_web_bg.wasm
    └── neon-pulse/         # 霓虹脉冲（Canvas 闪避街机）
        └── index.html
```

## 子项目

| #  | 项目            | 路径                       | 技术栈                |
|----|----------------|----------------------------|----------------------|
| 01 | Minecraft Web  | `/projects/minecraft-web/` | rust · bevy · wasm   |
| 02 | 霓虹脉冲        | `/projects/neon-pulse/`    | canvas · arcade      |
| 03 | EML 组会汇报    | `/projects/group-meeting-eml/` | slides · katex · webgl |
| 04 | GUON Optimizer | `/projects/guon-paper/`     | llm · optimizer · satire |
| 05 | 心韵深辨 (ECG AI Local) | `/projects/ecg-ai-local/` | tfjs · snn · local-ai |
| 06 | AI 连续版 · 滑动变祖器 (Liang Calibrator) | `/projects/liang-intensity-calibrator/` | image2 · h3-ai · video · canvas |

## 新增子项目

1. 在 `projects/` 下新建文件夹（如 `projects/my-thing/`），放入 `index.html` 及资源
2. 编辑根 `index.html`，在 `projects` 数组里追加一条：
   ```js
   { id:'03', slug:'my-thing', title:'MY THING', tag:'DEMO',
     stack:['canvas'], desc:'一句话描述。' }
   ```
3. 子项目内引用根目录 favicon 用绝对路径 `/favicon.ico`
4. 提交即可，无需构建

## 本地预览

```bash
python -m http.server 8000
# 访问 http://localhost:8000/
```

> 提示：`liang-intensity-calibrator`（AI 连续版滑动变祖器）依赖视频逐帧 seek，
> 需支持 Range 请求的服务器。本地预览该子项目时请改用根目录的
> `serve8000.py`（`python serve8000.py 8000`），否则 Chrome 会判定视频不可 seek。

## 备注

- `projects/minecraft-web/minecraft_web_bg.wasm` 约 97MB，已直接提交在仓库中。
  未来如有更多大文件，建议改用 [Git LFS](https://git-lfs.com) 或 Release 附件，避免仓库膨胀。
- 首页为单文件 HTML（内联 CSS/JS），零外部依赖，加载即用。
