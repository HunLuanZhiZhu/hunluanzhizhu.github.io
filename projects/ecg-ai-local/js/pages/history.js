// pages/history.js — 心电检测历史记录页面 (H5 版)
// 由小程序 pages/history/history.js + history.wxml 转化

import { globalData } from '../app.js'
import { navigateTo, switchTab } from '../router.js'
import { exportAndShare } from '../utils/exportHelper.js'
import { getStorageSync, setStorageSync, removeStorageSync } from '../storage.js'
import { showToast, showModal } from '../ui.js'

const state = {
  historyList: [],
  totalCount: 0,
  abnormalCount: 0,
  normalCount: 0,
  theme: 'light',
  editMode: false,
  selectedCount: 0,
  allChecked: false,
  analysis: null
}

let root = null

function setData(patch) {
  Object.assign(state, patch)
  render()
}

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-history dark' : 'container page-history'
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'

  html += '<div class="header">' +
    '<div class="title-xl">检测历史</div>' +
    '<div class="subtitle">查看所有心电检测记录</div>' +
  '</div>'

  // 顶部统计栏
  html += '<div class="card stats-bar fade-in">' +
    '<div class="stats-item"><span class="stats-number">' + s.totalCount + '</span><span class="stats-label">总检测</span></div>' +
    '<div class="stats-divider"></div>' +
    '<div class="stats-item"><span class="stats-number text-danger">' + s.abnormalCount + '</span><span class="stats-label">异常</span></div>' +
    '<div class="stats-divider"></div>' +
    '<div class="stats-item"><span class="stats-number text-success">' + s.normalCount + '</span><span class="stats-label">正常</span></div>' +
  '</div>'

  // 综合分析入口
  if (s.historyList.length > 0) {
    html += '<div class="card analysis-entry" id="goAnalysis">' +
      '<div class="analysis-entry-icon">📊</div>' +
      '<div class="analysis-entry-info">' +
        '<div class="analysis-entry-title">综合分析</div>' +
        '<div class="analysis-entry-desc">查看检测数据统计与健康建议</div>' +
      '</div>' +
      (s.analysis ? '<div class="risk-badge risk-' + s.analysis.riskColor + '">' + s.analysis.riskLevel + '风险</div>' : '') +
      '<span class="entry-arrow">›</span>' +
    '</div>'
  }

  // 操作栏
  if (s.historyList.length > 0) {
    html += '<div class="action-bar">' +
      '<div class="action-btn manage-btn" id="btnToggleEdit"><span>' + (s.editMode ? '完成' : '管理') + '</span></div>' +
      '<div class="action-btn export-btn" id="btnExport"><span>导出</span></div>' +
      '<div class="action-btn clear-btn" id="btnClear"><span>清空全部</span></div>' +
    '</div>'
  }

  // 历史记录列表
  if (s.historyList.length > 0) {
    html += '<div class="history-list">'
    s.historyList.forEach(function(item) {
      html += '<div class="card history-card fade-in ' + (s.editMode ? 'edit-mode' : '') + '" data-id="' + item.id + '" data-card>' +
        (s.editMode
          ? '<div class="check-box ' + (item.checked ? 'checked' : '') + '" data-check>' +
              (item.checked ? '<div class="check-mark">✓</div>' : '') +
            '</div>'
          : '') +
        '<div class="card-left cat-' + item.classAbbr + '"><span class="abbr">' + item.classAbbr + '</span></div>' +
        '<div class="card-content">' +
          '<div class="card-top-row">' +
            '<span class="card-time">' + item.timeStr + '</span>' +
            '<div class="tag ' + (item.isAbnormal ? 'tag-abnormal' : 'tag-normal') + '"><span>' + (item.isAbnormal ? '异常' : '正常') + '</span></div>' +
          '</div>' +
          '<div class="card-bottom-row">' +
            '<span class="card-classname">' + item.className + '</span>' +
            '<span class="card-confidence">' + item.confidencePercent + '%</span>' +
          '</div>' +
        '</div>' +
        (s.editMode ? '' : '<span class="card-arrow">›</span>') +
      '</div>'
    })
    html += '</div>'
  }

  // 底部删除栏 (编辑态)
  if (s.editMode && s.historyList.length > 0) {
    html += '<div class="bottom-delete-bar">' +
      '<div class="select-all-btn" id="btnSelectAll"><span>' + (s.allChecked ? '取消全选' : '全选') + '</span></div>' +
      '<div class="delete-selected-btn ' + (s.selectedCount > 0 ? 'active' : '') + '" id="btnDeleteSelected"><span>删除选中' + (s.selectedCount > 0 ? '(' + s.selectedCount + ')' : '') + '</span></div>' +
    '</div>'
  }

  // 空状态
  if (s.historyList.length === 0) {
    html += '<div class="empty-state">' +
      '<div class="empty-icon"><div class="empty-pulse"></div></div>' +
      '<span class="empty-text">暂无检测记录</span>' +
      '<span class="empty-subtext">完成心电检测后，记录将显示在此处</span>' +
    '</div>'
  }

  html += '</div>'
  root.innerHTML = html
  bindEvents()
}

// 轻量计算风险标签
function loadRiskPreview() {
  const rawList = getStorageSync('history') || []
  if (rawList.length === 0) {
    setData({ analysis: null })
    return
  }
  let abnormal = 0
  for (let i = 0; i < rawList.length; i++) {
    if (rawList[i].isAbnormal) abnormal++
  }
  const rate = abnormal / rawList.length * 100
  let level = '低', color = 'green'
  if (rate >= 50) { level = '高'; color = 'red' }
  else if (rate >= 25) { level = '中'; color = 'orange' }
  setData({ analysis: { riskLevel: level, riskColor: color } })
}

// 加载历史记录并格式化
function loadHistory() {
  const rawList = getStorageSync('history') || []
  const sorted = rawList.slice().sort((a, b) => b.timestamp - a.timestamp)

  // 保留 checked 状态
  const prevChecked = {}
  state.historyList.forEach(item => {
    if (item.checked) prevChecked[item.id] = true
  })

  const historyList = sorted.map(item => {
    return {
      id: item.id,
      timeStr: formatTime(item.timestamp),
      className: item.className,
      classAbbr: item.classAbbr,
      isAbnormal: item.isAbnormal,
      confidence: item.confidence,
      confidencePercent: item.confidencePercent || ((item.confidence || 0) * 100).toFixed(1),
      checked: !!prevChecked[item.id]
    }
  })

  const abnormalCount = rawList.filter(item => item.isAbnormal).length
  const selectedCount = historyList.filter(item => item.checked).length

  setData({
    historyList,
    totalCount: rawList.length,
    abnormalCount,
    normalCount: rawList.length - abnormalCount,
    selectedCount,
    allChecked: historyList.length > 0 && selectedCount === historyList.length
  })
}

function onGoAnalysis() {
  navigateTo('analysis')
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.getFullYear() + '-' + padZero(date.getMonth() + 1) + '-' + padZero(date.getDate()) +
    ' ' + padZero(date.getHours()) + ':' + padZero(date.getMinutes())
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n
}

// 点击单条记录
function onItemTap(id) {
  if (state.editMode) {
    toggleCheck(id)
    return
  }
  // 非编辑态: 跳转检测页查看详情 (通过 globalData 传参, 与原小程序一致)
  globalData.pendingHistoryId = id
  switchTab('#/detect')
}

function toggleCheck(id) {
  const list = state.historyList
  let count = 0
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i].checked = !list[i].checked
    }
    if (list[i].checked) count++
  }
  setData({
    historyList: list,
    selectedCount: count,
    allChecked: list.length > 0 && count === list.length
  })
}

function onToggleEdit() {
  const newMode = !state.editMode
  if (!newMode) {
    const list = state.historyList
    for (let i = 0; i < list.length; i++) {
      list[i].checked = false
    }
    setData({
      editMode: false,
      historyList: list,
      selectedCount: 0,
      allChecked: false
    })
  } else {
    setData({ editMode: true })
  }
}

function onToggleSelectAll() {
  const list = state.historyList
  const newChecked = !state.allChecked
  for (let i = 0; i < list.length; i++) {
    list[i].checked = newChecked
  }
  const count = newChecked ? list.length : 0
  setData({
    historyList: list,
    selectedCount: count,
    allChecked: newChecked
  })
}

function onDeleteSelected() {
  if (state.selectedCount === 0) {
    showToast({ title: '请先选择记录', icon: 'none' })
    return
  }
  showModal({
    title: '删除记录',
    content: '确定删除选中的 ' + state.selectedCount + ' 条记录吗？此操作不可恢复。',
    confirmText: '删除',
    confirmColor: '#FF3B30',
    cancelText: '取消',
    onConfirm: function() {
      const rawList = getStorageSync('history') || []
      const checkedIds = {}
      state.historyList.forEach(function(item) {
        if (item.checked) checkedIds[item.id] = true
      })
      const newList = rawList.filter(function(item) {
        return !checkedIds[item.id]
      })
      if (newList.length > 0) {
        setStorageSync('history', newList)
      } else {
        removeStorageSync('history')
      }
      setData({ editMode: false })
      loadHistory()
      showToast({ title: '已删除', icon: 'success' })
    }
  })
}

function onExportHistory() {
  const history = getStorageSync('history') || []
  exportAndShare(history)
}

function onClearHistory() {
  if (state.historyList.length === 0) return
  showModal({
    title: '清空历史记录',
    content: '确定要清空全部 ' + state.totalCount + ' 条检测记录吗？此操作不可恢复。',
    confirmText: '清空',
    confirmColor: '#FF3B30',
    cancelText: '取消',
    onConfirm: function() {
      removeStorageSync('history')
      setData({
        historyList: [],
        totalCount: 0,
        abnormalCount: 0,
        normalCount: 0,
        editMode: false,
        selectedCount: 0
      })
      showToast({ title: '已清空', icon: 'success' })
    }
  })
}

function bindEvents() {
  if (!root) return
  const goAnalysis = root.querySelector('#goAnalysis')
  if (goAnalysis) goAnalysis.addEventListener('click', onGoAnalysis)

  const btnToggleEdit = root.querySelector('#btnToggleEdit')
  if (btnToggleEdit) btnToggleEdit.addEventListener('click', onToggleEdit)
  const btnExport = root.querySelector('#btnExport')
  if (btnExport) btnExport.addEventListener('click', onExportHistory)
  const btnClear = root.querySelector('#btnClear')
  if (btnClear) btnClear.addEventListener('click', onClearHistory)

  root.querySelectorAll('[data-card]').forEach(function(card) {
    card.addEventListener('click', function() {
      onItemTap(card.dataset.id)
    })
  })

  const btnSelectAll = root.querySelector('#btnSelectAll')
  if (btnSelectAll) btnSelectAll.addEventListener('click', onToggleSelectAll)
  const btnDeleteSelected = root.querySelector('#btnDeleteSelected')
  if (btnDeleteSelected) btnDeleteSelected.addEventListener('click', onDeleteSelected)
}

export default {
  title: '检测历史',
  tab: 1,

  async mount(container) {
    root = container
    setData({ theme: globalData.theme })
    loadHistory()
    loadRiskPreview()
  },

  unmount() {
    root = null
  },

  updateTheme(theme) {
    setData({ theme: theme })
  }
}
