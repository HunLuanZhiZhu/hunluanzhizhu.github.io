// js/pages/member-detail.js — 成员详情页 (H5)
// 来源: subpackages/extra/member-detail/member-detail.wxml + member-detail.wxss
// 关键: 保持 H5 隐私 — avatar 为 assets/smr.jpg，姓名神秘人 A-D（与 js/pages/team.js 一致）
// 同步: 小程序 member-hero 结构、sec-inline-sm、info-section-text、achievement-tags 等

import { globalData } from '../app.js'

const state = { theme: 'light', member: null }
let root = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-member-detail dark' : 'container page-member-detail'
}

function render() {
  if (!root || !state.member) return
  const m = state.member
  // 与小程序一致：团队总负责人用 role-leader，其余用 role-member（含指导老师在 H5 已为神秘人 D，仍用 role-leader 以突出）
  const roleCls = m.role === '团队总负责人' ? 'role-leader' : (m.role === '指导老师' ? 'role-leader' : 'role-member')
  let html = '<div class="' + themeClass() + '">'
  html += '<div class="card member-hero fade-in-up"><img class="member-hero-avatar-img pop-in avatar-lg" src="' + m.avatar + '" alt="' + m.name + '" /><div class="member-hero-name">' + m.name + '</div><div class="member-hero-role ' + roleCls + '">' + m.role + '</div></div>'
  html += '<div class="card fade-in-up-d1">'
  html += '<div class="detail-section"><div class="sec sec-inline-sm"><div class="sec-title">学历背景</div></div><div class="info-section-text">' + m.education + '</div></div><div class="divider"></div>'
  html += '<div class="detail-section"><div class="sec sec-inline-sm"><div class="sec-title">研究方向</div></div><div class="info-section-text">' + m.research + '</div></div><div class="divider"></div>'
  html += '<div class="detail-section"><div class="sec sec-inline-sm"><div class="sec-title">项目职责</div></div><div class="info-section-text">' + m.responsibility + '</div></div>'
  html += '</div>'
  if (m.achievements && m.achievements.length > 0) {
    html += '<div class="card fade-in-up-d2"><div class="sec sec-inline-lg"><div class="sec-title">研究成果</div></div><div class="achievement-tags">' + m.achievements.map(a => '<span class="achievement-tag">' + a + '</span>').join('') + '</div></div>'
  }
  html += '<div class="footer-text">心韵深辨 \u00B7 用心感知，以智辨析</div>'
  html += '</div>'
  root.innerHTML = html
}

export default {
  title: '成员详情', tab: -1,
  async mount(container) {
    root = container
    const m = globalData.memberDetail
    if (!m) { root.innerHTML = '<div class="' + themeClass() + '"><div class="empty-state"><div class="empty-text">暂无成员信息</div></div></div>'; return }
    state.member = m
    state.theme = globalData.theme
    render()
  },
  unmount() { root = null },
  updateTheme(theme) { state.theme = theme; if (root) render() }
}
