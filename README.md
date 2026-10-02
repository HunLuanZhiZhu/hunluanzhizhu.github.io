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
| 03 | 组会 PPT 合集 (Group Meeting PPTs) | `/projects/group-meeting-ppts/` | slides · katex · svg · webgl |
| 04 | GUON Optimizer | `/projects/guon-paper/`     | llm · optimizer · satire |
| 05 | 心韵深辨 (ECG AI Local) | `/projects/ecg-ai-local/` | tfjs · snn · local-ai |
| 06 | AI 连续版 · 滑动变祖器 (Liang Calibrator) | `/projects/liang-intensity-calibrator/` | image2 · h3-ai · video · canvas |
| 07 | AI 游戏生成评测 第二届 (Game Studio Eval) | `/projects/game-studio-eval-s2/` | benchmark · godot · wasm |
| 08 | 动态 SVG 鹈鹕 (Dynamic SVG Pelican) | `/projects/svg-pelican/` | svg · smil · deepseek-v4-pro |
| 09 | Blender 3D 建模 (Blender 3D) | `/projects/blender-3d/` | blender · gltf · webgl · deepseek-v4.1-flash |
| 10 | Open Design Test | `/projects/open-design-test/` | webgl2 · shader · open-design · deepseek-v4.1-flash |

### 客户项目

| # | 项目 | 路径 | 技术栈 | 费用 |
|---|------|------|--------|------|
| C01 | Breakout 霓虹重制 | `/projects/clients/breakout/` | godot · svg · wasm | ¥10 |
| C02 | 活动经费记账 (Fund Manager) | `/projects/fund-manager/` | indexeddb · sheetjs · single-page | 未标注 |

> `fund-manager` 在首页归入「客户项目」，但**访问路径保持 `projects/fund-manager/` 不变** ——
> 移动的是它在这张页面上的位置，不是它的 URL。它的图形也不写任何金额。

> 首页的 `03` 是原 `group-meeting-eml` 与 `group-meeting-ct` **合并后的一个条目**。
> 它指向 `/projects/group-meeting-ppts/` —— 一个**聚合页**，从那里再进各场讲稿。
> 两场讲稿仍部署在各自路径上（`/projects/group-meeting-eml/` 32 页、
> `/projects/group-meeting-ct/` 43 页），源码仓库在
> [HunLuanZhiZhu/zuhui-ppt](https://github.com/HunLuanZhiZhu/zuhui-ppt)。
> 首页卡片本身不跳站外。

> 说明：首页注册的是 **第二届** 的 `game-studio-eval-s2`；第一届结果在
> `/projects/game-studio-eval/`，两个页面互相链接。另外
> `/projects/ecg-ai-local1/` 是早期副本，未在首页注册。

## 首页结构

首页是**单文件 HTML**（内联字体、CSS 与 JS，零外部运行依赖）。本次设计只作用于根首页，不与子页面共享样式。

| 段 | 内容 |
|----|------|
| Hero | Browser Lab 大标题、中文/英文简介、可交互三叶结线框雕塑。个人作品、客户作品、探索方向数量都由注册数组计算。可直接跳到作品索引，也可切换雕塑形态、暂停全部动效。 |
| 作品索引 | 9 个项目，桌面 3 列（>1100px）、平板 2 列、手机 1 列（≤580px）。同一行等高，DOM 和 Tab 顺序与注册顺序一致。图形、标题及留白组织层级，卡片整体可点，源码链接和触摸端运行按钮独立可用。 |
| 客户作品 | 独立的深色区域：桌面为侧标题加 2 列作品，手机为单列；保留委托信息、技术栈、交付元数据与已有费用字段，C02 不显示金额。 |
| 页脚 | 大字号结语、回到顶部、本页导航和外部链接。 |

### 首页交互

- **分类**：全部作品 / 交互与图形 / 研究与分享 / 应用与工具，按注册数据的 `kind` 过滤个人作品。分类记录在 `?category=`，支持刷新、分享和浏览器后退。
- **搜索**：顶栏搜索按钮、`/`、`Ctrl K`（Apple 平台为 `Cmd K`）唤起，检索全部 11 个项目；搜索词记录在 `?q=`。正文和技术栈做文本匹配，英文标题支持缩写匹配。输入作为文本安全显示。
- **搜索键盘操作**：`↑↓` 选择、`Enter` 打开；`Tab` 补全未完成的技术栈前缀，再按 `Tab` 在输入框和关闭按钮之间循环。`Esc` 或可见关闭按钮关闭面板，焦点回到触发处，背景在打开期间设为 `inert`。
- **触摸与鼠标**：鼠标悬停或键盘聚焦卡片时启动图形；触摸设备提供至少 44px 的运行按钮。主视觉随鼠标轻微转动，触摸端可用「切换形态」按钮。
- **语言**：ZH / EN 写入 `localStorage`；描述、分类、搜索、计数和操作文案同步切换。
- **动效**：「暂停动效」控制主视觉与所有项目图形，选择会保存。尊重系统 `prefers-reduced-motion`，并在系统偏好改变时即时响应。暂停或减少动效时仍可切换静态雕塑形态。
- **链接**：所有项目主入口都保持原有本站路径；卡片内的源码链接在新标签页打开，并带有 `rel="noopener"`。
- **滚动**：使用原生滚动、锚点跳转和顶部进度线，没有滚动劫持。

### 子项目聚合页：`/projects/group-meeting-ppts/`

与首页同一套设计语言的场次索引：标题、两场的页数（32 + 43 = 75，由数据推导）、
每场一张**页码条**图形 —— 一个刻度代表一页，每 5 页加高，读过的点上酸绿、
未读的保持灰暗，一根连续阅读头扫过，右上角是「第 N / 总页数」实时读数。

每张卡片整体可点（拉伸链接覆盖全卡），边框常显、悬停变强调色。
两场的链接指向本站的演示页，源码仓库在页面底部的「源码」一段里。

### 主视觉与 12 张项目图形（零位图）

首页主视觉为 Canvas 2D 实时投影的三叶结线框，有两种可切换形态；项目卡片保留 12 个独立绘制器，首页不使用预览位图。
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
| 10 | Open Design Test | 水面涟漪波前：三个落点各自呼出椭圆波前并相互交叠成干涉网，落点即点击 |
| C01 | Breakout | 霓虹砖墙逐块消解，挡板与球带轨迹 |
| C02 | Fund Manager | 账本流水：四行功能条目 + 完成度规则，当前行带一个行进的处理头。**不写任何金额**，只报状态 |

### 动效预算

一个 `requestAnimationFrame` 循环同时驱动主视觉和项目图形：主视觉最高 30fps；
正在交互的项目图形最高 60fps，视口内闲置图形约 12fps 并减慢时间流速，视口外不绘制。
页面不可见、用户暂停或系统要求减少动效时停止循环。窗口缩放和字体就绪后重新计算尺寸。
减少动效时，项目图形使用 `STILL` 表中单独选定的完整静帧。

### 字体

首页展示字使用 **Bricolage Grotesque**，元信息使用 **Cascadia Mono**，中文使用系统中文字体。
两款拉丁字体都以子集 WOFF2 内联在 HTML 中，页面运行无需字体请求。
Bricolage Grotesque 的完整 SIL OFL 1.1 许可证和上游地址保留在 `display-font` 样式块注释中。
原 `font` 样式块中的 Cascadia Mono 仍可通过 `tools/subset-font.py` 更新；该脚本不会改动新增的展示字体块。
404 页和各子项目字体保持不变。

## 新增子项目

1. 在 `projects/` 下新建文件夹，放入 `index.html` 及资源
2. 编辑根 `index.html`，在 `projects` 数组里追加一条：
   ```js
   { id:'10', slug:'my-thing', title:'MY THING', tag:'DEMO',
     kind:'app', stack:['canvas'], fig:'voxel',
     labelZh:'体素晶格', labelEn:'VOXEL LATTICE',
     descZh:'一句话描述。', descEn:'One line.' }
   ```
   - `fig` 选择 `MARKS` 里已有的绘制器，或在 `MARKS` 中新增一个
   - `kind` 取 `3D` / `game` / `talk` / `paper` / `app` / `tool` 之一，首页「探索方向」计数与分类由此推导
   - 项目主入口统一指向 `projects/<slug>/`；需要源码链接时放入描述，不改变项目访问路径
   - 卡片布局无需额外字段：桌面自动排 3 列、平板 2 列、手机 1 列；新增 `kind` 时同步维护首页分类映射
3. 同步更新 `sitemap.xml`
4. 子项目内引用根目录 favicon 用绝对路径 `/favicon.ico`
5. 提交即可，无需构建

## 验证说明

首页、`404.html`、`projects/group-meeting-ppts/` 三页都跑过 motion-web 的验收底线
（无 console 错误、320/375/414/768/1440 无横向溢出、恰好一个 `<h1>`、`lang`、
landmarks、≥3 种 section 形状、字号比 ≥4、无「引用却未定义」的自定义属性、
body 自绘底色、真实滚轮与 hover 有反应）。

**一个已知例外**：`404.html` 不通过「真实滚轮要改变页面」这一条 —— 它在 1440×900 下
`scrollHeight == innerHeight`，本来就没有可滚动的内容，这条断言对它不成立，不是缺陷。

字号比这一条抓出过一个真实的静默故障：`clamp()` 里的 `+` **两侧必须有空格**，
否则整条声明被丢弃、元素回落到浏览器默认字号。本项目在 `404.html` 与
旧版客户条带的 `.commission__title` 上各中过一次（分别回落到 32px 与 15px）。改动 `clamp()` 后
务必再跑一次验收底线。

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
