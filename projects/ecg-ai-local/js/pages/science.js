// js/pages/science.js — 心电科普页 (H5)
// 来源: pages/science/science.js + science.wxml
// 同步: 小程序 logo-card 精炼文案、search+chip、精选轮播 image+mask、色卡速查条、分类卡装饰条、健康提示 warning 分色、返回顶部
// H5 差异: swiper → div.carousel (原生 JS 切换，保留 image+mask 结构)

import { globalData } from '../app.js'
import { navigateTo } from '../router.js'
import { getSampleByAbbr } from '../utils/ecgSamples.js'
import * as waveAnimator from '../utils/waveAnimator.js'

// 与小程序 science.js 完全一致的 featured / articles / categories
const FEATURED = [
  { id: 1, category: '心律基础', title: '什么是窦性心律？', desc: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟。', coverImage: 'assets/feature-sinus.jpg' },
  { id: 2, category: '异常解读', title: '室性早搏有多危险？', desc: '起源于心室肌的提前搏动，QRS波群宽大畸形，频发需警惕器质性心脏病。', coverImage: 'assets/feature-pvc.jpg' },
  { id: 7, category: '新技术', title: '人工智能在心电图诊断中的应用', desc: '深度学习模型在心电分类任务中已达到甚至超过心内科专家的准确率。', coverImage: 'assets/feature-ai.jpg' }
]

const ARTICLES = [
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
]

const CATEGORIES = [
  { key: 'N', name: '正常心搏', enName: 'Normal Beat', accentClass: 'card-accent-emerald', iconClass: 'category-icon-emerald', desc: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟范围内。', features: ['窦性节律', 'PR间期正常', 'QRS形态正常'] },
  { key: 'S', name: '室上性早搏', enName: 'Supraventricular Ectopic', accentClass: 'card-accent-amber', iconClass: 'category-icon-amber', desc: '异位起搏点位于房室结以上区域的提前搏动。', features: ['提前出现', 'QRS波群变窄', '代偿间歇不完全'] },
  { key: 'V', name: '室性早搏', enName: 'Ventricular Ectopic', accentClass: 'card-accent-rose', iconClass: 'category-icon-rose', desc: '起源于心室肌的提前搏动，QRS波群宽大畸形。', features: ['QRS宽大畸形', 'T波方向相反', '代偿间歇完全'] },
  { key: 'F', name: '融合搏动', enName: 'Fusion Beat', accentClass: 'card-accent-coral', iconClass: 'category-icon-coral', desc: '正常心搏与室性异位搏动融合产生的波形。', features: ['形态介于二者间', 'PR间期缩短', '多见于室性并行心律'] },
  { key: 'Q', name: '未知搏动', enName: 'Unknown Beat', accentClass: '', iconClass: 'category-icon-slate', desc: '因信号质量差或形态不典型而无法分类的搏动。', features: ['信号质量差', '噪声干扰', '形态不典型'] }
]

const CHIP_CATEGORIES = ['全部', '心律基础', '检测指南', '健康建议', '异常解读', '新技术']

const state = {
  theme: 'light',
  activeCategory: '全部',
  searchKeyword: '',
  filteredArticles: ARTICLES.slice(),
  featureIndex: 0,
  showBackTop: false
}
let root = null
let _waves = []
let _featTimer = null
let _searchTimer = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-science dark' : 'container page-science'
}

function filterArticles() {
  let list = ARTICLES
  const cat = state.activeCategory
  const kw = (state.searchKeyword || '').toLowerCase().trim()
  if (cat !== '全部') list = list.filter(a => a.category === cat)
  if (kw) list = list.filter(a => a.title.toLowerCase().includes(kw) || a.desc.toLowerCase().includes(kw))
  state.filteredArticles = list
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'

  // page-head + logo-card (与小程序 science.wxml 精炼文案一致)
  html += '<div class="page-head fade-in-up"><div class="page-eyebrow">知识库</div><div class="page-title">心律科普</div></div>'
  html += '<div class="logo-card fade-in-up-d1"><img class="logo-card-img" src="assets/logo.jpg" alt="logo" /><div class="logo-card-text"><div class="logo-card-title">心韵深辨</div><div class="logo-card-sub">从P波到T波 · 一站式读懂你的心电图</div></div></div>'

  // 搜索 + 芯片
  html += '<div class="search-bar fade-in-up-d1"><div class="search-bar-icon-css"></div><input class="search-bar-input" placeholder="搜索科普文章" value="' + escAttr(s.searchKeyword) + '" data-search-input /><div class="search-clear" data-search-clear style="' + (s.searchKeyword ? '' : 'display:none') + '">✕</div></div>'
  html += '<div class="chip-row">' + CHIP_CATEGORIES.map(c => '<div class="chip ' + (s.activeCategory === c ? 'active' : '') + '" data-chip="' + c + '">' + c + '</div>').join('') + '</div>'

  // 精选轮播 — image + mask 方案（与小程序 science.wxml 一致，不用 background-image）
  html += '<div class="feature-swiper-wrap fade-in-up-d1"><div class="feature-swiper" data-feature-swiper>'
  FEATURED.forEach((item, idx) => {
    const active = idx === s.featureIndex ? ' active' : ''
    html += '<div class="feature-slide' + active + '" data-feature-id="' + item.id + '" data-slide-idx="' + idx + '">'
    html += '<div class="feature-slide-cover">'
    html += '<img class="feature-slide-bg" src="' + item.coverImage + '" alt="' + escAttr(item.title) + '" loading="lazy" />'
    html += '<div class="feature-slide-mask"></div>'
    html += '<div class="feature-slide-content">'
    html += '<div class="feature-slide-tag">精选 · ' + item.category + '</div>'
    html += '<div class="feature-slide-title">' + item.title + '</div>'
    html += '<div class="feature-slide-desc">' + item.desc + '</div>'
    html += '<div class="feature-slide-cta">阅读文章 ›</div>'
    html += '</div></div></div>'
  })
  html += '</div>'
  html += '<div class="feature-dots">' + FEATURED.map((_, i) => '<div class="feature-dot ' + (s.featureIndex === i ? 'active' : '') + '" data-feature-dot="' + i + '"></div>').join('') + '</div>'
  html += '</div>'

  // 科普文章
  html += '<div class="sec fade-in-up-d3"><div class="sec-title">科普文章</div></div>'
  if (s.filteredArticles.length === 0) {
    html += '<div class="empty-state ecg-bg-line"><div class="empty-icon empty-icon-text">阅</div><div class="empty-text">暂无文章</div><div class="empty-subtext">没有找到匹配的科普文章，试试其他关键词</div></div>'
  } else {
    s.filteredArticles.forEach((item, index) => {
      const delay = (0.08 + Math.min(index, 5) * 0.035).toFixed(3)
      html += '<div class="article-card stagger-item" data-article-id="' + item.id + '" style="animation-delay:' + delay + 's">'
      html += '<div class="article-cover article-cover-' + item.cover + '"><div class="article-cover-tag">' + item.category + '</div>' + item.iconText + '</div>'
      html += '<div class="article-body"><div class="article-title">' + item.title + '</div><div class="article-desc">' + item.desc + '</div><div class="article-foot"><span class="article-author">' + item.author + '</span><span class="article-time">' + item.readTime + '阅读 · ' + item.time + '</span></div></div>'
      html += '</div>'
    })
  }

  // AAMI 分类标题 + 色卡速查条
  html += '<div class="sec fade-in-up-d4"><div class="sec-title">AAMI 心律失常分类</div></div>'
  html += '<div class="card legend-strip-card fade-in-up-d4">' + CATEGORIES.map(item => '<div class="legend-strip"><div class="legend-strip-dot legend-dot-' + item.key + '"></div><div class="legend-strip-abbr">' + item.key + '</div><div class="legend-strip-name">' + item.name + '</div></div>').join('') + '</div>'

  // AAMI 分类卡（带装饰条 + 波形 canvas）
  CATEGORIES.forEach((item, index) => {
    const delay = (0.06 + Math.min(index, 5) * 0.035).toFixed(3)
    html += '<div class="card category-card stagger-item ' + item.accentClass + '" data-category-key="' + item.key + '" style="animation-delay:' + delay + 's">'
    html += '<div class="category-header"><div class="category-icon-wrap ' + item.iconClass + '">' + item.key + '</div><div class="category-name-wrap"><div class="category-name">' + item.name + '</div><div class="category-en-name">' + item.enName + '</div></div></div>'
    html += '<div class="category-wave-bg"><canvas id="waveCanvas_' + item.key + '" class="category-wave-canvas"></canvas></div>'
    html += '<div class="category-desc">' + item.desc + '</div>'
    html += '</div>'
  })

  // 健康提示 — 3条用 teal/info，第4条警示用 amber/warning（与小程序 Sc5/Sc6 一致）
  html += '<div class="card health-tip health-tip-info"><div class="health-tip-dot health-tip-dot-info">i</div><div class="health-tip-content"><div class="health-tip-title">健康提示</div><div class="health-tip-text">01 定期进行心电检查，尤其是40岁以上人群及有心血管疾病家族史者</div><div class="health-tip-text">02 保持规律作息与适度运动，避免过度劳累和情绪波动</div><div class="health-tip-text">03 如出现心悸、胸闷、头晕等不适症状，应及时就医并做心电图检查</div></div></div>'
  html += '<div class="card health-tip health-tip-warning"><div class="health-tip-dot health-tip-dot-warning">!</div><div class="health-tip-content"><div class="health-tip-title">免责声明</div><div class="health-tip-text">本应用检测结果仅供参考，不能替代专业医疗诊断</div></div></div>'

  html += '<div class="footer-text">心韵深辨 · 用心感知，以智辨析</div>'
  html += '<div class="back-top ' + (s.showBackTop ? 'show' : '') + '" data-back-top><div class="back-top-icon">↑</div></div>'
  html += '</div>'
  root.innerHTML = html
  bindEvents()
  // 波形需在 DOM 挂载后启动
  setTimeout(startAllWaveAnimations, 80)
  startFeaturedAutoPlay()
}

let _waveTimers = []
function startAllWaveAnimations() {
  stopAllAnimations()
  _waves = []
  _waveTimers = []
  const isDark = globalData.theme === 'dark'
  const bgColor = isDark ? '#334155' : '#F1F5F9'
  const waveConfigs = {
    N: { color: isDark ? '#34D399' : '#10B981' },
    S: { color: isDark ? '#FBBF24' : '#F59E0B' },
    V: { color: isDark ? '#FB7185' : '#E11D48' },
    F: { color: isDark ? '#FB923C' : '#F97316' },
    Q: { color: isDark ? '#94A3B8' : '#64748B' }
  }
  let stopped = false
  CATEGORIES.forEach((cat, index) => {
    const t = setTimeout(() => {
      if (stopped) return
      const sample = getSampleByAbbr(cat.key)
      if (!sample) return
      const cfg = waveConfigs[cat.key]
      const ctl = waveAnimator.start({
        canvasId: 'waveCanvas_' + cat.key,
        data: sample.data,
        style: 'mini',
        pointsPerFrame: 5,
        loop: true,
        loopDelay: 700,
        bgColor, waveColor: cfg.color
      })
      _waves.push(ctl)
    }, index * 120)
    _waveTimers.push(t)
  })
  // 暴露停止标记，供 onShow 复用
  startAllWaveAnimations._stoppedRef = { get: () => stopped, set: v => { stopped = v } }
}

function stopAllAnimations() {
  if (startAllWaveAnimations._stoppedRef) startAllWaveAnimations._stoppedRef.set(true)
  _waveTimers.forEach(t => clearTimeout(t))
  _waveTimers = []
  _waves.forEach(w => { try { w.stop() } catch (e) {} })
  _waves = []
  stopFeaturedAutoPlay()
}

function startFeaturedAutoPlay() {
  stopFeaturedAutoPlay()
  _featTimer = setInterval(() => {
    state.featureIndex = (state.featureIndex + 1) % FEATURED.length
    syncFeatureSlide()
  }, 4000)
}

function stopFeaturedAutoPlay() {
  if (_featTimer) { clearInterval(_featTimer); _featTimer = null }
}

function syncFeatureSlide() {
  if (!root) return
  root.querySelectorAll('[data-slide-idx]').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.slideIdx, 10) === state.featureIndex)
  })
  root.querySelectorAll('[data-feature-dot]').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.featureDot, 10) === state.featureIndex)
  })
}

function bindEvents() {
  if (!root) return
  // 搜索输入（300ms 防抖，与小程序一致）
  const input = root.querySelector('[data-search-input]')
  if (input) {
    input.addEventListener('input', e => {
      state.searchKeyword = e.target.value
      // 同步清空按钮显隐
      const clearBtn = root.querySelector('[data-search-clear]')
      if (clearBtn) clearBtn.style.display = state.searchKeyword ? '' : 'none'
      if (_searchTimer) clearTimeout(_searchTimer)
      _searchTimer = setTimeout(() => { filterArticles(); render() }, 300)
    })
  }
  const clearBtn = root.querySelector('[data-search-clear]')
  if (clearBtn) clearBtn.addEventListener('click', () => {
    state.searchKeyword = ''
    filterArticles(); render()
  })
  root.querySelectorAll('[data-chip]').forEach(el => {
    el.addEventListener('click', () => {
      state.activeCategory = el.dataset.chip
      filterArticles(); render()
    })
  })
  // 精选点击 / 指示点
  root.querySelectorAll('[data-feature-id]').forEach(el => {
    el.addEventListener('click', () => navigateTo('info-detail?type=article&id=' + el.dataset.featureId))
  })
  root.querySelectorAll('[data-feature-dot]').forEach(el => {
    el.addEventListener('click', () => {
      state.featureIndex = parseInt(el.dataset.featureDot, 10)
      syncFeatureSlide()
    })
  })
  // 文章卡
  root.querySelectorAll('[data-article-id]').forEach(el => {
    el.addEventListener('click', () => navigateTo('info-detail?type=article&id=' + el.dataset.articleId))
  })
  // 分类卡
  root.querySelectorAll('[data-category-key]').forEach(el => {
    el.addEventListener('click', () => navigateTo('category-detail?key=' + el.dataset.categoryKey))
  })
  const backTop = root.querySelector('[data-back-top]')
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
}

// 返回顶部显隐由全局 scroll 监听驱动（与小程序 onPageScroll 对齐）
let _scrollHandler = null

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default {
  title: '心电科普',
  tab: 2,
  async mount(container) {
    root = container
    state.theme = globalData.theme
    state.searchKeyword = ''
    state.activeCategory = '全部'
    state.featureIndex = 0
    state.showBackTop = false
    filterArticles()
    render()
    _scrollHandler = () => {
      const show = window.scrollY > 400
      if (state.showBackTop !== show) {
        state.showBackTop = show
        const el = root && root.querySelector('[data-back-top]')
        if (el) el.classList.toggle('show', show)
      }
    }
    window.addEventListener('scroll', _scrollHandler, { passive: true })
  },
  unmount() {
    if (_scrollHandler) { window.removeEventListener('scroll', _scrollHandler); _scrollHandler = null }
    stopAllAnimations()
    if (_searchTimer) { clearTimeout(_searchTimer); _searchTimer = null }
    root = null
  },
  updateTheme(theme) {
    state.theme = theme
    if (root) { render() }
  }
}
