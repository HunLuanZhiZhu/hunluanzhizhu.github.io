// js/pages/mine.js — 我的页面 (H5)
// 来源: pages/mine/mine.js + mine.wxml
// 同步: 小程序 healthAssessment/categoryStats/trend/heatmap 等全部字段与逻辑、logo-card 精炼文案、三段档案摘要等
// H5 差异: profileSheet 由组件改为 js/profileSheet.js 的 show(tabIndex)
// 色值与 app.wxss 一致：#007AFF / --teal-dim / --emerald 等（旧色值已统一替换为 Apple 蓝）

import { globalData } from '../app.js'
import * as profileSheet from '../profileSheet.js'
import { getStorageSync, setStorageSync } from '../storage.js'
import { showToast } from '../ui.js'

const state = {
  totalCount: 0, normalCount: 0, abnormalCount: 0,
  categoryStats: [],
  healthAssessment: { level: 'none', levelText: '暂无数据', levelColor: '#007AFF', score: 0, scoreDeg: 0, findings: [], advice: '开始检测后将自动生成健康评估报告', visible: false },
  trendData: [], trendNormalRate: 0, trendRateClass: 'trend-rate-emerald',
  weekCount: 0, avgHeartRate: '-', streakDays: 0,
  heatmap: [],
  profileComplete: 0, allergySummary: '未填写', chronicSummary: '未填写',
  theme: 'light', userInfo: {}
}
let root = null
let _scoreAnim = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-mine dark' : 'container page-mine'
}

function calcHealthAssessment(history, catCount, total) {
  if (total === 0) return { level: 'none', levelText: '暂无数据', levelColor: '#007AFF', score: 0, findings: [], advice: '开始检测后将自动生成健康评估报告' }
  const normalCount = catCount.N
  const score = Math.round(normalCount / total * 100)
  let level, levelText, levelColor, advice, findings = []
  if (score >= 85 && catCount.V === 0 && catCount.F === 0) {
    level = 'low'; levelText = '低风险'; levelColor = '#10B981'; advice = '心律整体健康。建议保持规律作息和适度运动，定期复查。'
    if (catCount.S > 0) findings.push('检测到' + catCount.S + '次室上性早搏(S)，偶发一般为良性')
    if (normalCount > 0) findings.push('正常检测占比' + score + '%')
  } else if (score >= 60 || (catCount.V > 0 && catCount.V <= 2)) {
    level = 'medium'; levelText = '中风险'; levelColor = '#F59E0B'; advice = '近期检测存在异常心律，建议增加检测频率，注意休息，必要时咨询专业医生。'
    if (catCount.V > 0) findings.push('检测到' + catCount.V + '次室性早搏(V)，频发需警惕器质性心脏病')
    if (catCount.S > 0) findings.push('检测到' + catCount.S + '次室上性早搏(S)')
    if (catCount.F > 0) findings.push('检测到' + catCount.F + '次融合搏动(F)')
  } else {
    level = 'high'; levelText = '高风险'; levelColor = '#E11D48'; advice = '近期检测异常率较高，建议尽快前往医院心内科进行专业检查。'
    if (catCount.V > 0) findings.push('检测到' + catCount.V + '次室性早搏(V)，需高度警惕')
    if (catCount.F > 0) findings.push('检测到' + catCount.F + '次融合搏动(F)')
    if (catCount.S > 0) findings.push('检测到' + catCount.S + '次室上性早搏(S)')
    if (catCount.Q > 0) findings.push('检测到' + catCount.Q + '次无法分类的搏动(Q)，可能信号质量不佳')
  }
  return { level, levelText, levelColor, score, findings, advice }
}

function calcWeekCount(history) {
  const now = new Date(), weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
  let count = 0
  for (let i = 0; i < history.length; i++) {
    const r = history[i]
    const d = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
    if (d && d >= weekAgo) count++
  }
  return count
}

function calcStreakDays(history) {
  if (history.length === 0) return 0
  const dateSet = {}
  for (let i = 0; i < history.length; i++) {
    const r = history[i]
    const d = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
    if (d) dateSet[d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()] = true
  }
  let streak = 0; const now = new Date()
  for (let j = 0; j < 365; j++) {
    const d = new Date(now); d.setDate(d.getDate() - j)
    const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    if (dateSet[key]) streak++; else break
  }
  return streak
}

function calcTrend(history) {
  const days = [], now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
    const label = ['日','一','二','三','四','五','六'][d.getDay()]
    const dayRecords = history.filter(r => {
      const rd = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
      if (!rd) return false
      return rd.getFullYear() + '-' + (rd.getMonth() + 1) + '-' + rd.getDate() === dateStr
    })
    const hasAbnormal = dayRecords.some(r => r.isAbnormal)
    const total = dayRecords.length
    days.push({ date: dateStr, label, count: total, hasAbnormal, height: Math.min(72, Math.max(8, total * 16)) })
  }
  return days
}

function calcHeatmap(history) {
  const countByDate = {}
  for (let i = 0; i < history.length; i++) {
    const r = history[i]
    const d = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
    if (d) { const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); countByDate[key] = (countByDate[key] || 0) + 1 }
  }
  const now = new Date(), weeks = []
  for (let w = 7; w >= 0; w--) {
    const week = []
    for (let day = 6; day >= 0; day--) {
      const dd = new Date(now); dd.setDate(dd.getDate() - (w * 7 + day))
      const key2 = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + dd.getDate()
      const count = countByDate[key2] || 0
      let level = 0
      if (count >= 5) level = 4; else if (count >= 3) level = 3; else if (count === 2) level = 2; else if (count === 1) level = 1
      week.push({ count, level })
    }
    weeks.push(week)
  }
  return weeks
}

function computeAndSetData() {
  const userInfo = getStorageSync('userInfo') || {}
  const history = getStorageSync('history') || []
  let normal = 0, abnormal = 0
  const catCount = { N: 0, S: 0, V: 0, F: 0, Q: 0 }
  for (let i = 0; i < history.length; i++) {
    const r = history[i]
    if (r.isAbnormal) abnormal++; else normal++
    const abbr = r.classAbbr || 'Q'
    if (catCount[abbr] !== undefined) catCount[abbr]++; else catCount.Q++
  }
  const total = history.length
  const categoryStats = [
    { key: 'N', name: '正常心搏', count: catCount.N, percent: total > 0 ? Math.round(catCount.N / total * 100) : 0, color: '#10B981', barClass: 'cat-bar-emerald' },
    { key: 'S', name: '室上性早搏', count: catCount.S, percent: total > 0 ? Math.round(catCount.S / total * 100) : 0, color: '#F59E0B', barClass: 'cat-bar-amber' },
    { key: 'V', name: '室性早搏', count: catCount.V, percent: total > 0 ? Math.round(catCount.V / total * 100) : 0, color: '#E11D48', barClass: 'cat-bar-rose' },
    { key: 'F', name: '融合搏动', count: catCount.F, percent: total > 0 ? Math.round(catCount.F / total * 100) : 0, color: '#F97316', barClass: 'cat-bar-coral' },
    { key: 'Q', name: '未知搏动', count: catCount.Q, percent: total > 0 ? Math.round(catCount.Q / total * 100) : 0, color: '#64748B', barClass: 'cat-bar-slate' }
  ]
  const assessment = calcHealthAssessment(history, catCount, total)
  const trendData = calcTrend(history)
  const trendNormalRate = total > 0 ? Math.round((normal / total) * 100) : 0
  let trendRateClass = ''
  if (trendNormalRate > 80) trendRateClass = 'trend-rate-emerald'
  else if (trendNormalRate >= 50) trendRateClass = 'trend-rate-amber'
  else trendRateClass = 'trend-rate-rose'
  const weekCount = calcWeekCount(history)
  const avgHeartRate = '-'
  const streakDays = calcStreakDays(history)
  const heatmap = calcHeatmap(history)
  let profileSections = 0
  if (userInfo.name && userInfo.gender && userInfo.ageRange) profileSections++
  if (userInfo.hasAllergies !== undefined) profileSections++
  if (userInfo.hasChronicDisease !== undefined) profileSections++
  const profileComplete = Math.round(profileSections / 3 * 100)
  let allergySummary = '未填写'
  if (userInfo.hasAllergies === false) allergySummary = '无过敏史'
  else if (userInfo.hasAllergies === true) {
    const parts = []
    if (userInfo.foodAllergies) parts.push('食物'); if (userInfo.drugAllergies) parts.push('药物'); if (userInfo.otherAllergies) parts.push('其他')
    allergySummary = parts.length > 0 ? parts.join('·') : '有过敏史'
  }
  let chronicSummary = '未填写'
  if (userInfo.hasChronicDisease === false) chronicSummary = '无慢性疾病'
  else if (userInfo.hasChronicDisease === true) {
    let list = userInfo.chronicDiseases || []
    if (userInfo.chronicOther) list = list.concat([userInfo.chronicOther])
    chronicSummary = list.length > 0 ? list.join('·') : '有慢性疾病'
  }
  Object.assign(state, {
    theme: globalData.theme, userInfo, totalCount: total, normalCount, abnormalCount, categoryStats,
    healthAssessment: { level: assessment.level, levelText: assessment.levelText, levelColor: assessment.levelColor, score: 0, scoreDeg: 0, findings: assessment.findings, advice: assessment.advice, visible: total > 0 },
    trendData, trendNormalRate, trendRateClass, weekCount, avgHeartRate, streakDays, heatmap, profileComplete, allergySummary, chronicSummary
  })
  render()
  animateScore(assessment.score, Math.round(assessment.score * 3.6), total > 0)
}

function animateScore(score, scoreDeg, visible) {
  if (_scoreAnim) { try { cancelAnimationFrame(_scoreAnim) } catch (e) {} _scoreAnim = null }
  if (!visible || score <= 0) return
  const duration = 700, delay = 150, start = performance.now() + delay
  const tick = now => {
    if (now < start) { _scoreAnim = requestAnimationFrame(tick); return }
    const p = Math.min(1, (now - start) / duration)
    const cur = Math.round(score * p), deg = Math.round(scoreDeg * p)
    state.healthAssessment.score = cur
    state.healthAssessment.scoreDeg = deg
    const ring = root && root.querySelector('.score-ring')
    const valEl = root && root.querySelector('.score-ring-val')
    if (ring) ring.style.background = 'conic-gradient(' + state.healthAssessment.levelColor + ' 0deg ' + deg + 'deg, var(--inp) ' + deg + 'deg 360deg)'
    if (valEl) valEl.textContent = String(cur)
    if (p < 1) _scoreAnim = requestAnimationFrame(tick)
  }
  _scoreAnim = requestAnimationFrame(tick)
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'
  // 与小程序 mine.wxml 精炼文案一致：用户姓名字段回退到心韵深辨
  html += '<div class="page-head fade-in-up"><div class="page-eyebrow">个人中心</div><div class="page-title">我的健康</div></div>'
  html += '<div class="logo-card fade-in-up-d1"><img class="logo-card-img" src="assets/logo.jpg" alt="logo" /><div class="logo-card-text"><div class="logo-card-title">' + escHtml(s.userInfo.name || '心韵深辨') + '</div><div class="logo-card-sub">你的健康数据中枢 · 档案·趋势·评估一体化</div></div></div>'

  html += '<div class="stat-hero fade-in-up-d1"><div class="stat-hero-item"><div class="stat-hero-val teal">' + s.totalCount + '</div><div class="stat-hero-lbl">总检测</div></div><div class="stat-hero-div"></div><div class="stat-hero-item"><div class="stat-hero-val green">' + s.normalCount + '</div><div class="stat-hero-lbl">正常</div></div><div class="stat-hero-div"></div><div class="stat-hero-item"><div class="stat-hero-val red">' + s.abnormalCount + '</div><div class="stat-hero-lbl">异常</div></div></div>'

  if (s.totalCount > 0) {
    html += '<div class="card fade-in-up-d2"><div class="trend-header"><div class="trend-title">心律分类分布</div><div class="trend-rate ' + s.trendRateClass + '">' + s.trendNormalRate + '% 正常率</div></div><div class="cat-dist">'
    s.categoryStats.forEach(item => {
      html += '<div class="cat-dist-row"><div class="cat-dist-label"><div class="cat-dist-dot cat-dot-' + item.key + '"></div><span class="cat-dist-name">' + item.name + '(' + item.key + ')</span></div><div class="cat-dist-bar-wrap"><div class="cat-dist-bar ' + item.barClass + '" style="width:' + item.percent + '%;"></div></div><div class="cat-dist-count">' + item.count + '次</div><div class="cat-dist-percent">' + item.percent + '%</div></div>'
    })
    html += '</div></div>'
  }

  if (s.healthAssessment.visible) {
    html += '<div class="score-card fade-in-up-d2"><div class="score-ring pop-in" style="background:conic-gradient(' + s.healthAssessment.levelColor + ' 0deg ' + s.healthAssessment.scoreDeg + 'deg, var(--inp) ' + s.healthAssessment.scoreDeg + 'deg 360deg);"><div class="score-ring-inner"><div class="score-ring-val" style="color:' + s.healthAssessment.levelColor + ';">' + s.healthAssessment.score + '</div><div class="score-ring-lbl">健康评分</div></div></div><div class="score-info"><div class="score-status" style="color:' + s.healthAssessment.levelColor + ';">' + s.healthAssessment.levelText + '</div><div class="score-desc">' + s.healthAssessment.advice + '</div>' + (s.healthAssessment.findings.length ? '<div class="score-tags">' + s.healthAssessment.findings.map(t => '<span class="score-tag">' + escHtml(t) + '</span>').join('') + '</div>' : '') + '</div></div>'
  }

  html += '<div class="stat-row fade-in-up-d3"><div class="stat-item"><div class="stat-val stat-val-teal">' + s.weekCount + '</div><div class="stat-lbl">本周检测</div></div><div class="stat-div"></div><div class="stat-item"><div class="stat-val stat-val-teal">' + s.avgHeartRate + '</div><div class="stat-lbl">平均心率</div></div><div class="stat-div"></div><div class="stat-item"><div class="stat-val stat-val-teal">' + s.streakDays + '</div><div class="stat-lbl">连续天数</div></div></div>'

  if (s.trendData.length > 0) {
    html += '<div class="card card-accent-teal"><div class="trend-header"><div class="trend-title">7天健康趋势</div></div><div class="trend-chart">' + s.trendData.map((item, idx) => '<div class="trend-bar-col"><div class="trend-bar bar-grow-y ' + (item.hasAbnormal ? 'trend-bar-abnormal' : 'trend-bar-normal') + '" style="height:' + item.height + 'px; animation-delay:' + (idx * 0.04) + 's;"></div><div class="trend-bar-label">' + item.label + '</div></div>').join('') + '</div></div>'
  }

  html += '<div class="card profile-complete-card fade-in-up-d3"><div class="profile-complete-head"><div class="profile-complete-title">档案完整度</div><div class="profile-complete-val ' + (s.profileComplete === 100 ? 'done' : '') + '">' + s.profileComplete + '%</div></div><div class="progress-bar"><div class="progress-fill ' + (s.profileComplete === 100 ? 'profile-fill-done' : '') + '" style="width:' + s.profileComplete + '%;"></div></div><div class="profile-complete-hint">' + (s.profileComplete === 100 ? '档案已完善，个性化评估更精准' : '完善档案可获得更精准的健康评估') + '</div></div>'

  if (s.totalCount > 0) {
    html += '<div class="card fade-in-up-d3"><div class="trend-header"><div class="trend-title">检测活跃度</div><div class="heatmap-legend"><div class="heat-legend-item"><div class="heat-cell heat-l1"></div><span>少</span></div><div class="heat-legend-item"><div class="heat-cell heat-l4"></div><span>多</span></div></div></div><div class="heatmap">' + s.heatmap.map(week => '<div class="heat-week">' + week.map(cell => '<div class="heat-cell heat-l' + cell.level + '"></div>').join('') + '</div>').join('') + '</div></div>'
  }

  html += '<div class="sec"><div class="sec-title">健康档案</div></div><div class="list-group">'
  html += '<div class="list-row" data-profile-tab="0"><div class="list-icon list-icon-teal">基</div><div class="list-content"><div class="list-title">个人基础信息</div><div class="list-desc">姓名 · 性别 · 年龄段</div></div><div class="list-meta"><div class="list-meta-val">' + escHtml(s.userInfo.name || '未填') + '</div><div class="list-meta-lbl">' + escHtml((s.userInfo.gender ? (s.userInfo.gender === 'male' ? '男' : '女') : '') + (s.userInfo.ageRange ? ' · ' + s.userInfo.ageRange : '')) + '</div></div><div class="list-arrow">›</div></div>'
  html += '<div class="list-row" data-profile-tab="1"><div class="list-icon list-icon-amber">敏</div><div class="list-content"><div class="list-title">过敏史</div><div class="list-desc">食物过敏 · 药物过敏</div></div><div class="list-meta"><div class="list-meta-val">' + escHtml(s.allergySummary) + '</div><div class="list-meta-lbl">过敏情况</div></div><div class="list-arrow">›</div></div>'
  html += '<div class="list-row" data-profile-tab="2"><div class="list-icon list-icon-rose">疾</div><div class="list-content"><div class="list-title">慢性疾病</div><div class="list-desc">高血压 · 冠心病 · 糖尿病等</div></div><div class="list-meta"><div class="list-meta-val">' + escHtml(s.chronicSummary) + '</div><div class="list-meta-lbl">疾病情况</div></div><div class="list-arrow">›</div></div>'
  html += '</div>'

  html += '<div class="sec"><div class="sec-title">更多</div></div><div class="list-group"><div class="list-row" data-go-settings><div class="list-icon list-icon-slate">S</div><div class="list-content"><div class="list-title">设置</div><div class="list-desc">数据管理 · 系统设置 · 关于</div></div><div class="list-arrow">›</div></div></div>'
  html += '<div class="footer-text">心韵深辨 · 用心感知，以智辨析</div>'
  html += '</div>'
  root.innerHTML = html
  bindEvents()
}

function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

function bindEvents() {
  if (!root) return
  root.querySelectorAll('[data-profile-tab]').forEach(el => el.addEventListener('click', () => {
    const tab = parseInt(el.dataset.profileTab, 10)
    profileSheet.show(false, tab, info => { globalData.userInfo = info; computeAndSetData() })
  }))
  const goSettings = root.querySelector('[data-go-settings]')
  if (goSettings) goSettings.addEventListener('click', () => showToast({ title: '设置页建设中', icon: 'none' }))
}

export default {
  title: '我的', tab: 4,
  async mount(container) {
    root = container
    state.theme = globalData.theme
    computeAndSetData()
  },
  unmount() { if (_scoreAnim) { try { cancelAnimationFrame(_scoreAnim) } catch (e) {} _scoreAnim = null } root = null },
  updateTheme(theme) { state.theme = theme; if (root) render() }
}
