# hunluanzhizhu.github.io

个人静态网页项目合集。每个子项目独立文件夹，首页负责导航。纯前端，无框架、无构建。

## 目录结构

```
hunluanzhizhu.github.io/
├── index.html              # 门户首页（导航页，单文件内含内联字体、CSS、JS）
├── 404.html                # 未知路径（GitHub Pages 自动使用）
├── og.png                  # 社交分享预览图（1200×630，构建产物）
├── favicon.ico / favicon.svg / apple-touch-icon.png
├── robots.txt / sitemap.xml / site.webmanifest
├── tools/                  # 资产生成脚本（手动运行，不在部署时执行）
│   ├── subset-font.py      # 把首页字体子集化并内联进 index.html
│   └── make-images.py      # 生成 og.png 与 apple-touch-icon.png
└── projects/               # 子项目（完整清单见下表）
    ├── minecraft-web/      # Minecraft Web（Rust + Bevy · WASM 3D 沙盒）
    │   ├── index.html
    │   ├── minecraft_web.js
    │   └── minecraft_web_bg.wasm
    └── neon-pulse/         # 霓虹脉冲（Canvas 闪避街机）
        └── index.html
```

## 个人项目

| #  | 项目            | 路径                       | 技术栈                |
|----|----------------|----------------------------|----------------------|
| 01 | Minecraft Web  | `/projects/minecraft-web/` | rust · bevy · wasm   |
| 02 | 霓虹脉冲        | `/projects/neon-pulse/`    | canvas · arcade      |
| 03 | 组会 PPT 合集 (Group Meeting PPTs) | `github.com/HunLuanZhiZhu/zuhui-ppt` | slides · katex · svg · webgl |
| 04 | GUON Optimizer | `/projects/guon-paper/`     | llm · optimizer · satire |
| 05 | 心韵深辨 (ECG AI Local) | `/projects/ecg-ai-local/` | tfjs · snn · local-ai |
| 06 | AI 连续版 · 滑动变祖器 (Liang Calibrator) | `/projects/liang-intensity-calibrator/` | image2 · h3-ai · video · canvas |
| 07 | AI 游戏生成评测 第二届 (Game Studio Eval) | `/projects/game-studio-eval-s2/` | benchmark · godot · wasm |
| 08 | 动态 SVG 鹈鹕 (Dynamic SVG Pelican) | `/projects/svg-pelican/` | svg · smil · deepseek-v4-pro |
| 09 | Blender 3D 建模 (Blender 3D) | `/projects/blender-3d/` | blender · gltf · webgl · deepseek-v4.1-flash |

### 客户项目

| # | 项目 | 路径 | 技术栈 | 费用 |
|---|------|------|--------|------|
| C01 | Breakout 霓虹重制 | `/projects/clients/breakout/` | godot · svg · wasm | ¥10 |
| C02 | 活动经费记账 (Fund Manager) | `/projects/fund-manager/` | indexeddb · sheetjs · single-page | 未标注 |

> `fund-manager` 在首页归入「客户项目」，但**访问路径保持 `projects/fund-manager/` 不变** ——
> 移动的是它在这张页面上的位置，不是它的 URL。它的图形也不写任何金额。

> 首页的 `03` 是原 `group-meeting-eml` 与 `group-meeting-ct` **合并后的一个条目**，
> 指向组会 PPT 合集仓库 `github.com/HunLuanZhiZhu/zuhui-ppt`。
> 两个原始场次页面**仍部署在各自路径上**（`/projects/group-meeting-eml/`、
> `/projects/group-meeting-ct/`），但首页已不再链接它们 —— 只占一张卡片是合并的目的。
> 要恢复入口，在 03 的 `descZh`/`descEn` 里补两个内联链接即可。

> 说明：首页注册的是 **第二届** 的 `game-studio-eval-s2`；第一届结果在
> `/projects/game-studio-eval/`，两个页面互相链接。另外
> `/projects/ecg-ai-local1/` 是早期副本，未在首页注册。

## 首页结构

首页是**单文件 HTML**（内联字体、CSS 与 JS，零网络依赖，克隆即可打开）。
三个 `section` 加页脚，四段各有不同形状：

| 段 | 内容 |
|----|------|
| Hero | 终端提示符式的巨型标题 + 读数面板：只报**项目数、客户数与项目类型**，全部由数据数组推导，没有手写的数字 |
| 个人索引 | 3 列马赛克，9 个项目。卡片的跨列数按顺序取 `3, 2, 1, 2, 1, 3, 2, 1, 3`，**桌面 3 列与 768px 的 2 列都恰好铺满每一行且不留空洞**，因此无需 `dense` 排布，DOM 顺序与阅读顺序、Tab 顺序一致。增删项目后必须重算这个序列（`3` 独占一行、`2`+`1` 成对、`1`+`1`+`1` 成组） |
| 客户项目 | 全幅出血带，独立底色，每单一段「委托 → 内容 → 交付」；两条之间有分隔线。C01 标注费用，C02 不写金额 |
| 页脚 | 两列小页脚 + 构建说明 |

### 11 张图形（零位图）

每张卡片上的图形都由 canvas 2D **按该项目自身的物理实时绘制**，仓库里没有任何预览位图。
每张的实时读数前缀由数据里的 `id` 注入，所以改动编号不会在图形里留下过期数字。

| 图 | 项目 | 画的是 |
|----|------|--------|
| 01 | Minecraft Web | 等距体素晶格，方块分层加注并各自轻微起伏 |
| 02 | 霓虹脉冲 | 单点透视航道，光墙迎面推近，光点在其间穿行 |
| 03 | 组会 PPT 合集 | 讲稿扇面摊开，一支连续播放头扫过，下方到场次括号随之高亮 |
| 04 | GUON Optimizer | 等高线损失曲面上的无状态下降，头部连续推进、轨迹按步重置 |
| 05 | ECG AI Local | 心电节律条带滚动，R 波被逐拍标出 |
| 06 | Liang Calibrator | 0–30 级滑杆，刻度随播放头逐格填充 |
| 07 | Game Studio Eval | 五位选手的评测记分板，达标线之上的领先者被标出 |
| 08 | Dynamic SVG Pelican | 鹈鹕轮廓按版本逐笔重绘，一支笔头沿轮廓巡回，底部是版本刻度 |
| 09 | Blender 3D | 旋转体的三种初始灯型（球 / 锥 / 梭）线框，激活的一种缓慢形变 |
| C01 | Breakout | 霓虹砖墙逐块消解，挡板与球带轨迹 |
| C02 | Fund Manager | 账本流水：四行功能条目 + 完成度规则，当前行带一个行进的处理头。**不写任何金额**，只报状态 |

### 交互

- **命令面板**：`/` 或 `Ctrl K`（Apple 平台显示 `Cmd K`）唤起，输入即过滤全部 11 个项目，
  `Tab` 补全技术栈标签，`↑↓` 移动，`Enter` 打开，`Esc` 关闭并归还焦点，面板内有焦点陷阱。
  筛选状态写进 URL（`?q=`），可分享、可后退。顶栏有**常驻可见入口**，不做隐藏快捷键。
- **悬停 / 聚焦 = 运行**：指针设备上悬停卡片会启动该卡的图形，卡片底部的说明行会打出
  **该图形自己的实时读数**（如 `图06 · 帧 17/30`），而不是统一的抬升动画。
- **触摸设备**：`(hover:none)` 或 `pointer:coarse` 时，每张卡片显示真实的「运行」按钮
  （≥44px），因为触摸端没有悬停。
- **外部项目**：组会 PPT 合集的主场在 GitHub，那张卡的按钮写作「GITHUB →」并新标签页打开，
   `target="_blank"` / `rel="noopener"` 齐备，屏幕阅读器另有一句在讲这件事。
- **语言**：ZH / EN 切换，写入 `localStorage`，卡片描述与全部界面文案同步切换。
- **滚动进度**：顶部那道酸绿光带即页面滚动进度。

### 动效预算

一帧 rAF 驱动全部图形，速率是**配额**而非统一值：被指向或刚启动的图形跑满帧率，
仅在视口内闲置的图形降到约 10fps 且时间流速放慢，视口外的完全不参与。
`prefers-reduced-motion` 下不起循环，改为每张图形绘制一张**构图完成的静帧**
（每张图的静止时刻是单独选定的，见 `index.html` 里的 `STILL` 表）。

### 字体

正文使用 **Cascadia Mono**（SIL OFL 1.1），由 `tools/subset-font.py` 子集化后
以 base64 woff2 内联进 `index.html`（约 20KB），因此页面零网络请求、离线可用，
且每位访问者看到的是同一套字形，而不是各自系统里碰巧存在的等宽字体。
中文回落到系统字体（中文等宽本身不该用等宽拉丁字面）。

> 该字体缺少 `↵ ↗ ⌘ ⌥ ⌃ ⇧` 等字形，页面文案已避开这些字符；
> 新增文案若用到它们，`python tools/subset-font.py --report` 会报出来。
> 首页与 404 页共用同一份内联子集。

## 新增子项目

1. 在 `projects/` 下新建文件夹，放入 `index.html` 及资源
2. 编辑根 `index.html`，在 `projects` 数组里追加一条：
   ```js
   { id:'10', slug:'my-thing', title:'MY THING', tag:'DEMO',
     kind:'app', stack:['canvas'], fig:'voxel', d:1,
     labelZh:'体素晶格', labelEn:'VOXEL LATTICE',
     descZh:'一句话描述。', descEn:'One line.' }
   ```
   - `fig` 选择 `MARKS` 里已有的绘制器，或在 `MARKS` 中新增一个
   - `kind` 取 `3D` / `game` / `talk` / `paper` / `app` / `tool` 之一，首页读数面板的
     「类型」一行由此推导
   - 指向站外时加 `href:'https://…'`，卡片按钮会自动改写作「GITHUB →」并新标签页打开
   - `d` 是桌面 3 列的跨列数。**增删项目后必须重算整个序列**：3 列下每行要正好填满
     （`3` 独占一行；`2`+`1` 成对；`1`+`1`+`1` 成组），且同一序列映射到 2 列
     （`3`→`2`，`2`→`1`，`1`→`1`）后也必须不留空洞，否则马赛克会出现空格
3. 同步更新 `sitemap.xml`
4. 子项目内引用根目录 favicon 用绝对路径 `/favicon.ico`
5. 提交即可，无需构建

## 本地预览

```bash
python -m http.server 8000
# 访问 http://localhost:8000/
```

> 提示：`liang-intensity-calibrator`（AI 连续版滑动变祖器）依赖视频逐帧 seek，
> 需支持 Range 请求的服务器。本地预览该子项目时请改用根目录的
> `serve8000.py`（`python serve8000.py 8000`），否则 Chrome 会判定视频不可 seek。

## 重新生成资产

```bash
python tools/subset-font.py --inject index.html 404.html   # 字号子集变了才需要
python tools/subset-font.py --report                      # 检查字形覆盖
python tools/make-images.py                               # 重新生成 og.png / apple-touch-icon.png
```

两个脚本都只在本地手动运行，不参与部署。

## 备注

- `projects/minecraft-web/minecraft_web_bg.wasm` 约 97MB，已直接提交在仓库中。
  未来如有更多大文件，建议改用 [Git LFS](https://git-lfs.com) 或 Release 附件，避免仓库膨胀。
- 首页为单文件 HTML（内联字体/CSS/JS），零外部依赖，加载即用。
- `og.png` 与 `apple-touch-icon.png` 是仓库里仅有的两张位图：OG 预览图在平台侧只接受
  位图格式，且它们都是由 `tools/make-images.py` 用本项目自己的图形代码渲染出来的**构建产物**，
  不是找来的素材。
