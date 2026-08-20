// pages/science.js — 心电知识科普页 (H5 版)
// 由小程序 pages/science/science.js + science.wxml 转化

import { globalData } from '../app.js'
import { navigateTo } from '../router.js'
import { getSampleByAbbr } from '../utils/ecgSamples.js'
import * as waveAnimator from '../utils/waveAnimator.js'

const CATEGORIES = [
  {
    key: 'N', name: '正常心搏', enName: 'Normal Beat', type: 'normal',
    desc: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟范围内。P波、QRS波群和T波形态正常，是健康心脏的典型表现。'
  },
  {
    key: 'S', name: '室上性早搏', enName: 'Supraventricular Ectopic', type: 'abnormal',
    desc: '异位起搏点位于房室结以上区域的提前搏动，包括房性早搏和交界性早搏。QRS波群通常变窄，与正常心搏形态相似但出现时间提前。'
  },
  {
    key: 'V', name: '室性早搏', enName: 'Ventricular Ectopic', type: 'abnormal',
    desc: '起源于心室肌的提前搏动，QRS波群宽大畸形，时限超过120ms，T波方向与QRS主波方向相反。频发室性早搏可能提示器质性心脏病。'
  },
  {
    key: 'F', name: '融合搏动', enName: 'Fusion Beat', type: 'abnormal',
    desc: '正常心搏与室性异位搏动同时激动心室时产生的融合波形，形态介于正常QRS与室性早搏之间。提示可能存在室性异位节律。'
  },
  {
    key: 'Q', name: '未知搏动', enName: 'Unknown Beat', type: 'unclassified',
    desc: '因信号质量差、噪声干扰或形态不典型而无法归入上述类别的搏动。需结合上下文波形和信号质量综合评估。'
  }
]

const state = { theme: 'light' }
let root = null
let _waves = []

function setData(patch) {
  Object.assign(state, patch)
  render()
}

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-science dark' : 'container page-science'
}

function render() {
  if (!root) return
  let html = '<div class="' + themeClass() + '">'

  html += '<div class="header">' +
    '<div class="title-xl">心电科普</div>' +
    '<div class="subtitle">了解心电图与心律失常分类</div>' +
  '</div>'

  // 顶部Banner
  html += '<div class="banner">' +
    '<div class="banner-bg-pattern">' +
      '<div class="pulse-line pulse-line-1"></div>' +
      '<div class="pulse-line pulse-line-2"></div>' +
    '</div>' +
    '<div class="banner-content">' +
      '<div class="banner-tag">心电检测的意义</div>' +
      '<div class="banner-title">心电图（ECG）</div>' +
      '<div class="banner-desc">记录心脏电活动的无创检查方法，通过捕捉心脏每次跳动产生的电信号变化，帮助发现心律失常、心肌缺血等潜在心脏问题。定期监测对早期预防心血管疾病至关重要。</div>' +
    '</div>' +
  '</div>'

  // 章节标题
  html += '<div class="section-header">' +
    '<div class="section-title title-lg">AAMI心律失常分类</div>' +
    '<div class="section-subtitle subtitle">点击查看详情 · Association for the Advancement of Medical Instrumentation</div>' +
  '</div>'

  // 分类卡片列表
  html += '<div class="category-list">'
  CATEGORIES.forEach(function(cat) {
    const tagCls = cat.type === 'normal' ? 'tag-normal' : cat.type === 'unclassified' ? 'tag-neutral' : 'tag-abnormal'
    const tagText = cat.type === 'normal' ? '正常' : cat.type === 'unclassified' ? '未分类' : '异常'
    html += '<div class="card category-card" data-key="' + cat.key + '" data-category>' +
      '<div class="cat-header">' +
        '<div class="cat-icon cat-icon-' + cat.key + '"><div class="cat-icon-letter">' + cat.key + '</div></div>' +
        '<div class="cat-info">' +
          '<div class="cat-name">' + cat.name + '</div>' +
          '<div class="cat-en">' + cat.enName + '</div>' +
        '</div>' +
        '<div class="tag ' + tagCls + '">' + tagText + '</div>' +
      '</div>' +
      '<div class="cat-wave"><canvas id="waveCanvas_' + cat.key + '" class="wave-canvas"></canvas></div>' +
      '<div class="cat-desc">' + cat.desc + '</div>' +
      '<div class="cat-arrow">查看详情 ›</div>' +
    '</div>'
  })
  html += '</div>'

  // 健康提示
  html += '<div class="card health-tip-card">' +
    '<div class="tip-header">' +
      '<div class="tip-icon-wrap"><div class="tip-dot"></div></div>' +
      '<div class="tip-title">健康提示</div>' +
    '</div>' +
    '<div class="tip-content">' +
      '<div class="tip-item"><span class="tip-num">01</span><span class="tip-text">定期进行心电检查，尤其是40岁以上人群及有心血管疾病家族史者</span></div>' +
      '<div class="tip-item"><span class="tip-num">02</span><span class="tip-text">保持规律作息与适度运动，避免过度劳累和情绪波动</span></div>' +
      '<div class="tip-item"><span class="tip-num">03</span><span class="tip-text">如出现心悸、胸闷、头晕等不适症状，应及时就医并做心电图检查</span></div>' +
      '<div class="tip-item"><span class="tip-num">04</span><span class="tip-text">本应用检测结果仅供参考，不能替代专业医疗诊断</span></div>' +
    '</div>' +
  '</div>'

  html += '</div>'
  root.innerHTML = html
  bindEvents()
  startAllWaveAnimations()
}

function startAllWaveAnimations() {
  stopAllAnimations()
  _waves = []
  CATEGORIES.forEach(function(cat) {
    const sample = getSampleByAbbr(cat.key)
    if (!sample) return
    const controller = waveAnimator.start({
      canvasId: 'waveCanvas_' + cat.key,
      data: sample.data,
      style: 'mini',
      pointsPerFrame: 5,
      loop: true,
      loopDelay: 700
    })
    _waves.push(controller)
  })
}

function stopAllAnimations() {
  for (let i = 0; i < _waves.length; i++) {
    _waves[i].stop()
  }
  _waves = []
}

function bindEvents() {
  if (!root) return
  root.querySelectorAll('[data-category]').forEach(function(card) {
    card.addEventListener('click', function() {
      navigateTo('category-detail?key=' + card.dataset.key)
    })
  })
}

export default {
  title: '心电科普',
  tab: 2,

  async mount(container) {
    root = container
    setData({ theme: globalData.theme })
  },

  unmount() {
    stopAllAnimations()
    root = null
  },

  updateTheme(theme) {
    setData({ theme: theme })
  }
}
