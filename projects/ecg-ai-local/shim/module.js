// shim/module.js — 极简 CommonJS 加载器
// 让原小程序的 require('../../utils/x.js') 懒加载模式在浏览器中原样工作
// 所有业务模块通过 define('模块id', factory) 注册，首次 require 才执行 factory

(function(global) {
  var modules = {}      // id -> {factory, exports, loaded}
  var resolveCache = {} // 相对路径 -> 规范 id 缓存

  // 规范 id：去 ./ ../ 前缀，统一为正斜杠相对路径
  function normalize(id, fromId) {
    if (id.charAt(0) !== '.') return id // 裸模块名（如 @tensorflow/tfjs-core）
    if (!fromId) return id
    var fromDir = fromId.split('/').slice(0, -1)
    var parts = id.split('/')
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]
      if (p === '.' || p === '') continue
      if (p === '..') fromDir.pop()
      else fromDir.push(p)
    }
    return fromDir.join('/')
  }

  function define(id, factory) {
    modules[id] = { factory: factory, exports: {}, loaded: false }
  }

  // 预注册外部依赖
  function register(id, exportsObj) {
    modules[id] = { factory: null, exports: exportsObj, loaded: true }
  }

  function require(id, fromId) {
    var resolved = normalize(id, fromId)
    var key = id + '|' + (fromId || '')
    if (resolveCache[key]) resolved = resolveCache[key]
    else { resolveCache[key] = resolved }

    // 扩展名兼容：utils/ecgModel → utils/ecgModel.js（若 .js 版本存在）
    var m = modules[resolved]
    if (!m && resolved.indexOf('.js') < 0 && modules[resolved + '.js']) {
      resolved = resolved + '.js'
      resolveCache[key] = resolved
      m = modules[resolved]
    }

    if (!m) {
      throw new Error('[module] 模块未注册: ' + resolved + ' (require from ' + (fromId || 'root') + ')')
    }
    if (!m.loaded) {
      m.loaded = true
      var localRequire = function(rel) { return require(rel, resolved) }
      localRequire.resolve = function(rel) { return normalize(rel, resolved) }
      // module 包装对象：factory 里 module.exports = x 会更新 m.exports
      var moduleObj = { exports: m.exports }
      try {
        m.factory(moduleObj, moduleObj.exports, localRequire)
        m.exports = moduleObj.exports
      } catch (e) {
        m.loaded = false
        throw e
      }
    }
    return m.exports
  }

  // 注册一个"脚本"模块：直接把源文件内容包成 factory
  // 由 wrap-cjs.js 生成的代码调用：define('pages/detect/detect.js', function(module, exports, require){ ...原代码... })
  global.__defineModule = define
  global.__registerModule = register
  global.__requireModule = function(id, fromId) { return require(id, fromId) }
  global.__moduleRegistry = modules

  // 预注册 TF.js 与微信 polyfill 占位
  // @tensorflow/tfjs-core → 全局 tf（由 vendor script 提供）
  // @tensorflow/tfjs-backend-cpu → 空（UMD 已注册后端）
  // fetch-wechat → 空（H5 用原生 fetch）
  register('@tensorflow/tfjs-core', global.tf || {})
  register('@tensorflow/tfjs-backend-cpu', {})
  register('fetch-wechat', { setWechatFetch: function() {} })
})(window)
