// js/router.js — H5 hash 路由 (对应小程序 wx.navigateTo/switchTab/navigateBack)
// 路由表: 5 tab 页 + 4 子页
// 子页跨页传参: memberDetail/infoDetail 走 app.globalData, key 走 query

import { globalData, onThemeChange } from './app.js'
import * as tabbar from './tabbar.js'

const routes = {
  'detect':           { page: null, title: '心电检测', tab: 0 },
  'history':          { page: null, title: '检测历史', tab: 1 },
  'science':          { page: null, title: '心电科普', tab: 2 },
  'team':             { page: null, title: '团队介绍', tab: 3 },
  'mine':             { page: null, title: '我的', tab: 4 },
  'category-detail':  { page: null, title: '分类详情', tab: -1 },
  'member-detail':    { page: null, title: '成员详情', tab: -1 },
  'info-detail':      { page: null, title: '详情', tab: -1 },
  'analysis':         { page: null, title: '综合分析', tab: -1 }
}

const pageContainer = document.getElementById('page-root')
const navTitleEl = document.getElementById('nav-title')
const navBackEl = document.getElementById('nav-back')
const tabbarRoot = document.getElementById('tabbar-root')

let currentName = null
let currentPage = null

// 解析 hash: '#/detect?key=N' → { name:'detect', query:{key:'N'} }
function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const parts = hash.split('?')
  const name = parts[0] || 'detect'
  const query = {}
  if (parts[1]) {
    parts[1].split('&').forEach(function(kv) {
      const idx = kv.indexOf('=')
      if (idx > 0) {
        query[decodeURIComponent(kv.slice(0, idx))] = decodeURIComponent(kv.slice(idx + 1))
      }
    })
  }
  return { name: name, query: query }
}

async function loadPageModule(name) {
  if (!routes[name]) return null
  if (routes[name].page) return routes[name].page
  const mod = await import('./pages/' + name + '.js')
  routes[name].page = mod.default
  return routes[name].page
}

// 切换 tab (对应 wx.switchTab)
export function switchTab(path) {
  window.location.hash = path.replace(/^#\/?/, '')
}

// 跳转 (对应 wx.navigateTo)
export function navigateTo(path) {
  window.location.hash = path.replace(/^#\/?/, '')
}

// 返回 (对应 wx.navigateBack)
export function navigateBack() {
  window.history.back()
}

// 重新加载当前页 (对应 wx.reLaunch 效果: 回到检测首页)
export function reLaunch() {
  window.location.hash = '#/detect'
}

async function render() {
  const { name, query } = parseHash()
  const route = routes[name]
  if (!route) {
    window.location.hash = '#/detect'
    return
  }

  const pageModule = await loadPageModule(name)
  if (!pageModule) return

  // 卸载旧页面
  if (currentPage && currentPage.unmount) {
    currentPage.unmount()
  }
  currentName = name
  currentPage = pageModule

  // 导航栏
  navTitleEl.textContent = route.title
  navBackEl.style.display = route.tab === -1 ? '' : 'none'
  document.title = route.title + ' · 心韵深辨'

  // TabBar: 子页隐藏, tab页显示
  if (route.tab >= 0) {
    tabbarRoot.style.display = ''
    tabbar.renderTabBar(tabbarRoot, route.tab, globalData.theme, function(index, path) {
      if (index !== route.tab) switchTab(path)
    })
  } else {
    tabbarRoot.style.display = 'none'
  }

  // 渲染页面
  pageContainer.innerHTML = ''
  await pageModule.mount(pageContainer, query)
}

// 主题切换时通知当前页
onThemeChange(function(theme) {
  if (currentPage && currentPage.updateTheme) {
    currentPage.updateTheme(theme)
  }
  // 同步 TabBar 主题
  if (tabbarRoot.style.display !== 'none' && tabbarRoot.querySelector('.tab-bar')) {
    tabbarRoot.querySelector('.tab-bar').classList.toggle('tab-dark', theme === 'dark')
  }
})

// 返回按钮
navBackEl.addEventListener('click', navigateBack)

export function initRouter() {
  window.addEventListener('hashchange', render)
  if (!window.location.hash) {
    window.location.hash = '#/detect'
  }
  render()
}
