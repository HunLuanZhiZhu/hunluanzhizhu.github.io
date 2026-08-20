// js/pages/info-detail.js — 项目背景/技术亮点/文章详情页 (H5)
// 来源: subpackages/extra/info-detail/info-detail.js + info-detail.wxml
// 同步: 小程序 info-hero / sections 分段 / info-divider / reading-progress 进度条 / related 相关阅读
// 数据: globalData.infoDetail {icon, title, sections|detail} 或 query?type=article&id= (10篇完整 sections)

import { globalData } from '../app.js'
import { navigateTo } from '../router.js'

const ARTICLES = [
  { id: 1, title: '什么是窦性心律？', icon: '窦', sections: [
    { title: '概述', content: '窦性心律是起源于窦房结的正常心脏搏动节律，是健康心脏的典型表现。P波、QRS波群和T波形态正常，节律规整，频率在60-100次/分钟范围内。' },
    { title: '特征', content: '窦性心律具有明确的特征：P波形态正常且在每个QRS波群之前；PR间期正常（0.12-0.20秒）；QRS波群形态和时限正常；节律规整，RR间期差异<0.16秒。' },
    { title: '临床意义', content: '窦性心律是心电图报告中最常见的结论之一，代表心脏的电活动起源于窦房结，是正常的心脏节律。如果您的心电图报告显示窦性心律，这通常是一个好消息。' }
  ]},
  { id: 2, title: '室性早搏有多危险？', icon: '室', sections: [
    { title: '概述', content: '室性早搏是起源于心室肌的提前搏动，QRS波群宽大畸形，时限超过120ms。T波方向与QRS主波方向相反。' },
    { title: '危险程度', content: '偶发室性早搏可见于健康人群，但频发或成对出现时需警惕器质性心脏病。特别是伴随其他心电图异常时，风险显著增加。' },
    { title: '建议', content: '建议尽快至心内科就诊，完善心脏超声、动态心电图等检查，评估是否存在器质性心脏病，遵医嘱进行相应治疗。' }
  ]},
  { id: 3, title: '心电图的PQRST波群', icon: '波', sections: [
    { title: '概述', content: '一次完整心搏由P波、QRS波群和T波组成，各自反映心脏不同部位的电活动与传导过程。P波代表心房除极，QRS波群代表心室除极，T波代表心室复极。' },
    { title: '各波详解', content: 'P波：心房除极产生的小而圆的波形，时限<0.12秒，振幅<0.25mV。PR间期：从P波起点到QRS波群起点的时间，正常0.12-0.20秒。QRS波群：心室除极产生的尖锐波形，时限0.06-0.10秒。ST段：QRS终点到T波起点，应位于等电位线。T波：心室复极产生的宽大波形，方向与QRS主波一致。QT间期：从QRS起点到T波终点，代表心室除极和复极的总时间。' },
    { title: '临床意义', content: 'PQRST波群的形态和时限变化是诊断心律失常、心肌缺血、电解质紊乱等疾病的重要依据。掌握各波的正常值范围，是读懂心电图的基础。' }
  ]},
  { id: 4, title: '心房颤动：最常见的持续性心律失常', icon: '颤', sections: [
    { title: '概述', content: '心房颤动（Atrial Fibrillation, AF）是最常见的持续性心律失常。房颤时心房失去有效的机械收缩，心房率可达350-600次/分，心室率通常为100-160次/分，节律绝对不规整。' },
    { title: '心电图特征', content: '房颤的心电图特征是：P波消失，代之以大小不等、形态不一、间距不规则的f波（颤动波）；QRS波群节律绝对不规则（RR间期绝对不等）；QRS波群形态通常正常，但可因室内差异性传导而增宽变形。' },
    { title: '风险与治疗', content: '房颤最主要的危害是血栓栓塞风险显著增加，尤其是缺血性脑卒中（中风）。治疗原则包括：控制心室率、恢复并维持窦性心律、预防血栓栓塞（抗凝治疗）。' }
  ]},
  { id: 5, title: '动态心电图（Holter）检测指南', icon: '动', sections: [
    { title: '概述', content: '24小时动态心电图（Holter监测）是一种连续记录24小时或更长时间心电活动的无创检查方法。受检者佩戴便携式记录仪，在日常活动状态下完成检测，可捕捉偶发性心律失常和阵发性症状。' },
    { title: '适用人群', content: '适用于以下情况：不明原因的心悸、头晕、晕厥；评估心律失常的类型、频率和严重程度；评估抗心律失常药物的疗效；评估起搏器功能；心肌梗死后风险评估；常规心电图正常但症状高度怀疑心源性者。' },
    { title: '注意事项', content: '检查期间应保持正常日常活动，记录活动日志，避免洗澡和剧烈出汗以防电极脱落，远离强磁场环境。现代Holter设备已支持远程传输和AI辅助分析。' }
  ]},
  { id: 6, title: '运动与心脏健康：科学运动指南', icon: '运', sections: [
    { title: '运动的好处', content: '规律的中等强度有氧运动可降低心血管疾病风险30%-50%。运动能够增强心肌收缩力、改善血管内皮功能、降低静息心率和血压。' },
    { title: '科学运动方案', content: '世界卫生组织建议：每周至少150分钟中等强度有氧运动，或75分钟高强度有氧运动。运动时心率应达到目标心率范围：（220-年龄）×（60%-80%）。' },
    { title: '注意事项', content: '心脏病患者应在医生指导下制定个体化运动方案。运动中出现胸痛、胸闷、心悸、头晕、呼吸困难等症状应立即停止并就医。' }
  ]},
  { id: 7, title: '人工智能在心电图诊断中的应用', icon: '智', sections: [
    { title: '概述', content: '深度学习模型在心电分类任务中已达到甚至超过心内科专家的准确率。基于卷积神经网络（CNN）、时间卷积网络（TCN）和Transformer等架构的AI模型，能够自动识别心律失常、心肌缺血、心肌梗死等多种心电异常。' },
    { title: '技术原理', content: 'AI心电分析包括：信号预处理、特征提取、深度学习模型推理、后处理。模型在MIT-BIH、PhysioNet等国际标准数据库上训练验证，TPR超过95%。' },
    { title: '优势与局限', content: '优势：分析速度快、不受疲劳影响、可部署在移动设备实现端侧推理保护隐私。局限：依赖训练数据质量；AI结果为辅助诊断，不能完全替代医生判断。心韵深辨采用端侧AI推理，所有检测在手机本地完成。' }
  ]},
  { id: 8, title: '窦性心动过缓需要治疗吗？', icon: '缓', sections: [
    { title: '概述', content: '窦性心动过缓是指窦性心律频率低于60次/分钟。其病因可分为生理性和病理性两类。运动员和经常锻炼者常见生理性心动过缓，属于正常变异。' },
    { title: '病因分析', content: '生理性原因：长期耐力运动训练导致迷走神经张力增高；病理性原因：窦房结功能障碍、甲状腺功能减退、颅内压增高、药物影响等。' },
    { title: '治疗原则', content: '生理性心动过缓通常无需治疗。病理性心动过缓需根据症状决定：无症状者定期随访；出现头晕、乏力、晕厥者需评估是否需植入起搏器。心率<40次/分或长间歇>3秒需高度重视。' }
  ]},
  { id: 9, title: '心电图导联系统详解', icon: '导', sections: [
    { title: '概述', content: '标准12导联心电图从12个不同角度记录心脏电活动。包括6个肢体导联和6个胸导联，各导联从不同方位观察心脏。' },
    { title: '导联分类', content: '肢体导联分为双极导联（I、II、III）和加压单极导联（aVR、aVL、aVF）；胸导联V1-V6从右前胸到左腋前线依次放置。' },
    { title: '临床应用', content: '不同导联对心脏不同区域的病变敏感：II、III、aVF反映下壁；V1-V2反映室间隔；V3-V4反映前壁；V5-V6反映侧壁；aVR反映右心室流出道。根据ST段分布可定位心梗部位。' }
  ]},
  { id: 10, title: '如何看懂你的心电图报告', icon: '读', sections: [
    { title: '概述', content: '心电图报告通常包含心率、心律、电轴、间期、ST-T改变等核心信息。掌握这五个维度，即可快速理解报告的主要内容。' },
    { title: '五个核心维度', content: '1. 心率：正常成人静息心率60-100次/分。2. 心律：窦性心律为正常。3. 心电轴：正常为-30至+90。4. 间期：PR 0.12-0.20秒，QRS<0.12秒。5. ST-T改变：ST段抬高或压低需警惕心肌缺血。' },
    { title: '常见结论解读', content: '“大致正常心电图”：各指标正常。“窦性心律不齐”：多见于年轻人，良性。“T波改变”：需结合临床。“左心室高电压”：建议心脏彩超评估。任何异常结论都应咨询心内科医生。' }
  ]}
]

const state = { theme: 'light', info: {}, relatedArticles: [], progressPercent: 0 }
let root = null
let scrollHandler = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-info-detail dark' : 'container page-info-detail'
}

function render() {
  if (!root || !state.info || !state.info.title) {
    if (root) root.innerHTML = '<div class="' + themeClass() + '"><div class="empty-state"><div class="empty-text">暂无内容</div></div></div>'
    return
  }
  const info = state.info
  let html = '<div class="' + themeClass() + '">'
  html += '<div class="reading-progress" style="width:' + state.progressPercent + '%;"></div>'
  html += '<div class="card info-hero fade-in-up"><div class="info-hero-icon pop-in">' + (info.icon || '内') + '</div><div class="info-hero-title">' + info.title + '</div></div>'
  html += '<div class="card fade-in-up-d1">'
  ;(info.sections || []).forEach((sec, idx) => {
    html += '<div class="sec sec-inline-sm"><div class="sec-title">' + sec.title + '</div></div><div class="info-section-text">' + sec.content + '</div>'
    if (idx < info.sections.length - 1) html += '<div class="info-divider"></div>'
  })
  html += '</div>'
  if (state.relatedArticles && state.relatedArticles.length > 0) {
    html += '<div class="sec"><div class="sec-title">相关阅读</div></div><div class="related-scroll">'
    state.relatedArticles.forEach(a => {
      html += '<div class="related-card" data-related-id="' + a.id + '"><div class="related-title">' + a.title + '</div><div class="related-cta">阅读文章 \u203A</div></div>'
    })
    html += '</div>'
  }
  html += '<div class="footer-text">心韵深辨 \u00B7 用心感知，以智辨析</div>'
  html += '</div>'
  root.innerHTML = html
  root.querySelectorAll('[data-related-id]').forEach(el => el.addEventListener('click', () => navigateTo('info-detail?type=article&id=' + el.dataset.relatedId)))
}

export default {
  title: '详情', tab: -1,
  async mount(container, params) {
    root = container
    state.theme = globalData.theme
    if (params && params.type === 'article') {
      const id = parseInt(params.id) || 1
      const article = ARTICLES.find(a => a.id === id) || ARTICLES[0]
      const cats = { 1: '心律基础', 2: '异常解读', 3: '心律基础', 4: '异常解读', 5: '检测指南', 6: '健康建议', 7: '新技术', 8: '异常解读', 9: '心律基础', 10: '检测指南' }
      let related = ARTICLES.filter(a => a.id !== id && cats[a.id] === cats[id])
      if (related.length < 2) ARTICLES.forEach(a => { if (related.length < 2 && a.id !== id && !related.includes(a)) related.push(a) })
      state.info = article
      state.relatedArticles = related.slice(0, 2).map(a => ({ id: a.id, title: a.title }))
      state.progressPercent = 0
      render()
    } else {
      let data = globalData.infoDetail
      if (!data) { state.info = {}; render(); return }
      if (!data.sections && data.detail) data = { icon: data.icon, title: data.title, sections: [{ title: '详细介绍', content: data.detail }] }
      state.info = data
      state.relatedArticles = []
      state.progressPercent = 0
      render()
    }
    scrollHandler = () => {
      const el = root && root.querySelector('.container')
      if (!el) return
      const ch = el.scrollHeight, vh = window.innerHeight, max = ch - vh
      const pct = max > 0 ? Math.min(100, Math.max(0, Math.round(window.scrollY / max * 100))) : 100
      if (state.progressPercent !== pct) {
        state.progressPercent = pct
        const bar = root && root.querySelector('.reading-progress')
        if (bar) bar.style.width = pct + '%'
      }
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })
  },
  unmount() { if (scrollHandler) { window.removeEventListener('scroll', scrollHandler); scrollHandler = null } root = null },
  updateTheme(theme) { state.theme = theme; if (root) render() }
}
