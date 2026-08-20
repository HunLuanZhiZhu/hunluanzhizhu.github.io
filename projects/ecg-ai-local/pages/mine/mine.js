// pages/mine/mine.js — 我的页面 (重构版)
// 聚焦: 个人健康信息展示 (检测统计、心律分布、健康评估、健康档案)
// 设置类功能已迁移到 pages/settings/settings
//
// 重构记录:
// M-R1: 健康档案改为三段式(基础信息/过敏史/慢性疾病)
// M-R2: 统计区重构 — 新增心律分类分布(N/S/V/F/Q)
// M-R3: 健康评估替代单一"成功率"评分 — 按异常类型加权计算风险等级
// M-R4: 档案完整度按三段式计算(基础信息/过敏史/慢性疾病)

const app = getApp()
var animateValue = null  // 懒加载: 评分环扫入工具

Page({
  data: {
    totalCount: 0,
    normalCount: 0,
    abnormalCount: 0,
    // 心律分类分布: N/S/V/F/Q 各自数量
    categoryStats: [],
    // 健康评估: 风险等级 + 详细说明
    healthAssessment: {
      level: 'none',          // none / low / medium / high
      levelText: '暂无数据',
      levelColor: '#007AFF',
      score: 0,
      scoreDeg: 0,
      findings: [],            // 具体发现列表
      advice: '开始检测后将自动生成健康评估报告',
      visible: false
    },
    // 趋势数据
    trendData: [],
    trendNormalRate: 0,
    trendRateClass: 'trend-rate-emerald',
    // stat-row 数据
    weekCount: 0,
    avgHeartRate: '-',
    streakDays: 0,
    // 检测活跃度热力图
    heatmap: [],
    // 档案完整度: 基础信息/过敏史/慢性疾病 3段完成百分比
    profileComplete: 0,
    // 过敏史摘要
    allergySummary: '未填写',
    // 慢性疾病摘要
    chronicSummary: '未填写',
    theme: 'light',
    userInfo: {}
  },

  onLoad() {
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)
    this.computeAndSetData()
  },

  onShow() {
    // === TabBar选中态同步 ===
    var tabBar = typeof this.getTabBar === 'function' && this.getTabBar()
    if (tabBar) {
      tabBar.updateSelected(4)
      tabBar.updateTheme(app.globalData.theme)
    }

    // 同步页面背景色
    app.applyThemeColors(app.globalData.theme)

    // === 主题同步 ===
    if (this.data.theme !== app.globalData.theme) {
      this.setData({ theme: app.globalData.theme })
    }

    // 性能优化: 首次加载时onLoad已完成计算, 跳过避免双次渲染
    if (this._firstShow) {
      this._firstShow = false
      app.globalData.dataDirty = false
      return
    }
    // === 性能优化: 检查全局数据脏标记 ===
    if (!app.globalData.dataDirty) {
      return
    }
    this.computeAndSetData()
    app.globalData.dataDirty = false
  },

  // 提取的数据计算和设置方法 (供onLoad和onShow共用)
  computeAndSetData() {
    var userInfo = wx.getStorageSync('userInfo') || {}
    var history = wx.getStorageSync('history') || []

    // === 基础统计 ===
    var normal = 0
    var abnormal = 0
    // 心律分类计数: N/S/V/F/Q
    var catCount = { N: 0, S: 0, V: 0, F: 0, Q: 0 }
    for (var i = 0; i < history.length; i++) {
      var r = history[i]
      if (r.isAbnormal) abnormal++
      else normal++
      // 按分类缩写累加
      var abbr = r.classAbbr || 'Q'
      if (catCount[abbr] !== undefined) {
        catCount[abbr]++
      } else {
        catCount.Q++
      }
    }

    // === 心律分类分布数据(用于前端展示) ===
    var total = history.length
    var categoryStats = [
      { key: 'N', name: '正常心搏', count: catCount.N, percent: total > 0 ? Math.round(catCount.N / total * 100) : 0, color: '#10B981', barClass: 'cat-bar-emerald' },
      { key: 'S', name: '室上性早搏', count: catCount.S, percent: total > 0 ? Math.round(catCount.S / total * 100) : 0, color: '#F59E0B', barClass: 'cat-bar-amber' },
      { key: 'V', name: '室性早搏', count: catCount.V, percent: total > 0 ? Math.round(catCount.V / total * 100) : 0, color: '#E11D48', barClass: 'cat-bar-rose' },
      { key: 'F', name: '融合搏动', count: catCount.F, percent: total > 0 ? Math.round(catCount.F / total * 100) : 0, color: '#F97316', barClass: 'cat-bar-coral' },
      { key: 'Q', name: '未知搏动', count: catCount.Q, percent: total > 0 ? Math.round(catCount.Q / total * 100) : 0, color: '#64748B', barClass: 'cat-bar-slate' }
    ]

    // === 健康评估 (替代单一成功率评分) ===
    // 按异常类型严重度加权计算: V(室性)=3, F(融合)=2, S(室上性)=1.5, Q(未知)=1
    var assessment = this.calcHealthAssessment(history, catCount, total)

    // === 趋势数据 ===
    var trendData = this.calcTrend(history)
    var trendNormalRate = total > 0 ? Math.round((normal / total) * 100) : 0
    var trendRateClass = ''
    if (trendNormalRate > 80) {
      trendRateClass = 'trend-rate-emerald'
    } else if (trendNormalRate >= 50) {
      trendRateClass = 'trend-rate-amber'
    } else {
      trendRateClass = 'trend-rate-rose'
    }

    var weekCount = this.calcWeekCount(history)
    var avgHeartRate = this.calcAvgHeartRate(history)
    var streakDays = this.calcStreakDays(history)
    var heatmap = this.calcHeatmap(history)

    // === 档案完整度 (三段式) ===
    var profileComplete = 0
    var profileSections = 0
    // 段1: 基础信息(姓名+性别+年龄段, 全部填写算完成)
    if (userInfo.name && userInfo.gender && userInfo.ageRange) profileSections++
    // 段2: 过敏史(无论有无, 明确选择即算完成)
    if (userInfo.hasAllergies !== undefined) profileSections++
    // 段3: 慢性疾病(无论有无, 明确选择即算完成)
    if (userInfo.hasChronicDisease !== undefined) profileSections++
    profileComplete = Math.round(profileSections / 3 * 100)

    // === 过敏史摘要 ===
    var allergySummary = '未填写'
    if (userInfo.hasAllergies === false) {
      allergySummary = '无过敏史'
    } else if (userInfo.hasAllergies === true) {
      var allergyParts = []
      if (userInfo.foodAllergies) allergyParts.push('食物')
      if (userInfo.drugAllergies) allergyParts.push('药物')
      if (userInfo.otherAllergies) allergyParts.push('其他')
      allergySummary = allergyParts.length > 0 ? allergyParts.join('·') : '有过敏史'
    }

    // === 慢性疾病摘要 ===
    var chronicSummary = '未填写'
    if (userInfo.hasChronicDisease === false) {
      chronicSummary = '无慢性疾病'
    } else if (userInfo.hasChronicDisease === true) {
      var chronicList = userInfo.chronicDiseases || []
      if (userInfo.chronicOther) chronicList = chronicList.concat([userInfo.chronicOther])
      chronicSummary = chronicList.length > 0 ? chronicList.join('·') : '有慢性疾病'
    }

    // 一次性setData
    this.setData({
      theme: app.globalData.theme,
      userInfo: userInfo,
      totalCount: total,
      normalCount: normal,
      abnormalCount: abnormal,
      categoryStats: categoryStats,
      healthAssessment: {
        level: assessment.level,
        levelText: assessment.levelText,
        levelColor: assessment.levelColor,
        score: 0,           // 初始0, 由动画扫入
        scoreDeg: 0,
        findings: assessment.findings,
        advice: assessment.advice,
        visible: total > 0
      },
      trendData: trendData,
      trendNormalRate: trendNormalRate,
      trendRateClass: trendRateClass,
      weekCount: weekCount,
      avgHeartRate: avgHeartRate,
      streakDays: streakDays,
      heatmap: heatmap,
      profileComplete: profileComplete,
      allergySummary: allergySummary,
      chronicSummary: chronicSummary
    })

    // 评分环扫入动画
    this.animateScore(assessment.score, Math.round(assessment.score * 3.6), total > 0)
  },

  // === 健康评估 ===
  // 评分逻辑: 按检测成功(正常)/失败(异常)比例计算
  // score = 正常检测次数 / 总检测次数 * 100
  calcHealthAssessment: function(history, catCount, total) {
    if (total === 0) {
      return {
        level: 'none', levelText: '暂无数据', levelColor: '#007AFF',
        score: 0, findings: [], advice: '开始检测后将自动生成健康评估报告'
      }
    }

    // 健康评分 = 正常检测占比 × 100
    var normalCount = catCount.N
    var abnormalCount = total - normalCount
    var score = Math.round(normalCount / total * 100)

    // 风险等级判定
    var level, levelText, levelColor, advice, findings = []

    if (score >= 85 && catCount.V === 0 && catCount.F === 0) {
      level = 'low'
      levelText = '低风险'
      levelColor = '#10B981'
      advice = '心律整体健康。建议保持规律作息和适度运动，定期复查。'
      if (catCount.S > 0) {
        findings.push('检测到' + catCount.S + '次室上性早搏(S)，偶发一般为良性')
      }
      if (normalCount > 0) {
        findings.push('正常检测占比' + score + '%')
      }
    } else if (score >= 60 || (catCount.V > 0 && catCount.V <= 2)) {
      level = 'medium'
      levelText = '中风险'
      levelColor = '#F59E0B'
      advice = '近期检测存在异常心律，建议增加检测频率，注意休息，必要时咨询专业医生。'
      if (catCount.V > 0) {
        findings.push('检测到' + catCount.V + '次室性早搏(V)，频发需警惕器质性心脏病')
      }
      if (catCount.S > 0) {
        findings.push('检测到' + catCount.S + '次室上性早搏(S)')
      }
      if (catCount.F > 0) {
        findings.push('检测到' + catCount.F + '次融合搏动(F)')
      }
    } else {
      level = 'high'
      levelText = '高风险'
      levelColor = '#E11D48'
      advice = '近期检测异常率较高，建议尽快前往医院心内科进行专业检查。'
      if (catCount.V > 0) {
        findings.push('检测到' + catCount.V + '次室性早搏(V)，需高度警惕')
      }
      if (catCount.F > 0) {
        findings.push('检测到' + catCount.F + '次融合搏动(F)')
      }
      if (catCount.S > 0) {
        findings.push('检测到' + catCount.S + '次室上性早搏(S)')
      }
      if (catCount.Q > 0) {
        findings.push('检测到' + catCount.Q + '次无法分类的搏动(Q)，可能信号质量不佳')
      }
    }

    return {
      level: level, levelText: levelText, levelColor: levelColor,
      score: score, findings: findings, advice: advice
    }
  },

  // 健康评分扫入: 数字与conic角度同步从0生长
  animateScore: function(score, scoreDeg, visible) {
    if (this._scoreAnim) {
      this._scoreAnim.stop()
      this._scoreAnim = null
    }
    if (!visible || score <= 0) return
    if (!animateValue) {
      animateValue = require('../../utils/animateValue.js')
    }
    var self = this
    this._scoreAnim = animateValue({
      from: 0,
      to: 1,
      duration: 700,
      delay: 150,
      onUpdate: function(p) {
        self.setData({
          'healthAssessment.score': Math.round(score * p),
          'healthAssessment.scoreDeg': Math.round(scoreDeg * p)
        })
      }
    })
  },

  onHide() {
    if (this._scoreAnim) {
      this._scoreAnim.stop()
      this._scoreAnim = null
    }
  },

  updateTheme(theme) {
    this.setData({ theme: theme })
  },

  // 计算本周(最近7天)检测次数
  calcWeekCount: function(history) {
    var now = new Date()
    var weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    var count = 0
    for (var i = 0; i < history.length; i++) {
      var r = history[i]
      // 优先使用 timestamp (毫秒数), 兼容旧的 timeStr
      var recordDate = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
      if (recordDate && recordDate >= weekAgo) count++
    }
    return count
  },

  // 计算平均心率(历史记录中暂无心率字段,返回占位符"-")
  calcAvgHeartRate: function(history) {
    return '-'
  },

  // 计算连续检测天数
  calcStreakDays: function(history) {
    if (history.length === 0) return 0
    var dateSet = {}
    for (var i = 0; i < history.length; i++) {
      var r = history[i]
      var d = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
      if (d) {
        var dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
        dateSet[dateStr] = true
      }
    }
    var streak = 0
    var now = new Date()
    for (var j = 0; j < 365; j++) {
      var d = new Date(now)
      d.setDate(d.getDate() - j)
      var dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
      if (dateSet[dateStr]) {
        streak++
      } else {
        break
      }
    }
    return streak
  },

  calcTrend: function(history) {
    var days = []
    var now = new Date()
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now)
      d.setDate(d.getDate() - i)
      var dateStr = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
      var label = ['日','一','二','三','四','五','六'][d.getDay()]
      var dayRecords = history.filter(function(r) {
        var rd = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
        if (!rd) return false
        var rDateStr = rd.getFullYear() + '-' + (rd.getMonth() + 1) + '-' + rd.getDate()
        return rDateStr === dateStr
      })
      var hasAbnormal = dayRecords.some(function(r) { return r.isAbnormal })
      var total = dayRecords.length
      days.push({
        date: dateStr,
        label: label,
        count: total,
        hasAbnormal: hasAbnormal,
        height: Math.min(72, Math.max(8, total * 16))
      })
    }
    return days
  },

  // 检测活跃度热力图: 近8周(56天)
  calcHeatmap: function(history) {
    var countByDate = {}
    for (var i = 0; i < history.length; i++) {
      var r = history[i]
      var d = r.timestamp ? new Date(r.timestamp) : (r.timeStr ? new Date(r.timeStr.replace(/-/g, '/')) : null)
      if (d) {
        var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
        countByDate[key] = (countByDate[key] || 0) + 1
      }
    }
    var now = new Date()
    var weeks = []
    for (var w = 7; w >= 0; w--) {
      var week = []
      for (var day = 6; day >= 0; day--) {
        var dd = new Date(now)
        dd.setDate(dd.getDate() - (w * 7 + day))
        var key2 = dd.getFullYear() + '-' + (dd.getMonth() + 1) + '-' + dd.getDate()
        var count = countByDate[key2] || 0
        var level = 0
        if (count >= 5) level = 4
        else if (count >= 3) level = 3
        else if (count === 2) level = 2
        else if (count === 1) level = 1
        week.push({ count: count, level: level })
      }
      weeks.push(week)
    }
    return weeks
  },

  // 编辑个人档案 — 按标签页打开
  onEditProfile: function(e) {
    var sheet = this.selectComponent('#profileSheet')
    if (sheet) {
      var tab = e.currentTarget.dataset.tab
      sheet.show(false, tab !== undefined ? Number(tab) : 0)
    }
  },

  // 档案保存回调
  onProfileSaved(e) {
    app.globalData.userInfo = e.detail
    this.setData({ userInfo: e.detail })
    app.globalData.dataDirty = true
    // 重新计算摘要
    this.computeAndSetData()
  },

  // 跳转到设置页
  onGoSettings() {
    wx.navigateTo({ url: '/subpackages/extra/settings/settings' })
  }
})
