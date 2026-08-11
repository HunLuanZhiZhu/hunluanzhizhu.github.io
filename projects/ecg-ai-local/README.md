# 心韵深辨 · ECG AI Local（H5 版）

> 由微信小程序「心韵深辨」完整转化的纯静态 H5 网页。**全部 9 个页面完整复刻**，无框架、无构建、零外部 CDN。

基于心电信号的智能心律失常检测系统：本地 AI 推理（TensorFlow.js），无需联网上传数据。

## 技术栈

- **推理框架**：TensorFlow.js 4.22.0（本地 vendor，CPU/WebGL 双后端）
- **模型**：SNNConv1d（脉冲神经网络卷积）+ 双向 LSTM + FC，权重 FP16 量化 1.4MB
- **架构**：原生 ES Modules + hash 路由，零依赖零构建

## 目录结构

```
ecg-ai-local/
├── index.html              # 入口（导航栏 + 路由挂载点 + TabBar）
├── css/
│   ├── app.css             # 全局样式（原 app.wxss，含深色模式变量）
│   ├── tabbar.css          # 底部导航（原 custom-tab-bar，CSS 绘制图标）
│   ├── profile-sheet.css   # 个人档案半屏面板
│   └── pages/              # 9 个页面样式（加 page-xxx 作用域前缀）
├── js/
│   ├── app.js              # 全局状态 / TF.js 初始化 / 模型加载 / 推理
│   ├── router.js           # hash 路由（9 页）
│   ├── tabbar.js           # 底部导航组件
│   ├── ui.js               # Toast / Loading / Modal / ActionSheet
│   ├── profileSheet.js     # 个人档案组件
│   ├── storage.js          # localStorage 封装
│   ├── utils/              # 推理核心（与原小程序完全一致）
│   └── pages/              # 9 个页面
├── vendor/                 # TF.js UMD（本地，离线可用）
└── assets/                 # 图片 + 权重文件
```

## 页面清单

| 页面 | 路由 | 说明 |
|------|------|------|
| 检测 | `#/detect` | 导入数据（文件/示例）→ 波形预览 → AI 推理 → 五分类结果 |
| 历史 | `#/history` | 检测记录列表、管理/导出/清空、综合分析入口 |
| 科普 | `#/science` | 5 类 AAMI 心律失常分类卡片 + 动态波形 |
| 团队 | `#/team` | 团队成员、项目背景、技术亮点 |
| 我的 | `#/mine` | 统计、深色模式、模型管理、关于 |
| 分类详情 | `#/category-detail?key=N` | 单分类波形 + 介绍 + 建议 |
| 成员详情 | `#/member-detail` | 团队成员详情 |
| 详情 | `#/info-detail` | 项目背景/技术亮点详情 |
| 综合分析 | `#/analysis` | 风险等级 + 环形图/柱状图 + 个性化建议 |

## 与小程序版差异（H5 适配）

| 小程序 API | H5 替代 |
|---|---|
| `wx.chooseMessageFile` | `<input type="file">` + FileReader |
| `wx.getFileSystemManager` + ZIP 解压加载权重 | `fetch('assets/weights_fp16.bin')` 直接加载（链路简化） |
| `wx.showToast/showModal/showLoading/showActionSheet` | `js/ui.js` 自研组件 |
| `wx.navigateTo/switchTab/navigateBack/reLaunch` | `js/router.js` hash 路由 |
| `wx.getStorageSync/setStorageSync` | `localStorage`（key 完全一致） |
| `wx.createSelectorQuery` + canvas.RAF | `getElementById` + `window.requestAnimationFrame` |
| `wx.shareFileMessage/openDocument`（导出） | Blob + `<a download>` |
| `<button open-type="feedback">` | mailto 链接 |
| 自定义 platform + fetch-wechat polyfill | 浏览器原生（删除） |

**模型推理链路与原小程序完全一致**：同一份 `ecgModel.js`（fp16 解码 → Conv1d → SNN 脉冲 → BiLSTM → FC → softmax）+ 同一权重文件，确保分类结果一致。

## 本地运行

```bash
python -m http.server 8000
# 访问 http://localhost:8000/projects/ecg-ai-local/
```

> 注意：ES Modules 通过 `fetch` 加载，必须通过 HTTP 服务器访问，不能直接双击打开（file:// 协议会因 CORS 失败）。

## 版权

模型与数据来自 MIT-BIH 心律失常数据库（训练用）。本项目为医疗辅助参考工具，检测结果不构成医疗诊断。
