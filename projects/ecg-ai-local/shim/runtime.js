// shim/runtime.js — App()/Page()/getApp()/setData/事件委托/生命周期
// 让原小程序的 Page({data, onLoad, onShow, 方法}) 结构在浏览器中原样运行

(function(global) {
  var appInstance = null
  var pageInstances = {}   // route -> instance
  var currentPageRoute = null
  var pageStack = []       // 页面栈（对应 getCurrentPages）

  var template = function() { return global.__template }

  // ===== 主题事件总线 =====
  var themeListeners = []

  // ===== 事件委托 =====
  // 容器内所有 [data-bind="tap:onXxx"] 元素，点击时调用 page[onXxx](event)
  // event.currentTarget.dataset 从元素 data-* 属性填充
  function delegateEvents(container, page, extraScope) {
    container.addEventListener('click', function(e) {
      var el = e.target.closest('[data-bind]')
      if (!el) return
      var bind = el.getAttribute('data-bind')
      var parts = bind.split(':')
      var type = parts[0]
      var method = parts[1]
      if (type !== 'tap' && type !== 'click') return
      if (!page[method]) return
      // 构造微信风格事件对象
      var evt = buildEvent(e, el)
      if (extraScope) {
        // 组件内方法
        page[method].call(extraScope, evt)
      } else {
        page[method](evt)
      }
    })

    container.addEventListener('input', function(e) {
      var el = e.target
      if (!el.hasAttribute('data-bind')) return
      var bind = el.getAttribute('data-bind')
      var parts = bind.split(':')
      if (parts[0] !== 'input') return
      var method = parts[1]
      if (!page[method]) return
      var evt = buildEvent(e, el)
      evt.detail = { value: el.value }
      page[method](evt)
    })

    container.addEventListener('change', function(e) {
      var el = e.target
      if (!el.hasAttribute('data-bind')) return
      var bind = el.getAttribute('data-bind')
      var parts = bind.split(':')
      if (parts[0] !== 'change') return
      var method = parts[1]
      if (!page[method]) return
      var evt = buildEvent(e, el)
      evt.detail = { value: el.value, current: parseInt(el.getAttribute('data-current') || '0', 10) }
      page[method](evt)
    })
  }

  function buildEvent(e, el) {
    // dataset: 所有 data-* 属性（除 data-bind）
    var dataset = {}
    for (var i = 0; i < el.attributes.length; i++) {
      var attr = el.attributes[i]
      var name = attr.name
      if (name.indexOf('data-') !== 0) continue
      if (name === 'data-bind') continue
      var key = name.slice(5).replace(/-([a-z])/g, function(_, c) { return c.toUpperCase() })
      dataset[key] = attr.value
    }
    return {
      type: e.type,
      currentTarget: { dataset: dataset, id: el.id },
      target: { dataset: dataset, id: el.id },
      detail: {},
      stopPropagation: function() { e.stopPropagation() }
    }
  }

  // ===== setData 实现（支持点路径动态 key + 回调）=====
  function setDataOn(instance, patch, cb) {
    if (!patch) return
    Object.keys(patch).forEach(function(key) {
      var value = patch[key]
      // 点路径 key: 'healthAssessment.score'
      if (key.indexOf('.') > 0) {
        var parts = key.split('.')
        var target = instance.data
        for (var i = 0; i < parts.length - 1; i++) {
          if (target[parts[i]] === undefined || target[parts[i]] === null) {
            target[parts[i]] = {}
          }
          target = target[parts[i]]
        }
        target[parts[parts.length - 1]] = value
      } else {
        instance.data[key] = value
      }
    })
    if (instance._renderFn) instance._renderFn()
    if (cb) setTimeout(cb, 0)
  }

  // ===== Page() =====
  function Page(cfg) {
    if (!currentPageRoute) throw new Error('Page() called without route')
    var route = currentPageRoute
    var instance = {
      route: route,
      data: JSON.parse(JSON.stringify(cfg.data || {})),
      setData: function(patch, cb) { setDataOn(this, patch, cb) },
      selectComponent: function(sel) {
        var id = sel.replace(/^#/, '')
        // 支持驼峰/连字符：profileSheet → profile-sheet
        var kebab = id.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        return global.__componentRegistry && (global.__componentRegistry.get(id) || global.__componentRegistry.get(kebab))
      },
      getTabBar: function() {
        return global.__tabbarController || null
      }
    }
    // 复制方法（不含 data/生命周期）
    Object.keys(cfg).forEach(function(key) {
      if (key === 'data') return
      if (['onLoad', 'onShow', 'onHide', 'onUnload', 'onReady', 'onPullDownRefresh', 'onPageScroll', 'onShareAppMessage'].indexOf(key) >= 0) return
      instance[key] = cfg[key]
    })
    // 生命周期方法
    instance._lifecycle = {
      onLoad: cfg.onLoad, onShow: cfg.onShow, onHide: cfg.onHide,
      onUnload: cfg.onUnload, onReady: cfg.onReady,
      onPageScroll: cfg.onPageScroll, onPullDownRefresh: cfg.onPullDownRefresh,
      onShareAppMessage: cfg.onShareAppMessage
    }
    // 绑定 this 到方法
    Object.keys(instance).forEach(function(key) {
      if (typeof instance[key] === 'function' && key !== 'setData' && key !== 'selectComponent' && key !== 'getTabBar') {
        var orig = instance[key]
        instance[key] = orig.bind(instance)
      }
    })
    instance._cfg = cfg
    pageInstances[route] = instance
    return instance
  }

  // ===== App() / getApp() =====
  function App(cfg) {
    appInstance = Object.assign({ globalData: cfg.globalData || {} }, cfg)
    // 绑定方法 this
    Object.keys(cfg).forEach(function(key) {
      if (typeof cfg[key] === 'function') {
        appInstance[key] = cfg[key].bind(appInstance)
      }
    })
    // onLaunch
    if (appInstance.onLaunch) appInstance.onLaunch()
    return appInstance
  }

  function getApp() {
    return appInstance
  }

  // ===== Component() 组件注册 =====
  var componentRegistry = {}   // id -> 组件实例
  global.__componentRegistry = {
    get: function(id) { return componentRegistry[id] }
  }

  function Component(cfg) {
    var route = currentPageRoute || 'component'
    var instance = {
      data: JSON.parse(JSON.stringify(cfg.data || {})),
      setData: function(patch, cb) { setDataOn(this, patch, cb) },
      triggerEvent: function(name, detail) {
        // 触发父页面同名回调：onProfileSaved 等
        if (this._parentPage && this._parentPage._cfg && this._parentPage._cfg[name[0].toUpperCase() + name.slice(1)]) {
          var cb = this._parentPage._cfg[name[0].toUpperCase() + name.slice(1)]
          cb.call(this._parentPage, { detail: detail })
        }
        // 也触发 data-bind="custom:onXxx" 委托（通过事件）
        if (this._parentPage && this._mountEl) {
          var evt = { detail: detail, type: name }
          this._mountEl.dispatchEvent(new CustomEvent('component:' + name, { detail: detail }))
        }
      }
    }
    // 复制方法
    var methods = cfg.methods || {}
    Object.keys(methods).forEach(function(key) {
      instance[key] = methods[key]
    })
    // 绑定 this
    Object.keys(instance).forEach(function(key) {
      if (typeof instance[key] === 'function' && key !== 'setData' && key !== 'triggerEvent') {
        var orig = instance[key]
        instance[key] = orig.bind(instance)
      }
    })
    instance._cfg = cfg
    // 注册（用组件名做 id：profile-sheet）
    var compId = (cfg._id) || 'profile-sheet'
    componentRegistry[compId] = instance
    return instance
  }

  // 组件挂载到占位节点
  function mountComponentTo(compId, placeholder, parentPage) {
    var comp = componentRegistry[compId]
    if (!comp) return
    comp._parentPage = parentPage
    comp._mountEl = placeholder
    comp._renderFn = function() {
      var tpl = global.__componentTemplateRegistry && global.__componentTemplateRegistry[compId]
      if (tpl && placeholder) {
        placeholder.innerHTML = template().render(tpl, comp.data)
        // 事件委托到组件方法
        delegateEvents(placeholder, comp)
      }
    }
    // 组件生命周期
    if (comp._cfg.lifetimes && comp._cfg.lifetimes.attached) comp._cfg.lifetimes.attached.call(comp)
    comp._mountTo = function(ph, parentPage) {
      placeholder = ph
      comp._parentPage = parentPage
      comp._renderFn()
    }
    if (placeholder) comp._renderFn()
  }

  // ===== 页面栈（getCurrentPages 兼容）=====
  function getCurrentPages() {
    return pageStack.map(function(route) {
      return pageInstances[route] || { route: route, data: {}, setData: function() {} }
    })
  }

  // ===== 路由驱动生命周期 =====
  // 由 router.js 调用：挂载页面（route, options）→ 渲染 → onLoad → onShow
  function mountPage(route, options) {
    var inst = pageInstances[route]
    if (!inst) return null
    // 入栈
    if (pageStack.indexOf(route) < 0) pageStack.push(route)
    currentPageRoute = route

    // 渲染
    var tpl = global.__templateRegistry && global.__templateRegistry[route]
    if (tpl) {
      var container = document.getElementById('page-root')
      if (container) {
        var html = template().render(tpl, inst.data)
        container.innerHTML = html
        // 给根 .container 加页面作用域前缀（匹配 css/pages/xxx.css 的 .page-xxx 选择器）
        var pageRootEl = container.querySelector('.container')
        if (pageRootEl) {
          var segs = route.split('/')
          var pageName = segs[segs.length - 1]
          pageRootEl.classList.add('page-' + pageName)
        }
        // 事件委托
        delegateEvents(container, inst)
        inst._renderFn = function() {
          if (global.__currentRoute === route) {
            container.innerHTML = template().render(tpl, inst.data)
            var pr = container.querySelector('.container')
            if (pr) {
              var segs2 = route.split('/')
              pr.classList.add('page-' + segs2[segs2.length - 1])
            }
            // 重新委托（innerHTML 替换后旧监听丢失）
            delegateEvents(container, inst)
            // 挂载组件
            mountComponents(container, inst)
            // 重渲染后置处理（swiper 等需要重新初始化）
            if (global.__afterMount) global.__afterMount(container, inst, route)
          }
        }
        mountComponents(container, inst)
        // 触发组件挂载后置处理
        if (global.__afterMount) global.__afterMount(container, inst, route)
      }
    }
    // 生命周期（this 绑定到页面实例）
    if (inst._lifecycle.onLoad) inst._lifecycle.onLoad.call(inst, options || {})
    if (inst._lifecycle.onShow) inst._lifecycle.onShow.call(inst)
    return inst
  }

  function unmountPage(route) {
    var inst = pageInstances[route]
    if (inst) {
      if (inst._lifecycle.onHide) inst._lifecycle.onHide.call(inst)
      if (inst._lifecycle.onUnload) inst._lifecycle.onUnload.call(inst)
    }
    var idx = pageStack.indexOf(route)
    if (idx >= 0) pageStack.splice(idx, 1)
  }

  // 组件挂载（profile-sheet 等 data-wx-component 占位）
  function mountComponents(container, inst) {
    var placeholders = container.querySelectorAll('[data-wx-component]')
    placeholders.forEach(function(ph) {
      var compId = ph.getAttribute('data-wx-component') || 'profile-sheet'
      mountComponentTo(compId, ph, inst)
    })
  }

  // ===== 主题广播 =====
  function broadcastTheme(theme) {
    themeListeners.forEach(function(fn) {
      try { fn(theme) } catch (e) {}
    })
    // 通知所有页面 updateTheme
    Object.keys(pageInstances).forEach(function(route) {
      var inst = pageInstances[route]
      if (inst._cfg && inst._cfg.updateTheme) {
        inst._cfg.updateTheme.call(inst, theme)
      }
    })
  }

  function onThemeChange(fn) {
    themeListeners.push(fn)
  }

  global.Page = Page
  global.App = App
  global.Component = Component
  global.getApp = getApp
  global.getCurrentPages = getCurrentPages
  global.__runtime = {
    mountPage: mountPage,
    unmountPage: unmountPage,
    getInstance: function(route) { return pageInstances[route] },
    getAllInstances: function() { return pageInstances },
    broadcastTheme: broadcastTheme,
    onThemeChange: onThemeChange,
    setCurrentRoute: function(r) { currentPageRoute = r; global.__currentRoute = r }
  }
})(window)
