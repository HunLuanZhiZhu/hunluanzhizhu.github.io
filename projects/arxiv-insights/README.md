# arXiv 洞察 · 交互式论文讲解

这是 GitHub Pages 上的独立静态子项目，目标是把有研究价值的 arXiv 论文变成**通俗但严谨的中文交互讲解**。仓库使用当前连接的 GitHub 账号对应的 `<github用户名>.github.io` 用户站点命名；实际仓库、默认分支和自定义域名以当前环境为准。论文 HTML 的提交与索引生成是独立流程，是否完成线上部署须实际验证。

## 页面

- 首页论文流：`index.html`（默认展示按本站收录时间排序的**最新 24 篇**完整讲解；同页切换历史论文与本地收藏）
- 独立项目介绍与方法页：`about.html`（原首页的大幅介绍、研究工作流交互图和方法来源移至此处）
- 内容清单：`data/papers.json`（由 GitHub Actions 自动生成）
- 单篇论文页面：`papers/<arxiv-id>/index.html`
- 四份 Skill：`skills/arxiv-hot-papers/SKILL.md`（论文发现）、`skills/paper-html-explainer/SKILL.md`（中文交互讲解）、`skills/hourly-paper-pipeline/SKILL.md`（单次总控）、`skills/chat-paper-publisher/SKILL.md`（普通聊天人工授权发布）

**页面逻辑：读者打开首页即进入论文列表，不以项目自我介绍占据首屏。** 导航中的「关于本站」单独介绍项目理念、方法来源及隐私原则；首页只负责浏览、搜索、筛选及收藏。保持原生 HTML / CSS / JavaScript、无打包流程、无需外部内容分发网络。项目相对路径须兼容 GitHub Pages 的 `/projects/arxiv-insights/` 子路径及站点实际域名。

## Skill 来源及改造范围

1. **发现热点论文**：参考 [Yilgrimage/arxiv-digest](https://github.com/Yilgrimage/arxiv-digest) 的三源检索、社区热度信号、筛选和推荐历史设计，并以 [Hugging Face 官方论文 Skill](https://github.com/huggingface/skills/blob/main/skills/huggingface-papers/SKILL.md) 的公开 API 信息为接口参考。本仓库的 `arxiv-hot-papers` 是**重新编写的站点适配说明**，没有复制原仓库脚本、模型评分结果或 QQ/OpenClaw 调度设置。
2. **生成 HTML 讲解**：参考 [sukanthoriginal/interactive-paper-explainers](https://github.com/sukanthoriginal/interactive-paper-explainers)（MIT License）双层讲解、论文专属交互和静态网页发布的思路。本仓库的 `paper-html-explainer` 是**重新编写的站点适配说明**，没有复制其反馈服务器和运行时代码。
3. **单次总控**：`hourly-paper-pipeline` 读取并调用上述两份 Skill 的规范，目标一次选择、精读、生成、验证并暂存**一篇**完整讲解。用于未来每小时一次、每天目标 24 篇的调度，定时调度需单独授权与配置。

4. **普通聊天人工发布**：`chat-paper-publisher` 专门处理用户在非定时任务的普通对话中明确授权的草稿发布；读取并调用 `tools/preflight_papers.py` 对待提交 HTML 进行只读元数据检查，再通过 GitHub 插件提交并核查索引构建与 Pages 状态。脚本不是 Git Hook 或 CI 强制门禁，不会自动触发发布，也不属于定时生产流程。

这些是存储在仓库中的 **Agent Skill 指令文件**，不是由浏览器执行的脚本。ChatGPT 定时任务不会因为文件存在而自动安装或加载它们；若未来接入任务，需要在每次运行中明确读取总控及两份子 Skill 的 `SKILL.md`，并按权限调用论文检索及 GitHub 插件 工具。具体执行是否可用取决于该轮任务的连接与权限。

自动总控只生成并验收 HTML 附件，不提交文章或触发索引；人工发布须在普通对话中经用户明确批准，通过 GitHub 插件单独执行。为首页「最新 24 篇」的稳定排序，每篇新增记录应写入 `added_at`（本站登记完成的 UTC 时间）；「历史」读取全部历史记录；「我的收藏」由浏览器本地存储管理，不写入 GitHub。这三个首页视图现已实现，首页通过 JavaScript 自动加载并定期刷新 `data/papers.json`，每小时内容任务无需修改首页代码。首页第一屏默认显示「最新 24 篇」，按 `added_at` 从新到旧取最多 24 篇（旧记录缺少该字段时回退到归档日期、发表日期），**不按小时数过滤**；「历史论文」与「我的收藏」使用同页标签切换；项目介绍已移至独立的 `about.html`。

## 本地收藏与 JSON 备份

- 网站的「最新 24 篇」按本站新增时间倒序取前 24 条，哪怕论文已收录多于 24 小时也仍可显示；「历史论文」可回顾全部已收录论文（包括当前最新 24 篇）；「我的收藏」按 arXiv ID 在浏览器的 `localStorage` 中保存，不上传到 GitHub。
- 收藏视图有「导入收藏」和「导出收藏」按钮。导出会在浏览器内下载一个 JSON 文件；导入仅在浏览器中解析文件，**按稳定 arXiv ID 合并去重、保留现有收藏，不向服务器上传文件**。
- 备份结构为 `{"format":"arxiv-insights-bookmarks","version":1,"exported_at":"...","bookmarks":[...]}`；每个条目包括 `arxiv_id`、标题、简介、主题及 `saved_at` 等必要快照字段。导入校验格式、ID、条目数量及文件大小，跳过重复或无效条目。导入成功不会改变公开论文索引。
- 如果收藏的论文后来不在当前公开目录，仍在本地收藏列表保留其快照，可通过 arXiv ID 访问原文。收藏不会跨设备同步；换设备要自行导出并导入备份，清理浏览器站点数据可能删除收藏。
- 公开论文索引由自动化生成；收藏导入导出是浏览器本地功能，不依赖论文生产任务直接修改索引。

## 内容数据约定

`data/papers.json` 是自动生成文件，不是 AI 的编辑入口。每篇文章的 `<head>` 必须包含唯一 `<script type="application/json" id="paper-meta">`，其中至少填写 `arxiv_id`、`title`、`title_zh`、`date`、`published`、`added_at`、`summary`、`topics`、`heat_note`。`added_at` 是首次收录的 UTC 时间，后续不得改变。工作流 `.github/workflows/arxiv-paper-index.yml` 在论文 HTML 变更时运行 `python projects/arxiv-insights/tools/build_paper_index.py` 并由机器人提交生成索引。需要 Actions 写入权限；GitHub Pages 部署仍须单独核验。

`data/papers.json` 是单一对象：

```json
{
  "schema_version": 1,
  "updated_at": null,
  "papers": []
}
```

生成索引时，每个条目至少应包含：
`arxiv_id`、`title`、`title_zh`、`date`（归档日期 YYYY-MM-DD）、`published`（原论文首发日期）、`summary`（中文摘要）、`topics`（字符串数组）、`href`（`papers/<arxiv-id>/`）、`heat_note`（注明来源与统计口径）；新增文章必须提供 `added_at`（网站实际新增时间，ISO 8601 UTC），也可提供 `arxiv_version`、`method_note` 和 `read_time`。

论文 ID 去重时剥离 `v1`、`v2` 等版本后缀，但应记录版本。**热门是有可核验关注信号的属性，不等于最新，也不等于学术结论可靠。**

## 未来文章的最低标准

- 同时提供「五分钟看懂」和「技术拆解」，至少一张解释真实机制的 SVG/交互图；不强行堆砌无意义动画。
- 数字、曲线、基准结论来自论文原文或明确引用的可靠来源；区分作者声称、复现结果与解读者推断。
- 报告全文是否获得；只读到摘要的论文不能冒充精读。
- 保留原文、代码（如有）和局限性，避免照搬原论文整张受版权保护的图。
- 无外部 JS 依赖，移动端、键盘和减少动效偏好可正常使用。


## 自动论文生产与人工发布

定时任务仅通过 GitHub 插件读取仓库规范并按远程文章路径去重，每轮最多精读、生成和验收一篇中文交互 HTML，作为 ChatGPT 可下载附件暂存。不得写入仓库、修改索引、运行发布或监控程序，不得读取或编辑 data/papers.json。附件不保证永久保存。

只有用户在普通对话中明确授权，才能通过 GitHub 插件审核并集中提交可访问的未发布 HTML。之后索引由 GitHub Actions 维护，Pages 部署须另行核验。自动生产流程不包括发布。 普通聊天发布流程按 `skills/chat-paper-publisher/SKILL.md` 执行，并在提交前使用 `tools/preflight_papers.py --mode publish <HTML文件路径>` 校验待发布页面；检查脚本不会写入仓库或生成索引。
