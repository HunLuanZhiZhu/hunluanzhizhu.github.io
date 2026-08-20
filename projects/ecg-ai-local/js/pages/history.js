// js/pages/history.js — 检测历史页 (H5)
// 来源: pages/history/history.js + history.wxml
// 同步: 小程序 logo-card 精炼文案、心跳有迹可循、stat-hero/donut/trend/risk 等全局样式、分组/骨架/空状态等

import { globalData } from '../app.js'
import { navigateTo, switchTab } from '../router.js'
import { exportAndShare } from '../utils/exportHelper.js'
import { getStorageSync, setStorageSync, removeStorageSync } from '../storage.js'
import { showToast, showModal } from '../ui.js'

const state = {
  historyList: [],
  groupedHistory: [],
  totalCount: 0,
  abnormalCount: 0,
  normalCount: 0,
  theme: 'light',
  editMode: false,
  selectedCount: 0,
  allChecked: false,
  analysis: null,
  trendData: [],
  trendNormalRate: 0,
  categoryStats: [],
  donutGradient: '',
  riskLevel: 'green',
  riskLevelText: '',
  riskDesc: '',
  riskIcon: '',
  loading: true
}

let root = null
let _donutAnim = null
let _donutSegments = []

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-history dark' : 'container page-history'
}

function padZero(n) { return n < 10 ? '0' + n : '' + n }

function formatTime(ts) {
  const d = new Date(ts)
  return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate()) + ' ' + padZero(d.getHours()) + ':' + padZero(d.getMinutes())
}

// —— 以下 5 个 load* 与小程序 history.js 完全一致的逻辑（仅把 wx.* 换成 storage）——

function loadHistory(rawList) {
  if (rawList === undefined) rawList = getStorageSync('history') || []
  const sorted = rawList.slice().sort((a, b) => b.timestamp - a.timestamp)
  const prevChecked = {}
  state.historyList.forEach(item => { if (item.checked) prevChecked[item.id] = true })
  const historyList = sorted.map(item => ({
    id: item.id,
    timeStr: formatTime(item.timestamp),
    className: item.className,
    classAbbr: item.classAbbr,
    isAbnormal: item.isAbnormal,
    confidence: item.confidence,
    confidencePercent: item.confidencePercent || ((item.confidence || 0) * 100).toFixed(1),
    checked: !!prevChecked[item.id]
  }))
  const abnormalCount = rawList.filter(item => item.isAbnormal).length
  const selectedCount = historyList.filter(item => item.checked).length
  const groupedHistory = buildGroups(historyList)
  return { loading: false, historyList, groupedHistory, totalCount: rawList.length, abnormalCount, normalCount: rawList.length - abnormalCount, selectedCount, allChecked: historyList.length > 0 && selectedCount === historyList.length }
}

function buildGroups(list) {
  const now = new Date()
  const today = now.getFullYear() + '-' + padZero(now.getMonth() + 1) + '-' + padZero(now.getDate())
  const y = new Date(now); y.setDate(y.getDate() - 1)
  const yesterday = y.getFullYear() + '-' + padZero(y.getMonth() + 1) + '-' + padZero(y.getDate())
  const groups = [{ label: '今天', items: [] }, { label: '昨天', items: [] }, { label: '更早', items: [] }]
  for (let i = 0; i < list.length; i++) {
    const day = list[i].timeStr ? list[i].timeStr.slice(0, 10) : ''
    if (day === today) groups[0].items.push(list[i])
    else if (day === yesterday) groups[1].items.push(list[i])
    else groups[2].items.push(list[i])
  }
  return groups.filter(g => g.items.length > 0)
}

function loadRiskData(rawList) {
  if (rawList === undefined) rawList = getStorageSync('history') || []
  if (rawList.length === 0) return { analysis: null, riskLevel: 'green', riskLevelText: '', riskDesc: '', riskIcon: '' }
  const total = rawList.length
  let abnormal = 0; for (let i = 0; i < rawList.length; i++) if (rawList[i].isAbnormal) abnormal++
  const abnormalRate = abnormal / total
  const rate = abnormal / total * 100
  let shortLevel = '低', shortColor = 'green'
  if (rate >= 50) { shortLevel = '高'; shortColor = 'red' }
  else if (rate >= 25) { shortLevel = '中'; shortColor = 'orange' }
  let level, text, desc, icon
  if (abnormalRate < 0.3) { level = 'green'; text = '低风险'; icon = '✓'; desc = '近期检测以正常心律为主，异常率' + Math.round(abnormalRate * 100) + '%。建议保持定期检测频率。' }
  else if (abnormalRate < 0.6) { level = 'orange'; text = '中风险'; icon = '!'; desc = '近期异常率' + Math.round(abnormalRate * 100) + '%，建议增加检测频率并关注身体变化。' }
  else { level = 'red'; text = '高风险'; icon = '!'; desc = '近期异常率' + Math.round(abnormalRate * 100) + '%，建议尽快前往医院进行专业检查。' }
  return { analysis: { riskLevel: shortLevel, riskColor: shortColor }, riskLevel: level, riskLevelText: text, riskDesc: desc, riskIcon: icon }
}

function loadTrendData(history) {
  if (history === undefined) history = getStorageSync('history') || []
  if (history.length === 0) return { trendData: [], trendNormalRate: 0 }
  const dayMap = {}, dayLabels = [], now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const dateStr = d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate())
    const label = (d.getMonth() + 1) + '/' + d.getDate()
    dayMap[dateStr] = { count: 0, abnormal: 0, normal: 0, hasAbnormal: false }
    dayLabels.push({ dateStr, label })
  }
  for (let j = 0; j < history.length; j++) {
    const record = history[j]; const rd = new Date(record.timestamp)
    const recordDateStr = rd.getFullYear() + '-' + padZero(rd.getMonth() + 1) + '-' + padZero(rd.getDate())
    if (dayMap[recordDateStr]) { dayMap[recordDateStr].count++; if (record.isAbnormal) { dayMap[recordDateStr].abnormal++; dayMap[recordDateStr].hasAbnormal = true } else dayMap[recordDateStr].normal++ }
  }
  let maxCount = 0; for (let m = 0; m < dayLabels.length; m++) if (dayMap[dayLabels[m].dateStr].count > maxCount) maxCount = dayMap[dayLabels[m].dateStr].count
  const trendData = []; let totalCount = 0, totalNormal = 0
  for (let n = 0; n < dayLabels.length; n++) {
    const dayInfo = dayMap[dayLabels[n].dateStr]
    const height = maxCount > 0 ? Math.max(4, Math.round(dayInfo.count / maxCount * 50)) : 4
    trendData.push({ date: dayLabels[n].dateStr, label: dayLabels[n].label, height, hasAbnormal: dayInfo.hasAbnormal, count: dayInfo.count })
    totalCount += dayInfo.count; totalNormal += dayInfo.normal
  }
  return { trendData, trendNormalRate: totalCount > 0 ? Math.round(totalNormal / totalCount * 100) : 0 }
}

function loadCategoryStats(history, theme) {
  if (history === undefined) history = getStorageSync('history') || []
  if (history.length === 0) { _donutSegments = []; return { categoryStats: [], donutGradient: '' } }
  const counts = { N: 0, S: 0, V: 0, F: 0, Q: 0 }
  for (let i = 0; i < history.length; i++) { const abbr = history[i].classAbbr || 'Q'; if (counts[abbr] !== undefined) counts[abbr]++ }
  const names = { N: '正常心律', S: '室上性早搏', V: '室性早搏', F: '融合心搏', Q: '未分类' }
  const categoryColors = (globalData.categoryColors) || { N: { light: '#10B981', dark: '#34D399' }, S: { light: '#B45309', dark: '#FBBF24' }, V: { light: '#E11D48', dark: '#FB7185' }, F: { light: '#F97316', dark: '#FB923C' }, Q: { light: '#78909C', dark: '#64748B' } }
  const currentTheme = theme || state.theme
  const isDark = currentTheme === 'dark'
  const stats = [], total = history.length, segments = [], segmentData = []
  let currentDeg = 0
  const order = ['N', 'S', 'V', 'F', 'Q']
  for (let j = 0; j < order.length; j++) {
    const abbr = order[j]
    if (counts[abbr] > 0) {
      const deg = Math.round(counts[abbr] / total * 360)
      const colorObj = categoryColors[abbr] || { light: '#78909C', dark: '#64748B' }
      const color = isDark ? colorObj.dark : colorObj.light
      segments.push(color + ' ' + currentDeg + 'deg ' + (currentDeg + deg) + 'deg')
      segmentData.push({ color, deg }); currentDeg += deg
      stats.push({ abbr, name: names[abbr], count: counts[abbr] })
    }
  }
  _donutSegments = segmentData
  return { categoryStats: stats, donutGradient: 'conic-gradient(' + segments.join(', ') + ')' }
}

function animateDonut(total) {
  if (!_donutSegments || !_donutSegments.length || !total) return
  if (_donutAnim) { try { _donutAnim.stop?.() } catch (e) {} _donutAnim = null }
  const start = performance.now(), duration = 480
  const tick = now => {
    const p = Math.min(1, (now - start) / duration)
    const parts = []; let deg = 0
    for (let i = 0; i < _donutSegments.length; i++) { const next = deg + _donutSegments[i].deg * p; parts.push(_donutSegments[i].color + ' ' + deg.toFixed(1) + 'deg ' + next.toFixed(1) + 'deg'); deg = next }
    const el = root && root.querySelector('.donut-ring')
    const valEl = root && root.querySelector('.donut-center-val')
    if (el) el.style.background = 'conic-gradient(' + parts.join(', ') + ')'
    if (valEl) valEl.textContent = String(Math.round(total * p))
    if (p < 1) _donutAnim = requestAnimationFrame(tick)
  }
  _donutAnim = requestAnimationFrame(tick)
}

function refreshAll() {
  const history = getStorageSync('history') || []
  const theme = globalData.theme
  const historyData = loadHistory(history)
  const riskData = loadRiskData(history)
  const trendData = loadTrendData(history)
  const categoryData = loadCategoryStats(history, theme)
  Object.assign(state, { theme }, historyData, riskData, trendData, categoryData)
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + (s.editMode ? ' edit-padding-bottom' : '') + '">'

  // 骨架屏（首载，loading 时）
  if (s.loading) {
    html += '<div class="sk sk-stat"></div><div class="sk-card"><div class="sk sk-line sk-line-40"></div><div class="sk-bars">' + [1,2,3,4,5,6,7].map(() => '<div class="sk sk-bar"></div>').join('') + '</div></div>'
    html += '<div class="sk-card">' + [1,2,3,4,5].map(() => '<div class="sk-row"><div class="sk sk-avatar"></div><div class="sk-lines"><div class="sk sk-line"></div><div class="sk sk-line sk-line-40"></div></div></div>').join('') + '</div>'
    html += '</div>'; root.innerHTML = html; return
  }

  // 顶部：page-head + logo-card（与小程序 history.wxml 精炼文案一致）
  if (s.historyList.length > 0) {
    html += '<div class="page-head fade-in-up"><div class="page-eyebrow">检测记录</div><div class="page-title">检测历史</div></div>'
    html += '<div class="logo-card fade-in-up-d1"><img class="logo-card-img" src="assets/logo.jpg" alt="logo" /><div class="logo-card-text"><div class="logo-card-title">心韵深辨</div><div class="logo-card-sub">心跳有迹可循 · 趋势/分布/风险一目了然</div></div></div>'
  }

  if (s.historyList.length > 0) {
    // stat-hero
    html += '<div class="stat-hero fade-in-up-d1"><div class="stat-hero-item"><div class="stat-hero-val">' + s.totalCount + '</div><div class="stat-hero-lbl">总检测</div></div><div class="stat-hero-div"></div><div class="stat-hero-item"><div class="stat-hero-val green">' + s.normalCount + '</div><div class="stat-hero-lbl">正常</div></div><div class="stat-hero-div"></div><div class="stat-hero-item"><div class="stat-hero-val red">' + s.abnormalCount + '</div><div class="stat-hero-lbl">异常</div></div></div>'
    // 趋势
    html += '<div class="trend-card fade-in-up-d2"><div class="trend-header"><div class="trend-title">7天检测趋势</div>' + (s.trendNormalRate > 0 ? '<div class="trend-rate">' + s.trendNormalRate + '% 正常</div>' : '') + '</div><div class="trend-chart">' + s.trendData.map((item, idx) => '<div class="trend-bar-col"><div class="trend-bar bar-grow-y ' + (item.hasAbnormal ? 'trend-bar-abnormal' : 'trend-bar-normal') + '" style="height:' + item.height + 'px; animation-delay:' + (idx * 0.04) + 's;"></div><div class="trend-bar-label">' + item.label + '</div></div>').join('') + '</div></div>'
    // 环图
    html += '<div class="donut-card fade-in-up-d3"><div class="donut-header"><div class="donut-title">心律分类统计</div></div><div class="donut-body"><div class="donut-ring" style="background:' + s.donutGradient + ';"><div class="donut-center"><div class="donut-center-val">' + s.totalCount + '</div><div class="donut-center-lbl">总计</div></div></div><div class="donut-legend">' + s.categoryStats.map(item => '<div class="legend-item"><div class="legend-dot legend-dot-' + item.abbr + '"></div><div class="legend-name">' + item.name + '</div><div class="legend-val">' + item.count + '</div></div>').join('') + '</div></div></div>'
    // 风险卡
    html += '<div class="risk-card risk-card-' + s.riskLevel + ' fade-in-up-d4"><div class="risk-icon risk-icon-' + s.riskLevel + '">' + s.riskIcon + '</div><div class="risk-info"><div class="risk-level risk-level-' + s.riskLevel + '">' + s.riskLevelText + '</div><div class="risk-desc">' + s.riskDesc + '</div></div></div>'
    // 综合分析入口（用 list-icon-teal + 文字“析”，与小程序一致，去 emoji）
    html += '<div class="list-group"><div class="list-row" data-go-analysis><div class="list-icon list-icon-teal">析</div><div class="list-content"><div class="list-title">综合分析</div><div class="list-desc">查看检测数据统计与健康建议</div></div>' + (s.analysis ? '<div class="tag tag-orange">' + s.analysis.riskLevel + '风险</div>' : '') + '<div class="list-arrow">›</div></div></div>'
    // 紧凑操作
    html += '<div class="compact-actions"><div class="compact-action-btn compact-action-manage" data-toggle-edit>' + (s.editMode ? '完成' : '管理') + '</div><div class="compact-action-btn compact-action-export" data-export>导出</div><div class="compact-action-btn compact-action-clear" data-clear>清空</div></div>'
    // 检测记录分组（今天/昨天/更早）
    html += '<div class="sec"><div class="sec-title">检测记录</div></div><div class="list-group">'
    s.groupedHistory.forEach(group => {
      html += '<div class="list-group-head">' + group.label + ' · ' + group.items.length + ' 条</div>'
      group.items.forEach((item, index) => {
        const delay = Math.min(index, 8) * 0.03
        html += '<div class="list-row stagger-item ' + (s.editMode ? 'edit-mode' : '') + '" data-card-id="' + item.id + '" style="animation-delay:' + delay + 's;">'
        if (s.editMode) html += '<div class="check-box ' + (item.checked ? 'checked' : '') + '"><div class="check-mark" style="' + (item.checked ? '' : 'display:none') + '">✓</div></div>'
        html += '<div class="list-badge list-badge-' + item.classAbbr + '">' + item.classAbbr + '</div><div class="list-content"><div class="list-title">' + item.timeStr + '</div><div class="list-desc">' + item.className + '</div></div>'
        if (!s.editMode) html += '<div class="tag ' + (item.isAbnormal ? 'tag-abnormal' : 'tag-normal') + '">' + (item.isAbnormal ? '异常' : '正常') + '</div><div class="list-meta"><div class="list-meta-val">' + item.confidencePercent + '%</div><div class="list-meta-lbl">置信度</div></div><div class="list-arrow">›</div>'
        html += '</div>'
      })
    })
    html += '</div>'
    if (s.editMode) {
      html += '<div class="bottom-delete-bar"><div class="select-all-btn" data-select-all>' + (s.allChecked ? '取消全选' : '全选') + '</div><div class="delete-selected-btn ' + (s.selectedCount > 0 ? 'active' : '') + '" data-delete-selected>删除选中' + (s.selectedCount > 0 ? '(' + s.selectedCount + ')' : '') + '</div></div>'
    }
    html += '<div class="footer-text">心韵深辨 · 用心感知，以智辨析</div>'
  }

  if (!s.loading && s.historyList.length === 0) {
    html += '<div class="empty-state ecg-bg-line"><div class="empty-icon empty-icon-text">记</div><div class="empty-text">暂无检测记录</div><div class="empty-subtext">完成心电检测后，记录将显示在此处</div><div class="empty-action-btn" data-go-detect>去检测</div></div>'
  }

  html += '</div>'
  root.innerHTML = html
  bindEvents()
  // 环图扫入动画（与小程序 480ms 一致，首载用同批渲染避免闪烁）
  if (s.historyList.length > 0 && _donutSegments.length) setTimeout(() => animateDonut(s.totalCount), 80)
}

function onItemTap(id) {
  if (state.editMode) { toggleCheck(id); render(); return }
  globalData.pendingHistoryId = id
  switchTab('detect')
}

function toggleCheck(id) {
  const list = state.historyList
  let count = 0
  for (let i = 0; i < list.length; i++) { if (list[i].id === id) list[i].checked = !list[i].checked; if (list[i].checked) count++ }
  state.selectedCount = count
  state.allChecked = list.length > 0 && count === list.length
  state.groupedHistory = buildGroups(list)
}

function onToggleEdit() {
  const newMode = !state.editMode
  if (!newMode) {
    for (let i = 0; i < state.historyList.length; i++) state.historyList[i].checked = false
    state.editMode = false; state.selectedCount = 0; state.allChecked = false
  } else state.editMode = true
  render()
}

function onToggleSelectAll() {
  const newChecked = !state.allChecked
  for (let i = 0; i < state.historyList.length; i++) state.historyList[i].checked = newChecked
  state.selectedCount = newChecked ? state.historyList.length : 0
  state.allChecked = newChecked
  state.groupedHistory = buildGroups(state.historyList)
  render()
}

function onDeleteSelected() {
  if (state.selectedCount === 0) { showToast({ title: '请先选择记录', icon: 'none' }); return }
  showModal({
    title: '删除记录',
    content: '确定删除选中的 ' + state.selectedCount + ' 条记录吗？此操作不可恢复。',
    confirmText: '删除', confirmColor: '#E11D48',
    onConfirm: function () {
      const rawList = getStorageSync('history') || []
      const checkedIds = {}; state.historyList.forEach(item => { if (item.checked) checkedIds[item.id] = true })
      const newList = rawList.filter(item => !checkedIds[item.id])
      if (newList.length > 0) setStorageSync('history', newList); else removeStorageSync('history')
      refreshAll(); render(); showToast({ title: '已删除', icon: 'success' })
    }
  })
}

function onExportHistory() { const history = getStorageSync('history') || []; exportAndShare(history) }

function onClearHistory() {
  if (state.historyList.length === 0) return
  showModal({
    title: '清空历史记录',
    content: '确定要清空全部 ' + state.totalCount + ' 条检测记录吗？此操作不可恢复。',
    confirmText: '清空', confirmColor: '#E11D48',
    onConfirm: function () { removeStorageSync('history'); refreshAll(); render(); showToast({ title: '已清空', icon: 'success' }) }
  })
}

function bindEvents() {
  if (!root) return
  const goAnalysis = root.querySelector('[data-go-analysis]'); if (goAnalysis) goAnalysis.addEventListener('click', () => navigateTo('analysis'))
  const toggleEdit = root.querySelector('[data-toggle-edit]'); if (toggleEdit) toggleEdit.addEventListener('click', onToggleEdit)
  const exp = root.querySelector('[data-export]'); if (exp) exp.addEventListener('click', onExportHistory)
  const clr = root.querySelector('[data-clear]'); if (clr) clr.addEventListener('click', onClearHistory)
  root.querySelectorAll('[data-card-id]').forEach(el => el.addEventListener('click', () => onItemTap(el.dataset.cardId)))
  const sel = root.querySelector('[data-select-all]'); if (sel) sel.addEventListener('click', onToggleSelectAll)
  const del = root.querySelector('[data-delete-selected]'); if (del) del.addEventListener('click', onDeleteSelected)
  const goDet = root.querySelector('[data-go-detect]'); if (goDet) goDet.addEventListener('click', () => switchTab('detect'))
}

export default {
  title: '检测历史', tab: 1,
  async mount(container) {
    root = container
    state.theme = globalData.theme
    state.loading = true; render()
    // 与小程序 onLoad 中 merged 一次 setData 的节奏一致：先算好再渲染
    refreshAll()
    render()
  },
  unmount() { if (_donutAnim) { try { cancelAnimationFrame(_donutAnim) } catch (e) {} _donutAnim = null } root = null },
  updateTheme(theme) {
    const historyForTheme = getStorageSync('history') || []
    const cat = loadCategoryStats(historyForTheme, theme)
    state.theme = theme
    Object.assign(state, cat)
    if (root) render()
  }
}
