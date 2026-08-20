// pages/member-detail.js — 成员详情页 (H5 版)
// 由小程序 pages/member-detail/member-detail.js + member-detail.wxml 转化
// 数据经 globalData.memberDetail 传入 (与原小程序一致)

import { globalData } from '../app.js'
import { navigateBack } from '../router.js'

const state = { theme: 'light', member: null }
let root = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-member-detail dark' : 'container page-member-detail'
}

function render() {
  if (!root || !state.member) return
  const m = state.member
  let html = '<div class="' + themeClass() + '">'

  // Hero: 大头像 + 姓名 + 身份
  html += '<div class="hero">' +
    '<div class="hero-avatar"><img class="hero-avatar-img" src="' + m.avatar + '" alt="' + m.name + '" /></div>' +
    '<div class="hero-name">' + m.name + '</div>' +
    '<div class="hero-role tag ' + (m.role === '指导老师' ? 'role-mentor' : 'role-member') + '">' + m.role + '</div>' +
  '</div>'

  // 详细信息卡片
  html += '<div class="card detail-card">' +
    '<div class="detail-section">' +
      '<div class="detail-label">学历背景</div>' +
      '<div class="detail-text">' + m.education + '</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="detail-section">' +
      '<div class="detail-label">研究方向</div>' +
      '<div class="detail-text">' + m.research + '</div>' +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="detail-section">' +
      '<div class="detail-label">项目职责</div>' +
      '<div class="detail-text">' + m.responsibility + '</div>' +
    '</div>' +
  '</div>'

  html += '</div>'
  root.innerHTML = html
}

export default {
  title: '成员详情',
  tab: -1,

  async mount(container) {
    root = container
    const m = globalData.memberDetail
    if (!m) {
      navigateBack()
      return
    }
    state.member = m
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
