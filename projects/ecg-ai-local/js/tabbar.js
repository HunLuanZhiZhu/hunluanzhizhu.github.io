// js/tabbar.js — H5 自定义底部导航 (由小程序 custom-tab-bar 转化)
// CSS 图标复用 custom-tab-bar/index.wxss → css/tabbar.css

export const TAB_LIST = [
  { pagePath: '#/detect', text: '检测', icon: 'detect' },
  { pagePath: '#/history', text: '历史', icon: 'history' },
  { pagePath: '#/science', text: '科普', icon: 'science' },
  { pagePath: '#/team', text: '团队', icon: 'team' },
  { pagePath: '#/mine', text: '我的', icon: 'mine' }
]

let selectedIndex = 0
let container = null
let onTapHandler = null

// 渲染 TabBar 到指定容器
export function renderTabBar(root, selected, theme, onTap) {
  container = root
  selectedIndex = selected
  onTapHandler = onTap
  root.innerHTML = buildHtml(selected, theme)
  bindEvents()
}

function buildHtml(selected, theme) {
  const cls = theme === 'dark' ? 'tab-bar tab-dark' : 'tab-bar'
  const items = TAB_LIST.map(function(item, index) {
    return (
      '<div class="tab-item ' + (selected === index ? 'tab-active' : '') + '" data-index="' + index + '" data-path="' + item.pagePath + '">' +
        '<div class="tab-icon-wrap">' +
          '<div class="tab-icon tab-icon-' + item.icon + ' ' + (selected === index ? 'icon-active' : '') + '"></div>' +
        '</div>' +
        '<span class="tab-text">' + item.text + '</span>' +
        (selected === index ? '<div class="tab-indicator"></div>' : '') +
      '</div>'
    )
  }).join('')
  return '<div class="' + cls + '"><div class="tab-bar-inner">' + items + '</div></div>'
}

function bindEvents() {
  if (!container) return
  container.querySelectorAll('.tab-item').forEach(function(item) {
    item.addEventListener('click', function() {
      const index = parseInt(item.dataset.index, 10)
      const path = item.dataset.path
      if (onTapHandler) onTapHandler(index, path)
    })
  })
}

// 更新选中项
export function updateSelected(index) {
  selectedIndex = index
  // 就地更新 class (不重建整个 DOM, 避免点击闪烁)
  if (!container) return
  container.querySelectorAll('.tab-item').forEach(function(item) {
    const i = parseInt(item.dataset.index, 10)
    const active = i === index
    item.classList.toggle('tab-active', active)
    item.querySelector('.tab-indicator').style.display = active ? '' : 'none'
    const icon = item.querySelector('.tab-icon')
    if (icon) icon.classList.toggle('icon-active', active)
  })
}
