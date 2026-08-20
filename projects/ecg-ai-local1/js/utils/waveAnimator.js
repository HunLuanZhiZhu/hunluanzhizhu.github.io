// utils/waveAnimator.js — 统一科技感心电波形动画器 (H5 版)
// 由小程序版转化: createSelectorQuery → getElementById, canvas.RAF → window.RAF
// 被检测页/结果页/科普页/分类详情页共用, 保证动画风格一致(缓慢绘制+循环)
//
// 用法:
//   var waveAnimator = await import('../../js/utils/waveAnimator.js')
//   this._wave = waveAnimator.start({
//     canvasId: 'ecgCanvas',      // canvas id (不带#)
//     data: ecgData,              // 数值数组
//     style: 'full',              // 'full'(带HUD/扫描线) | 'mini'(简洁)
//     pointsPerFrame: 5,          // 每帧推进点数, 越小越慢
//     loop: true,                 // 是否循环
//     loopDelay: 700,             // 单循环结束后停留ms
//     hudLabel: 'ECG · 250Hz'     // full模式左上角标签(可选)
//   })
//   this._wave.stop()             // 停止

export function start(opts) {
  var canvasId = opts.canvasId
  var data = opts.data || []
  var style = opts.style || 'full'
  var ppf = opts.pointsPerFrame || 5
  var loop = opts.loop !== false
  var loopDelay = opts.loopDelay != null ? opts.loopDelay : 700
  var hudLabel = opts.hudLabel || 'ECG · 250Hz'

  if (!data.length) return { stop: function() {} }

  var state = {
    canvas: null,
    ctx: null,
    w: 0,
    h: 0,
    data: data,
    n: data.length,
    min: Math.min.apply(null, data),
    max: Math.max.apply(null, data),
    drawPos: 0,
    frame: 0,
    loopCount: 0,
    raf: null,
    stopped: false,
    retryCount: 0
  }
  state.range = (state.max - state.min) || 1

  function queryCanvas() {
    // H5: 直接取 DOM 节点; 若尚未挂载/无尺寸则重试 (最多10次)
    var canvas = document.getElementById(canvasId)
    if (!canvas || !canvas.getBoundingClientRect || !canvas.getBoundingClientRect().width) {
      if (!state.stopped && state.retryCount < 10) {
        state.retryCount++
        setTimeout(queryCanvas, 150)
      }
      return
    }
    var ctx = canvas.getContext('2d')
    var rect = canvas.getBoundingClientRect()
    var dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    state.canvas = canvas
    state.ctx = ctx
    state.w = rect.width
    state.h = rect.height
    state.retryCount = 0
    startLoop()
  }

  function startLoop() {
    state.drawPos = 0
    state.frame = 0
    drawFrame(0, false)
    state.raf = requestAnimationFrame(frame)
  }

  function frame() {
    if (state.stopped) return
    state.frame++
    state.drawPos += ppf
    if (state.drawPos >= state.n) {
      // 完成本轮, 画完整波形并停留
      drawFrame(state.n, true)
      if (!loop) return
      setTimeout(function() {
        if (state.stopped) return
        state.drawPos = 0
        state.loopCount++
        state.raf = requestAnimationFrame(frame)
      }, loopDelay)
      return
    }
    drawFrame(state.drawPos, false)
    state.raf = requestAnimationFrame(frame)
  }

  function drawFrame(drawPos, isComplete) {
    if (style === 'mini') {
      drawMini(state, drawPos, isComplete)
    } else {
      drawFull(state, drawPos, isComplete, hudLabel)
    }
  }

  queryCanvas()

  return {
    stop: function() {
      state.stopped = true
      if (state.raf) {
        try { cancelAnimationFrame(state.raf) } catch (e) {}
      }
      state.raf = null
    }
  }
}

// 坐标计算
function getY(data, idx, min, range, h) {
  return h - ((data[idx] - min) / range) * h * 0.72 - h * 0.14
}
function getX(idx, n, w) {
  return (idx / (n - 1)) * w
}

// full 风格: 深色背景 + 网格 + 光晕 + 扫描线 + HUD
function drawFull(s, drawPos, isComplete, hudLabel) {
  var ctx = s.ctx, w = s.w, h = s.h, data = s.data, n = s.n
  var min = s.min, range = s.range, frame = s.frame
  if (!ctx || !w || !h) return

  // 1. 深色渐变背景
  var bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, '#0a1520')
  bgGrad.addColorStop(0.5, '#0d1a28')
  bgGrad.addColorStop(1, '#0a1520')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  // 2. 网格(呼吸效果)
  var gridAlpha = 0.08 + 0.04 * Math.sin(frame * 0.02)
  ctx.lineWidth = 0.5
  ctx.strokeStyle = 'rgba(0, 200, 255, ' + gridAlpha + ')'
  for (var gi = 0; gi <= 8; gi++) {
    var gy = (h / 8) * gi
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
  }
  for (var gj = 0; gj <= 12; gj++) {
    var gx = (w / 12) * gj
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke()
  }

  // 3. 中线
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
  ctx.setLineDash([])

  if (drawPos <= 0) return

  // 4. 外光晕
  if (isComplete || drawPos > 1) {
    ctx.strokeStyle = 'rgba(0, 220, 180, 0.15)'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.shadowBlur = 12; ctx.shadowColor = '#00ddb4'
    ctx.beginPath()
    var endIdx = isComplete ? n : drawPos
    for (var i = 0; i < endIdx; i++) {
      var x = getX(i, n, w)
      var y = getY(data, i, min, range, h)
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  // 5. 主线(渐变)
  var waveGrad = ctx.createLinearGradient(0, 0, w, 0)
  waveGrad.addColorStop(0, '#00ddb4')
  waveGrad.addColorStop(0.5, '#00e8ff')
  waveGrad.addColorStop(1, '#00ddb4')
  ctx.strokeStyle = waveGrad
  ctx.lineWidth = 2
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  var drawEnd = isComplete ? n : drawPos
  for (var j = 0; j < drawEnd; j++) {
    var px = getX(j, n, w)
    var py = getY(data, j, min, range, h)
    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // 6. 拖尾
  if (!isComplete && drawPos > 2) {
    var trailLen = Math.min(20, drawPos)
    var trailStart = drawPos - trailLen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (var k = trailStart; k < drawPos; k++) {
      var tx = getX(k, n, w)
      var ty = getY(data, k, min, range, h)
      if (k === trailStart) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty)
    }
    ctx.stroke()
  }

  // 7. 扫描线 + 亮点
  if (!isComplete && drawPos < n) {
    var scanX = getX(drawPos, n, w)
    var scanY = getY(data, drawPos, min, range, h)
    var scanGrad = ctx.createLinearGradient(scanX - 30, 0, scanX + 30, 0)
    scanGrad.addColorStop(0, 'rgba(0, 220, 180, 0)')
    scanGrad.addColorStop(0.5, 'rgba(0, 220, 180, 0.4)')
    scanGrad.addColorStop(1, 'rgba(0, 220, 180, 0)')
    ctx.fillStyle = scanGrad
    ctx.fillRect(scanX - 30, 0, 60, h)

    ctx.fillStyle = 'rgba(0, 232, 255, 0.15)'
    ctx.beginPath(); ctx.arc(scanX, scanY, 12, 0, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = 'rgba(0, 232, 255, 0.3)'
    ctx.beginPath(); ctx.arc(scanX, scanY, 7, 0, 2 * Math.PI); ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(scanX, scanY, 3, 0, 2 * Math.PI); ctx.fill()
  }

  // 8. HUD
  ctx.fillStyle = 'rgba(0, 220, 180, 0.6)'
  ctx.font = '10px monospace'
  ctx.textAlign = 'left'
  ctx.fillText(hudLabel, 8, 16)
  ctx.fillText('LOOP ' + String(s.loopCount + 1).padStart(3, '0'), 8, 30)

  if (!isComplete && drawPos > 0) {
    var curVal = data[drawPos - 1]
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(0, 220, 180, 0.7)'
    ctx.fillText(curVal.toFixed(3) + ' mV', w - 8, 16)
    ctx.fillText(drawPos + '/' + n, w - 8, 30)
  }
}

// mini 风格: 简洁波形, 用于科普卡片(多个同时)
function drawMini(s, drawPos, isComplete) {
  var ctx = s.ctx, w = s.w, h = s.h, data = s.data, n = s.n
  var min = s.min, range = s.range
  if (!ctx || !w || !h) return

  // 背景
  var bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, '#0a1520')
  bgGrad.addColorStop(1, '#0d1a28')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  // 网格
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.06)'
  ctx.lineWidth = 0.5
  for (var gi = 0; gi <= 4; gi++) {
    var gy = (h / 4) * gi
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke()
  }

  if (drawPos <= 0) return

  function yAt(idx) { return h - ((data[idx] - min) / range) * h * 0.7 - h * 0.15 }
  function xAt(idx) { return (idx / (n - 1)) * w }

  var endIdx = isComplete ? n : drawPos

  // 外光晕
  ctx.strokeStyle = 'rgba(0, 220, 180, 0.12)'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.shadowBlur = 8; ctx.shadowColor = '#00ddb4'
  ctx.beginPath()
  for (var i = 0; i < endIdx; i++) {
    var x = xAt(i); var y = yAt(i)
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  // 主线
  var waveGrad = ctx.createLinearGradient(0, 0, w, 0)
  waveGrad.addColorStop(0, '#00ddb4')
  waveGrad.addColorStop(0.5, '#00e8ff')
  waveGrad.addColorStop(1, '#00ddb4')
  ctx.strokeStyle = waveGrad
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (var j = 0; j < endIdx; j++) {
    var px = xAt(j); var py = yAt(j)
    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // 亮点
  if (!isComplete && drawPos < n) {
    var scanX = xAt(drawPos); var scanY = yAt(drawPos)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(scanX, scanY, 2, 0, 2 * Math.PI); ctx.fill()
  }
}
