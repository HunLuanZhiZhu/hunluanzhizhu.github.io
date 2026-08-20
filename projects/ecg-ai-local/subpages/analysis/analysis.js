// pages/analysis/analysis.js — 综合分析页
var app = getApp()
var chartHelper = require('../utils/chartHelper.js')

Page({
  data: {
    theme: 'light',
    analysis: null
  },

  onLoad: function() {
    // v3: onLoad不调用setData, 由onShow统一处理
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)
  },

  // v3优化: 合并theme到computeAnalysis内部, 避免独立setData
  onShow: function() {
    app.applyThemeColors(app.globalData.theme)
    if (this._firstShow) {
      this._firstShow = false
    }
    this.computeAnalysis()
  },

  updateTheme: function(theme) {
    this.setData({ theme: theme })
  },

  onGoDetect: function() {
    wx.switchTab({ url: '/pages/detect/detect' })
  },

  computeAnalysis: function() {
    var rawList = wx.getStorageSync('history') || []
    // 性能优化: 无数据时合并theme到同一次setData
    if (rawList.length === 0) {
      this.setData({ theme: app.globalData.theme, analysis: null })
      return
    }

    // 统计5类分布
    var dist = { N: 0, S: 0, V: 0, F: 0, Q: 0 }
    var total = rawList.length
    var abnormal = 0
    for (var i = 0; i < rawList.length; i++) {
      var abbr = rawList[i].classAbbr || 'Q'
      if (dist[abbr] !== undefined) dist[abbr]++
      if (rawList[i].isAbnormal) abnormal++
    }

    var abnormalRate = total > 0 ? (abnormal / total * 100).toFixed(1) : 0

    // 找出异常类型(可能并列最多)
    var abnormalTypes = []  // [{abbr, count}] 按数量降序
    var abbrs = ['S', 'V', 'F', 'Q']
    for (var j = 0; j < abbrs.length; j++) {
      if (dist[abbrs[j]] > 0) {
        abnormalTypes.push({ abbr: abbrs[j], count: dist[abbrs[j]] })
      }
    }
    abnormalTypes.sort(function(a, b) { return b.count - a.count })

    // 找最多数量, 看是否有并列
    var maxCount = abnormalTypes.length > 0 ? abnormalTypes[0].count : 0
    var topTypes = []
    for (var k = 0; k < abnormalTypes.length; k++) {
      if (abnormalTypes[k].count === maxCount) {
        topTypes.push(abnormalTypes[k].abbr)
      }
    }

    // 用户信息
    var userInfo = wx.getStorageSync('userInfo') || {}
    var name = userInfo.name || '用户'
    var gender = userInfo.gender || ''
    var ageRange = userInfo.ageRange || ''

    // 风险等级
    var riskLevel = '低'
    var riskColor = 'green'
    var rateNum = parseFloat(abnormalRate)
    if (rateNum >= 50) { riskLevel = '高'; riskColor = 'red' }
    else if (rateNum >= 25) { riskLevel = '中'; riskColor = 'orange' }

    // === 生成评语 ===
    var genderText = gender === 'male' ? '男性' : gender === 'female' ? '女性' : ''
    var ageText = ageRange ? ageRange + '年龄段' : ''
    var profilePrefix = ''
    if (genderText && ageText) {
      profilePrefix = '结合您为' + genderText + '、处于' + ageText + '的个人特征，'
    } else if (genderText) {
      profilePrefix = '结合您为' + genderText + '的个人特征，'
    } else if (ageText) {
      profilePrefix = '结合您处于' + ageText + '的个人特征，'
    }

    var summary = ''
    var suggestion = ''

    if (rateNum === 0) {
      // === 全部正常 ===
      summary = name + '，您好。您已完成' + total + '次心电检测，所有结果均为正常心搏（N类）。' + profilePrefix + '综合评判为低风险，当前心电健康状况良好。'
      suggestion = this.buildNormalSuggestion(gender, ageRange)
    } else {
      // === 有异常 ===
      // 构建异常类型描述
      var typeNames = []
      for (var m = 0; m < topTypes.length; m++) {
        typeNames.push('「' + chartHelper.CATEGORY_NAMES[topTypes[m]] + '」')
      }
      var typeStr = typeNames.length > 1
        ? typeNames.slice(0, -1).join('、') + '和' + typeNames[typeNames.length - 1]
        : typeNames[0]

      summary = name + '，您好。您已完成' + total + '次心电检测，其中' + abnormal + '次检出异常（异常率' + abnormalRate + '%）。' + profilePrefix + '综合评判为' + riskLevel + '风险。其中，检出最多的异常类型为' + typeStr + '，共' + maxCount + '次。'

      // 针对性建议: 考虑异常类型 + 年龄 + 性别交叉
      suggestion = this.buildAbnormalSuggestion(topTypes, abnormalTypes, maxCount, gender, ageRange, rateNum)
    }

    var categories = [
      { abbr: 'N', count: dist.N },
      { abbr: 'S', count: dist.S },
      { abbr: 'V', count: dist.V },
      { abbr: 'F', count: dist.F },
      { abbr: 'Q', count: dist.Q }
    ]

    // 指标宫格数据: 总检测/正常/异常/正常率 (正常率复用normalRate)
    var stats = [
      { label: '总检测', value: total, cls: '' },
      { label: '正常', value: total - abnormal, cls: 'green' },
      { label: '异常', value: abnormal, cls: 'red' },
      { label: '正常率', value: (100 - parseFloat(abnormalRate)).toFixed(1) + '%', cls: 'teal' }
    ]

    var analysis = {
      riskLevel: riskLevel,
      riskColor: riskColor,
      summary: summary,
      suggestion: suggestion,
      dist: dist,
      categories: categories,
      total: total,
      abnormalRate: abnormalRate,
      normalRate: (100 - parseFloat(abnormalRate)).toFixed(1),
      stats: stats
    }

    // 性能优化: 合并theme到同一次setData, 减少渲染次数
    this.setData({ theme: app.globalData.theme, analysis: analysis })

    // 延迟绘制图表, 等canvas渲染
    // A1: 删除重复的 drawDonutChart/drawBarChart 调用，仅保留 drawDonut/drawBars
    var self = this
    setTimeout(function() {
      self.drawDonut(dist, total)
      self.drawBars(dist)
    }, 150)
  },

  // === 全部正常的建议: 结合性别+年龄 ===
  buildNormalSuggestion: function(gender, ageRange) {
    var parts = []
    parts.push('您的检测结果全部正常，心电波形规整，这是一个非常好的信号。')

    // 年龄相关建议
    if (ageRange === '18-30') {
      parts.push('青年阶段心脏代偿能力强，但仍建议保持规律作息，避免长期熬夜和过度摄入咖啡因。每半年进行一次心电复查即可。')
    } else if (ageRange === '31-45') {
      parts.push('中年阶段工作压力大，建议注意劳逸结合，每周保持150分钟以上中等强度运动，控制体重和血脂。每季度复查一次心电。')
    } else if (ageRange === '46-60') {
      parts.push('46-60岁是心血管疾病风险上升期，建议每两个月进行一次心电检测，同时关注血压、血糖、血脂等危险因素，低盐低脂饮食。')
    } else if (ageRange === '60+') {
      parts.push('60岁以上建议每月进行一次心电检测，注意监测有无隐匿性心律失常。适当进行有氧运动如散步、太极拳，避免剧烈运动。')
    } else {
      parts.push('建议保持规律作息、适量运动和均衡饮食，每季度进行一次心电复查。')
    }

    // 性别补充
    if (gender === 'male' && (ageRange === '46-60' || ageRange === '60+')) {
      parts.push('男性在45岁后心血管疾病风险显著上升，建议定期检查颈动脉超声和心脏彩超。')
    } else if (gender === 'female' && (ageRange === '46-60' || ageRange === '60+')) {
      parts.push('女性绝经后心血管保护作用减弱，建议关注血压波动，必要时进行激素水平评估。')
    }

    return parts.join('')
  },

  // === 有异常的建议: 异常类型+年龄+性别交叉 ===
  buildAbnormalSuggestion: function(topTypes, allAbnormalTypes, maxCount, gender, ageRange, rateNum) {
    var parts = []
    var hasS = topTypes.indexOf('S') >= 0
    var hasV = topTypes.indexOf('V') >= 0
    var hasF = topTypes.indexOf('F') >= 0
    var hasQ = topTypes.indexOf('Q') >= 0

    // === 按异常类型给核心建议 ===
    if (hasV) {
      // 室性早搏最危险, 优先处理
      parts.push('室性早搏（V类）是需要重点关注的异常类型。频发室性早搏可能增加心血管事件风险，')
      if (ageRange === '60+') {
        parts.push('尤其在60岁以上人群中，室性早搏与器质性心脏病的关联更为密切。建议尽快至心内科就诊，完善心脏彩超、冠脉CT等检查，排除结构性心脏病。日常避免剧烈运动，注意监测血压。')
      } else if (ageRange === '46-60') {
        parts.push('46-60岁人群出现频发室性早搏，需警惕冠心病可能。建议至心内科就诊，完善运动平板试验和心脏彩超。控制血压血脂，戒烟限酒。')
      } else if (ageRange === '31-45') {
        parts.push('中青年人群的室性早搏多为功能性，但仍建议心内科就诊评估。完善24小时动态心电图（Holter）了解早搏负荷，排除心肌炎等病因。')
      } else if (ageRange === '18-30') {
        parts.push('青年人群的室性早搏多为良性，但频发仍需重视。建议行Holter监测评估24小时早搏总数，避免熬夜、剧烈运动和过量摄入咖啡因。')
      } else {
        parts.push('建议尽快至心内科就诊，完善心脏彩超和24小时动态心电图检查。')
      }
    } else if (hasS) {
      parts.push('室上性早搏（S类）在健康人群中也较常见，偶发通常无碍。')
      if (maxCount >= 3) {
        parts.push('但' + maxCount + '次检出提示有频发倾向，建议进行24小时动态心电图（Holter）监测，评估早搏负荷。')
      } else {
        parts.push('本次检出次数较少，建议持续观察。')
      }
      if (ageRange === '60+') {
        parts.push('老年人群频发室上性早搏可能进展为房颤，建议每两个月复查心电，关注有无心悸、胸闷等症状。')
      } else if (gender === 'female' && (ageRange === '31-45' || ageRange === '46-60')) {
        parts.push('中年女性出现频发室上性早搏，需关注是否与甲状腺功能异常或激素水平波动有关，必要时检查甲功。')
      }
      parts.push('避免熬夜、浓茶咖啡和情绪激动等诱因。')
    } else if (hasF) {
      parts.push('融合搏动（F类）提示可能存在室性异位节律与正常心律的竞争。建议进一步行动态心电图监测，评估室性异位搏动的频率和形态特征。')
      if (ageRange === '46-60' || ageRange === '60+') {
        parts.push('该年龄段出现融合搏动需警惕器质性心脏病，建议心内科就诊完善心脏彩超。')
      }
    } else if (hasQ) {
      parts.push('多次检出未知搏动（Q类）可能与信号采集质量有关。建议在安静环境下、保持静止状态重新采集心电数据，确保电极接触良好、减少干扰后再次检测。')
      if (rateNum > 50) {
        parts.push('异常率较高且多为未知搏动，也不排除存在复杂心律失常的可能，建议至心内科进行专业心电检测。')
      }
    }

    // === 并列多种异常的补充 ===
    if (topTypes.length > 1) {
      var typeNames = []
      for (var i = 0; i < topTypes.length; i++) {
        typeNames.push(chartHelper.CATEGORY_NAMES[topTypes[i]])
      }
      parts.push('您同时检出多种异常类型（' + typeNames.join('、') + '）并列最多，提示心律失常表现较为复杂，建议尽快至心内科进行系统评估，不可掉以轻心。')
    }

    // === 高异常率的额外警示 ===
    if (rateNum >= 50) {
      parts.push('当前异常率超过50%，属于高风险水平，强烈建议尽快就医进行全面心电评估，切勿拖延。')
    }

    // === 年龄段检测频率建议 ===
    if (ageRange === '60+') {
      parts.push('建议此后每月至少进行一次心电检测，持续监测。')
    } else if (ageRange === '46-60') {
      parts.push('建议此后每两个月进行一次心电检测。')
    }

    return parts.join('')
  },

  // 绘制环形图
  // retryCount: 内部重试计数，防止 canvas 未就绪时无限重试
  // 图表颜色使用 app.globalData.categoryColors，根据主题选择 light/dark
  drawDonut: function(dist, total, retryCount) {
    var self = this
    retryCount = retryCount || 0
    var query = wx.createSelectorQuery()
    query.select('#donutChart')
      .fields({ node: true, size: true })
      .exec(function(res) {
        if (!res || !res[0] || !res[0].node || !res[0].width) {
          // 超过最大重试次数(10次)后停止并报错，避免无限循环
          if (retryCount >= 10) {
            console.error('[analysis] drawDonut 重试已达上限(10次)，canvas 仍未就绪，停止重试')
            return
          }
          setTimeout(function() { self.drawDonut(dist, total, retryCount + 1) }, 60)
          return
        }
        var canvas = res[0].node
        var ctx = canvas.getContext('2d')
        var dpr = wx.getWindowInfo().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)

        var w = res[0].width
        var h = res[0].height
        var cx = w * 0.25
        var cy = h / 2
        var outerR = Math.min(w * 0.2, h * 0.4)
        var innerR = outerR * 0.6

        // 从全局 categoryColors 获取颜色，根据主题选择 light/dark
        var categoryColors = app.globalData.categoryColors || {}
        var isDark = self.data.theme === 'dark'
        var colors = {}
        var keys = ['N', 'S', 'V', 'F', 'Q']
        for (var ci = 0; ci < keys.length; ci++) {
          var co = categoryColors[keys[ci]] || { light: '#78909C', dark: '#64748B' }
          colors[keys[ci]] = isDark ? co.dark : co.light
        }
        var textColor = isDark ? '#F1F5F9' : '#0F172A'

        chartHelper.drawDonutChart(ctx, cx, cy, outerR, innerR, dist, total.toString(), colors, textColor)

        // 图例
        var legendX = w * 0.48
        var legendY = h / 2 - 60
        chartHelper.drawLegend(ctx, legendX, legendY, 22, dist, total, colors, textColor)
      })
  },

  // 绘制柱状图
  // retryCount: 内部重试计数，防止 canvas 未就绪时无限重试
  // 图表颜色使用 app.globalData.categoryColors，根据主题选择 light/dark
  drawBars: function(dist, retryCount) {
    var self = this
    retryCount = retryCount || 0
    var query = wx.createSelectorQuery()
    query.select('#barChart')
      .fields({ node: true, size: true })
      .exec(function(res) {
        if (!res || !res[0] || !res[0].node || !res[0].width) {
          // 超过最大重试次数(10次)后停止并报错，避免无限循环
          if (retryCount >= 10) {
            console.error('[analysis] drawBars 重试已达上限(10次)，canvas 仍未就绪，停止重试')
            return
          }
          setTimeout(function() { self.drawBars(dist, retryCount + 1) }, 60)
          return
        }
        var canvas = res[0].node
        var ctx = canvas.getContext('2d')
        var dpr = wx.getWindowInfo().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)

        var w = res[0].width
        var h = res[0].height

        // 从全局 categoryColors 获取颜色，根据主题选择 light/dark
        var categoryColors = app.globalData.categoryColors || {}
        var isDark = self.data.theme === 'dark'
        var colors = {}
        var keys = ['N', 'S', 'V', 'F', 'Q']
        for (var ci = 0; ci < keys.length; ci++) {
          var co = categoryColors[keys[ci]] || { light: '#78909C', dark: '#64748B' }
          colors[keys[ci]] = isDark ? co.dark : co.light
        }
        var labelColor = isDark ? '#94A3B8' : '#8E8E93'
        var valueColor = isDark ? '#F1F5F9' : '#0F172A'

        chartHelper.drawBarChart(ctx, 4, 4, w - 8, 22, 8, dist, colors, labelColor, valueColor)
      })
  }
})
