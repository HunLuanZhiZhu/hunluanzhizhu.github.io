/* Auto-wrapped by tools/wrap-cjs.js — 原代码未改动 */
__defineModule("pages/science/science.js", function(module, exports, require) {
// pages/science/science.js — 心电科普页逻辑
// 修改记录:
// Sc3: 分类数据统一使用全局颜色变量名(accentClass/iconClass)
// Sc7: 文章封面图标统一为中文字符风格
// Sc9: 搜索添加 300ms 防抖 + 无结果空状态
// Sc11: 波形动画传入自定义颜色(浅色模式用 var(--inp) 背景 + var(--teal) 波形)
// Sc-R1: 修复搜索栏 — 移除受控value绑定, 避免输入冲突
// Sc-R2: 5类波形动画统一启用, 每类使用不同颜色
// Sc-R3: 文章封面统一中文字符 + 背景色
// Sc-R4: 轮播图使用渐变背景替代黑色画布

var app = getApp()
// 性能优化: 延迟加载ecgSamples(10.2KB)和waveAnimator(11.4KB)
var ecgSamples = null
var waveAnimator = null

Page({
  data: {
    theme: 'light',
    activeCategory: '全部',
    filteredArticles: [],
    searchKeyword: '',
    // 精选科普轮播 (3篇, 点击跳转文章详情)
    // Sc-R4: 每篇轮播使用对应主题的渐变背景
    // 2026-08-20: 封面图转回 JPG(q78, 103KB)以保证旧机型兼容; 原 WebP 体积略小但兼容性不足
    featuredArticles: [
      { id: 1, category: '心律基础', title: '什么是窦性心律？', desc: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟。', coverImage: '/assets/feature-sinus.jpg' },
      { id: 2, category: '异常解读', title: '室性早搏有多危险？', desc: '起源于心室肌的提前搏动，QRS波群宽大畸形，频发需警惕器质性心脏病。', coverImage: '/assets/feature-pvc.jpg' },
      { id: 7, category: '新技术', title: '人工智能在心电图诊断中的应用', desc: '深度学习模型在心电分类任务中已达到甚至超过心内科专家的准确率。', coverImage: '/assets/feature-ai.jpg' }
    ],
    featureIndex: 0,      // 轮播当前页 (指示器高亮)
    showBackTop: false,   // 返回顶部按钮显隐
    // Sc7: 文章封面图标统一为中文字符风格
    articles: [
      { id: 1, title: '什么是窦性心律？', category: '心律基础', cover: 'teal', iconText: '窦', desc: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟。P波、QRS波群和T波形态正常。', author: '心韵深辨', time: '3天前', readTime: '5分钟' },
      { id: 2, title: '室性早搏有多危险？', category: '异常解读', cover: 'rose', iconText: '室', desc: '起源于心室肌的提前搏动，QRS波群宽大畸形，时限超过120ms。频发需警惕器质性心脏病。', author: '心韵深辨', time: '5天前', readTime: '6分钟' },
      { id: 3, title: '心电图的PQRST波群', category: '心律基础', cover: 'violet', iconText: '波', desc: '一次完整心搏由P波、QRS波群和T波组成，各自反映心脏不同部位的电活动与传导过程。', author: '心韵深辨', time: '1周前', readTime: '7分钟' },
      { id: 4, title: '心房颤动：最常见的持续性心律失常', category: '异常解读', cover: 'indigo', iconText: '颤', desc: '房颤时心房失去有效收缩，频率可达350-600次/分，血栓风险显著增加，需规范抗凝治疗。', author: '心韵深辨', time: '1周前', readTime: '8分钟' },
      { id: 5, title: '动态心电图（Holter）检测指南', category: '检测指南', cover: 'emerald', iconText: '动', desc: '24小时动态心电图可捕捉偶发性心律失常，记录日常活动下的心电变化，是重要的诊断工具。', author: '心韵深辨', time: '2周前', readTime: '5分钟' },
      { id: 6, title: '运动与心脏健康：科学运动指南', category: '健康建议', cover: 'teal', iconText: '运', desc: '规律的中等强度有氧运动可降低心血管疾病风险30%-50%，每周建议150分钟以上。', author: '心韵深辨', time: '2周前', readTime: '6分钟' },
      { id: 7, title: '人工智能在心电图诊断中的应用', category: '新技术', cover: 'cyan', iconText: '智', desc: '深度学习模型在心电分类任务中已达到甚至超过心内科专家的准确率，TPR超过95%。', author: '心韵深辨', time: '3周前', readTime: '7分钟' },
      { id: 8, title: '窦性心动过缓需要治疗吗？', category: '异常解读', cover: 'violet', iconText: '缓', desc: '心率低于60次/分即为窦性心动过缓。运动员常见生理性心动过缓，但病理性需评估。', author: '心韵深辨', time: '3周前', readTime: '5分钟' },
      { id: 9, title: '心电图导联系统详解', category: '心律基础', cover: 'indigo', iconText: '导', desc: '标准12导联心电图从不同角度记录心脏电活动，肢体导联与胸导联各有侧重。', author: '心韵深辨', time: '1月前', readTime: '8分钟' },
      { id: 10, title: '如何看懂你的心电图报告', category: '检测指南', cover: 'emerald', iconText: '读', desc: '心率、心律、电轴、间期、ST-T改变——掌握这五个维度，快速理解心电图报告核心内容。', author: '心韵深辨', time: '1月前', readTime: '6分钟' }
    ],
    // Sc3: AAMI 分类卡数据 — 统一使用全局颜色变量名
    categories: [
      {
        key: 'N', name: '正常心搏', enName: 'Normal Beat', type: 'normal',
        accentClass: 'card-accent-emerald', iconClass: 'category-icon-emerald',
        desc: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟范围内。',
        features: ['窦性节律', 'PR间期正常', 'QRS形态正常']
      },
      {
        key: 'S', name: '室上性早搏', enName: 'Supraventricular Ectopic', type: 'abnormal',
        accentClass: 'card-accent-amber', iconClass: 'category-icon-amber',
        desc: '异位起搏点位于房室结以上区域的提前搏动。',
        features: ['提前出现', 'QRS波群变窄', '代偿间歇不完全']
      },
      {
        key: 'V', name: '室性早搏', enName: 'Ventricular Ectopic', type: 'abnormal',
        accentClass: 'card-accent-rose', iconClass: 'category-icon-rose',
        desc: '起源于心室肌的提前搏动，QRS波群宽大畸形。',
        features: ['QRS宽大畸形', 'T波方向相反', '代偿间歇完全']
      },
      {
        key: 'F', name: '融合搏动', enName: 'Fusion Beat', type: 'abnormal',
        accentClass: 'card-accent-coral', iconClass: 'category-icon-coral',
        desc: '正常心搏与室性异位搏动融合产生的波形。',
        features: ['形态介于二者间', 'PR间期缩短', '多见于室性并行心律']
      },
      {
        key: 'Q', name: '未知搏动', enName: 'Unknown Beat', type: 'unclassified',
        accentClass: '', iconClass: 'category-icon-slate',
        desc: '因信号质量差或形态不典型而无法分类的搏动。',
        features: ['信号质量差', '噪声干扰', '形态不典型']
      }
    ]
  },

  onLoad: function() {
    // 性能优化: 首次加载时设置数据和启动波形动画
    app.applyThemeColors(app.globalData.theme)
    this.setData({ theme: app.globalData.theme, filteredArticles: this.data.articles })
    // 波形动画仅在首次加载时启动, 后续onShow不重启
    // Sc-R5: 延迟增至800ms, 确保所有canvas节点已挂载
    var self = this
    this._waveAnimTimer = setTimeout(function() {
      self.startAllWaveAnimations()
    }, 800)
  },

  onShow() {
    // === TabBar选中态同步 ===
    var tabBar = typeof this.getTabBar === 'function' && this.getTabBar()
    if (tabBar) {
      tabBar.updateSelected(2)
      tabBar.updateTheme(app.globalData.theme)
    }

    // 同步页面背景色
    app.applyThemeColors(app.globalData.theme)

    // 同步主题
    if (this.data.theme !== app.globalData.theme) {
      this.setData({ theme: app.globalData.theme })
    }

    // 修复: 每次显示页面时重启波形动画, 确保从其他Tab返回后波形可见
    // 原逻辑仅在主题变更时重启, 导致页面切回后波形可能丢失
    this.stopAllAnimations()
    if (this._onShowTimer) clearTimeout(this._onShowTimer)
    var self = this
    this._onShowTimer = setTimeout(function() {
      self._onShowTimer = null
      self.startAllWaveAnimations()
    }, 300)
  },

  onUnload() {
    this.stopAllAnimations()
    if (this._onShowTimer) {
      clearTimeout(this._onShowTimer)
      this._onShowTimer = null
    }
  },

  onHide() {
    // 不停止动画, 避免onShow时重新初始化canvas
  },

  updateTheme(theme) {
    this.setData({ theme: theme })
  },

  // 启动分类卡片波形动画 (统一使用 waveAnimator, mini风格)
  // Sc-R2: 5类波形动画统一启用, 每类使用不同颜色
  // Sc-R5: 错开启动时间, 避免同时创建5个canvas查询导致渲染失败
  startAllWaveAnimations() {
    this.stopAllAnimations()
    if (!ecgSamples) ecgSamples = require('../../utils/ecgSamples.js')
    if (!waveAnimator) waveAnimator = require('../../utils/waveAnimator.js')
    var self = this
    this._waves = []
    this._waveStartTimers = []
    var isDark = app.globalData.theme === 'dark'
    var bgColor = isDark ? '#334155' : '#F1F5F9'

    // 5类波形各自使用对应颜色, 浅色/深色模式分别配色
    var waveConfigs = {
      'N': { color: isDark ? '#34D399' : '#10B981' },  // emerald — 正常心搏
      'S': { color: isDark ? '#FBBF24' : '#F59E0B' },  // amber — 室上性早搏
      'V': { color: isDark ? '#FB7185' : '#E11D48' },  // rose — 室性早搏
      'F': { color: isDark ? '#FB923C' : '#F97316' },  // coral — 融合搏动
      'Q': { color: isDark ? '#94A3B8' : '#64748B' }   // slate — 未知搏动
    }

    var classes = ['N', 'S', 'V', 'F', 'Q']
    // Sc-R5: 每个波形延迟120ms启动, 避免同时查询canvas导致冲突
    classes.forEach(function(cls, index) {
      var timer = setTimeout(function() {
        if (self._waveStopped) return
        var sample = ecgSamples.getSampleByAbbr(cls)
        if (!sample) return
        var config = waveConfigs[cls]
        var controller = waveAnimator.start({
          page: self,
          canvasId: 'waveCanvas_' + cls,
          data: sample.data,
          style: 'mini',
          pointsPerFrame: 5,
          loop: true,
          loopDelay: 700,
          bgColor: bgColor,
          waveColor: config.color
        })
        self._waves.push(controller)
      }, index * 120)
      self._waveStartTimers.push(timer)
    })
  },

  stopAllAnimations: function() {
    // 设置停止标志, 阻止尚未启动的定时器回调
    this._waveStopped = true
    if (this._waveAnimTimer) {
      clearTimeout(this._waveAnimTimer)
      this._waveAnimTimer = null
    }
    // Sc-R5: 清除错开启动的定时器
    if (this._waveStartTimers) {
      for (var t = 0; t < this._waveStartTimers.length; t++) {
        clearTimeout(this._waveStartTimers[t])
      }
      this._waveStartTimers = []
    }
    // 同步停止所有正在运行的动画控制器
    if (this._waves) {
      for (var i = 0; i < this._waves.length; i++) {
        this._waves[i].stop()
      }
    }
    this._waves = []
    // 修复: 立即重置标志, 不再延迟50ms
    // 原延迟50ms会导致 startAllWaveAnimations 中 index*120 的第一个定时器(0ms)
    // 在 _waveStopped 仍为 true 时触发, 从而跳过第一个波形(N)的启动
    this._waveStopped = false
  },

  // 点击分类标签或分类卡片
  onCategoryTap: function(e) {
    var cat = e.currentTarget.dataset.category
    if (cat !== undefined) {
      this.setData({ activeCategory: cat })
      this.filterArticles()
      return
    }
    var key = e.currentTarget.dataset.key
    if (key !== undefined) {
      wx.navigateTo({ url: '/subpackages/extra/category-detail/category-detail?key=' + key })
    }
  },

  // Sc-R1: 搜索输入 — 使用setData更新关键字(清空按钮需要响应式显隐)
  // 不绑定value到input, 避免受控输入导致的光标跳动
  onSearchInput: function(e) {
    var keyword = e.detail.value
    this.setData({ searchKeyword: keyword })
    if (this._searchTimer) {
      clearTimeout(this._searchTimer)
    }
    var that = this
    this._searchTimer = setTimeout(function() {
      that.filterArticles()
    }, 300)
  },

  // 清空搜索
  onSearchClear: function() {
    this.setData({ searchKeyword: '' })
    this.filterArticles()
  },

  filterArticles: function() {
    var articles = this.data.articles
    var cat = this.data.activeCategory
    var kw = (this.data.searchKeyword || '').toLowerCase().trim()
    if (cat !== '全部') {
      articles = articles.filter(function(a) { return a.category === cat })
    }
    if (kw) {
      articles = articles.filter(function(a) {
        return a.title.toLowerCase().indexOf(kw) > -1 || a.desc.toLowerCase().indexOf(kw) > -1
      })
    }
    this.setData({ filteredArticles: articles })
  },

  onArticleTap: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/subpackages/extra/info-detail/info-detail?type=article&id=' + id })
  },

  // === 精选轮播交互 ===
  onFeatureChange: function(e) {
    var current = e.detail.current
    if (this.data.featureIndex !== current) {
      this.setData({ featureIndex: current })
    }
  },

  onFeatureDot: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({ featureIndex: index })
  },

  onFeaturedTap: function(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/subpackages/extra/info-detail/info-detail?type=article&id=' + id })
  },

  // === 返回顶部 ===
  onPageScroll: function(e) {
    var show = e.scrollTop > 400
    if (this.data.showBackTop !== show) {
      this.setData({ showBackTop: show })
    }
  },

  onBackTop: function() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  },

  onShareAppMessage() {
    return {
      title: '心韵深辨 — 心电科普',
      path: '/pages/science/science'
    };
  }
})

});
