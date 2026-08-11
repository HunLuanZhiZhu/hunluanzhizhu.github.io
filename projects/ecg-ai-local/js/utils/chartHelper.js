// utils/chartHelper.js — 纯Canvas 2D图表绘制工具
// 支持: 饼图(5类分色)、环形图、水平柱状图
// 所有方法接收 canvas 2d context + 数据, 直接绘制

// AAMI 5类标准颜色 (与全局统一)
var CATEGORY_COLORS = {
  N: '#34C759',  // 绿
  S: '#FF3B30',  // 红
  V: '#5856D6',  // 靛紫
  F: '#FF9500',  // 橙
  Q: '#8E8E93'   // 灰
}

var CATEGORY_NAMES = {
  N: '正常心搏',
  S: '室上性早搏',
  V: '室性早搏',
  F: '融合搏动',
  Q: '未知搏动'
}

/**
 * 绘制饼图
 * @param {Object} ctx - canvas 2d context (已scale dpr)
 * @param {Number} cx - 圆心x
 * @param {Number} cy - 圆心y
 * @param {Number} radius - 半径
 * @param {Object} data - {N:5, S:2, V:1, F:0, Q:0}
 */
function drawPieChart(ctx, cx, cy, radius, data) {
  var total = 0
  var keys = ['N', 'S', 'V', 'F', 'Q']
  for (var i = 0; i < keys.length; i++) {
    total += (data[keys[i]] || 0)
  }
  if (total === 0) return

  var startAngle = -Math.PI / 2  // 从顶部开始
  for (var j = 0; j < keys.length; j++) {
    var k = keys[j]
    var val = data[k] || 0
    if (val === 0) continue
    var angle = (val / total) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, radius, startAngle, startAngle + angle)
    ctx.closePath()
    ctx.fillStyle = CATEGORY_COLORS[k]
    ctx.fill()
    // 白色分隔线
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
    startAngle += angle
  }
}

/**
 * 绘制环形图 (中间留空, 显示总数)
 * @param {Object} ctx
 * @param {Number} cx
 * @param {Number} cy
 * @param {Number} outerRadius
 * @param {Number} innerRadius
 * @param {Object} data
 * @param {String} centerText - 中间文字
 */
function drawDonutChart(ctx, cx, cy, outerRadius, innerRadius, data, centerText) {
  var total = 0
  var keys = ['N', 'S', 'V', 'F', 'Q']
  for (var i = 0; i < keys.length; i++) {
    total += (data[keys[i]] || 0)
  }
  if (total === 0) return

  var startAngle = -Math.PI / 2
  for (var j = 0; j < keys.length; j++) {
    var k = keys[j]
    var val = data[k] || 0
    if (val === 0) continue
    var angle = (val / total) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx, cy, outerRadius, startAngle, startAngle + angle)
    ctx.arc(cx, cy, innerRadius, startAngle + angle, startAngle, true)
    ctx.closePath()
    ctx.fillStyle = CATEGORY_COLORS[k]
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
    startAngle += angle
  }

  // 中间文字
  if (centerText) {
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 20px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(centerText, cx, cy)
  }
}

/**
 * 绘制水平柱状图 (5类分布)
 * @param {Object} ctx
 * @param {Number} x - 左上角x
 * @param {Number} y - 左上角y
 * @param {Number} width - 总宽度
 * @param {Number} barHeight - 每条高度
 * @param {Number} gap - 间距
 * @param {Object} data - {N:5, S:2, ...}
 * @param {Object} labels - 是否显示标签
 */
function drawBarChart(ctx, x, y, width, barHeight, gap, data) {
  var keys = ['N', 'S', 'V', 'F', 'Q']
  var maxVal = 0
  for (var i = 0; i < keys.length; i++) {
    if ((data[keys[i]] || 0) > maxVal) maxVal = data[keys[i]]
  }
  if (maxVal === 0) return

  for (var j = 0; j < keys.length; j++) {
    var k = keys[j]
    var val = data[k] || 0
    var barW = (val / maxVal) * (width - 60)  // 留60px给标签
    var barY = y + j * (barHeight + gap)

    // 标签
    ctx.fillStyle = '#8E8E93'
    ctx.font = '12px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(k + ' ' + CATEGORY_NAMES[k], x, barY + barHeight / 2)

    // 背景轨道
    ctx.fillStyle = 'rgba(120, 120, 128, 0.1)'
    roundRect(ctx, x + 60, barY, width - 60, barHeight, barHeight / 2)
    ctx.fill()

    // 柱条
    if (barW > 0) {
      ctx.fillStyle = CATEGORY_COLORS[k]
      roundRect(ctx, x + 60, barY, barW, barHeight, barHeight / 2)
      ctx.fill()
    }

    // 数值
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 12px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(val.toString(), x + 60 + barW + 6, barY + barHeight / 2)
  }
}

/**
 * 绘制图例
 * @param {Object} ctx
 * @param {Number} x - 起始x
 * @param {Number} y - 起始y
 * @param {Number} itemHeight - 每行高度
 * @param {Object} data - {N:5, S:2, ...}
 * @param {Number} total - 总数
 */
function drawLegend(ctx, x, y, itemHeight, data, total) {
  var keys = ['N', 'S', 'V', 'F', 'Q']
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i]
    var val = data[k] || 0
    if (val === 0) continue
    var itemY = y + i * itemHeight

    // 色块
    ctx.fillStyle = CATEGORY_COLORS[k]
    ctx.beginPath()
    ctx.arc(x + 6, itemY + itemHeight / 2, 5, 0, Math.PI * 2)
    ctx.fill()

    // 文字
    ctx.fillStyle = '#000000'
    ctx.font = '13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    var pct = total > 0 ? (val / total * 100).toFixed(1) : '0'
    ctx.fillText(k + ' ' + CATEGORY_NAMES[k] + '  ' + val + '次 (' + pct + '%)', x + 16, itemY + itemHeight / 2)
  }
}

// 圆角矩形辅助函数
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export {
  drawPieChart,
  drawDonutChart,
  drawBarChart,
  drawLegend,
  CATEGORY_COLORS,
  CATEGORY_NAMES
}
