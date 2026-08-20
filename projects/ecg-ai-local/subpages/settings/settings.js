// pages/settings/settings.js — 设置页面
// 从"我的"页拆分出的设置功能集中管理
// 包含: 数据管理、系统设置、技术架构

const app = getApp()
// 性能优化: 延迟加载exportHelper(3.9KB), 仅在导出时才加载
var exportHelper = null

Page({
  data: {
    modelStatusText: '未加载',
    theme: 'light',
    // 存储用量: {text: 大小文本, percent: 占比%} (wx.getStorageInfoSync 真实数据)
    cacheSize: { text: '计算中...', percent: 0 }
  },

  onLoad: function() {
    // 性能优化: 合并theme和cacheSize为一次setData, 并标记首次加载
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)
    var cacheSize = this.calcCacheSize()
    this.setData({ theme: app.globalData.theme, cacheSize: cacheSize })
  },

  // S10: 使用 wx.getStorageInfoSync() 获取完整存储占用(含模型权重等)
  // 2026-08-10: 返回 {text, percent} 对象, 供存储用量进度条展示
  // 性能优化: 返回计算结果, 由调用方合并setData
  calcCacheSize: function() {
    try {
      var info = wx.getStorageInfoSync()
      var totalKB = info.currentSize  // currentSize 单位为 KB
      var sizeText = totalKB > 1024 ? (totalKB / 1024).toFixed(1) + 'MB' : totalKB + 'KB'
      var limitKB = info.limitSize || 10240  // 兜底10MB
      var percent = Math.min(100, Math.round(totalKB / limitKB * 100))
      return { text: sizeText, percent: percent }
    } catch(e) {
      return { text: '未知', percent: 0 }
    }
  },

  onPrivacyPolicy: function() {
    wx.showModal({
      title: '隐私政策',
      content: '心韵深辨所有心电数据均在本地处理，不上传至任何服务器。检测结果仅存储在您的设备中，您可以随时清除。我们不会收集、使用或分享您的任何个人健康数据。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // v3优化: 仅必要时setData(主题变化/首次)
  // 加固: theme校验放在_firstShow判断之前, 无条件兜底同步(防御性修复深色模式偶发不同步)
  onShow() {
    app.applyThemeColors(app.globalData.theme)
    // 主题不一致时立即同步(合并modelStatus避免双次渲染)
    if (this.data.theme !== app.globalData.theme) {
      this.setData({ theme: app.globalData.theme, modelStatusText: this.getModelStatusText() })
    } else {
      // modelStatus在每个onShow都检查(可能后台加载完成)
      this.setData({ modelStatusText: this.getModelStatusText() })
    }
    if (this._firstShow) {
      this._firstShow = false
    }
  },

  updateTheme(theme) {
    this.setData({ theme: theme })
  },

  // 切换深浅主题
  onToggleTheme() {
    var newTheme = app.toggleTheme()
    this.setData({ theme: newTheme })
  },

  // 检查模型状态 — 返回状态文本, 由调用方合并setData
  // 性能优化: 原checkModelStatus直接调用setData, 现改为返回数据避免独立渲染
  getModelStatusText() {
    const g = app.globalData
    if (g.isModelReady) {
      return '已就绪 ✓'
    } else if (g.modelLoading) {
      return '加载中...'
    } else {
      return '未加载'
    }
  },

  // 导出历史记录
  onExportHistory() {
    // 延迟加载exportHelper, 首次导出时才加载模块
    if (!exportHelper) exportHelper = require('../../../utils/exportHelper.js')
    var history = wx.getStorageSync('history') || []
    exportHelper.exportAndShare(history)
  },

  // 清空历史
  onClearHistory() {
    wx.showModal({
      title: '清空历史记录',
      content: '确定删除所有检测记录吗？此操作不可撤销。',
      confirmColor: '#E11D48',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('history')
          // 数据已变更, 标记脏位让Tab页面onShow时重新计算
          app.globalData.dataDirty = true
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // 重新加载模型
  async onReloadModel() {
    if (app.globalData.modelLoading) {
      wx.showToast({ title: '正在加载中...', icon: 'none' })
      return
    }

    // 清除缓存, 强制重新加载
    app.globalData.isModelReady = false
    app.globalData.weights = null

    try {
      const fs = wx.getFileSystemManager()
      // 删除缓存的权重文件
      try { fs.unlinkSync(`${wx.env.USER_DATA_PATH}/weights.bin`) } catch (e) {}
      try { fs.unlinkSync(`${wx.env.USER_DATA_PATH}/model.zip`) } catch (e) {}
      try { fs.unlinkSync(`${wx.env.USER_DATA_PATH}/model_dir`, true) } catch (e) {}

      wx.showLoading({ title: '加载模型中...' })
      this.setData({ modelStatusText: '加载中...' })
      await app.loadModel()
      wx.hideLoading()
      this.setData({ modelStatusText: '已就绪 ✓' })
      wx.showToast({ title: '模型已加载', icon: 'success' })
    } catch (e) {
      wx.hideLoading()
      this.setData({ modelStatusText: '加载失败' })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 关于
  onAbout() {
    wx.showModal({
      title: '心韵深辨',
      content: '基于分数阶优化算法与时间卷积网络（TCN）的智能心电检测小程序。\n\n采用 TensorFlow.js 在本地完成推理，模型权重 FP16 量化压缩至 1.4MB，无需上传数据至服务器，保护用户隐私。\n\n版本: 2.0.0',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // S8: 分类清除 — 只清除检测记录和个人档案,保留模型权重和主题偏好
  onClearAllData() {
    wx.showModal({
      title: '清除所有数据',
      content: '将清除所有检测记录和个人档案，恢复为初始状态。模型权重和主题偏好将被保留。此操作不可撤销。',
      confirmText: '清除',
      confirmColor: '#E11D48',
      success: (res) => {
        if (res.confirm) {
          // S8: 分类清除 — 只清除 'history' 和 'userInfo',保留模型权重和主题
          wx.removeStorageSync('history')
          wx.removeStorageSync('userInfo')
          app.globalData.userInfo = null
          // 数据已变更, 标记脏位让Tab页面onShow时重新计算
          app.globalData.dataDirty = true
          wx.showToast({ title: '已清除', icon: 'success' })
          // 刷新存储大小显示 (calcCacheSize现在返回值, 需手动setData)
          this.setData({ cacheSize: this.calcCacheSize() })
        }
      }
    })
  }
})
