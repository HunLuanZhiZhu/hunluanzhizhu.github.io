# arXiv 洞察 · 交互式论文讲解

这是个人 Browser Lab 的一个独立静态子项目，目标是把有研究价值的 arXiv 新论文变成**通俗但严谨的中文交互讲解**。当前阶段已建立网页骨架、两份专项 Skill 和一份单次执行总控 Skill；**尚未启用任何定时任务、自动抓取、自动生成或自动部署流程**。

## 页面

- 首页论文流：`index.html`（直接展示近 24 小时新增的完整讲解；同页切换历史论文与本地收藏）
- 独立项目介绍与方法页：`about.html`（原首页的大幅介绍、研究工作流交互图和方法来源移至此处）
- 内容清单：`data/papers.json`（目前为空）
- 后续单篇论文页面：`papers/<arxiv-id>/index.html`
- 三份 Skill：`skills/arxiv-hot-papers/SKILL.md`（论文发现）、`skills/paper-html-explainer/SKILL.md`（中文交互讲解）、`skills/hourly-paper-pipeline/SKILL.md`（单次总控）

**页面逻辑：读者打开首页即进入论文列表，不以项目自我介绍占据首屏。** 导航中的「关于本站」单独介绍项目理念、方法来源及隐私原则；首页只负责浏览、搜索、筛选及收藏。保持原生 HTML / CSS / JavaScript、无打包流程、无需外部内容分发网络。项目下的相对路径应在 `https://zyh.sryze.cc/projects/arxiv-insights/` 下正常工作。

## Skill 来源及改造范围

1. **发现热点论文**：参考 [Yilgrimage/arxiv-digest](https://github.com/Yilgrimage/arxiv-digest) 的三源检索、社区热度信号、筛选和推荐历史设计，并以 [Hugging Face 官方论文 Skill](https://github.com/huggingface/skills/blob/main/skills/huggingface-papers/SKILL.md) 的公开 API 信息为接口参考。本仓库的 `arxiv-hot-papers` 是**重新编写的站点适配说明**，没有复制原仓库脚本、模型评分结果或 QQ/OpenClaw 调度设置。
2. **生成 HTML 讲解**：参考 [sukanthoriginal/interactive-paper-explainers](https://github.com/sukanthoriginal/interactive-paper-explainers)（MIT License）双层讲解、论文专属交互和静态网页发布的思路。本仓库的 `paper-html-explainer` 是**重新编写的站点适配说明**，没有复制其反馈服务器和运行时代码。
3. **单次总控**：`hourly-paper-pipeline` 读取并调用上述两份 Skill 的规范，目标一次选择、精读、生成、验证并在授权后登记**一篇**完整讲解。用于未来每小时一次、每天目标 24 篇的调度，但**目前没有启用任务**。

这些是存储在仓库中的 **Agent Skill 指令文件**，不是由浏览器执行的脚本。ChatGPT 定时任务不会因为文件存在而自动安装或加载它们；若未来接入任务，需要在每次运行中明确读取总控及两份子 Skill 的 `SKILL.md`，并按权限调用论文检索及 GitHub 工具。此步骤尚未进行。

总控只会在全部内容和浏览器验收通过、具备写入授权时，先新增单篇文章，再**最后**更新 `data/papers.json`；首页应以数据驱动，而非每小时重写 `index.html`。为未来「近 24 小时」展示，记录可增加 `added_at`（本站登记完成的 UTC 时间）；「历史」读取全部历史记录；「我的收藏」由浏览器本地存储管理，不写入 GitHub。这三个首页视图现已实现，首页通过 JavaScript 自动加载并定期刷新 `data/papers.json`，每小时内容任务无需修改首页代码。首页第一屏默认显示「近 24 小时」，「历史论文」与「我的收藏」使用同页标签切换；项目介绍已移至独立的 `about.html`。

## 本地收藏与 JSON 备份

- 网站的「近 24 小时」按论文的 `added_at`（本站新增时间）筛选；「历史论文」可回顾全部已收录论文；「我的收藏」按 arXiv ID 在浏览器的 `localStorage` 中保存，不上传到 GitHub。
- 收藏视图有「导入收藏」和「导出收藏」按钮。导出会在浏览器内下载一个 JSON 文件；导入仅在浏览器中解析文件，**按稳定 arXiv ID 合并去重、保留现有收藏，不向服务器上传文件**。
- 备份结构为 `{"format":"arxiv-insights-bookmarks","version":1,"exported_at":"...","bookmarks":[...]}`；每个条目包括 `arxiv_id`、标题、简介、主题及 `saved_at` 等必要快照字段。导入校验格式、ID、条目数量及文件大小，跳过重复或无效条目。导入成功不会改变公开论文索引。
- 如果收藏的论文后来不在当前公开目录，仍在本地收藏列表保留其快照，可通过 arXiv ID 访问原文。收藏不会跨设备同步；换设备要自行导出并导入备份，清理浏览器站点数据可能删除收藏。
- 当前 `data/papers.json` 为空，尚不能对真实已发布论文进行收藏的端到端演示；浏览器本地备份功能已加入网站代码。

## 内容数据约定

`data/papers.json` 是单一对象：

```json
{
  "schema_version": 1,
  "updated_at": null,
  "papers": []
}
```

添加论文时，每个条目至少应包含：
`arxiv_id`、`title`、`title_zh`、`date`（归档日期 YYYY-MM-DD）、`published`（原论文首发日期）、`summary`（中文摘要）、`topics`（字符串数组）、`href`（`papers/<arxiv-id>/`）、`heat_note`（注明来源与统计口径）；可增加 `added_at`（网站实际新增时间，ISO 8601 UTC）、`arxiv_version`、`method_note` 和 `read_time`。

论文 ID 去重时剥离 `v1`、`v2` 等版本后缀，但应记录版本。**热门是有可核验关注信号的属性，不等于最新，也不等于学术结论可靠。**

## 未来文章的最低标准

- 同时提供「五分钟看懂」和「技术拆解」，至少一张解释真实机制的 SVG/交互图；不强行堆砌无意义动画。
- 数字、曲线、基准结论来自论文原文或明确引用的可靠来源；区分作者声称、复现结果与解读者推断。
- 报告全文是否获得；只读到摘要的论文不能冒充精读。
- 保留原文、代码（如有）和局限性，避免照搬原论文整张受版权保护的图。
- 无外部 JS 依赖，移动端、键盘和减少动效偏好可正常使用。

## 尚未完成

- 尚未安装上游代码或编写自动抓取器。
- 尚未选定或解析第一篇论文。
- 尚未配置 ChatGPT 定时任务与写入自动化。
- 收藏导入导出已实现，尚未在真实线上浏览器完成完整回归测试。
- 尚未实际验证第三方热榜和 arXiv API 的运行时可用性。
