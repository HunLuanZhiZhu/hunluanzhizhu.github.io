// pages/mine.js — 我的页面 (H5 版)
// 由小程序 pages/mine/mine.js + mine.wxml 转化
// 功能: 用户统计、模型状态管理、历史记录导出/清理、关于信息

import { globalData, toggleTheme, loadModel } from '../app.js'
import * as profileSheet from '../profileSheet.js'
import { reLaunch } from '../router.js'
import { exportAndShare } from '../utils/exportHelper.js'
import { getStorageSync, removeStorageSync, clearStorageSync } from '../storage.js'
import { showToast, showModal, showLoading, hideLoading } from '../ui.js'

const state = {
  totalCount: 0,
  normalCount: 0,
  abnormalCount: 0,
  modelStatusText: '未加载',
  theme: 'light',
  userInfo: {}
}

let root = null

function setData(patch) {
  Object.assign(state, patch)
  render()
}

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-mine dark' : 'container page-mine'
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'

  html += '<div class="header"><div class="title-xl">我的</div></div>'

  // 用户信息卡片
  html += '<div class="card profile-card">' +
    '<div class="avatar"><img class="avatar-img" src="assets/logo.jpg" alt="logo" /></div>' +
    '<div class="profile-info">' +
      '<div class="profile-name">心韵深辨</div>' +
      '<div class="profile-desc">智能心电检测助手</div>' +
    '</div>' +
  '</div>'

  // 统计数据
  html += '<div class="card stats-card">' +
    '<div class="stat-item"><div class="stat-value">' + s.totalCount + '</div><div class="stat-label">总检测</div></div>' +
    '<div class="stat-divider"></div>' +
    '<div class="stat-item"><div class="stat-value text-success">' + s.normalCount + '</div><div class="stat-label">正常</div></div>' +
    '<div class="stat-divider"></div>' +
    '<div class="stat-item"><div class="stat-value text-danger">' + s.abnormalCount + '</div><div class="stat-label">异常</div></div>' +
  '</div>'

  // 个人档案卡片
  const hasProfile = s.userInfo.name || s.userInfo.gender || s.userInfo.ageRange
  let profileDesc = '完善信息以获得更精准的健康参考'
  if (hasProfile) {
    profileDesc = (s.userInfo.name ? s.userInfo.name + ' · ' : '') +
      (s.userInfo.gender === 'male' ? '男' : s.userInfo.gender === 'female' ? '女' : '') +
      (s.userInfo.ageRange ? ' · ' + s.userInfo.ageRange + '岁' : '')
  }
  html += '<div class="card profile-edit-card" id="editProfile">' +
    '<div class="list-icon" style="background: var(--accent-blue);"><span class="list-icon-text">☺</span></div>' +
    '<div class="list-content">' +
      '<div class="list-title">个人档案</div>' +
      '<div class="list-desc">' + profileDesc + '</div>' +
    '</div>' +
    '<div class="list-arrow">›</div>' +
  '</div>'

  // 功能列表
  html += '<div class="card">' +
    // 深色模式开关
    '<div class="list-item list-item-switch">' +
      '<div class="list-icon" style="background: var(--accent-indigo);"><span class="list-icon-text">◑</span></div>' +
      '<div class="list-content"><div class="list-title">深色模式</div></div>' +
      '<div class="switch-track ' + (s.theme === 'dark' ? 'switch-on' : '') + '" id="toggleTheme"><div class="switch-thumb"></div></div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="list-item" id="exportHistory">' +
      '<div class="list-icon" style="background: var(--accent-green);"><span class="list-icon-text">↥</span></div>' +
      '<div class="list-content"><div class="list-title">导出历史记录</div><div class="list-desc">导出为 JSON 文件</div></div>' +
      '<div class="list-arrow">›</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="list-item" id="clearHistory">' +
      '<div class="list-icon" style="background: var(--accent-red);"><span class="list-icon-text">×</span></div>' +
      '<div class="list-content"><div class="list-title">清空历史记录</div><div class="list-desc">删除所有检测记录</div></div>' +
      '<div class="list-arrow">›</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="list-item" id="reloadModel">' +
      '<div class="list-icon" style="background: var(--accent-blue);"><span class="list-icon-text">↻</span></div>' +
      '<div class="list-content"><div class="list-title">重新加载模型</div><div class="list-desc">' + s.modelStatusText + '</div></div>' +
      '<div class="list-arrow">›</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="list-item" id="about">' +
      '<div class="list-icon" style="background: var(--accent-teal);"><span class="list-icon-text">i</span></div>' +
      '<div class="list-content"><div class="list-title">关于心韵深辨</div><div class="list-desc">版本 1.0.0</div></div>' +
      '<div class="list-arrow">›</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="list-item" id="clearAllData">' +
      '<div class="list-icon" style="background: var(--label-quaternary);"><span class="list-icon-text">⌫</span></div>' +
      '<div class="list-content"><div class="list-title">清除所有数据</div><div class="list-desc">重置为初始状态</div></div>' +
      '<div class="list-arrow">›</div>' +
    '</div>' +
  '</div>'

  // 技术信息
  html += '<div class="card">' +
    '<div class="title-md" style="margin-bottom: 10px;">技术架构</div>' +
    '<div class="tech-info">' +
      '<div class="tech-item"><span class="tech-label">推理框架</span><span class="tech-value">TensorFlow.js</span></div>' +
      '<div class="tech-item"><span class="tech-label">模型架构</span><span class="tech-value">TCN + 分数阶优化</span></div>' +
      '<div class="tech-item"><span class="tech-label">权重文件</span><span class="tech-value">FP16 量化 · 1.4MB</span></div>' +
      '<div class="tech-item"><span class="tech-label">运行方式</span><span class="tech-value">本地推理</span></div>' +
    '</div>' +
  '</div>'

  html += '<div class="footer-text">心韵深辨 · 本地AI心电检测</div>'
  html += '</div>'
  root.innerHTML = html
  bindEvents()
}

function loadStats() {
  const history = getStorageSync('history') || []
  let normal = 0
  let abnormal = 0
  for (const r of history) {
    if (r.isAbnormal) abnormal++
    else normal++
  }
  setData({
    totalCount: history.length,
    normalCount: normal,
    abnormalCount: abnormal
  })
}

function checkModelStatus() {
  const g = globalData
  if (g.isModelReady) {
    setData({ modelStatusText: '已就绪 ✓' })
  } else if (g.modelLoading) {
    setData({ modelStatusText: '加载中...' })
  } else {
    setData({ modelStatusText: '未加载' })
  }
}

function onEditProfile() {
  profileSheet.show(false, function(info) {
    globalData.userInfo = info
    setData({ userInfo: info })
  })
}

function onToggleTheme() {
  const newTheme = toggleTheme()
  setData({ theme: newTheme })
}

function onExportHistory() {
  const history = getStorageSync('history') || []
  exportAndShare(history)
}

function onClearHistory() {
  showModal({
    title: '清空历史记录',
    content: '确定删除所有检测记录吗？此操作不可撤销。',
    confirmColor: '#FF3B30',
    onConfirm: function() {
      removeStorageSync('history')
      loadStats()
      showToast({ title: '已清空', icon: 'success' })
    }
  })
}

async function onReloadModel() {
  if (globalData.modelLoading) {
    showToast({ title: '正在加载中...', icon: 'none' })
    return
  }
  // 重置, 强制重新加载 (H5: 无文件缓存, 直接重新 fetch)
  globalData.isModelReady = false
  globalData.weights = null

  try {
    showLoading({ title: '加载模型中...' })
    setData({ modelStatusText: '加载中...' })
    await loadModel()
    hideLoading()
    setData({ modelStatusText: '已就绪 ✓' })
    showToast({ title: '模型已加载', icon: 'success' })
  } catch (e) {
    hideLoading()
    setData({ modelStatusText: '加载失败' })
    showToast({ title: '加载失败', icon: 'none' })
  }
}

function onAbout() {
  showModal({
    title: '心韵深辨',
    content: '基于分数阶优化算法与时间卷积网络（TCN）的智能心电检测小程序。\n\n采用 TensorFlow.js 在本地完成推理，模型权重 FP16 量化压缩至 1.4MB，无需上传数据至服务器，保护用户隐私。\n\n版本: 1.0.0',
    showCancel: false,
    confirmText: '知道了'
  })
}

function onClearAllData() {
  showModal({
    title: '清除所有数据',
    content: '将清除所有检测记录、个人档案和偏好设置，恢复为初始状态。此操作不可撤销。',
    confirmText: '清除',
    confirmColor: '#FF3B30',
    onConfirm: function() {
      clearStorageSync()
      globalData.theme = 'light'
      globalData.userInfo = null
      globalData.isModelReady = false
      globalData.weights = null
      // 效果等同重启: 回到检测首页
      reLaunch()
    }
  })
}

function bindEvents() {
  if (!root) return
  const editProfile = root.querySelector('#editProfile')
  if (editProfile) editProfile.addEventListener('click', onEditProfile)
  const toggleThemeEl = root.querySelector('#toggleTheme')
  if (toggleThemeEl) toggleThemeEl.addEventListener('click', onToggleTheme)
  const exportHistory = root.querySelector('#exportHistory')
  if (exportHistory) exportHistory.addEventListener('click', onExportHistory)
  const clearHistory = root.querySelector('#clearHistory')
  if (clearHistory) clearHistory.addEventListener('click', onClearHistory)
  const reloadModel = root.querySelector('#reloadModel')
  if (reloadModel) reloadModel.addEventListener('click', onReloadModel)
  const about = root.querySelector('#about')
  if (about) about.addEventListener('click', onAbout)
  const clearAllData = root.querySelector('#clearAllData')
  if (clearAllData) clearAllData.addEventListener('click', onClearAllData)
}

export default {
  title: '我的',
  tab: 4,

  async mount(container) {
    root = container
    setData({
      theme: globalData.theme,
      userInfo: getStorageSync('userInfo') || {}
    })
    loadStats()
    checkModelStatus()
  },

  unmount() {
    root = null
  },

  updateTheme(theme) {
    setData({ theme: theme })
  }
}
