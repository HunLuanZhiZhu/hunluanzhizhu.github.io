# 心韵深辨 · ECG AI Local（H5 版 v2）

> 微信小程序「心韵深辨」v2 的完整 H5 转化。**保留原代码 + 适配层**方案：业务 JS/WXML/WXSS 几乎逐字节保留，仅用 shim 层替代微信特有 API。

基于心电信号的智能心律失常检测系统：本地 AI 推理（TensorFlow.js），无需联网上传数据。

## 迁移方案（保留原代码 + 适配层）

与 v1（全重写）不同，v2 采用**最小改动**策略：

1. **复制**：原小程序的 `pages/`、`subpackages/`、`utils/`、`components/`、WXML、WXSS 原样复制
2. **包装**：每个 JS 文件外层包 `define(id, function(module, exports, require){ 原代码 })`，`require` 懒加载模式原样工作
3. **shim 适配层**（`shim/`）替代微信特有能力：
   - `module.js` — 极简 CommonJS 加载器（require 懒加载）
   - `wx.js` — 28 种 wx.* API → Web API（storage/UI/导航/剪贴板/canvas 查询等）
   - `runtime.js` — App()/Page()/Component()/setData/事件委托/生命周期
   - `template.js` — WXML 渲染引擎（{{}} 插值 + wx:if/for 指令）
   - `router.js` — hash 路由（5 tab + 5 子页）
   - `tabbar.js` — 底部导航控制器
4. **差异点替换**（仅 3 处）：
   - `app.js` loadModel：ZIP 解压链路 → fetch 直载 `assets/weights_fp16.bin`
   - `app.js` initTF：删 fetch-wechat/setPlatform（H5 原生）
   - `app.js` toggleTheme：getCurrentPages 遍历 → 事件总线广播
5. **转换**：WXML → HTML（`tools/wxml2html.js` 逐字符解析器，正确处理 `{{expr}}` 内含 `>`）；WXSS → CSS（`page`→`:root/body`，页面样式加 `.page-xxx` 作用域前缀）

## 技术栈

- **推理**：TensorFlow.js 4.22（本地 vendor，CPU 后端）
- **模型**：SNNConv1d + BiLSTM + FC，FP16 权重 1.5MB（与小程序逐字节一致）
- **架构**：原生 JS + CommonJS 加载器，无框架无构建

## 目录结构

```
ecg-ai-local/
├── index.html              # 入口（shim + vendor + wrapped 模块 + boot）
├── shim/                   # 适配层（微信 API → Web）
│   ├── module.js wx.js runtime.js template.js router.js tabbar.js ui.js boot.js templates.js
├── pages/                  # 5 个 tab 页（detect/history/science/team/mine，原代码 wrapped）
├── subpages/               # 5 个子页（analysis/category-detail/info-detail/member-detail/settings）
├── utils/                  # 工具模块（spikeEncoder/ecgSamples/demoSamples/fileParser/animateValue/ecgModel/exportHelper/waveAnimator）
├── components/             # profile-sheet 组件
├── templates/              # WXML 转换后的 HTML 模板
├── css/                    # app.css + 10 页 css + tabbar/profile-sheet
├── vendor/                 # TF.js UMD（本地）
├── assets/                 # 图片 + 权重
└── tools/                  # wxml2html.js + wrap-cjs.js（转换/包装脚本）
```

## 页面清单（10 页）

| 页面 | 路由 | 新版特性 |
|------|------|---------|
| 检测 | `#/detect` | 文件导入/示例卡、滚动公告、三步骤、置信度数字滚动 |
| 历史 | `#/history` | 分组头（今天/昨天）、骨架屏、7 天趋势、环图、编辑删除 |
| 科普 | `#/science` | 精选轮播、分类筛选、搜索、5 canvas 波形、返回顶部 |
| 团队 | `#/team` | 指标卡、成员（匿名）、项目背景/历程/技术亮点折叠 |
| 我的 | `#/mine` | 心律分类分布、健康评分环、7 天趋势、8 周活跃度热力图 |
| 综合分析 | `#/analysis` | 4 宫格指标、环形图/柱状图、个性化评语 |
| 分类详情 | `#/category-detail?key=N` | 完整医学科普 + 波形动画 |
| 成员详情 | `#/member-detail` | 成员信息 |
| 详情 | `#/info-detail` | 文章/项目背景，阅读进度条 |
| 设置 | `#/settings` | 存储用量、主题、模型重载、导出/清空 |

## 隐私说明

团队页与成员页已匿名化：成员名为「神秘人 A/B/C」，学历去除学校名，删除真实电话/邮箱，头像统一使用 `assets/smr.jpg`。

## 本地运行

```bash
python -m http.server 8000
# 访问 http://localhost:8000/projects/ecg-ai-local/
```

> ES Modules 需通过 HTTP 服务器访问（file:// 会因 CORS 失败）。

## 模型一致性

模型推理代码（`utils/ecgModel.js`/`spikeEncoder.js`）与权重文件与原小程序**逐字节一致**，5 个标注样本（F/N/Q/S/V）推理结果全部与标注一致（置信度 84.8%~100%）。

## 版权

模型与数据来自 MIT-BIH 心律失常数据库。检测结果仅供参考，不构成医疗诊断。
