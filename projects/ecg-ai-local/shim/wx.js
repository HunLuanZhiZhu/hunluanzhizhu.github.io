// shim/wx.js — wx.* API shim
// 让原小程序的 wx.xxx 调用在浏览器中原样工作
// 依赖：__ui（ui.js）、__router（router.js）

(function(global) {
  var ui = function() { return global.__ui }
  var router = function() { return global.__router }

  // ===== 存储 =====
  function getStorageSync(key) {
    try {
      var raw = localStorage.getItem(key)
      if (raw === null) return ''
      try { return JSON.parse(raw) } catch (e) { return raw }
    } catch (e) { return '' }
  }
  function setStorageSync(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) {}
  }
  function removeStorageSync(key) {
    try { localStorage.removeItem(key) } catch (e) {}
  }
  function clearStorageSync() {
    try { localStorage.clear() } catch (e) {}
  }
  function getStorageInfoSync() {
    var estimate = { currentSize: 0, limitSize: 10240 }
    try {
      var total = 0
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i)
        total += (localStorage.getItem(k) || '').length * 2
      }
      estimate.currentSize = total / 1024 // KB
    } catch (e) {}
    return estimate
  }

  // ===== UI（转发到 __ui）=====
  function showToast(o) { ui().showToast(o) }
  function showLoading(o) { ui().showLoading(o) }
  function hideLoading() { ui().hideLoading() }
  function showModal(o) { ui().showModal(o) }
  function showActionSheet(o) { ui().showActionSheet(o) }

  // ===== 导航 =====
  function urlToHash(url) {
    // '/pages/detect/detect' → '#/detect'; '/subpackages/extra/settings/settings?x=1' → '#/settings?x=1'
    var m = url.replace(/^\/+/, '').match(/([^\/]+)\/([^\/?]+)(\?.*)?$/)
    if (!m) return url
    return '#/' + m[2] + (m[3] || '')
  }
  function navigateTo(o) { router().navigateTo(urlToHash(o.url)) }
  function switchTab(o) { router().switchTab(urlToHash(o.url)) }
  function redirectTo(o) { router().redirectTo(urlToHash(o.url)) }
  function navigateBack(o) { router().navigateBack(o && o.delta) }
  function reLaunch(o) { router().reLaunch(urlToHash(o.url)) }

  // ===== 导航栏 =====
  function setNavigationBarTitle(o) {
    if (o && o.title) document.title = o.title + ' · 心韵深辨'
  }
  function setNavigationBarColor() {}
  function setBackgroundColor() {}
  function showTabBar() { if (router().showTabBar) router().showTabBar() }
  function hideTabBar() { if (router().hideTabBar) router().hideTabBar() }
  function stopPullDownRefresh() {}
  function pageScrollTo(o) {
    window.scrollTo(0, (o && o.scrollTop) || 0)
  }

  // ===== 剪贴板 =====
  function setClipboardData(o) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(o.data).then(function() {
        if (o.success) o.success({})
      }).catch(function() { fallbackCopy(o) })
    } else {
      fallbackCopy(o)
    }
  }
  function fallbackCopy(o) {
    var ta = document.createElement('textarea')
    ta.value = o.data
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy'); if (o.success) o.success({}) } catch (e) {}
    document.body.removeChild(ta)
  }

  // ===== 窗口信息 =====
  function getWindowInfo() {
    return {
      pixelRatio: window.devicePixelRatio || 1,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      safeArea: { top: 0, bottom: 0 }
    }
  }
  function getSystemInfoSync() {
    return Object.assign(getWindowInfo(), {
      platform: 'devtools',
      model: 'H5',
      system: 'web',
      version: '1.0.0'
    })
  }

  // ===== 环境 =====
  var env = { USER_DATA_PATH: '/tmp' }

  // ===== 文件系统（H5 简化）=====
  // 模型权重改 fetch 直载，getFileSystemManager 仅用于兼容占位
  function getFileSystemManager() {
    return {
      readFile: function(o) {
        // H5 用 fetch 读取 URL
        fetch(o.filePath).then(function(r) { return r.text() }).then(function(text) {
          if (o.success) o.success({ data: text })
        }).catch(function(e) { if (o.fail) o.fail(e) })
      },
      statSync: function() { throw new Error('fs.statSync not supported in H5') },
      readFileSync: function() { throw new Error('fs.readFileSync not supported in H5') },
      writeFileSync: function() {},
      unlinkSync: function() {},
      rmdirSync: function() {},
      mkdirSync: function() {},
      unzip: function(o) { if (o.fail) o.fail(new Error('unzip not supported')) }
    }
  }

  // ===== 选择器查询（canvas 节点）=====
  // 返回兼容 wx.createSelectorQuery().select('#id').fields({node,size}).exec(cb)
  function createSelectorQuery() {
    return {
      _selectors: [],
      _inScope: null,
      in: function(scope) { this._inScope = scope; return this },
      select: function(sel) { this._selectors.push(sel); return this },
      selectAll: function(sel) { this._selectors.push(sel); return this },
      boundingClientRect: function() { return this },
      fields: function() { return this },
      exec: function(cb) {
        var results = this._selectors.map(function(sel) {
          var id = sel.replace(/^#/, '')
          var el = document.getElementById(id)
          if (!el) return { node: null, width: 0, height: 0 }
          var rect = el.getBoundingClientRect()
          return {
            node: el,
            width: rect.width || el.offsetWidth || 0,
            height: rect.height || el.offsetHeight || 0,
            left: rect.left,
            top: rect.top,
            id: id
          }
        })
        // 单选择 exec 回调签名：res[0].node / res[0].width
        setTimeout(function() { cb(results) }, 0)
        return this
      }
    }
  }

  // ===== 文件选择（chooseMessageFile → input file）=====
  function chooseMessageFile(o) {
    o = o || {}
    var input = document.createElement('input')
    input.type = 'file'
    input.accept = o.extension ? '.' + o.extension.join(',.') : '*/*'
    input.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0]
      if (file && o.success) {
        o.success({
          tempFiles: [{ path: URL.createObjectURL(file), name: file.name, size: file.size }]
        })
      }
      input.remove()
    })
    document.body.appendChild(input)
    input.click()
  }

  // ===== 导出 wx 全局 =====
  global.wx = {
    getStorageSync: getStorageSync,
    setStorageSync: setStorageSync,
    removeStorageSync: removeStorageSync,
    clearStorageSync: clearStorageSync,
    getStorageInfoSync: getStorageInfoSync,
    showToast: showToast,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showModal: showModal,
    showActionSheet: showActionSheet,
    navigateTo: navigateTo,
    switchTab: switchTab,
    redirectTo: redirectTo,
    navigateBack: navigateBack,
    reLaunch: reLaunch,
    setNavigationBarTitle: setNavigationBarTitle,
    setNavigationBarColor: setNavigationBarColor,
    setBackgroundColor: setBackgroundColor,
    showTabBar: showTabBar,
    hideTabBar: hideTabBar,
    stopPullDownRefresh: stopPullDownRefresh,
    pageScrollTo: pageScrollTo,
    setClipboardData: setClipboardData,
    getWindowInfo: getWindowInfo,
    getSystemInfoSync: getSystemInfoSync,
    env: env,
    getFileSystemManager: getFileSystemManager,
    createSelectorQuery: createSelectorQuery,
    chooseMessageFile: chooseMessageFile
  }

  global.__wxShim = global.wx
})(window)
