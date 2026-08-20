// shim/router.js — hash 路由
// 路由表：5 tab 页（pages/*）+ 5 子页（subpages/*）
// 页面路由名 → 模块 id（define 注册）与模板 id

(function(global) {
  var ROUTES = {
    'detect':           { title: '心电检测', tab: 0, module: 'pages/detect/detect.js', tpl: 'templates/detect.html' },
    'history':          { title: '检测历史', tab: 1, module: 'pages/history/history.js', tpl: 'templates/history.html' },
    'science':          { title: '心电科普', tab: 2, module: 'pages/science/science.js', tpl: 'templates/science.html' },
    'team':             { title: '团队介绍', tab: 3, module: 'pages/team/team.js', tpl: 'templates/team.html' },
    'mine':             { title: '我的', tab: 4, module: 'pages/mine/mine.js', tpl: 'templates/mine.html' },
    'analysis':         { title: '综合分析', tab: -1, module: 'subpages/analysis/analysis.js', tpl: 'templates/analysis.html' },
    'category-detail':  { title: '分类详情', tab: -1, module: 'subpages/category-detail/category-detail.js', tpl: 'templates/category-detail.html' },
    'info-detail':      { title: '详情', tab: -1, module: 'subpages/info-detail/info-detail.js', tpl: 'templates/info-detail.html' },
    'member-detail':    { title: '成员详情', tab: -1, module: 'subpages/member-detail/member-detail.js', tpl: 'templates/member-detail.html' },
    'settings':         { title: '设置', tab: -1, module: 'subpages/settings/settings.js', tpl: 'templates/settings.html' }
  }

  var runtime = function() { return global.__runtime }
  var tabbar = function() { return global.__tabbarController }

  var currentRoute = null
  var currentInstance = null
  var templates = {}

  // 解析 hash: '#/detect?key=N' → {name:'detect', query:{key:'N'}}
  function parseHash() {
    var hash = window.location.hash.replace(/^#\/?/, '')
    var parts = hash.split('?')
    var name = parts[0] || 'detect'
    var query = {}
    if (parts[1]) {
      parts[1].split('&').forEach(function(kv) {
        var idx = kv.indexOf('=')
        if (idx > 0) {
          query[decodeURIComponent(kv.slice(0, idx))] = decodeURIComponent(kv.slice(idx + 1))
        }
      })
    }
    return { name: name, query: query }
  }

  function navigateTo(hash) {
    window.location.hash = hash.replace(/^#\/?/, '')
  }
  function switchTab(hash) {
    window.location.hash = hash.replace(/^#\/?/, '')
  }
  function redirectTo(hash) {
    window.location.hash = hash.replace(/^#\/?/, '')
  }
  function navigateBack(delta) {
    if (window.history.length > 1) window.history.back()
    else window.location.hash = '#/detect'
  }
  function reLaunch(hash) {
    window.location.hash = hash.replace(/^#\/?/, '')
  }

  function showTabBar() {
    var root = document.getElementById('tabbar-root')
    if (root) root.style.display = ''
  }
  function hideTabBar() {
    var root = document.getElementById('tabbar-root')
    if (root) root.style.display = 'none'
  }

  // 挂载模板（首次加载）
  async function ensureTemplate(route) {
    if (templates[route]) return templates[route]
    var tplPath = ROUTES[route].tpl
    try {
      var res = await fetch(tplPath)
      var text = await res.text()
      templates[route] = text
    } catch (e) {
      console.error('模板加载失败:', tplPath, e)
      templates[route] = '<div class="container">模板加载失败</div>'
    }
    return templates[route]
  }

  async function render() {
    var parsed = parseHash()
    var name = parsed.name
    var route = ROUTES[name]
    if (!route) {
      window.location.hash = '#/detect'
      return
    }

    // 卸载旧页
    if (currentInstance && currentRoute !== name) {
      runtime().unmountPage(currentRoute)
      // 清除页面 root 内容（由 mountPage 重建）
    }

    // 导航栏
    var navTitle = document.getElementById('nav-title')
    if (navTitle) navTitle.textContent = route.title
    var navBack = document.getElementById('nav-back')
    if (navBack) navBack.style.display = route.tab === -1 ? '' : 'none'
    document.title = route.title + ' · 心韵深辨'

    // TabBar
    var tbRoot = document.getElementById('tabbar-root')
    if (route.tab >= 0) {
      if (tbRoot) tbRoot.style.display = ''
      if (tabbar().renderTabBar) tabbar().renderTabBar(route.tab)
    } else {
      if (tbRoot) tbRoot.style.display = 'none'
    }

    // 确保模板已加载
    await ensureTemplate(name)

    var moduleId = route.module

    // 注册模板到 registry，供 runtime.mountPage 渲染
    global.__templateRegistry = global.__templateRegistry || {}
    global.__templateRegistry[moduleId.replace(/\.js$/, '')] = templates[name]

    // 先设置当前路由（Page() 依赖），再执行模块 factory
    runtime().setCurrentRoute(moduleId.replace(/\.js$/, ''))

    // 执行模块（define 已注册，require 首次执行 factory → Page() 注册实例）
    var mod = global.__requireModule(moduleId, null)
    var inst = runtime().getInstance(moduleId.replace(/\.js$/, ''))

    // mountPage 会渲染 + 调 onLoad/onShow
    runtime().mountPage(moduleId.replace(/\.js$/, ''), parsed.query)

    currentRoute = name
  }

  function initRouter() {
    window.addEventListener('hashchange', render)
    if (!window.location.hash) {
      window.location.hash = '#/detect'
    }
    render()
  }

  global.__router = {
    navigateTo: navigateTo,
    switchTab: switchTab,
    redirectTo: redirectTo,
    navigateBack: navigateBack,
    reLaunch: reLaunch,
    showTabBar: showTabBar,
    hideTabBar: hideTabBar,
    initRouter: initRouter,
    getCurrent: function() { return currentRoute }
  }
})(window)
