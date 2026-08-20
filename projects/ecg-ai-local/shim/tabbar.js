// shim/tabbar.js — 底部导航控制器
// 提供 getTabBar() 返回的 updateSelected/updateTheme 方法 + 渲染底部导航
// 图标复用 custom-tab-bar 的 CSS（css/tabbar.css），用文字图标（心/史/科/队/我）

(function(global) {
  var LIST = [
    { pagePath: '#/detect', text: '检测', iconText: '心' },
    { pagePath: '#/history', text: '历史', iconText: '史' },
    { pagePath: '#/science', text: '科普', iconText: '科' },
    { pagePath: '#/team', text: '团队', iconText: '队' },
    { pagePath: '#/mine', text: '我的', iconText: '我' }
  ]

  var selected = 0
  var theme = 'light'
  var root = null

  function getTheme() {
    var app = global.getApp()
    return (app && app.globalData && app.globalData.theme) || 'light'
  }

  function renderTabBar(activeIndex) {
    selected = activeIndex
    theme = getTheme()
    root = document.getElementById('tabbar-root')
    if (!root) return
    var cls = theme === 'dark' ? 'tab-bar tab-dark' : 'tab-bar'
    var items = LIST.map(function(item, index) {
      return (
        '<div class="tab-item ' + (selected === index ? 'tab-active' : '') + '" data-index="' + index + '" data-path="' + item.pagePath + '">' +
          '<div class="tab-icon-wrap">' +
            '<text class="tab-icon-text ' + (selected === index ? 'icon-active' : '') + '">' + item.iconText + '</text>' +
          '</div>' +
          '<text class="tab-text">' + item.text + '</text>' +
          (selected === index ? '<div class="tab-indicator"></div>' : '') +
        '</div>'
      )
    }).join('')
    root.innerHTML = '<div class="' + cls + '"><div class="tab-bar-inner">' + items + '</div></div>'
    bindEvents()
  }

  function bindEvents() {
    if (!root) return
    root.querySelectorAll('.tab-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var index = parseInt(item.dataset.index, 10)
        var path = item.dataset.path
        if (index !== selected) {
          global.__router.switchTab(path)
        }
      })
    })
  }

  // getTabBar() 返回的控制器
  var controller = {
    updateSelected: function(index) {
      if (index === selected) return
      selected = index
      if (root) {
        root.querySelectorAll('.tab-item').forEach(function(item) {
          var i = parseInt(item.dataset.index, 10)
          var active = i === index
          item.classList.toggle('tab-active', active)
          var ind = item.querySelector('.tab-indicator')
          if (ind) ind.style.display = active ? '' : 'none'
          var icon = item.querySelector('.tab-icon-text')
          if (icon) icon.classList.toggle('icon-active', active)
        })
      }
    },
    updateTheme: function(t) {
      if (t === theme) return
      theme = t
      if (root) {
        var bar = root.querySelector('.tab-bar')
        if (bar) bar.classList.toggle('tab-dark', t === 'dark')
      }
    }
  }

  global.__tabbarController = controller
  global.__tabbarController.renderTabBar = renderTabBar
  global.__tabbarController.getSelected = function() { return selected }
})(window)
