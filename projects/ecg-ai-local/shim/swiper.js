// shim/swiper.js — 微信 <swiper> 行为还原
// 转换后 <swiper autoplay circular interval duration bindchange current> 变成了普通 div，
// 这里把它升级为可用的轮播：横向 slide 轨道 + 自动播放 + 循环 + 触摸滑动 + change 回调。
// 页面每次 setData 重渲染后（runtime 的 __afterMount）都会重新初始化，保证状态不丢失。

(function(global) {
  var controllers = []

  function initSwiper(sw, page) {
    // 清理已脱离文档的旧控制器
    controllers = controllers.filter(function(c) {
      if (!c.el || !c.el.isConnected) {
        c.destroy()
        return false
      }
      return true
    })
    // 同一元素避免重复初始化
    for (var i = 0; i < controllers.length; i++) {
      if (controllers[i].el === sw) {
        // current 可能已通过 setData 变化，同步一次位置
        controllers[i].refreshFromAttr()
        return controllers[i]
      }
    }
    var ctrl = createController(sw, page)
    controllers.push(ctrl)
    ctrl.init()
    return ctrl
  }

  function createController(sw, page) {
    var autoplay = sw.hasAttribute('autoplay')
    var circular = sw.hasAttribute('circular')
    var interval = parseInt(sw.getAttribute('interval'), 10) || 5000
    var duration = parseInt(sw.getAttribute('duration'), 10) || 500
    var items = []
    var count = 0
    var index = 0
    var timer = null
    var startX = null
    var swiped = false

    function collect() {
      items = Array.prototype.slice.call(sw.children)
      count = items.length
    }

    function currentFromAttr() {
      var v = parseInt(sw.getAttribute('current'), 10)
      return isNaN(v) ? 0 : v
    }

    function apply() {
      if (count === 0) return
      // 平移每个 slide 而非容器：容器保持固定（可见窗口），内容在窗口内滚动
      for (var i = 0; i < count; i++) {
        items[i].style.transition = 'transform ' + duration + 'ms ease'
        items[i].style.transform = 'translateX(' + (-index * 100) + '%)'
      }
    }

    function goTo(i, notify) {
      if (count === 0) return
      var target
      if (i < 0) target = circular ? count - 1 : 0
      else if (i >= count) target = circular ? 0 : count - 1
      else target = i
      if (target === index) {
        // 非循环时停在边界，不通知
        return
      }
      index = target
      apply()
      if (notify !== false && page && typeof page.onFeatureChange === 'function') {
        page.onFeatureChange({ detail: { current: index } })
      } else if (notify !== false && page) {
        // 通用 fallback：通过页面方法名对应的 data-bind="change:onXxx" 已绑定在 sw 上，
        // 直接触发页面同名方法（wx 页面用 onFeatureChange，这里留通用入口）
        var bind = sw.getAttribute('data-bind') || ''
        var parts = bind.split(':')
        if (parts[0] === 'change' && parts[1] && typeof page[parts[1]] === 'function') {
          page[parts[1]]({ detail: { current: index, source: 'autoplay' } })
        }
      }
    }

    function tick() {
      if (!sw.isConnected) {
        stop()
        return
      }
      goTo(index + 1, true)
    }

    function start() {
      stop()
      if (autoplay && count > 1) {
        timer = setInterval(tick, interval)
      }
    }

    function stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    // 触摸 / 鼠标滑动
    function onPointerDown(e) {
      startX = e.touches ? e.touches[0].clientX : e.clientX
    }

    function onPointerEnd(e) {
      if (startX === null) return
      var endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX
      var dx = endX - startX
      startX = null
      if (Math.abs(dx) < 40) return
      swiped = true
      setTimeout(function() { swiped = false }, 350)
      if (dx < 0) goTo(index + 1, true)
      else goTo(index - 1, true)
    }

    // 滑动后阻止点击冒泡（避免误触发 slide 的 tap 跳转）
    function onClickGuard(e) {
      if (swiped) {
        e.stopPropagation()
        e.preventDefault()
      }
    }

    // 将所有子 slide 布局为等宽轨道
    function layOut() {
      if (count === 0) return
      sw.style.display = 'flex'
      sw.style.flexWrap = 'nowrap'
      sw.style.overflow = 'hidden'
      sw.style.boxSizing = 'border-box'
      items.forEach(function(it) {
        it.style.flex = '0 0 100%'
        it.style.width = '100%'
        it.style.minWidth = '100%'
        it.style.boxSizing = 'border-box'
      })
    }

    return {
      el: sw,
      init: function() {
        collect()
        index = Math.max(0, Math.min(currentFromAttr(), count - 1))
        layOut()
        apply()
        sw.addEventListener('touchstart', onPointerDown, { passive: true })
        sw.addEventListener('touchend', onPointerEnd, { passive: true })
        sw.addEventListener('mousedown', onPointerDown)
        sw.addEventListener('mouseup', onPointerEnd)
        sw.addEventListener('click', onClickGuard, true)
        start()
      },
      refreshFromAttr: function() {
        var target = Math.max(0, Math.min(currentFromAttr(), count - 1))
        if (target !== index) {
          index = target
          apply()
        }
      },
      goTo: goTo,
      stop: stop,
      destroy: function() {
        stop()
        sw.removeEventListener('touchstart', onPointerDown)
        sw.removeEventListener('touchend', onPointerEnd)
        sw.removeEventListener('mousedown', onPointerDown)
        sw.removeEventListener('mouseup', onPointerEnd)
        sw.removeEventListener('click', onClickGuard, true)
      }
    }
  }

  function initAllIn(container, page) {
    var swipers = container.querySelectorAll('.feature-swiper, [data-swiper]')
    for (var i = 0; i < swipers.length; i++) {
      initSwiper(swipers[i], page)
    }
  }

  // 挂到 mount / re-render 后置钩子
  var prev = global.__afterMount
  global.__afterMount = function(container, page, route) {
    if (prev) prev(container, page, route)
    initAllIn(container, page)
  }

  global.__swiper = { initAllIn: initAllIn }
})(window)
