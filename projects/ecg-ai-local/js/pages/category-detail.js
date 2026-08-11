// pages/category-detail.js — 分类详情页 (H5 版)
// 由小程序 pages/category-detail/category-detail.js + category-detail.wxml 转化

import { globalData } from '../app.js'
import { getSampleByAbbr } from '../utils/ecgSamples.js'
import * as waveAnimator from '../utils/waveAnimator.js'

const CATEGORY_DATA = {
  N: {
    name: '正常心搏', enName: 'Normal Beat', type: 'normal',
    intro: '起源于窦房结的正常心脏搏动，节律规整，频率在60-100次/分钟范围内。P波、QRS波群和T波形态正常，是健康心脏的典型表现。',
    features: ['窦性节律，频率60-100次/分', 'PR间期0.12-0.20秒', 'QRS时限小于0.12秒', 'P波形态直立圆滑'],
    advice: '本次检测心搏形态正常，建议保持健康的生活方式——规律作息、适量运动、均衡饮食，定期进行心电检查以持续监测心脏健康。'
  },
  S: {
    name: '室上性早搏', enName: 'Supraventricular Ectopic', type: 'abnormal',
    intro: '异位起搏点位于房室结以上区域的提前搏动，包括房性早搏和交界性早搏。QRS波群通常变窄，与正常心搏形态相似但出现时间提前。',
    features: ['提前出现的P波或QRS波群', 'QRS波群形态与正常相似（变窄）', '代偿间歇多不完全', '可见于健康人或器质性心脏病患者'],
    advice: '室上性早搏偶发可见于健康人群，但频发可能提示甲状腺功能异常、电解质紊乱或心脏结构问题。建议减少咖啡因摄入、戒烟限酒、避免熬夜，如症状持续或加重请及时就医。'
  },
  V: {
    name: '室性早搏', enName: 'Ventricular Ectopic', type: 'abnormal',
    intro: '起源于心室肌的提前搏动，QRS波群宽大畸形，时限超过120ms，T波方向与QRS主波方向相反。频发室性早搏可能提示器质性心脏病，需进一步评估。',
    features: ['QRS波群宽大畸形（>120ms）', 'T波方向与QRS主波相反', '代偿间歇完全', '无相关P波'],
    advice: '室性早搏需引起重视，尤其是频发或成对出现时。建议尽快至心内科就诊，完善心脏超声、动态心电图等检查，评估是否存在器质性心脏病，遵医嘱进行相应治疗。'
  },
  F: {
    name: '融合搏动', enName: 'Fusion Beat', type: 'abnormal',
    intro: '正常心搏与室性异位搏动同时激动心室时产生的融合波形，形态介于正常QRS与室性早搏之间。其出现提示可能存在室性异位节律，需结合临床综合判断。',
    features: ['形态介于正常与室性早搏之间', 'PR间期较正常缩短', '多见于室性并行心律', 'QRS时限介于二者之间'],
    advice: '融合搏动提示可能存在室性异位节律，建议进一步行24小时动态心电图（Holter）监测，评估异位搏动的频率和形态特征，必要时咨询心内科医生。'
  },
  Q: {
    name: '未知搏动', enName: 'Unclassifiable Beat', type: 'unclassified',
    intro: '因信号质量差、噪声干扰或形态不典型而无法归入上述类别的搏动。此类搏动需要结合上下文波形和信号质量综合评估，必要时需重新采集。',
    features: ['信号质量差', '可能存在噪声干扰', '波形形态不典型', '需结合临床信息综合判断'],
    advice: '本次检测信号质量不佳，无法准确分类。建议在安静环境下重新采集心电数据，确保电极接触良好、保持静止，减少干扰后再次进行检测。'
  }
}

const state = { theme: 'light', key: '', info: null }
let root = null
let _wave = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-category-detail dark' : 'container page-category-detail'
}

function render() {
  if (!root || !state.info) return
  const info = state.info
  const key = state.key
  const tagCls = info.type === 'normal' ? 'tag-normal' : info.type === 'unclassified' ? 'tag-neutral' : 'tag-abnormal'
  const tagText = info.type === 'normal' ? '正常' : info.type === 'unclassified' ? '未分类' : '异常'

  let html = '<div class="' + themeClass() + '">'

  // 顶部动态波形
  html += '<div class="card wave-card">' +
    '<div class="wave-header">' +
      '<div class="cat-icon cat-icon-' + key + '"><div class="cat-icon-letter">' + key + '</div></div>' +
      '<div class="wave-title-area">' +
        '<div class="wave-title">' + info.name + '</div>' +
        '<div class="wave-en">' + info.enName + '</div>' +
      '</div>' +
      '<div class="tag ' + tagCls + '">' + tagText + '</div>' +
    '</div>' +
    '<div class="ecg-chart"><canvas id="detailWaveCanvas" class="ecg-canvas"></canvas></div>' +
  '</div>'

  // 分类介绍
  html += '<div class="card">' +
    '<div class="detail-section-title">分类介绍</div>' +
    '<div class="detail-text">' + info.intro + '</div>' +
  '</div>'

  // 波形特征
  html += '<div class="card">' +
    '<div class="detail-section-title">波形特征</div>' +
    '<div class="feature-list">' +
      info.features.map(function(f) {
        return '<div class="feature-item">' +
          '<div class="feature-dot ' + (info.type === 'normal' ? 'dot-normal' : 'dot-abnormal') + '"></div>' +
          '<span class="feature-text">' + f + '</span>' +
        '</div>'
      }).join('') +
    '</div>' +
  '</div>'

  // 健康建议
  html += '<div class="card">' +
    '<div class="detail-section-title">健康建议</div>' +
    '<div class="detail-text">' + info.advice + '</div>' +
  '</div>'

  // 免责声明
  html += '<div class="disclaimer-card">' +
    '<div class="disclaimer-icon">!</div>' +
    '<div class="disclaimer-text">本应用检测结果仅供参考，不构成医疗诊断建议。如有不适或紧急情况，请立即拨打120急救电话或前往就近医院就诊。</div>' +
  '</div>'

  html += '</div>'
  root.innerHTML = html

  // 启动波形动画 (full风格, 与原逻辑一致)
  const sample = getSampleByAbbr(key)
  if (sample) {
    setTimeout(function() {
      _wave = waveAnimator.start({
        canvasId: 'detailWaveCanvas',
        data: sample.data,
        style: 'full',
        pointsPerFrame: 5,
        loop: true,
        loopDelay: 700,
        hudLabel: 'ECG · ' + key + ' · 250Hz'
      })
    }, 200)
  }
}

function stopAnimation() {
  if (_wave) {
    _wave.stop()
    _wave = null
  }
}

export default {
  title: '分类详情',
  tab: -1,

  async mount(container, params) {
    root = container
    const key = params.key || 'N'
    const info = CATEGORY_DATA[key]
    if (!info) return
    state.key = key
    state.info = info
    state.theme = globalData.theme
    render()
  },

  unmount() {
    stopAnimation()
    root = null
  },

  updateTheme(theme) {
    state.theme = theme
    render()
  }
}
