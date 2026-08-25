// pages/detect/detect.js — 心电检测主页面
// 功能: 文件导入 → 数据预览(动态波形) → 模型推理 → 结果展示
// 动画统一使用 utils/waveAnimator, 保证与科普页一致

var app = getApp()
// 性能优化: waveAnimator和DEMO_ECG_SAMPLES改为懒加载, 避免阻塞页面首屏渲染
// waveAnimator(11.4KB)和DEMO_ECG_SAMPLES(10.2KB)仅在用户实际操作时才加载
var waveAnimator = null
var DEMO_ECG_SAMPLES = null
var animateValue = null  // 懒加载: 置信度数字滚动工具
var fileParser = null    // 懒加载: 文件解析器(5.5KB, 仅在导入文件时加载)

// AAMI分类标签 + 详细介绍与建议
var AAMI_CLASSES = [
  {
    abbr: 'F', name: '融合搏动', desc: 'Fusion beat', abnormal: true, color: 'orange', level: 'warning',
    intro: '正常心搏与室性异位搏动同时激动心室时产生的融合波形，形态介于正常QRS与室性早搏之间。其出现提示可能存在室性异位节律，需结合临床综合判断。',
    features: ['形态介于正常与室性早搏之间', 'PR间期缩短', '多见于室性并行心律'],
    advice: '融合搏动提示可能存在室性异位节律，建议进一步行24小时动态心电图（Holter）监测，评估异位搏动的频率和形态特征，必要时咨询心内科医生。'
  },
  {
    abbr: 'N', name: '正常心搏', desc: 'Normal beat', abnormal: false, color: 'green', level: 'normal',
    intro: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟范围内。P波、QRS波群和T波形态正常，是健康心脏的典型表现。',
    features: ['窦性节律', 'PR间期正常', 'QRS形态正常'],
    advice: '本次检测心搏形态正常，建议保持健康的生活方式——规律作息、适量运动、均衡饮食，定期进行心电检查以持续监测心脏健康。'
  },
  {
    abbr: 'Q', name: '未知搏动', desc: 'Unclassifiable beat', abnormal: true, color: 'grey', level: 'unknown',
    intro: '因信号质量差、噪声干扰或形态不典型而无法归入上述类别的搏动。此类搏动需要结合上下文波形和信号质量综合评估，必要时需重新采集。',
    features: ['信号质量差', '可能存在噪声干扰', '形态不典型'],
    advice: '本次检测信号质量不佳，无法准确分类。建议在安静环境下重新采集心电数据，确保电极接触良好、保持静止，减少干扰后再次进行检测。'
  },
  {
    abbr: 'S', name: '室上性早搏', desc: 'Supraventricular ectopic', abnormal: true, color: 'orange', level: 'warning',
    intro: '异位起搏点位于房室结以上区域的提前搏动，包括房性早搏和交界性早搏。QRS波群通常变窄，与正常心搏形态相似但出现时间提前。',
    features: ['提前出现', 'QRS波群变窄', '代偿间歇不完全'],
    advice: '室上性早搏偶发可见于健康人群，但频发可能提示甲状腺功能异常、电解质紊乱或心脏结构问题。建议减少咖啡因摄入、戒烟限酒、避免熬夜，如症状持续或加重请及时就医。'
  },
  {
    abbr: 'V', name: '室性早搏', desc: 'Ventricular ectopic', abnormal: true, color: 'red', level: 'danger',
    intro: '起源于心室肌的提前搏动，QRS波群宽大畸形，时限超过120ms，T波方向与QRS主波方向相反。频发室性早搏可能提示器质性心脏病，需进一步评估。',
    features: ['QRS宽大畸形', 'T波方向与主波相反', '代偿间歇完全'],
    advice: '室性早搏需引起重视，尤其是频发或成对出现时。建议尽快至心内科就诊，完善心脏超声、动态心电图等检查，评估是否存在器质性心脏病，遵医嘱进行相应治疗。'
  }
]

// 5类AAMI标准心跳示例数据已移至 utils/demoSamples.js, 仅在用户点击示例时懒加载

Page({
  data: {
    step: 'import',
    ecgData: null,
    ecgLength: 0,
    ecgMin: 0,
    ecgMax: 0,
    detecting: false,
    modelReady: false,
    modelLoading: false,
    modelStatusExpanded: false,  // 模型状态指示器: 默认半隐藏, 点击展开
    result: null,
    confidencePercent: 0,
    confidenceDisplay: '0.0',  // 大数字滚动显示值(0→confidencePercent动画)
    probDisplay: [],
    batchRecords: [],
    batchIndex: 0,
    batchTotal: 0,
    batchLabel: '',
    hasBatchNext: false,    // 结果页: 是否还有下一条可检测
    // 历史详情浏览模式：从历史页进入时启用独立的前后记录导航。
    viewingHistory: false,
    historyNavIndex: -1,
    historyNavTotal: 0,
    // 示例数据列表 — 性能优化: 初始为空, 在onLoad中懒加载demoSamples.js后填充
    demoSamples: [],
    // 健康提示 (根据近期检测动态生成)
    healthTip: null
  },

  onLoad: function(options) {
    // 性能优化: 标记首次加载, onShow据此跳过重复的setData, 消除双次渲染导致的窗口抖动
    // 这是detect页面抖动的关键修复: 之前onLoad和onShow都执行setData, 现在统一在onLoad中完成
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)

    // === 一次性计算所有首屏数据, 合并为单次setData, 避免多次渲染 ===
    var mergedData = { theme: app.globalData.theme }

    // 模型状态
    var modelStatus = this.getModelStatus()
    mergedData.modelReady = modelStatus.modelReady
    mergedData.modelLoading = modelStatus.modelLoading

    // 读取本地历史记录 (用于最近检测结果展示和健康提示)
    var history = wx.getStorageSync('history') || []
    if (history.length > 0) {
      var latest = history[history.length - 1]
      mergedData.latestResult = {
        className: latest.className,
        isAbnormal: latest.isAbnormal,
        confidencePercent: (latest.confidence * 100).toFixed(1),
        timeStr: latest.timeStr
      }
    }

    // 健康提示
    mergedData.healthTip = this.loadHomeStats(history)

    // 单次setData完成首屏渲染
    this.setData(mergedData)

    // 触发TF.js懒初始化 (延迟100ms, 不阻塞首屏渲染)
    app.ensureTFReady()

    // 如果模型正在加载, 启动轮询(仅启动一次)
    if (modelStatus.modelLoading && !this._modelCheckTimer) {
      var self0 = this
      this._modelCheckTimer = setInterval(function() {
        if (app.globalData.isModelReady) {
          self0.setData({ modelReady: true, modelLoading: false })
          clearInterval(self0._modelCheckTimer)
          self0._modelCheckTimer = null
        }
      }, 500)
    }

    // 性能优化: 懒加载demoSamples列表, 延迟到首屏渲染完成后执行
    var self = this
    setTimeout(function() {
      if (!DEMO_ECG_SAMPLES) {
        DEMO_ECG_SAMPLES = require('../../utils/demoSamples.js')
      }
      self.setData({
        demoSamples: DEMO_ECG_SAMPLES.map(function(s) {
          return { id: s.id, label: s.label, labelAbbr: s.labelAbbr, labelDesc: s.labelDesc }
        })
      })
    }, 500)

    if (app.globalData.pendingHistoryId) {
      var id = app.globalData.pendingHistoryId
      app.globalData.pendingHistoryId = null
      this._pendingHistoryId = id
    }

    // 性能优化: 个人档案弹窗仅在首次加载时检查, 延迟600ms避免与首屏渲染竞争
    var skipped = wx.getStorageSync('profileSkipped')
    if (!skipped) {
      setTimeout(function() {
        var sheet = self.selectComponent('#profileSheet')
        if (sheet) sheet.show(true)
      }, 600)
    }
  },

  onShow: function() {
    // === TabBar选中态同步 (修复: 切换页面后底部按钮不高亮) ===
    // 官方推荐模式: onShow把本页下标硬编码同步给TabBar组件
    // attached路径嗅探仅是首渲染快速兜底; 页面缓存后attached不再触发, 必须在此同步
    // updateSelected内部有"值不变不setData"守卫, 无额外渲染开销
    var tabBar = typeof this.getTabBar === 'function' && this.getTabBar()
    if (tabBar) {
      tabBar.updateSelected(0)
      tabBar.updateTheme(app.globalData.theme)
    }

    // 同步页面背景色 (修复: onLaunch中调用wx.setBackgroundColor时页面尚未创建)
    app.applyThemeColors(app.globalData.theme)

    // === 主题同步: 始终优先同步主题, 不依赖dataDirty ===
    // 修复: 从设置页切换深色模式后, dataDirty可能被其他Tab页onShow清除,
    // 导致检测页深色模式失效。直接比较当前主题与全局主题, 不一致则立即更新
    if (this.data.theme !== app.globalData.theme) {
      this.setData({ theme: app.globalData.theme })
    }

    // === 性能优化: 首次加载时onLoad已完成所有数据计算和setData ===
    // 跳过onShow的重复计算, 消除双次渲染导致的窗口抖动
    if (this._firstShow) {
      this._firstShow = false
      app.globalData.dataDirty = false
      // 仍需处理onLoad中设置的pendingHistoryId (从历史页跳转过来的情况)
      if (this._pendingHistoryId) {
        var loadId = this._pendingHistoryId
        this._pendingHistoryId = null
        var self = this
        setTimeout(function() {
          self.loadHistoryRecord(loadId)
        }, 150)
      }
      return
    }

    // 先于 dataDirty 判断消费待查看记录。历史页点击记录只是导航意图，不一定伴随数据变更；
    // 如果这里先按 dataDirty 提前 return，会出现点击历史记录却停在检测首页的问题。
    if (!this._pendingHistoryId && app.globalData.pendingHistoryId) {
      this._pendingHistoryId = app.globalData.pendingHistoryId
      app.globalData.pendingHistoryId = null
    }
    var pendingLoadId = null
    if (this._pendingHistoryId) {
      pendingLoadId = this._pendingHistoryId
      this._pendingHistoryId = null
    }

    // 数据未变更且没有待查看记录时，才跳过重计算。
    if (!app.globalData.dataDirty && !pendingLoadId) {
      return
    }

    // === 数据有变更或存在待查看记录, 执行必要刷新 ===
    var mergedData = {
      theme: app.globalData.theme
    }

    // 模型状态检查
    var modelStatus = this.getModelStatus()
    mergedData.modelReady = modelStatus.modelReady
    mergedData.modelLoading = modelStatus.modelLoading

    // 如果模型正在加载, 启动轮询(仅启动一次)
    if (modelStatus.modelLoading && !this._modelCheckTimer) {
      var self0 = this
      this._modelCheckTimer = setInterval(function() {
        if (app.globalData.isModelReady) {
          self0.setData({ modelReady: true, modelLoading: false })
          clearInterval(self0._modelCheckTimer)
          self0._modelCheckTimer = null
        }
      }, 500)
    }

    // 读取本地历史记录
    var history = wx.getStorageSync('history') || []
    if (history.length > 0) {
      var latest = history[history.length - 1]
      mergedData.latestResult = {
        className: latest.className,
        isAbnormal: latest.isAbnormal,
        confidencePercent: (latest.confidence * 100).toFixed(1),
        timeStr: latest.timeStr
      }
    }

    // 健康提示
    mergedData.healthTip = this.loadHomeStats(history)

    // 一次性更新所有页面数据
    this.setData(mergedData)

    // 数据已更新, 清除脏标记
    app.globalData.dataDirty = false

    // 从历史页点击记录进入时，延迟到统计区域刷新后再切换结果视图。
    if (pendingLoadId) {
      var self = this
      setTimeout(function() {
        self.loadHistoryRecord(pendingLoadId)
      }, 150)
    }
  },

  // 个人档案保存回调
  onProfileSaved: function(e) {
    app.globalData.userInfo = e.detail
    // 档案变更, 标记脏位让其他Tab页面onShow时重新计算
    app.globalData.dataDirty = true
  },

  // 加载首页健康提示 (从本地历史记录计算)
  // 修改: 接收传入的history参数, 避免重复读取storage
  loadHomeStats: function(history) {
    // 兼容: 未传入参数时自行读取 (如单独调用)
    if (!history) {
      history = wx.getStorageSync('history') || []
    }
    var total = history.length

    // 健康提示逻辑: 根据最近3次检测状态动态生成
    var tip = null
    if (total === 0) {
      tip = { type: 'info', icon: 'i', title: '欢迎使用心韵深辨', text: '开始您的第一次心电检测，体验本地AI智能分析' }
    } else {
      var recent = history.slice(0, Math.min(3, total))
      var allNormal = recent.every(function(r) { return !r.isAbnormal })
      if (allNormal) {
        tip = { type: 'success', icon: '✓', title: '心脏状态良好', text: '最近' + recent.length + '次检测均为正常心律，请继续保持健康的生活方式' }
      } else {
        var abnormalCount = recent.filter(function(r) { return r.isAbnormal }).length
        tip = { type: 'warning', icon: '!', title: '请关注心脏健康', text: '最近' + recent.length + '次检测中发现' + abnormalCount + '次异常，建议定期复查' }
      }
    }

    // 返回健康提示数据，由onShow合并到统一的setData中
    return tip
  },

  updateTheme: function(theme) {
    this.setData({ theme: theme })
  },

  onUnload: function() {
    this.stopWave()
    // 停止置信度滚动动画
    if (this._confAnim) {
      this._confAnim.stop()
      this._confAnim = null
    }
    // 清理模型检查定时器
    if (this._modelCheckTimer) {
      clearInterval(this._modelCheckTimer)
      this._modelCheckTimer = null
    }
  },

  // 获取模型状态 — 返回数据对象, 由调用方合并到统一setData中
  // 性能优化: 原checkModelStatus直接调用setData, 现改为返回数据避免独立渲染
  getModelStatus: function() {
    var g = app.globalData
    if (g.isModelReady) {
      return { modelReady: true, modelLoading: false }
    } else if (g.modelLoading) {
      return { modelReady: false, modelLoading: true }
    }
    return { modelReady: false, modelLoading: false }
  },

  // 模型状态指示器: 点击切换展开/收起
  onModelStatusTap: function() {
    this.setData({ modelStatusExpanded: !this.data.modelStatusExpanded })
  },

  onImportFile: function() {
    var self = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['csv', 'json', 'txt'],
      success: function(res) {
        var file = res.tempFiles[0]
        self.parseFile(file.path, file.name)
      }
    })
  },

  parseFile: function(filePath, fileName) {
    var self = this
    wx.showLoading({ title: '解析文件中...' })
    var fs = wx.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      encoding: 'utf-8',
      success: function(res) {
        try {
          var result = self.parseData(res.data, fileName)

          if (result.type === 'multi') {
            // 多记录数据集: 直接进入预览(带批量导航)
            wx.hideLoading()
            self.setData({
              batchRecords: result.records,
              batchIndex: 0,
              batchTotal: result.records.length
            })
            self.showBatchPreview(0)
            return
          }

          // 单条记录
          var data = result.data
          if (!data || data.length < 260) {
            wx.hideLoading()
            wx.showToast({ title: '数据不足260点', icon: 'none' })
            return
          }
          data = data.slice(0, 260)
          self.setData({ batchRecords: [], batchTotal: 0 })
          self.showPreview(data)
          wx.hideLoading()
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: '解析失败: ' + e.message, icon: 'none' })
        }
      },
      fail: function() {
        wx.hideLoading()
        wx.showToast({ title: '文件读取失败', icon: 'none' })
      }
    })
  },

  // 多记录: 展示第idx条
  showBatchPreview: function(idx) {
    var records = this.data.batchRecords
    if (idx < 0 || idx >= records.length) return
    var record = records[idx]
    this.setData({
      batchIndex: idx,
      batchTotal: records.length,
      batchLabel: record.labelName || record.label || ('记录' + (idx + 1))
    })
    this.showPreview(record.data)
  },

  onBatchNext: function() {
    var idx = this.data.batchIndex
    var total = this.data.batchRecords.length
    if (idx < total - 1) {
      this.showBatchPreview(idx + 1)
    }
  },

  onBatchPrev: function() {
    if (this.data.batchIndex > 0) {
      this.showBatchPreview(this.data.batchIndex - 1)
    }
  },

  // 解析数据: 支持纯数组/数组嵌套/records对象/CSV/TXT
  // v3优化: 实现已提取到 utils/fileParser.js, 懒加载节省首页~5.5KB解析开销
  parseData: function(content, fileName) {
    if (!fileParser) fileParser = require('../../utils/fileParser.js')
    return fileParser.parseData(content, fileName)
  },

  onUseDemoSample: function(e) {
    var idx = e.currentTarget.dataset.idx
    // 性能优化: 懒加载DEMO_ECG_SAMPLES, 仅在用户点击示例时才加载
    if (!DEMO_ECG_SAMPLES) {
      DEMO_ECG_SAMPLES = require('../../utils/demoSamples.js')
    }
    var sample = DEMO_ECG_SAMPLES[idx]
    if (!sample) return
    this.setData({ batchRecords: [], batchTotal: 0 })
    this.showPreview(sample.data)
  },

  showPreview: function(ecgData) {
    // 先停止上一个动画, 避免切换记录时残留
    this.stopWave()
    var min = Math.min.apply(null, ecgData)
    var max = Math.max.apply(null, ecgData)
    var hasBatchNext = this.data.batchTotal > 1 && this.data.batchIndex < this.data.batchTotal - 1
    this.setData({
      step: 'preview',
      ecgData: ecgData,
      ecgLength: ecgData.length,
      ecgMin: min.toFixed(3),
      ecgMax: max.toFixed(3),
      hasBatchNext: hasBatchNext,
      viewingHistory: false,
      historyNavIndex: -1,
      historyNavTotal: 0
    })
    var self = this
    // v3: waveAnimator自带60ms重试, 初始延迟降至100ms
    setTimeout(function() {
      if (!waveAnimator) {
        waveAnimator = require('../../utils/waveAnimator.js')
      }
      self._wave = waveAnimator.start({
        page: self,
        canvasId: 'ecgCanvas',
        data: ecgData,
        style: 'full',
        pointsPerFrame: 5,
        loop: true,
        loopDelay: 700,
        hudLabel: 'ECG · 250Hz'
      })
    }, 100)
  },

  stopWave: function() {
    if (this._wave) {
      this._wave.stop()
      this._wave = null
    }
  },

  // 置信度大数字滚动: 0 → 目标值, 600ms缓出 (设计: 数字即主角)
  // 在结果setData之后调用; 延迟200ms等pop-in图标先落定, 形成编排节奏
  animateConfidence: function(targetStr) {
    var target = parseFloat(targetStr) || 0
    if (this._confAnim) this._confAnim.stop()
    // 性能优化: 懒加载animateValue
    if (!animateValue) {
      animateValue = require('../../utils/animateValue.js')
    }
    var self = this
    this._confAnim = animateValue({
      from: 0,
      to: target,
      duration: 600,
      delay: 200,
      onUpdate: function(v) {
        self.setData({ confidenceDisplay: v.toFixed(1) })
      }
    })
  },

  // 开始检测当前预览的波形
  onDetect: function() {
    if (this.data.detecting) return
    var self = this
    this.stopWave()
    this.setData({ detecting: true })

    if (!app.globalData.isModelReady) {
      wx.showLoading({ title: '加载模型中...' })
      app.loadModel().then(function() {
        self.setData({ modelReady: true })
        wx.hideLoading()
        self.runDetect()
      }).catch(function() {
        wx.hideLoading()
        wx.showToast({ title: '模型加载失败', icon: 'none' })
        self.setData({ detecting: false })
      })
    } else {
      this.runDetect()
    }
  },

  runDetect: function() {
    var self = this
    wx.showLoading({ title: '检测分析中...', mask: true })

    app.runInference(this.data.ecgData).then(function(result) {
      var probDisplay = []
      for (var i = 0; i < 5; i++) {
        var p = result.probabilities[i] || 0
        probDisplay.push({
          abbr: AAMI_CLASSES[i].abbr,
          name: AAMI_CLASSES[i].name,
          abnormal: AAMI_CLASSES[i].abnormal,
          color: AAMI_CLASSES[i].color,
          level: AAMI_CLASSES[i].level,
          percent: (p * 100).toFixed(2)
        })
      }

      var classIdx = result.classIdx || 0
      var classInfo = AAMI_CLASSES[classIdx]
      var confPercent = (result.confidence * 100).toFixed(1)

      var hasBatchNext = self.data.batchTotal > 1 && self.data.batchIndex < self.data.batchTotal - 1

      self.setData({
        step: 'result',
        result: result,
        confidencePercent: confPercent,
        probDisplay: probDisplay,
        classInfo: classInfo,
        detecting: false,
        hasBatchNext: hasBatchNext
      })

      // 置信度大数字滚动 (结果页编排: 图标pop-in → 数字滚动 → 概率条生长)
      self.animateConfidence(confPercent)

      // 结果页动态波形 (v3: 延迟降至100ms, waveAnimator自带重试)
      setTimeout(function() {
        if (!waveAnimator) {
          waveAnimator = require('../../utils/waveAnimator.js')
        }
        self._wave = waveAnimator.start({
          page: self,
          canvasId: 'ecgResultCanvas',
          data: self.data.ecgData,
          style: 'full',
          pointsPerFrame: 5,
          loop: true,
          loopDelay: 700,
          hudLabel: 'ECG · ' + (result.classAbbr || '') + ' · 250Hz'
        })
      }, 100)

      wx.hideLoading()
      self.saveToHistory(result)
    }).catch(function(e) {
      wx.hideLoading()
      console.error('推理失败:', e)
      wx.showToast({ title: '检测失败: ' + (e.message || '未知错误'), icon: 'none' })
      self.setData({ detecting: false })
    })
  },

  // 结果页: 检测下一条(批量模式)
  onDetectNext: function() {
    this.stopWave()
    var idx = this.data.batchIndex
    if (idx < this.data.batchRecords.length - 1) {
      this.showBatchPreview(idx + 1)
    }
  },

  saveToHistory: function(result) {
    try {
      var history = wx.getStorageSync('history') || []
      var record = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        className: result.className,
        classAbbr: result.classAbbr,
        classDesc: result.classDesc || '',
        isAbnormal: result.isAbnormal,
        confidence: result.confidence,
        confidencePercent: (result.confidence * 100).toFixed(1),
        ecgData: this.data.ecgData,
        probabilities: result.probabilities
      }
      history.unshift(record)
      if (history.length > 100) history = history.slice(0, 100)
      wx.setStorageSync('history', history)
      // 数据已变更, 标记脏位让其他Tab页面onShow时重新计算
      app.globalData.dataDirty = true
    } catch (e) {
      console.error('保存历史记录失败:', e)
    }
  },

  // D9: 保存结果按钮 → 跳转到历史页查看已保存的记录
  // (结果已在 runDetect 中自动保存，此处无需重复保存)
  onSaveResult: function() {
    wx.switchTab({ url: '/pages/history/history' })
  },

  onReset: function() {
    this.stopWave()
    this.setData({
      step: 'import',
      ecgData: null,
      result: null,
      detecting: false,
      viewingHistory: false,
      historyNavIndex: -1,
      historyNavTotal: 0
    })
  },

  // 加载历史记录详情，并记录它在“最新→最早”列表中的位置。
  loadHistoryRecord: function(id) {
    var history = wx.getStorageSync('history') || []
    var sorted = history.slice().sort(function(a, b) { return b.timestamp - a.timestamp })
    var record = null
    var recordIndex = -1
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].id === id) {
        record = sorted[i]
        recordIndex = i
        break
      }
    }
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' })
      return
    }

    var probDisplay = []
    var probs = record.probabilities || []
    for (var j = 0; j < 5; j++) {
      var p = probs[j] || 0
      probDisplay.push({
        abbr: AAMI_CLASSES[j].abbr,
        name: AAMI_CLASSES[j].name,
        abnormal: AAMI_CLASSES[j].abnormal,
        color: AAMI_CLASSES[j].color,
        level: AAMI_CLASSES[j].level,
        percent: (p * 100).toFixed(2)
      })
    }

    var confPercent = record.confidencePercent || ((record.confidence || 0) * 100).toFixed(1)
    var classInfo = null
    for (var k = 0; k < AAMI_CLASSES.length; k++) {
      if (AAMI_CLASSES[k].abbr === record.classAbbr) {
        classInfo = AAMI_CLASSES[k]
        break
      }
    }

    this.stopWave()
    var self = this
    this.setData({
      step: 'result',
      ecgData: record.ecgData,
      result: {
        className: record.className,
        classAbbr: record.classAbbr,
        classDesc: record.classDesc || '',
        isAbnormal: record.isAbnormal,
        confidence: record.confidence
      },
      confidencePercent: confPercent,
      probDisplay: probDisplay,
      classInfo: classInfo,
      hasBatchNext: false,
      viewingHistory: true,
      historyNavIndex: recordIndex,
      historyNavTotal: sorted.length
    }, function() {
      // 置信度大数字滚动 (结果页编排: 图标pop-in → 数字滚动 → 概率条生长)
      self.animateConfidence(confPercent)
      setTimeout(function() {
        // 性能优化: 懒加载waveAnimator
        if (!waveAnimator) {
          waveAnimator = require('../../utils/waveAnimator.js')
        }
        self._wave = waveAnimator.start({
          page: self,
          canvasId: 'ecgResultCanvas',
          data: record.ecgData,
          style: 'full',
          pointsPerFrame: 5,
          loop: true,
          loopDelay: 700,
          hudLabel: 'ECG · ' + (record.classAbbr || '') + ' · 250Hz'
        })
      }, 100)
    })
  },

  // 历史浏览每次重新读取 ID，确保浏览过程中数据发生增删后导航仍按当前列表工作。
  getSortedHistoryIds: function() {
    var history = wx.getStorageSync('history') || []
    return history.slice().sort(function(a, b) { return b.timestamp - a.timestamp }).map(function(item) {
      return item.id
    })
  },

  // 上一条：列表中更靠前、时间更新的记录。
  onHistoryPrev: function() {
    var idx = this.data.historyNavIndex
    if (idx <= 0) return
    var ids = this.getSortedHistoryIds()
    if (ids[idx - 1]) this.loadHistoryRecord(ids[idx - 1])
  },

  // 下一条：列表中更靠后、时间更早的记录。
  onHistoryNext: function() {
    var idx = this.data.historyNavIndex
    if (idx < 0 || idx >= this.data.historyNavTotal - 1) return
    var ids = this.getSortedHistoryIds()
    if (ids[idx + 1]) this.loadHistoryRecord(ids[idx + 1])
  },

  onBackToHistory: function() {
    wx.switchTab({ url: '/pages/history/history' })
  }
})
