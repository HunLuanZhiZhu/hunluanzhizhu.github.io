# 把 CT 读懂：合成 · 检测 · 分割（组会文献汇报）

一份组会文献汇报用的横版网页 PPT：**43 页**，逐篇拆解三篇 CT 深度学习论文的「问题 — 方法 — 证据 — 边界」，
三篇构成「合成 → 检测 → 分割」的任务谱系。纯静态单文件 HTML（样式与内容全部内联），
`index.html` 打开即可演示，无需构建、无需后端。

- 访问路径：`/projects/group-meeting-ct/`
- 版式：Swiss / Carbon 2x Grid（8px 模数），默认主题 IKB 克莱因蓝
- 视觉体系：18 种注册版式、3 张几何 SVG 示意图、9 个 KaTeX 公式、论文图裁切放大

## 三篇论文

| # | 主题 | 论文 | 出处 |
|---|------|------|------|
| P1 | 合成：平扫 CT → 数字对比 CTPA | Digital Contrast CT Pulmonary Angiography Synthesis from Non-contrast CT for Pulmonary Vascular Disease Diagnosis | Elsevier 单栏投稿稿（原文未印期刊/年份/DOI） |
| P2 | 检测：腹部 CT 气腹检测 | PACT-3D, a deep learning algorithm for pneumoperitoneum detection in abdominal CT scans | Nature Communications, 2024 |
| P3 | 分割：脑实质与脑室系统分割 | Deep learning-based segmentation of brain parenchyma and ventricular system in CT scans in the presence of anomalies | Frontiers in Neuroimaging, 2023 |

汇报中出现的数字均可回溯到原文页码（核对笔记见下方「素材来源」章节说明）。
三篇论文的英文原题与出处也在封面页列出，与汇报人信息严格分离。

## 演示操作

| 操作 | 说明 |
|------|------|
| `→` `↓` `Space` `PageDown` / 滚轮 / 触摸滑动 | 下一页 |
| `←` `↑` `PageUp` | 上一页 |
| `Home` / `End` | 首页 / 末页 |
| `Esc` | 切换缩略图总览 |
| `N` | 切换演讲者备注面板（逐页备注随页码自动同步） |
| `B` | 切换低功耗模式（停止动效，便于投屏或省电） |

页面底部固定术语条 `term-strip`：正片中每一页出现的专业术语都在原地给出中文解释，
正文英文括注 1369 处，面向非医学听众。

## 目录结构

```
group-meeting-ct/
├── index.html          # 全部 43 页（样式/脚本/演讲者备注内联，单文件）
└── assets/
    ├── fig*.png        # 12 张论文图（含裁切放大版）
    └── katex/          # 本地 KaTeX（katex.min.js/css + contrib + 20 个 woff2 字体）
```

## 离线可用性

- KaTeX 与动效运行时（Motion One）**均已本地化**：双击 `index.html` 用 `file://` 打开，
  公式与动效都能正常渲染，不依赖网络。
- Google Fonts 与 lucide 图标走 CDN，离线时自动降级为系统字体（模板带 Windows 字重补偿），
  不影响阅读；本 deck 未使用 lucide 图标。

## 验证情况

交付前做过结构门、程序化版面审查与逐页视觉评分，结论如下（数字取自构建工作区的检查报告）：

- 结构门：43 页、18 种版式、最长连续同版式 2、术语条全覆盖、讲稿 7108 中文字（约 32 分钟）。
- 版面：在 1920×1080 / 1920×950 / 1600×900 / 1440×900 / 1366×768 / 1280×800 六个视口实测，
  内容溢出 0 处、越过底部安全区 0 处、可见文字 < 14px 0 处、图片加载失败 0 张、控制台错误 0。
- 视觉评分：多轮独立评审最终约 **4.2 / 5.0**（未达模板脚本设定的 4.5 阈值，已知短板为
  竖幅原图受纵横比限制偏小、部分卡片页下三分之一留白）。

## 素材来源与可复现性

`index.html` 由构建工作区（仓库外，`ppts/zuhui260913/ppt_v1/`）的 `build_v1.py` 从
Swiss 模板生成，本目录内的 `index.html` 与其构建产物**逐字节一致**，未做手工改动。

**未随仓库提交**（留在构建工作区，需要改版时在那里重建）：

- `build/`、`build_v1.py`：逐页源文件与注入脚本，改内容改版式的唯一入口
- `notes/paper{1,2,3}_content.md`：三篇论文逐页核对笔记，每个关键数字标注原文页码
- `slide_plan_v1.md`、`speaker_notes_v1.md`、`visual_plan_v1.md`：故事脊椎、讲稿、视觉计划
- `qa_check.py`、`layout_audit.py`、`render_deck.py`、`qa_report_v1.md`、`visual_score_v1.md`：检查脚本与报告
- `papers/`：三篇论文 PDF 与原始插图；`assets/` 中未被引用的裁切中间产物

因此：**改文案或版式请回到构建工作区重建，不要直接改本目录的 `index.html`**，否则与构建产物失去一致性。

## 本地预览

从仓库根目录起 HTTP 服务即可（本 deck 无视频、无 Range 需求，普通静态服务器足够）：

```bash
python -m http.server 8000
# 访问 http://localhost:8000/projects/group-meeting-ct/
```
