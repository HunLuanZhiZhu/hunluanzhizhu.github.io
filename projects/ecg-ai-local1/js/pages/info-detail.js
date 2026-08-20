// pages/info-detail.js — 项目背景/技术亮点 详情页 (H5 版)
// 由小程序 pages/info-detail/info-detail.js + info-detail.wxml 转化
// 数据经 globalData.infoDetail 传入 ({icon, title, detail})

import { globalData } from '../app.js'
import { navigateBack } from '../router.js'

const state = { theme: 'light', info: {} }
let root = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-info-detail dark' : 'container page-info-detail'
}

function render() {
  if (!root) return
  const info = state.info
  let html = '<div class="' + themeClass() + '">'

  // Hero: 大图标 + 标题
  html += '<div class="hero">' +
    '<div class="hero-icon">' + (info.icon || '') + '</div>' +
    '<div class="hero-title">' + (info.title || '') + '</div>' +
  '</div>'

  // 详情正文
  html += '<div class="card detail-card">' +
    '<div class="detail-text">' + (info.detail || '') + '</div>' +
  '</div>'

  html += '</div>'
  root.innerHTML = html
}

export default {
  title: '详情',
  tab: -1,

  async mount(container) {
    root = container
    const data = globalData.infoDetail
    if (!data) {
      navigateBack()
      return
    }
    state.info = data
    state.theme = globalData.theme
    render()
  },

  unmount() {
    root = null
  },

  updateTheme(theme) {
    state.theme = theme
    render()
  }
}
