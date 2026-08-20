// shim/boot.js — 启动器
// 加载顺序: 所有 wrapped 模块已通过 <script> 注册到 __defineModule
// boot.js: 执行 App() 注册 → 初始化主题 → 启动路由

(function(global) {
  function boot() {
    try {
      // 1. 执行 app.js 模块（内部调用 App() 注册全局实例）
      global.__requireModule('app.js', null)
      console.log('[boot] app.js 已加载')

      // 2. 初始化主题（app.initTheme 设置 body dark class + 背景色）
      var app = global.getApp()
      if (app && app.initTheme) {
        app.initTheme()
      }

      // 3. 启动路由
      if (global.__router && global.__router.initRouter) {
        global.__router.initRouter()
        console.log('[boot] 路由已启动')
      }
    } catch (e) {
      console.error('[boot] 启动失败:', e)
      var root = document.getElementById('page-root')
      if (root) root.innerHTML = '<div class="container"><div class="empty-state"><div class="empty-text">启动失败</div><div class="empty-subtext">' + (e.message || e) + '</div></div></div>'
    }
  }

  // 等待 DOM 就绪
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})(window)
