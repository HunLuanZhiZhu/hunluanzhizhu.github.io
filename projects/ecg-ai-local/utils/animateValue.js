// utils/animateValue.js — 轻量数值插值动画工具
// 用途: 数字滚动(置信度/统计数字) 与 conic-gradient 角度扫入(donut环图/score-ring评分环)
// 背景: WXSS无法过渡conic-gradient, 大数字滚动也需JS驱动, 统一在此实现
//
// 用法:
//   var animateValue = require('../../utils/animateValue')
//   this._anim = animateValue({
//     from: 0, to: 96,                          // 起止值
//     duration: 600,                            // 时长ms(默认600, 设计约束≤800)
//     delay: 0,                                 // 延迟ms(默认0)
//     easing: 'easeOutCubic',                   // 'linear' | 'easeOutCubic'(默认)
//     onUpdate: function(v) { /* 每帧插值 */ },
//     onComplete: function() { /* 可选 */ }
//   })
//   this._anim.stop()  // 中途停止(页面onUnload/onHide时务必调用, 避免后台空转)
//
// 性能说明:
// - 小程序页面上下文无可靠requestAnimationFrame, 用setTimeout(~16ms)模拟帧率
// - 单次仅驱动1个数值字段的setData, 时长≤800ms, 渲染压力可忽略
// - onUpdate回调内建议只setData一个字段, 避免多字段合并导致的额外渲染

var EASINGS = {
  linear: function(t) { return t },
  // 缓出三次方: 起步快收尾柔, 符合"克制精致"的动效基调
  easeOutCubic: function(t) { return 1 - Math.pow(1 - t, 3) }
}

function animateValue(opts) {
  var from = opts.from != null ? opts.from : 0
  var to = opts.to != null ? opts.to : 0
  var duration = opts.duration || 600
  var delay = opts.delay || 0
  var easing = EASINGS[opts.easing] || EASINGS.easeOutCubic
  var onUpdate = opts.onUpdate || function() {}
  var onComplete = opts.onComplete || function() {}

  var timer = null
  var stopped = false

  // 起止相同: 直接落终值并结束, 不走帧循环
  if (from === to) {
    onUpdate(to)
    onComplete()
    return { stop: function() {} }
  }

  var startTime = 0

  function frame() {
    if (stopped) return
    var now = Date.now()
    if (!startTime) startTime = now
    var elapsed = now - startTime
    var t = elapsed >= duration ? 1 : elapsed / duration
    var value = from + (to - from) * easing(t)
    onUpdate(value)
    if (t >= 1) {
      onComplete()
      return
    }
    timer = setTimeout(frame, 16)
  }

  if (delay > 0) {
    timer = setTimeout(frame, delay)
  } else {
    frame()
  }

  return {
    stop: function() {
      stopped = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
  }
}

module.exports = animateValue
