# arXiv 洞察 · 交互式论文讲解

这是个人 Browser Lab 的一个独立静态子项目，目标是把有研究价值的 arXiv 新论文变成**通俗但严谨的中文交互讲解**。当前阶段只建立网页骨架与两份可继续改造的 Agent Skill；**尚未启用任何定时任务、自动抓取、自动生成或自动部署流程**。

## 页面

- 入口：`index.html`
- 内容清单：`data/papers.json`（目前为空）
- 后续单篇论文页面：`papers/<arxiv-id>/index.html`
- 两份 Skill：`skills/arxiv-hot-papers/SKILL.md` 和 `skills/paper-html-explainer/SKILL.md`

保持原生 HTML / CSS / JavaScript、无打包流程、无需外部内容分发网络。项目下的相对路径应在 `https://zyh.sryze.cc/projects/arxiv-insights/` 下正常工作。

## Skill 来源及改造范围

1. **发现热点论文**：参考 [Yilgrimage/arxiv-digest](https://github.com/Yilgrimage/arxiv-digest) 的三源检索、社区热度信号、筛选和推荐历史设计，并以 [Hugging Face 官方论文 Skill](https://github.com/huggingface/skills/blob/main/skills/huggingface-papers/SKILL.md) 的公开 API 信息为接口参考。本仓库的 `arxiv-hot-papers` 是**重新编写的站点适配说明**，没有复制原仓库脚本、模型评分结果或 QQ/OpenClaw 调度设置。
2. **生成 HTML 讲解**：参考 [sukanthoriginal/interactive-paper-explainers](https://github.com/sukanthoriginal/interactive-paper-explainers)（MIT License）双层讲解、论文专属交互和静态网页发布的思路。本仓库的 `paper-html-explainer` 是**重新编写的站点适配说明**，没有复制其反馈服务器和运行时代码。

这些是存储在仓库中的 **Agent Skill 指令文件**，不是由浏览器执行的脚本。ChatGPT 定时任务不会因为文件存在而自动安装或加载它们；若未来接入任务，需要在任务中明确读取这两个 `SKILL.md` 并按权限调用检索及 GitHub 工具。此步骤尚未进行。

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
`arxiv_id`、`title`、`title_zh`、`date`（归档日期 YYYY-MM-DD）、`published`（原论文首发日期）、`summary`（中文摘要）、`topics`（字符串数组）、`href`（`papers/<arxiv-id>/`）、`heat_note`（注明来源与统计口径）；可增加 `method_note` 和 `read_time`。

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
- 尚未实际验证第三方热榜和 arXiv API 的运行时可用性。
