// pages/history/history.js — 心电检测历史记录页面
//
// 从 wx.getStorageSync('history') 读取检测记录
// 数据格式: [{ id, timestamp, className, classAbbr, isAbnormal, confidence, ecgData }]
// 点击记录跳转到检测页面查看详情 (switchTab + globalData传参)
// 支持选择性删除单条或多条记录

var app = getApp()
// 性能优化: 延迟加载exportHelper(3.9KB), 仅在导出时才加载
var exportHelper = null
var animateValue = null  // 懒加载: 环图扫入/数字滚动工具

Page({
  data: {
    historyList: [],
    totalCount: 0,
    abnormalCount: 0,
    normalCount: 0,
    loading: true,
    theme: 'light',
    editMode: false,
    selectedCount: 0,
    allChecked: false,
    analysis: null,
    trendData: [],        // 7天检测趋势数据 (柱状图)
    trendNormalRate: 0,   // 7天正常率
    categoryStats: [],    // 分类统计 (用于环图图例)
    donutGradient: '',     // 环图渐变CSS
    riskLevel: 'green',    // 风险等级
    riskLevelText: '低风险',
    riskDesc: '',
    riskIcon: '✓'
  },

  onLoad: function() {
    // 性能优化: 标记首次加载, onShow据此跳过重复计算
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)
    // 读取一次历史数据，传递给各计算函数 (H1)
    var history = wx.getStorageSync('history') || []
    var theme = app.globalData.theme
    // 计算所有数据 (各函数返回数据对象，不调用 setData，避免多次渲染)
    var historyData = this.loadHistory(history)
    var riskData = this.loadRiskData(history)
    var trendData = this.loadTrendData(history)
    var categoryData = this.loadCategoryStats(history, theme)
    // 合并为一次 setData 调用，避免多次渲染导致页面加载慢和窗口抖动
    this.setData(Object.assign({ theme: theme }, historyData, riskData, trendData, categoryData))
    // 环图扫入 + 总计数滚动 (首帧p=0与上面setData同批渲染, 无闪烁)
    // 性能优化: 延迟80ms启动动画, 让首次切换Tab的页面创建+首帧渲染先完成,
    // 避免rAF逐帧setData与切换帧竞争导致"初次切换不流畅"
    var self0 = this
    setTimeout(function() {
      self0.animateDonut(history.length)
    }, 80)
  },

  onShow: function() {
    // === TabBar选中态同步 (修复: 切换页面后底部按钮不高亮) ===
    // 官方推荐模式: onShow把本页下标硬编码同步给TabBar组件
    // attached路径嗅探仅是首渲染快速兜底; 页面缓存后attached不再触发, 必须在此同步
    var tabBar = typeof this.getTabBar === 'function' && this.getTabBar()
    if (tabBar) {
      tabBar.updateSelected(1)
      tabBar.updateTheme(app.globalData.theme)
    }

    // 同步页面背景色 (修复: onLaunch中调用wx.setBackgroundColor时页面尚未创建)
    app.applyThemeColors(app.globalData.theme)

    // === 主题同步: 始终优先同步主题, 不依赖dataDirty ===
    // 修复: 从设置页切换深色模式后, dataDirty可能被其他Tab页onShow清除,
    // 导致历史页深色模式失效。直接比较当前主题与全局主题, 不一致则立即更新。
    // 历史页的环图(conic-gradient)颜色依赖主题, 需要重算分类颜色
    var themeChanged = this.data.theme !== app.globalData.theme
    if (themeChanged) {
      var newTheme = app.globalData.theme
      var historyForTheme = wx.getStorageSync('history') || []
      var categoryDataForTheme = this.loadCategoryStats(historyForTheme, newTheme)
      this.setData(Object.assign({ theme: newTheme }, categoryDataForTheme))
    }

    // 性能优化: 首次加载时onLoad已完成所有计算和setData, 跳过避免双次渲染
    if (this._firstShow) {
      this._firstShow = false
      // 首次显示也需要清除脏标记(数据已在onLoad中计算)
      app.globalData.dataDirty = false
      return
    }
    // === 性能优化: 检查全局数据脏标记 ===
    // 数据未变更时, 跳过所有重计算和setData
    if (!app.globalData.dataDirty) {
      return
    }
    // H1: 一次读取历史数据，传递给各函数，避免重复读取 storage
    var history = wx.getStorageSync('history') || []
    var theme = app.globalData.theme
    // 计算所有数据 (各函数返回数据对象，不调用 setData，避免多次渲染)
    var historyData = this.loadHistory(history)
    var riskData = this.loadRiskData(history)
    var trendData = this.loadTrendData(history)
    var categoryData = this.loadCategoryStats(history, theme)
    // 合并为一次 setData 调用，避免多次渲染导致页面加载慢和窗口抖动
    this.setData(Object.assign({ theme: theme }, historyData, riskData, trendData, categoryData))
    // 数据已更新, 清除脏标记
    app.globalData.dataDirty = false
    // 环图扫入 + 总计数滚动 (数据变更后重播)
    this.animateDonut(history.length)
  },

  onUnload: function() {
    // 停止环图扫入动画, 避免页面销毁后空转
    if (this._donutAnim) {
      this._donutAnim.stop()
      this._donutAnim = null
    }
  },

  onPullDownRefresh: function() {
    var history = wx.getStorageSync('history') || []
    // loadHistory 返回数据对象，需手动 setData
    this.setData(this.loadHistory(history))
    wx.stopPullDownRefresh()
  },

  // H2: 合并 loadRiskPreview 和 loadRiskAssessment 为 loadRiskData
  // 同时计算入口卡片用的轻量风险标签和详情区域的风险评估
  // 优化: 返回计算好的数据对象，由调用方合并 setData，避免多次渲染
  loadRiskData: function(rawList) {
    // 若未传入则读取 (兼容单独调用)
    if (rawList === undefined) {
      rawList = wx.getStorageSync('history') || []
    }
    if (rawList.length === 0) {
      return {
        analysis: null,
        riskLevel: 'green',
        riskLevelText: '',
        riskDesc: '',
        riskIcon: ''
      }
    }

    var total = rawList.length
    var abnormal = 0
    for (var i = 0; i < rawList.length; i++) {
      if (rawList[i].isAbnormal) abnormal++
    }
    var abnormalRate = abnormal / total

    // 入口卡片用: 简短风险等级
    var rate = abnormal / total * 100
    var shortLevel = '低', shortColor = 'green'
    if (rate >= 50) { shortLevel = '高'; shortColor = 'red' }
    else if (rate >= 25) { shortLevel = '中'; shortColor = 'orange' }

    // 详情区域用: 完整风险评估
    var level, text, desc, icon
    if (abnormalRate < 0.3) {
      level = 'green'; text = '低风险'; icon = '✓'
      desc = '近期检测以正常心律为主，异常率' + Math.round(abnormalRate * 100) + '%。建议保持定期检测频率。'
    } else if (abnormalRate < 0.6) {
      level = 'orange'; text = '中风险'; icon = '!'
      desc = '近期异常率' + Math.round(abnormalRate * 100) + '%，建议增加检测频率并关注身体变化。'
    } else {
      level = 'red'; text = '高风险'; icon = '!'
      desc = '近期异常率' + Math.round(abnormalRate * 100) + '%，建议尽快前往医院进行专业检查。'
    }

    // 返回数据对象，由调用方合并 setData
    return {
      analysis: { riskLevel: shortLevel, riskColor: shortColor },
      riskLevel: level,
      riskLevelText: text,
      riskDesc: desc,
      riskIcon: icon
    }
  },

  // 计算7天检测趋势数据 (用于柱状图展示)
  // H1: 接收传入的 history 参数，避免重复读取 storage
  // 优化: 返回计算好的数据对象，由调用方合并 setData，避免多次渲染
  loadTrendData: function(history) {
    if (history === undefined) {
      history = wx.getStorageSync('history') || []
    }
    if (history.length === 0) {
      return { trendData: [], trendNormalRate: 0 }
    }

    // 构建最近7天的日期映射
    var dayMap = {}
    var dayLabels = []
    var now = new Date()
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now)
      d.setDate(d.getDate() - i)
      var dateStr = d.getFullYear() + '-' + this.padZero(d.getMonth() + 1) + '-' + this.padZero(d.getDate())
      var label = (d.getMonth() + 1) + '/' + d.getDate()
      dayMap[dateStr] = { count: 0, abnormal: 0, normal: 0, hasAbnormal: false }
      dayLabels.push({ dateStr: dateStr, label: label })
    }

    // 遍历历史记录, 统计每天的检测数和异常数
    for (var j = 0; j < history.length; j++) {
      var record = history[j]
      var rd = new Date(record.timestamp)
      var recordDateStr = rd.getFullYear() + '-' + this.padZero(rd.getMonth() + 1) + '-' + this.padZero(rd.getDate())

      if (dayMap[recordDateStr]) {
        dayMap[recordDateStr].count++
        if (record.isAbnormal) {
          dayMap[recordDateStr].abnormal++
          dayMap[recordDateStr].hasAbnormal = true
        } else {
          dayMap[recordDateStr].normal++
        }
      }
    }

    // 计算柱状图高度 (最大值映射到50px, 最小4px)
    var maxCount = 0
    for (var m = 0; m < dayLabels.length; m++) {
      var info = dayMap[dayLabels[m].dateStr]
      if (info.count > maxCount) maxCount = info.count
    }

    var trendData = []
    var totalCount = 0
    var totalNormal = 0
    for (var n = 0; n < dayLabels.length; n++) {
      var dayInfo = dayMap[dayLabels[n].dateStr]
      var height = maxCount > 0 ? Math.max(4, Math.round(dayInfo.count / maxCount * 50)) : 4
      trendData.push({
        date: dayLabels[n].dateStr,
        label: dayLabels[n].label,
        height: height,
        hasAbnormal: dayInfo.hasAbnormal,
        count: dayInfo.count
      })
      totalCount += dayInfo.count
      totalNormal += dayInfo.normal
    }

    var normalRate = totalCount > 0 ? Math.round(totalNormal / totalCount * 100) : 0
    // 返回数据对象，由调用方合并 setData
    return { trendData: trendData, trendNormalRate: normalRate }
  },

  // 计算心律分类统计 (用于环图)
  // H1: 接收传入的 history 参数
  // H7: 使用 app.globalData.categoryColors，根据 theme 选择 light/dark 色值
  // 优化: 返回计算好的数据对象，由调用方合并 setData，避免多次渲染
  // 新增 theme 参数，避免合并 setData 时 this.data.theme 尚未更新
  loadCategoryStats: function(history, theme) {
    if (history === undefined) {
      history = wx.getStorageSync('history') || []
    }
    if (history.length === 0) {
      this._donutSegments = []  // 扫入动画: 清空分段
      return { categoryStats: [], donutGradient: '' }
    }

    // 统计每个分类的数量
    var counts = { N: 0, S: 0, V: 0, F: 0, Q: 0 }
    for (var i = 0; i < history.length; i++) {
      var abbr = history[i].classAbbr || 'Q'
      if (counts[abbr] !== undefined) counts[abbr]++
    }

    // 构建图例数据
    var names = { N: '正常心律', S: '室上性早搏', V: '室性早搏', F: '融合心搏', Q: '未分类' }
    // H7: 从全局 categoryColors 获取颜色，根据主题选择 light/dark
    var categoryColors = app.globalData.categoryColors || {}
    // 优先使用传入的 theme 参数，避免合并 setData 时 this.data.theme 尚未更新
    var currentTheme = theme || this.data.theme
    var isDark = currentTheme === 'dark'
    var stats = []
    var total = history.length
    var segments = []
    var segmentData = []  // 环图扫入动画用: 结构化分段[{color, deg}]
    var currentDeg = 0

    var order = ['N', 'S', 'V', 'F', 'Q']
    for (var j = 0; j < order.length; j++) {
      var abbr = order[j]
      if (counts[abbr] > 0) {
        var deg = Math.round(counts[abbr] / total * 360)
        // 根据主题选择 light 或 dark 色值
        var colorObj = categoryColors[abbr] || { light: '#78909C', dark: '#64748B' }
        var color = isDark ? colorObj.dark : colorObj.light
        segments.push(color + ' ' + currentDeg + 'deg ' + (currentDeg + deg) + 'deg')
        segmentData.push({ color: color, deg: deg })
        currentDeg += deg
        stats.push({ abbr: abbr, name: names[abbr], count: counts[abbr] })
      }
    }

    var gradient = 'conic-gradient(' + segments.join(', ') + ')'
    // 暂存结构化分段, 供animateDonut逐帧重建渐变
    this._donutSegments = segmentData
    // 返回数据对象，由调用方合并 setData
    return { categoryStats: stats, donutGradient: gradient }
  },

  // 环图扫入动画: 分段角度按进度p缩放, 逐帧重建conic-gradient
  // 同时驱动总计数数字滚动(stat-hero与环图中心共用totalCount)
  // 注: 首次onUpdate(p=0)与数据setData同批渲染, 不会出现"先满后空"闪烁
  animateDonut: function(total) {
    var segments = this._donutSegments
    if (!segments || !segments.length || !total) return
    if (this._donutAnim) this._donutAnim.stop()
    // 性能优化: 懒加载animateValue
    if (!animateValue) {
      animateValue = require('../../utils/animateValue.js')
    }
    var self = this
    this._donutAnim = animateValue({
      from: 0,
      to: 1,
      // 性能优化: 700→480ms, 减少逐帧setData总帧数, 缩短首屏动画占用的渲染时间
      duration: 480,
      onUpdate: function(p) {
        var parts = []
        var deg = 0
        for (var i = 0; i < segments.length; i++) {
          var next = deg + segments[i].deg * p
          parts.push(segments[i].color + ' ' + deg.toFixed(1) + 'deg ' + next.toFixed(1) + 'deg')
          deg = next
        }
        self.setData({
          donutGradient: 'conic-gradient(' + parts.join(', ') + ')',
          totalCount: Math.round(total * p)
        })
      }
    })
  },

  updateTheme(theme) {
    this.setData({ theme: theme })
  },

  // 加载历史记录并格式化
  // H1: 接收传入的 rawList 参数，避免重复读取 storage
  // 优化: 返回计算好的数据对象，由调用方合并 setData，避免多次渲染
  loadHistory(rawList) {
    if (rawList === undefined) {
      rawList = wx.getStorageSync('history') || []
    }

    // 按时间倒序排列（最新的在前）
    const sorted = rawList.slice().sort((a, b) => b.timestamp - a.timestamp)

    // 格式化每条记录, 保留 checked 状态
    const prevChecked = {}
    this.data.historyList.forEach(item => {
      if (item.checked) prevChecked[item.id] = true
    })

    const historyList = sorted.map(item => {
      return {
        id: item.id,
        timeStr: this.formatTime(item.timestamp),
        className: item.className,
        classAbbr: item.classAbbr,
        isAbnormal: item.isAbnormal,
        confidence: item.confidence,
        confidencePercent: item.confidencePercent || ((item.confidence || 0) * 100).toFixed(1),
        checked: !!prevChecked[item.id]
      }
    })

    // 统计
    const abnormalCount = rawList.filter(item => item.isAbnormal).length
    const selectedCount = historyList.filter(item => item.checked).length

    // 日期分组 (今天/昨天/更早), 供列表分组渲染
    const groupedHistory = this.buildGroups(historyList)

    // 返回数据对象，由调用方合并 setData，避免多次渲染
    return {
      loading: false,
      historyList,
      groupedHistory,
      totalCount: rawList.length,
      abnormalCount,
      normalCount: rawList.length - abnormalCount,
      selectedCount,
      allChecked: historyList.length > 0 && selectedCount === historyList.length
    }
  },

  // 按检测日期分组: 今天 / 昨天 / 更早, 每组含 [组标签, 条数, items]
  // timeStr 格式 "YYYY-MM-DD HH:mm", 取前10位比较日期
  buildGroups: function(list) {
    var now = new Date()
    var pad = this.padZero
    var today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
    var y = new Date(now)
    y.setDate(y.getDate() - 1)
    var yesterday = y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate())
    var groups = [
      { label: '今天', items: [] },
      { label: '昨天', items: [] },
      { label: '更早', items: [] }
    ]
    for (var i = 0; i < list.length; i++) {
      var day = list[i].timeStr ? list[i].timeStr.slice(0, 10) : ''
      if (day === today) groups[0].items.push(list[i])
      else if (day === yesterday) groups[1].items.push(list[i])
      else groups[2].items.push(list[i])
    }
    // 过滤空组, 仅保留有记录的日期分组
    return groups.filter(function(g) { return g.items.length > 0 })
  },

  // 跳转综合分析页
  onGoAnalysis: function() {
    wx.navigateTo({ url: '/subpackages/extra/analysis/analysis' })
  },

  // 跳转检测页 (空状态引导按钮, 使用 switchTab 因为检测页是 tabBar 页面)
  onGoDetect: function() {
    wx.switchTab({ url: '/pages/detect/detect' })
  },

  // 格式化时间戳为可读字符串
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = this.padZero(date.getMonth() + 1)
    const day = this.padZero(date.getDate())
    const hour = this.padZero(date.getHours())
    const minute = this.padZero(date.getMinutes())
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 补零
  padZero(n) {
    return n < 10 ? '0' + n : '' + n
  },

  // 点击单条记录
  onItemTap(e) {
    const id = e.currentTarget.dataset.id

    // 编辑态: 切换勾选
    if (this.data.editMode) {
      this.toggleCheck(id)
      return
    }

    // 非编辑态: 跳转查看详情
    app.globalData.pendingHistoryId = id
    wx.switchTab({
      url: '/pages/detect/detect'
    })
  },

  // 切换单条勾选
  toggleCheck(id) {
    const list = this.data.historyList
    let count = 0
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].checked = !list[i].checked
      }
      if (list[i].checked) count++
    }
    this.setData({
      historyList: list,
      groupedHistory: this.buildGroups(list),
      selectedCount: count,
      allChecked: list.length > 0 && count === list.length
    })
  },

  // 切换编辑模式
  onToggleEdit() {
    var newMode = !this.data.editMode
    // 退出编辑模式时清除所有勾选
    if (!newMode) {
      var list = this.data.historyList
      for (var i = 0; i < list.length; i++) {
        list[i].checked = false
      }
      this.setData({
        editMode: false,
        historyList: list,
        selectedCount: 0,
        allChecked: false
      })
    } else {
      this.setData({ editMode: true })
    }
  },

  // 全选/取消全选
  onToggleSelectAll() {
    var list = this.data.historyList
    var newChecked = !this.data.allChecked
    for (var i = 0; i < list.length; i++) {
      list[i].checked = newChecked
    }
    var count = newChecked ? list.length : 0
    this.setData({
      historyList: list,
      groupedHistory: this.buildGroups(list),
      selectedCount: count,
      allChecked: newChecked
    })
  },

  // 删除选中的记录
  onDeleteSelected() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先选择记录', icon: 'none' })
      return
    }

    var self = this
    wx.showModal({
      title: '删除记录',
      content: '确定删除选中的 ' + self.data.selectedCount + ' 条记录吗？此操作不可恢复。',
      confirmText: '删除',
      confirmColor: '#E11D48',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 从 storage 中删除选中项
          var rawList = wx.getStorageSync('history') || []
          var checkedIds = {}
          self.data.historyList.forEach(function(item) {
            if (item.checked) checkedIds[item.id] = true
          })
          var newList = rawList.filter(function(item) {
            return !checkedIds[item.id]
          })

          if (newList.length > 0) {
            wx.setStorageSync('history', newList)
          } else {
            wx.removeStorageSync('history')
          }

          // 退出编辑模式并刷新 (loadHistory 返回数据对象，合并 editMode 后一次 setData)
          var refreshData = self.loadHistory()
          refreshData.editMode = false
          self.setData(refreshData)
          // 数据已变更, 标记脏位让其他Tab页面onShow时重新计算
          app.globalData.dataDirty = true
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // 导出历史记录
  onExportHistory() {
    // 延迟加载exportHelper, 首次导出时才加载模块
    if (!exportHelper) exportHelper = require('../../utils/exportHelper.js')
    var history = wx.getStorageSync('history') || []
    exportHelper.exportAndShare(history)
  },

  // 清空历史记录
  onClearHistory() {
    if (this.data.historyList.length === 0) return

    wx.showModal({
      title: '清空历史记录',
      content: '确定要清空全部 ' + this.data.totalCount + ' 条检测记录吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#E11D48',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('history')
          this.setData({
            historyList: [],
            groupedHistory: [],
            totalCount: 0,
            abnormalCount: 0,
            normalCount: 0,
            editMode: false,
            selectedCount: 0
          })
          // 数据已变更, 标记脏位让其他Tab页面onShow时重新计算
          app.globalData.dataDirty = true
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
