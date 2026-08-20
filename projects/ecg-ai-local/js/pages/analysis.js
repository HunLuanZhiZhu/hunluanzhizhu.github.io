// pages/analysis.js — 综合分析页 (H5 版)
// 由小程序 pages/analysis/analysis.js + analysis.wxml 转化
// 评语生成逻辑与原版完全一致, canvas 获取改为 getElementById

import { globalData } from '../app.js'
import { getStorageSync } from '../storage.js'
import { drawDonutChart, drawBarChart, drawLegend, CATEGORY_NAMES } from '../utils/chartHelper.js'

const state = { theme: 'light', analysis: null }
let root = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-analysis dark' : 'container page-analysis'
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'
  if (!s.analysis) {
    html += '<div class="empty-state ecg-bg-line"><div class="empty-icon empty-icon-text">析</div><div class="empty-text">暂无检测数据</div><div class="empty-subtext">完成心电检测后可查看综合分析</div><div class="empty-action-btn" data-go-detect>去检测</div></div>'
  } else {
    const a = s.analysis
    html += '<div class="page-head fade-in-up"><div class="page-eyebrow">数据分析</div><div class="page-title">综合分析</div></div>'
    html += '<div class="risk-card risk-card-' + a.riskColor + ' fade-in-up-d1"><div class="risk-icon risk-icon-' + a.riskColor + '">' + (a.riskLevel === '低' ? '✓' : '!') + '</div><div class="risk-info"><div class="risk-level risk-level-' + a.riskColor + '">' + a.riskLevel + '风险</div><div class="risk-desc">基于 ' + a.total + ' 次检测 · ' + a.summary + '</div></div></div>'
    if (a.stats) {
      html += '<div class="mini-grid fade-in-up-d1">' + a.stats.map(item => '<div class="mini-cell"><div class="mini-val ' + (item.cls ? 'mini-val-' + item.cls : '') + '">' + item.value + '</div><div class="mini-lbl">' + item.label + '</div></div>').join('') + '</div>'
    }
    html += '<div class="sec fade-in-up-d1"><div class="sec-title">心搏分类分布</div></div><div class="card fade-in-up-d2"><canvas id="donutChart" class="donut-canvas"></canvas></div>'
    html += '<div class="sec sec-spacer fade-in-up-d2"><div class="sec-title">各类检测次数</div></div><div class="card fade-in-up-d3"><canvas id="barChart" class="bar-canvas"></canvas></div>'
    html += '<div class="sec sec-spacer fade-in-up-d3"><div class="sec-title">正常 / 异常比例</div></div><div class="card fade-in-up-d4"><div class="ratio-bar"><div class="ratio-bar-normal bar-grow" style="width:' + a.normalRate + '%;"></div><div class="ratio-bar-abnormal bar-grow" style="width:' + a.abnormalRate + '%;"></div></div><div class="ratio-labels"><span class="ratio-normal-label">正常 ' + a.normalRate + '%</span><span class="ratio-abnormal-label">异常 ' + a.abnormalRate + '%</span></div></div>'
    if (a.suggestion) {
      const tipCls = a.riskColor === 'green' ? 'emerald' : a.riskColor === 'orange' ? 'amber' : 'rose'
      html += '<div class="tip-strip tip-strip-' + tipCls + '"><div class="tip-icon tip-icon-' + tipCls + '">!</div><div class="tip-body"><div class="tip-title">健康建议</div><div class="tip-text">' + a.suggestion + '</div></div></div>'
    }
    html += '<div class="disclaimer-card"><div class="disclaimer-icon">!</div><div class="disclaimer-text">以上分析仅供参考，不构成医疗诊断建议。</div></div>'
  }
  html += '<div class="footer-text">心韵深辨 · 用心感知，以智辨析</div>'
  html += '</div>'
  root.innerHTML = html
  const goBtn = root.querySelector('[data-go-detect]')
  if (goBtn) goBtn.addEventListener('click', () => { import('../router.js').then(m => m.switchTab('detect')) })
  if (s.analysis) setTimeout(function() { drawDonut(s.analysis.dist, s.analysis.total); drawBars(s.analysis.dist) }, 300)
}

function computeAnalysis() {
  const rawList = getStorageSync('history') || []
  if (rawList.length === 0) {
    setState({ analysis: null })
    return
  }

  // 统计5类分布
  const dist = { N: 0, S: 0, V: 0, F: 0, Q: 0 }
  const total = rawList.length
  let abnormal = 0
  for (let i = 0; i < rawList.length; i++) {
    const abbr = rawList[i].classAbbr || 'Q'
    if (dist[abbr] !== undefined) dist[abbr]++
    if (rawList[i].isAbnormal) abnormal++
  }

  const abnormalRate = total > 0 ? (abnormal / total * 100).toFixed(1) : 0

  // 找出异常类型(可能并列最多)
  const abnormalTypes = []
  const abbrs = ['S', 'V', 'F', 'Q']
  for (let j = 0; j < abbrs.length; j++) {
    if (dist[abbrs[j]] > 0) {
      abnormalTypes.push({ abbr: abbrs[j], count: dist[abbrs[j]] })
    }
  }
  abnormalTypes.sort(function(a, b) { return b.count - a.count })

  const maxCount = abnormalTypes.length > 0 ? abnormalTypes[0].count : 0
  const topTypes = []
  for (let k = 0; k < abnormalTypes.length; k++) {
    if (abnormalTypes[k].count === maxCount) {
      topTypes.push(abnormalTypes[k].abbr)
    }
  }

  // 用户信息
  const userInfo = getStorageSync('userInfo') || {}
  const name = userInfo.name || '用户'
  const gender = userInfo.gender || ''
  const ageRange = userInfo.ageRange || ''

  // 风险等级
  let riskLevel = '低'
  let riskColor = 'green'
  const rateNum = parseFloat(abnormalRate)
  if (rateNum >= 50) { riskLevel = '高'; riskColor = 'red' }
  else if (rateNum >= 25) { riskLevel = '中'; riskColor = 'orange' }

  // === 生成评语 (与原版完全一致) ===
  const genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : ''
  const ageText = ageRange ? ageRange + '年龄段' : ''
  let profilePrefix = ''
  if (genderText && ageText) {
    profilePrefix = '结合您为' + genderText + '、处于' + ageText + '的个人特征，'
  } else if (genderText) {
    profilePrefix = '结合您为' + genderText + '的个人特征，'
  } else if (ageText) {
    profilePrefix = '结合您处于' + ageText + '的个人特征，'
  }

  let summary = ''
  let suggestion = ''

  if (rateNum === 0) {
    summary = name + '，您好。您已完成' + total + '次心电检测，所有结果均为正常心搏（N类）。' + profilePrefix + '综合评判为低风险，当前心电健康状况良好。'
    suggestion = buildNormalSuggestion(gender, ageRange)
  } else {
    const typeNames = []
    for (let m = 0; m < topTypes.length; m++) {
      typeNames.push('「' + CATEGORY_NAMES[topTypes[m]] + '」')
    }
    const typeStr = typeNames.length > 1
      ? typeNames.slice(0, -1).join('、') + '和' + typeNames[typeNames.length - 1]
      : typeNames[0]

    summary = name + '，您好。您已完成' + total + '次心电检测，其中' + abnormal + '次检出异常（异常率' + abnormalRate + '%）。' + profilePrefix + '综合评判为' + riskLevel + '风险。其中，检出最多的异常类型为' + typeStr + '，共' + maxCount + '次。'
    suggestion = buildAbnormalSuggestion(topTypes, abnormalTypes, maxCount, gender, ageRange, rateNum)
  }

  const analysis = {
    riskLevel: riskLevel,
    riskColor: riskColor,
    summary: summary,
    suggestion: suggestion,
    dist: dist,
    total: total,
    abnormalRate: abnormalRate,
    normalRate: (100 - parseFloat(abnormalRate)).toFixed(1)
  }

  setState({ analysis: analysis })
}

// === 全部正常的建议: 结合性别+年龄 (与原版一致) ===
function buildNormalSuggestion(gender, ageRange) {
  const parts = []
  parts.push('您的检测结果全部正常，心电波形规整，这是一个非常好的信号。')

  if (ageRange === '18-30') {
    parts.push('青年阶段心脏代偿能力强，但仍建议保持规律作息，避免长期熬夜和过度摄入咖啡因。每半年进行一次心电复查即可。')
  } else if (ageRange === '31-45') {
    parts.push('中年阶段工作压力大，建议注意劳逸结合，每周保持150分钟以上中等强度运动，控制体重和血脂。每季度复查一次心电。')
  } else if (ageRange === '46-60') {
    parts.push('46-60岁是心血管疾病风险上升期，建议每两个月进行一次心电检测，同时关注血压、血糖、血脂等危险因素，低盐低脂饮食。')
  } else if (ageRange === '60+') {
    parts.push('60岁以上建议每月进行一次心电检测，注意监测有无隐匿性心律失常。适当进行有氧运动如散步、太极拳，避免剧烈运动。')
  } else {
    parts.push('建议保持规律作息、适量运动和均衡饮食，每季度进行一次心电复查。')
  }

  if (gender === 'male' && (ageRange === '46-60' || ageRange === '60+')) {
    parts.push('男性在45岁后心血管疾病风险显著上升，建议定期检查颈动脉超声和心脏彩超。')
  } else if (gender === 'female' && (ageRange === '46-60' || ageRange === '60+')) {
    parts.push('女性绝经后心血管保护作用减弱，建议关注血压波动，必要时进行激素水平评估。')
  }

  return parts.join('')
}

// === 有异常的建议: 异常类型+年龄+性别交叉 (与原版一致) ===
function buildAbnormalSuggestion(topTypes, allAbnormalTypes, maxCount, gender, ageRange, rateNum) {
  const parts = []
  const hasS = topTypes.indexOf('S') >= 0
  const hasV = topTypes.indexOf('V') >= 0
  const hasF = topTypes.indexOf('F') >= 0
  const hasQ = topTypes.indexOf('Q') >= 0

  if (hasV) {
    parts.push('室性早搏（V类）是需要重点关注的异常类型。频发室性早搏可能增加心血管事件风险，')
    if (ageRange === '60+') {
      parts.push('尤其在60岁以上人群中，室性早搏与器质性心脏病的关联更为密切。建议尽快至心内科就诊，完善心脏彩超、冠脉CT等检查，排除结构性心脏病。日常避免剧烈运动，注意监测血压。')
    } else if (ageRange === '46-60') {
      parts.push('46-60岁人群出现频发室性早搏，需警惕冠心病可能。建议至心内科就诊，完善运动平板试验和心脏彩超。控制血压血脂，戒烟限酒。')
    } else if (ageRange === '31-45') {
      parts.push('中青年人群的室性早搏多为功能性，但仍建议心内科就诊评估。完善24小时动态心电图（Holter）了解早搏负荷，排除心肌炎等病因。')
    } else if (ageRange === '18-30') {
      parts.push('青年人群的室性早搏多为良性，但频发仍需重视。建议行Holter监测评估24小时早搏总数，避免熬夜、剧烈运动和过量摄入咖啡因。')
    } else {
      parts.push('建议尽快至心内科就诊，完善心脏彩超和24小时动态心电图检查。')
    }
  } else if (hasS) {
    parts.push('室上性早搏（S类）在健康人群中也较常见，偶发通常无碍。')
    if (maxCount >= 3) {
      parts.push('但' + maxCount + '次检出提示有频发倾向，建议进行24小时动态心电图（Holter）监测，评估早搏负荷。')
    } else {
      parts.push('本次检出次数较少，建议持续观察。')
    }
    if (ageRange === '60+') {
      parts.push('老年人群频发室上性早搏可能进展为房颤，建议每两个月复查心电，关注有无心悸、胸闷等症状。')
    } else if (gender === 'female' && (ageRange === '31-45' || ageRange === '46-60')) {
      parts.push('中年女性出现频发室上性早搏，需关注是否与甲状腺功能异常或激素水平波动有关，必要时检查甲功。')
    }
    parts.push('避免熬夜、浓茶咖啡和情绪激动等诱因。')
  } else if (hasF) {
    parts.push('融合搏动（F类）提示可能存在室性异位节律与正常心律的竞争。建议进一步行动态心电图监测，评估室性异位搏动的频率和形态特征。')
    if (ageRange === '46-60' || ageRange === '60+') {
      parts.push('该年龄段出现融合搏动需警惕器质性心脏病，建议心内科就诊完善心脏彩超。')
    }
  } else if (hasQ) {
    parts.push('多次检出未知搏动（Q类）可能与信号采集质量有关。建议在安静环境下、保持静止状态重新采集心电数据，确保电极接触良好、减少干扰后再次检测。')
    if (rateNum > 50) {
      parts.push('异常率较高且多为未知搏动，也不排除存在复杂心律失常的可能，建议至心内科进行专业心电检测。')
    }
  }

  if (topTypes.length > 1) {
    const typeNames = []
    for (let i = 0; i < topTypes.length; i++) {
      typeNames.push(CATEGORY_NAMES[topTypes[i]])
    }
    parts.push('您同时检出多种异常类型（' + typeNames.join('、') + '）并列最多，提示心律失常表现较为复杂，建议尽快至心内科进行系统评估，不可掉以轻心。')
  }

  if (rateNum >= 50) {
    parts.push('当前异常率超过50%，属于高风险水平，强烈建议尽快就医进行全面心电评估，切勿拖延。')
  }

  if (ageRange === '60+') {
    parts.push('建议此后每月至少进行一次心电检测，持续监测。')
  } else if (ageRange === '46-60') {
    parts.push('建议此后每两个月进行一次心电检测。')
  }

  return parts.join('')
}

// 绘制环形图 (H5: getElementById)
function drawDonut(dist, total) {
  const canvas = document.getElementById('donutChart')
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  if (!rect.width) {
    setTimeout(function() { drawDonut(dist, total) }, 150)
    return
  }
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  const cx = w * 0.25
  const cy = h / 2
  const outerR = Math.min(w * 0.2, h * 0.4)
  const innerR = outerR * 0.6

  drawDonutChart(ctx, cx, cy, outerR, innerR, dist, total.toString())

  // 图例
  const legendX = w * 0.48
  const legendY = h / 2 - 60
  drawLegend(ctx, legendX, legendY, 22, dist, total)
}

// 绘制柱状图 (H5: getElementById)
function drawBars(dist) {
  const canvas = document.getElementById('barChart')
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  if (!rect.width) {
    setTimeout(function() { drawBars(dist) }, 150)
    return
  }
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = rect.height
  drawBarChart(ctx, 4, 4, w - 8, 22, 8, dist)
}

function setState(patch) {
  Object.assign(state, patch)
  render()
}

export default {
  title: '综合分析',
  tab: -1,

  async mount(container) {
    root = container
    state.theme = globalData.theme
    computeAnalysis()
  },

  unmount() {
    root = null
  },

  updateTheme(theme) {
    state.theme = theme
    render()
  }
}
