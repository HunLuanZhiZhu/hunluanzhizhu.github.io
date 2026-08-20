/* Auto-wrapped app.js — H5 适配版（单层包装） */
__defineModule("app.js", function(module, exports, require) {
// app.js — 心韵深辨小程序全局逻辑
// 负责: TF.js初始化、模型权重加载、全局状态管理
//
// 性能优化: TF.js和ecgModel改为延迟加载(在initTF/loadModel中require)
// 避免在App启动时同步加载大型库, 阻塞所有页面的首屏渲染

// 延迟加载的模块引用 (仅在首次调用initTF/loadModel时赋值)
var tf = null
var modelFns = null  // { loadWeights, predict }

// 权重元数据 (offset以字节为单位, loadWeights内部会除以2转为fp16元素偏移)
// 数据来源: code/tfjs_weights_meta.json (由 export_tfjs_weights.py 生成)
const WEIGHTS_META = {
  layers: [
    { name: 'snn_conv1d.conv1d.weight', shape: [128, 20, 5], offset: 0 },
    { name: 'snn_conv1d.conv1d.bias', shape: [128], offset: 25600 },
    { name: 'lstm.weight_ih_l0', shape: [512, 128], offset: 25856 },
    { name: 'lstm.weight_hh_l0', shape: [512, 128], offset: 156928 },
    { name: 'lstm.bias_ih_l0', shape: [512], offset: 288000 },
    { name: 'lstm.bias_hh_l0', shape: [512], offset: 289024 },
    { name: 'lstm.weight_ih_l0_reverse', shape: [512, 128], offset: 290048 },
    { name: 'lstm.weight_hh_l0_reverse', shape: [512, 128], offset: 421120 },
    { name: 'lstm.bias_ih_l0_reverse', shape: [512], offset: 552192 },
    { name: 'lstm.bias_hh_l0_reverse', shape: [512], offset: 553216 },
    { name: 'lstm.weight_ih_l1', shape: [512, 256], offset: 554240 },
    { name: 'lstm.weight_hh_l1', shape: [512, 128], offset: 816384 },
    { name: 'lstm.bias_ih_l1', shape: [512], offset: 947456 },
    { name: 'lstm.bias_hh_l1', shape: [512], offset: 948480 },
    { name: 'lstm.weight_ih_l1_reverse', shape: [512, 256], offset: 949504 },
    { name: 'lstm.weight_hh_l1_reverse', shape: [512, 128], offset: 1211648 },
    { name: 'lstm.bias_ih_l1_reverse', shape: [512], offset: 1342720 },
    { name: 'lstm.bias_hh_l1_reverse', shape: [512], offset: 1343744 },
    { name: 'fc.0.weight', shape: [256, 256], offset: 1344768 },
    { name: 'fc.0.bias', shape: [256], offset: 1475840 },
    { name: 'fc.2.weight', shape: [256], offset: 1476352 },
    { name: 'fc.2.bias', shape: [256], offset: 1476864 },
    { name: 'fc.2.running_mean', shape: [256], offset: 1477376 },
    { name: 'fc.2.running_var', shape: [256], offset: 1477888 },
    { name: 'fc.3.weight', shape: [128, 256], offset: 1478400 },
    { name: 'fc.3.bias', shape: [128], offset: 1543936 },
    { name: 'fc.6.weight', shape: [5, 128], offset: 1544192 },
    { name: 'fc.6.bias', shape: [5], offset: 1545472 }
  ]
}

// AAMI分类标签
const AAMI_CLASSES = [
  { idx: 0, abbr: 'F', name: '融合搏动', desc: 'Fusion beat', abnormal: true },
  { idx: 1, abbr: 'N', name: '正常心搏', desc: 'Normal beat', abnormal: false },
  { idx: 2, abbr: 'Q', name: '未知搏动', desc: 'Unclassifiable beat', abnormal: true },
  { idx: 3, abbr: 'S', name: '室上性早搏', desc: 'Supraventricular ectopic', abnormal: true },
  { idx: 4, abbr: 'V', name: '室性早搏', desc: 'Ventricular ectopic', abnormal: true }
]

// 五类心律分类统一颜色常量（与 app.wxss 变量保持一致）
// 各页面绘制 canvas/conic-gradient 时统一引用，避免颜色不一致
const CATEGORY_COLORS = {
  N: { light: '#10B981', dark: '#34D399', name: 'emerald' },  // 正常 → emerald
  S: { light: '#B45309', dark: '#FBBF24', name: 'amber' },    // 室上性 → amber
  V: { light: '#E11D48', dark: '#FB7185', name: 'rose' },     // 室性 → rose
  F: { light: '#F97316', dark: '#FB923C', name: 'coral' },    // 融合 → coral
  Q: { light: '#78909C', dark: '#64748B', name: 'slate' }     // 未分类 → slate
}

App({
  globalData: {
    weights: null,
    isModelReady: false,
    tfReady: false,
    modelLoading: false,
    pendingHistoryId: null,
    theme: 'light',  // 'light' or 'dark'
    categoryColors: CATEGORY_COLORS,  // 全局分类颜色常量，供各页面引用
    // 性能优化: 数据脏标记, 当检测/删除/档案变更时置为true
    // 各Tab页面onShow时检查此标记, 为false则跳过重计算和setData, 消除切换抖动
    dataDirty: true  // 初始为true, 确保首次加载时各页面正常计算数据
  },

  // 主题切换
  toggleTheme: function() {
    var newTheme = this.globalData.theme === 'dark' ? 'light' : 'dark'
    this.globalData.theme = newTheme
    wx.setStorageSync('theme', newTheme)
    // 主题变更后, 各页面需重新计算主题相关数据(如conic-gradient颜色)
    this.globalData.dataDirty = true
    // 同步设置导航栏和窗口背景色, 让 page 元素本身也变深色
    this.applyThemeColors(newTheme)
    // 通知所有页面更新 (H5: 事件总线广播，替代 getCurrentPages 遍历)
    if (window.__runtime && window.__runtime.broadcastTheme) {
      window.__runtime.broadcastTheme(newTheme)
    }
    return newTheme
  },

  // 应用主题颜色到系统UI (导航栏/窗口背景)
  // 深色模式背景色使用 #0B1120, 与 app.wxss 中 --warm 变量保持一致
  applyThemeColors: function(theme) {
    if (theme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#0B1120'
      })
      wx.setBackgroundColor({
        backgroundColor: '#0B1120',
        backgroundColorTop: '#0B1120',
        backgroundColorBottom: '#0B1120'
      })
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#F5F5F7'
      })
      wx.setBackgroundColor({
        backgroundColor: '#F5F5F7',
        backgroundColorTop: '#F5F5F7',
        backgroundColorBottom: '#F5F5F7'
      })
    }
  },

  // 初始化主题
  initTheme: function() {
    var saved = wx.getStorageSync('theme')
    if (saved) {
      this.globalData.theme = saved
    }
    this.applyThemeColors(this.globalData.theme)
    return this.globalData.theme
  },

  onLaunch() {
    console.log('心韵深辨小程序启动')
    this.initTheme()
    // 性能优化: TF.js初始化完全延迟到检测页首次显示时执行
    // 不在onLaunch中启动, 避免TF.js(~500KB)加载阻塞所有页面的首屏渲染
    // 由detect页面onLoad调用 app.ensureTFReady() 触发
  },

  // 供检测页调用的TF.js懒初始化入口 (仅首次调用时执行)
  ensureTFReady() {
    if (this.globalData.tfReady || this._tfInitializing) return
    this._tfInitializing = true
    var self = this
    // 延迟100ms执行, 让检测页首屏先完成渲染
    setTimeout(function() {
      self.initTF().catch(function(e) {
        console.error('TF.js初始化异常:', e)
      })
    }, 100)
  },

  // 初始化TF.js (延迟加载: 仅在此函数内部require TF.js库)
  async initTF() {
    try {
      // 性能优化: 在此延迟require, 避免App启动时同步加载TF.js(~500KB)阻塞页面渲染
      tf = require('@tensorflow/tfjs-core')
      require('@tensorflow/tfjs-backend-cpu')

      // H5: 浏览器原生 fetch/encode/decode，无需 polyfill 与 platform

      // 注册CPU后端并等待就绪
      await tf.setBackend('cpu')
      await tf.ready()
      this.globalData.tfReady = true
      console.log('TF.js初始化成功, 后端:', tf.getBackend())
    } catch (e) {
      console.error('TF.js初始化失败:', e)
      // 降级: 尝试直接设置
      try {
        await tf.setBackend('cpu')
        this.globalData.tfReady = true
        console.log('TF.js降级初始化成功')
      } catch (e2) {
        console.error('TF.js完全失败:', e2)
      }
    }
  },

  // 加载模型权重
  async loadModel() {
    if (this.globalData.isModelReady) return this.globalData.weights
    if (this.globalData.modelLoading) {
      while (this.globalData.modelLoading) {
        await new Promise(r => setTimeout(r, 100))
      }
      return this.globalData.weights
    }

    this.globalData.modelLoading = true

    try {
      // H5: 权重直接从静态资源 fetch 加载，删除 ZIP 解压/文件系统缓存链路
      const res = await fetch('assets/weights_fp16.bin')
      if (!res.ok) throw new Error('权重下载失败: HTTP ' + res.status)
      const buffer = await res.arrayBuffer()
      console.log('权重加载, buffer size:', buffer.byteLength)

      // 性能优化: 延迟require ecgModel (内部依赖TF.js, 与initTF共用缓存的tf模块)
      if (!modelFns) {
        modelFns = require('./utils/ecgModel')
      }
      this.globalData.weights = modelFns.loadWeights(buffer, WEIGHTS_META)
      this.globalData.isModelReady = true
      console.log('模型权重加载完成')

      return this.globalData.weights
    } catch (e) {
      console.error('模型加载失败:', e)
      throw e
    } finally {
      this.globalData.modelLoading = false
    }
  },

  // 执行推理
  async runInference(ecgData) {
    const weights = await this.loadModel()
    const result = await modelFns.predict(ecgData, weights)

    // 调试: 打印原始tensor数据
    const probsData = result.probs.dataSync()
    const logitsData = result.logits.dataSync()
    console.log('[推理] logits:', Array.from(logitsData))
    console.log('[推理] probsData:', Array.from(probsData))
    console.log('[推理] probsData类型:', Object.prototype.toString.call(probsData), '长度:', probsData.length)

    let maxIdx = 0
    let maxProb = probsData[0]
    for (let i = 1; i < 5; i++) {
      if (probsData[i] > maxProb) {
        maxProb = probsData[i]
        maxIdx = i
      }
    }
    console.log('[推理] maxIdx:', maxIdx, 'maxProb:', maxProb)

    const cls = AAMI_CLASSES[maxIdx]

    // 转为普通数组 (确保不是TypedArray)
    const probsArr = []
    for (let i = 0; i < probsData.length; i++) {
      probsArr.push(Number(probsData[i]))
    }
    const logitsArr = []
    for (let i = 0; i < logitsData.length; i++) {
      logitsArr.push(Number(logitsData[i]))
    }

    result.logits.dispose()
    result.probs.dispose()

    return {
      classIdx: maxIdx,
      classAbbr: cls.abbr,
      className: cls.name,
      classDesc: cls.desc,
      isAbnormal: cls.abnormal,
      confidence: Number(maxProb),
      probabilities: probsArr,
      logits: logitsArr
    }
  }
})

});
