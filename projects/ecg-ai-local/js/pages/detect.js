// js/pages/detect.js — 心电检测主页面 (H5)
// 来源: pages/detect/detect.js + detect.wxml
// 同步: 小程序 page-head/logo-card 精炼文案、flow-steps/notice-bar/stat-hero/summary-card、sample-card 横滑、model-status 折叠等
// H5 差异: wx.chooseMessageFile → input file，wx Canvas → waveAnimator 同款调用

import { globalData, loadModel, runInference } from '../app.js'
import * as waveAnimator from '../utils/waveAnimator.js'
import * as profileSheet from '../profileSheet.js'
import { getStorageSync, setStorageSync } from '../storage.js'
import { showToast, showLoading, hideLoading } from '../ui.js'
import { AAMI_CLASSES, DEMO_ECG_SAMPLES } from './detectData.js'

const state = {
  step: 'import',
  ecgData: null,
  ecgLength: 0,
  ecgMin: 0,
  ecgMax: 0,
  detecting: false,
  modelReady: false,
  modelLoading: false,
  modelStatusExpanded: false,
  result: null,
  confidencePercent: 0,
  confidenceDisplay: '0.0',
  probDisplay: [],
  batchRecords: [],
  batchIndex: 0,
  batchTotal: 0,
  batchLabel: '',
  hasBatchNext: false,
  latestResult: null,
  healthTip: null,
  theme: 'light',
  demoSamples: DEMO_ECG_SAMPLES.map(s => ({ id: s.id, label: s.label, labelAbbr: s.labelAbbr, labelDesc: s.labelDesc }))
}

let root = null
let _wave = null
let _pendingHistoryId = null
let _modelCheckTimer = null
let _confAnim = null

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-detect dark' : 'container page-detect'
}

function loadHomeStats(history) {
  const total = history.length
  if (total === 0) return { type: 'info', icon: 'i', title: '欢迎使用心韵深辨', text: '开始您的第一次心电检测，体验本地AI智能分析' }
  const recent = history.slice(0, Math.min(3, total))
  const allNormal = recent.every(r => !r.isAbnormal)
  if (allNormal) return { type: 'success', icon: '✓', title: '心脏状态良好', text: '最近' + recent.length + '次检测均为正常心律，请继续保持健康的生活方式' }
  const abnormalCount = recent.filter(r => r.isAbnormal).length
  return { type: 'warning', icon: '!', title: '请关注心脏健康', text: '最近' + recent.length + '次检测中发现' + abnormalCount + '次异常，建议定期复查' }
}

function buildHeaderMeta() {
  const history = getStorageSync('history') || []
  let latest = null
  if (history.length > 0) {
    const last = history[history.length - 1]
    latest = { className: last.className, isAbnormal: last.isAbnormal, confidencePercent: (last.confidence * 100).toFixed(1), timeStr: last.timeStr || new Date(last.timestamp).toLocaleString() }
  }
  return { latest, healthTip: loadHomeStats(history) }
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'

  // step === import 时的 page-head + logo-card（与小程序 detect.wxml 完全一致的精炼文案）
  if (s.step === 'import') {
    html += '<div class="page-head fade-in-up"><div class="page-eyebrow">AI 心电检测</div><div class="page-title">智能心律分析</div></div>'
    html += '<div class="logo-card fade-in-up-d1"><img class="logo-card-img" src="assets/logo.jpg" alt="logo" /><div class="logo-card-text"><div class="logo-card-title">心韵深辨</div><div class="logo-card-sub">端侧秒级判读 · 260点信号识别5类心律</div></div></div>'
  } else {
    html += '<div class="page-header"><div class="title-xl">心电检测</div></div>'
  }

  // flow-steps（导入→预览→结果，✓/数字/teal 发光，与小程序一致）
  html += '<div class="flow-steps fade-in-up">'
  html += '<div class="flow-step ' + (s.step === 'import' ? 'flow-step-active' : 'flow-step-done') + '"><div class="flow-step-dot">' + (s.step === 'import' ? '1' : '✓') + '</div><div class="flow-step-label">导入数据</div></div>'
  html += '<div class="flow-step-line ' + (s.step === 'preview' || s.step === 'result' ? 'flow-step-line-done' : '') + '"></div>'
  html += '<div class="flow-step ' + (s.step === 'preview' ? 'flow-step-active' : s.step === 'result' ? 'flow-step-done' : '') + '"><div class="flow-step-dot">' + (s.step === 'result' ? '✓' : '2') + '</div><div class="flow-step-label">预览波形</div></div>'
  html += '<div class="flow-step-line ' + (s.step === 'result' ? 'flow-step-line-done' : '') + '"></div>'
  html += '<div class="flow-step ' + (s.step === 'result' ? 'flow-step-active' : '') + '"><div class="flow-step-dot">3</div><div class="flow-step-label">分析结果</div></div>'
  html += '</div>'

  // import 态的 notice-bar / stat-hero / summary-card
  if (s.step === 'import') {
    html += '<div class="notice-bar fade-in-up"><div class="notice-dot"></div><div class="notice-viewport"><div class="notice-track"><div class="notice-text">检测结果仅供参考，不构成医疗诊断建议。如有不适或紧急情况，请及时就医。</div><div class="notice-text">检测结果仅供参考，不构成医疗诊断建议。如有不适或紧急情况，请及时就医。</div></div></div></div>'
    html += '<div class="stat-hero fade-in-up-d1"><div class="stat-hero-item"><div class="stat-hero-val teal">260</div><div class="stat-hero-lbl">采样点</div></div><div class="stat-hero-div"></div><div class="stat-hero-item"><div class="stat-hero-val">5</div><div class="stat-hero-lbl">心律分类</div></div><div class="stat-hero-div"></div><div class="stat-hero-item"><div class="stat-hero-val green">100%</div><div class="stat-hero-lbl">本地处理</div></div></div>'
    if (s.latestResult) {
      html += '<div class="card card-accent-teal summary-card fade-in-up-d2"><div class="summary-row"><div class="summary-icon ' + (s.latestResult.isAbnormal ? 'summary-icon-abnormal' : 'summary-icon-normal') + '">' + (s.latestResult.isAbnormal ? '!' : '✓') + '</div><div class="summary-info"><div class="summary-time">最近检测 · ' + s.latestResult.timeStr + '</div><div class="summary-name">' + s.latestResult.className + ' · ' + s.latestResult.confidencePercent + '% 置信度</div></div><div class="tag ' + (s.latestResult.isAbnormal ? 'tag-abnormal' : 'tag-normal') + '">' + (s.latestResult.isAbnormal ? '异常' : '正常') + '</div></div></div>'
    }
    html += '<div class="btn-primary fade-in-up-d3" data-import-file>导入心电数据</div>'
    html += '<div class="sec"><div class="sec-title">示例数据</div><div class="sec-sub">左右滑动 · 点击体验 AI 检测流程</div></div>'
    html += '<div class="sample-scroll" data-sample-scroll>'
    s.demoSamples.forEach((item, idx) => {
      html += '<div class="sample-card" data-sample-idx="' + idx + '"><div class="sample-top"><div class="list-badge list-badge-' + item.labelAbbr + '">' + item.labelAbbr + '</div><div class="sample-arrow">›</div></div><div class="sample-name">' + item.label + '</div><div class="sample-desc">' + item.labelDesc + '</div></div>'
    })
    html += '</div><div class="footer-text">样本来自 MIT-BIH 心律失常数据库</div>'
    if (s.healthTip) {
      const tipCls = s.healthTip.type === 'warning' ? 'amber' : 'emerald'
      html += '<div class="tip-strip tip-strip-' + tipCls + '"><div class="tip-icon tip-icon-' + tipCls + '">' + s.healthTip.icon + '</div><div class="tip-body"><div class="tip-title">' + s.healthTip.title + '</div><div class="tip-text">' + s.healthTip.text + '</div></div></div>'
    }
  }

  // 预览态
  if (s.step === 'preview') {
    html += '<div class="fade-in">'
    if (s.batchTotal > 1) {
      html += '<div class="batch-nav"><div class="batch-btn ' + (s.batchIndex === 0 ? 'disabled' : '') + '" data-batch-prev>‹ 上一条</div><div class="batch-info"><div class="batch-label">' + s.batchLabel + '</div><div class="batch-count">' + (s.batchIndex + 1) + ' / ' + s.batchTotal + '</div></div><div class="batch-btn ' + (s.batchIndex === s.batchTotal - 1 ? 'disabled' : '') + '" data-batch-next>下一条 ›</div></div>'
    }
    html += '<div class="card card-glow"><div class="title-lg preview-title">数据预览</div><div class="subtitle preview-sub">确认心电波形后开始检测</div><div class="ecg-chart"><canvas id="ecgCanvas" class="ecg-canvas"></canvas></div><div class="preview-stats"><div class="preview-stat-item"><div class="preview-stat-lbl">采样点数</div><div class="preview-stat-val">' + s.ecgLength + '</div></div><div class="preview-stat-item"><div class="preview-stat-lbl">数据范围</div><div class="preview-stat-val">' + s.ecgMin + ' ~ ' + s.ecgMax + '</div></div></div></div>'
    html += '<div class="action-bar"><div class="btn-secondary" data-reset>重新选择</div><div class="btn-primary" data-detect>' + (s.detecting ? '<span class="ecg-loader ecg-loader-white"></span><span>检测中</span>' : '<span>开始检测</span>') + '</div></div>'
    html += '</div>'
  }

  // 结果态（含示波器角括号 + confidenceDisplay 滚动值）
  if (s.step === 'result' && s.result) {
    const r = s.result
    html += '<div class="fade-in">'
    html += '<div class="big-stat-card ' + (r.isAbnormal ? 'abnormal' : '') + '"><div class="scope-corner scope-corner-tl"></div><div class="scope-corner scope-corner-tr"></div><div class="scope-corner scope-corner-bl"></div><div class="scope-corner scope-corner-br"></div><div class="big-stat-icon pop-in ' + (r.isAbnormal ? 'big-stat-icon-abnormal' : 'big-stat-icon-normal') + '">' + (r.isAbnormal ? '!' : '✓') + '</div><div class="big-stat-title">' + r.className + '</div><div class="big-stat-sub">' + r.classAbbr + ' · ' + r.classDesc + '</div><div class="big-stat-num ' + (r.isAbnormal ? 'big-stat-num-abnormal' : 'big-stat-num-normal') + '">' + s.confidenceDisplay + '<span class="big-stat-unit">%</span></div><div class="big-stat-lbl">置信度</div><div class="big-stat-bar"><div class="big-stat-bar-fill bar-grow ' + (r.isAbnormal ? 'big-stat-bar-fill-abnormal' : 'big-stat-bar-fill-normal') + '" style="width:' + s.confidencePercent + '%;"></div></div></div>'
    html += '<div class="card"><div class="card-title">五类概率分布</div>' + s.probDisplay.map(item => '<div class="prob-item"><div class="prob-header"><span class="prob-abbr cat-' + item.abbr + '">' + item.abbr + '</span><span class="prob-name">' + item.name + '</span><span class="prob-percent">' + item.percent + '%</span></div><div class="prob-bar-bg"><div class="prob-bar-fill bar-grow bar-' + item.abbr + '" style="width:' + item.percent + '%;"></div></div></div>').join('') + '</div>'
    html += '<div class="card card-glow"><div class="card-title">心电波形</div><div class="ecg-chart"><canvas id="ecgResultCanvas" class="ecg-canvas"></canvas></div></div>'
    if (s.classInfo) {
      const ci = s.classInfo
      html += '<div class="card"><div class="info-header"><div class="info-icon ' + (r.isAbnormal ? 'info-icon-abnormal' : 'info-icon-normal') + '">' + ci.abbr + '</div><div class="info-title-area"><div class="info-title">' + ci.name + '</div><div class="info-en">' + ci.desc + '</div></div><div class="tag ' + (r.isAbnormal ? 'tag-abnormal' : 'tag-normal') + '">' + (r.isAbnormal ? '异常' : '正常') + '</div></div><div class="info-section"><div class="info-section-title">分类介绍</div><div class="info-section-text">' + ci.intro + '</div></div><div class="info-section"><div class="info-section-title">波形特征</div><div class="info-features">' + ci.features.map(f => '<div class="info-feature-item"><div class="info-feature-dot ' + (r.isAbnormal ? 'dot-danger' : 'dot-success') + '"></div><span>' + f + '</span></div>').join('') + '</div></div><div class="info-section"><div class="info-section-title">健康建议</div><div class="info-section-text">' + ci.advice + '</div></div></div>'
    }
    html += '<div class="disclaimer-card"><div class="disclaimer-icon">!</div><div class="disclaimer-text">本应用检测结果仅供参考，不构成医疗诊断建议。如有不适或紧急情况，请立即拨打120急救电话或前往就近医院就诊。</div></div>'
    html += '<div class="action-bar"><div class="btn-secondary" data-reset>再次检测</div>' + (s.hasBatchNext ? '<div class="btn-primary" data-detect-next>检测下一条</div>' : '<div class="btn-primary" data-save-result>保存结果</div>') + '</div>'
    html += '</div>'
  }

  // 模型状态（可折叠，与小程序 onModelStatusTap 一致：小圆点/胶囊）
  if (!s.modelReady && s.step !== 'result') {
    const collapsed = !s.modelStatusExpanded
    html += '<div class="model-status ' + (collapsed ? 'model-status-collapsed' : 'model-status-expanded') + '" data-model-status><div class="ecg-loader ' + (s.modelLoading ? '' : 'ecg-loader-idle') + '"></div><span class="model-status-text">' + (s.modelLoading ? '模型加载中...' : '模型已就绪') + '</span></div>'
  }

  html += '</div>'
  root.innerHTML = html
  bindEvents()
  // 画布挂载后启动波形
  if (s.step === 'preview' && s.ecgData) setTimeout(() => { _wave = waveAnimator.start({ canvasId: 'ecgCanvas', data: s.ecgData, style: 'full', pointsPerFrame: 5, loop: true, loopDelay: 700, hudLabel: 'ECG · 250Hz' }) }, 120)
  if (s.step === 'result' && s.ecgData) setTimeout(() => { _wave = waveAnimator.start({ canvasId: 'ecgResultCanvas', data: s.ecgData, style: 'full', pointsPerFrame: 5, loop: true, loopDelay: 700, hudLabel: 'ECG · ' + (s.result.classAbbr || '') + ' · 250Hz' }) }, 120)
}

function triggerFileImport() {
  let input = document.getElementById('hiddenEcgFile')
  if (!input) {
    input = document.createElement('input')
    input.id = 'hiddenEcgFile'
    input.type = 'file'
    input.accept = '.csv,.json,.txt'
    input.className = 'hidden-file-input'
    input.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0]
      if (file) parseFile(file)
      input.value = ''
    })
    document.body.appendChild(input)
  }
  input.click()
}

function parseFile(file) {
  showLoading({ title: '解析文件中...' })
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const result = parseData(String(e.target.result), file.name)
      if (result.type === 'multi') {
        hideLoading()
        state.batchRecords = result.records
        state.batchIndex = 0
        state.batchTotal = result.records.length
        showBatchPreview(0)
        return
      }
      let data = result.data
      if (!data || data.length < 260) { hideLoading(); showToast({ title: '数据不足260点', icon: 'none' }); return }
      data = data.slice(0, 260)
      state.batchRecords = []; state.batchTotal = 0
      showPreview(data); hideLoading()
    } catch (err) { hideLoading(); showToast({ title: '解析失败: ' + err.message, icon: 'none' }) }
  }
  reader.onerror = () => { hideLoading(); showToast({ title: '文件读取失败', icon: 'none' }) }
  reader.readAsText(file)
}

function showBatchPreview(idx) {
  const records = state.batchRecords
  if (idx < 0 || idx >= records.length) return
  const record = records[idx]
  state.batchIndex = idx
  state.batchTotal = records.length
  state.batchLabel = record.labelName || record.label || ('记录' + (idx + 1))
  showPreview(record.data)
}

function parseData(content, fileName) {
  const ext = fileName.split('.').pop().toLowerCase()
  if (ext === 'json') {
    const obj = JSON.parse(content)
    if (obj.records && Array.isArray(obj.records)) {
      const records = []
      for (let i = 0; i < obj.records.length; i++) {
        const r = obj.records[i]; const d = Array.isArray(r) ? r : r.data
        if (d && Array.isArray(d) && d.length >= 260) records.push({ label: r.label || ('记录' + (i + 1)), labelName: r.labelName || r.label || ('记录' + (i + 1)), data: d.slice(0, 260) })
      }
      if (records.length > 0) return { type: 'multi', records }
      throw new Error('数据集中无有效记录')
    }
    if (Array.isArray(obj)) {
      if (obj.length > 0 && Array.isArray(obj[0])) {
        const multiRecords = []
        for (let mi = 0; mi < obj.length; mi++) if (Array.isArray(obj[mi]) && obj[mi].length >= 260) multiRecords.push({ label: '记录' + (mi + 1), labelName: '记录' + (mi + 1), data: obj[mi].slice(0, 260) })
        if (multiRecords.length > 0) return { type: 'multi', records: multiRecords }
        throw new Error('数据集中无有效记录')
      }
      return { type: 'single', data: obj.slice(0, 260) }
    }
    if (obj.data && Array.isArray(obj.data)) return { type: 'single', data: obj.data.slice(0, 260) }
    if (obj.ecg && Array.isArray(obj.ecg)) return { type: 'single', data: obj.ecg.slice(0, 260) }
    throw new Error('JSON格式不支持')
  }
  if (ext === 'csv') {
    const lines = content.trim().split('\n')
    const firstCells = lines[0].trim().split(',')
    const firstAllNum = firstCells.every(c => !isNaN(parseFloat(c)))
    if (firstAllNum && firstCells.length >= 260) {
      const csvRecs = []
      for (let ci = 0; ci < lines.length; ci++) {
        const cells = lines[ci].trim().split(','); const vals = []
        for (let ck = 0; ck < cells.length; ck++) { const v = parseFloat(cells[ck]); if (!isNaN(v)) vals.push(v) }
        if (vals.length >= 260) csvRecs.push({ label: '记录' + (ci + 1), labelName: '记录' + (ci + 1), data: vals.slice(0, 260) })
      }
      if (csvRecs.length === 1) return { type: 'single', data: csvRecs[0].data }
      if (csvRecs.length > 1) return { type: 'multi', records: csvRecs }
      throw new Error('CSV中无有效数据')
    }
    if (!firstAllNum && firstCells.length > 2) {
      const oldRecs = []
      for (let ri = 1; ri < lines.length; ri++) {
        const parts = lines[ri].trim().split(','); if (parts.length < 3) continue
        const csvLabel = parts[1] || ('记录' + ri); const csvData = []
        for (let vi = 2; vi < parts.length; vi++) { const vv = parseFloat(parts[vi]); if (!isNaN(vv)) csvData.push(vv) }
        if (csvData.length >= 260) oldRecs.push({ label: csvLabel, labelName: csvLabel, data: csvData.slice(0, 260) })
      }
      if (oldRecs.length > 0) return { type: 'multi', records: oldRecs }
    }
    const singleData = []
    for (let di = 0; di < lines.length; di++) { const v2 = parseFloat(lines[di].trim()); if (!isNaN(v2)) singleData.push(v2) }
    if (singleData.length >= 260) return { type: 'single', data: singleData.slice(0, 260) }
    throw new Error('CSV中无有效数据')
  }
  if (ext === 'txt') {
    const trimmed = content.trim(); const txtLines = trimmed.split('\n')
    if (txtLines.length > 1) {
      const txtRecs = []
      for (let ti = 0; ti < txtLines.length; ti++) {
        const parts = txtLines[ti].trim().split(/[, \t]+/); const vals = []
        for (let pi = 0; pi < parts.length; pi++) { const tv = parseFloat(parts[pi]); if (!isNaN(tv)) vals.push(tv) }
        if (vals.length >= 260) txtRecs.push({ label: '记录' + (ti + 1), labelName: '记录' + (ti + 1), data: vals.slice(0, 260) })
      }
      if (txtRecs.length > 1) return { type: 'multi', records: txtRecs }
      if (txtRecs.length === 1) return { type: 'single', data: txtRecs[0].data }
    }
    const txtData = trimmed.split(/[, \n]+/).map(v => parseFloat(v)).filter(v => !isNaN(v))
    if (txtData.length >= 260) return { type: 'single', data: txtData.slice(0, 260) }
    throw new Error('TXT中无有效数据')
  }
  throw new Error('不支持的文件格式: ' + ext)
}

function onUseDemoSample(idx) {
  const sample = DEMO_ECG_SAMPLES[idx]
  if (!sample) return
  state.batchRecords = []; state.batchTotal = 0
  showPreview(sample.data)
}

function showPreview(ecgData) {
  stopWave()
  const min = Math.min.apply(null, ecgData)
  const max = Math.max.apply(null, ecgData)
  const hasBatchNext = state.batchTotal > 1 && state.batchIndex < state.batchTotal - 1
  state.ecgData = ecgData
  state.ecgLength = ecgData.length
  state.ecgMin = min.toFixed(3)
  state.ecgMax = max.toFixed(3)
  state.step = 'preview'
  state.hasBatchNext = hasBatchNext
  render()
}

function stopWave() { if (_wave) { try { _wave.stop() } catch (e) {} _wave = null } }

function animateConfidence(targetStr) {
  const target = parseFloat(targetStr) || 0
  if (_confAnim) { try { _confAnim.stop() } catch (e) {} _confAnim = null }
  // 简易 rAF 数值滚动（与小程序 utils/animateValue 对齐）
  const duration = 600, delay = 200
  const start = performance.now() + delay
  const tick = now => {
    if (now < start) { _confAnim = requestAnimationFrame(tick); return }
    const p = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - p, 3)
    state.confidenceDisplay = (target * eased).toFixed(1)
    const el = root && root.querySelector('.big-stat-num')
    if (el) el.firstChild && (el.firstChild.textContent = state.confidenceDisplay)
    if (p < 1) _confAnim = requestAnimationFrame(tick)
    else state.confidenceDisplay = target.toFixed(1)
  }
  _confAnim = requestAnimationFrame(tick)
}

function onDetect() {
  if (state.detecting) return
  stopWave()
  state.detecting = true; render()
  if (!globalData.isModelReady) {
    showLoading({ title: '加载模型中...' })
    loadModel().then(() => { state.modelReady = true; hideLoading(); runDetect() }).catch(() => { hideLoading(); showToast({ title: '模型加载失败', icon: 'none' }); state.detecting = false; render() })
  } else runDetect()
}

function runDetect() {
  showLoading({ title: '检测分析中...' })
  runInference(state.ecgData).then(result => {
    const probDisplay = []
    for (let i = 0; i < 5; i++) {
      const p = result.probabilities[i] || 0
      probDisplay.push({ abbr: AAMI_CLASSES[i].abbr, name: AAMI_CLASSES[i].name, abnormal: AAMI_CLASSES[i].abnormal, percent: (p * 100).toFixed(2) })
    }
    const classIdx = result.classIdx || 0
    const classInfo = AAMI_CLASSES[classIdx]
    const confPercent = (result.confidence * 100).toFixed(1)
    const hasBatchNext = state.batchTotal > 1 && state.batchIndex < state.batchTotal - 1
    state.result = result
    state.confidencePercent = confPercent
    state.probDisplay = probDisplay
    state.classInfo = classInfo
    state.detecting = false
    state.hasBatchNext = hasBatchNext
    state.step = 'result'
    render()
    animateConfidence(confPercent)
    hideLoading(); saveToHistory(result)
  }).catch(e => { hideLoading(); console.error('推理失败:', e); showToast({ title: '检测失败: ' + (e.message || '未知错误'), icon: 'none' }); state.detecting = false; render() })
}

function onDetectNext() { stopWave(); const idx = state.batchIndex; if (idx < state.batchRecords.length - 1) showBatchPreview(idx + 1) }

function saveToHistory(result) {
  try {
    const history = getStorageSync('history') || []
    const record = { id: Date.now().toString(), timestamp: Date.now(), timeStr: new Date().toLocaleString(), className: result.className, classAbbr: result.classAbbr, classDesc: result.classDesc || '', isAbnormal: result.isAbnormal, confidence: result.confidence, confidencePercent: (result.confidence * 100).toFixed(1), ecgData: state.ecgData, probabilities: result.probabilities }
    history.unshift(record); if (history.length > 100) history.length = 100
    setStorageSync('history', history)
  } catch (e) { console.error('保存历史记录失败:', e) }
}

function onSaveResult() {
  // 与小程序一致：结果已在 runDetect 中自动保存，此处仅提示并跳转历史
  showToast({ title: '已保存到历史', icon: 'success' })
  setTimeout(() => { import('../router.js').then(m => m.switchTab('history')) }, 600)
}

function onReset() { stopWave(); if (_confAnim) { cancelAnimationFrame(_confAnim); _confAnim = null } state.step = 'import'; state.ecgData = null; state.result = null; state.detecting = false; state.confidenceDisplay = '0.0'; render() }

function loadHistoryRecord(id) {
  const history = getStorageSync('history') || []
  let record = null
  for (let i = 0; i < history.length; i++) if (history[i].id === id) { record = history[i]; break }
  if (!record) { showToast({ title: '记录不存在', icon: 'none' }); return }
  const probDisplay = []; const probs = record.probabilities || []
  for (let j = 0; j < 5; j++) { const p = probs[j] || 0; probDisplay.push({ abbr: AAMI_CLASSES[j].abbr, name: AAMI_CLASSES[j].name, abnormal: AAMI_CLASSES[j].abnormal, percent: (p * 100).toFixed(2) }) }
  const confPercent = record.confidencePercent || ((record.confidence || 0) * 100).toFixed(1)
  let classInfo = null; for (let k = 0; k < AAMI_CLASSES.length; k++) if (AAMI_CLASSES[k].abbr === record.classAbbr) { classInfo = AAMI_CLASSES[k]; break }
  stopWave()
  state.step = 'result'
  state.ecgData = record.ecgData
  state.result = { className: record.className, classAbbr: record.classAbbr, classDesc: record.classDesc || '', isAbnormal: record.isAbnormal, confidence: record.confidence }
  state.confidencePercent = confPercent
  state.confidenceDisplay = confPercent
  state.probDisplay = probDisplay
  state.classInfo = classInfo
  state.hasBatchNext = false
  render(); animateConfidence(confPercent)
}

function checkModelStatus() {
  const g = globalData
  if (g.isModelReady) { state.modelReady = true; state.modelLoading = false }
  else if (g.modelLoading) {
    state.modelReady = false; state.modelLoading = true
    if (_modelCheckTimer) clearInterval(_modelCheckTimer)
    _modelCheckTimer = setInterval(() => { if (globalData.isModelReady) { state.modelReady = true; state.modelLoading = false; clearInterval(_modelCheckTimer); _modelCheckTimer = null; render() } }, 500)
  }
}

function bindEvents() {
  if (!root) return
  const importEl = root.querySelector('[data-import-file]')
  if (importEl) importEl.addEventListener('click', triggerFileImport)
  root.querySelectorAll('[data-sample-idx]').forEach(el => el.addEventListener('click', () => onUseDemoSample(parseInt(el.dataset.sampleIdx, 10))))
  const prev = root.querySelector('[data-batch-prev]'); if (prev) prev.addEventListener('click', () => { if (state.batchIndex > 0) showBatchPreview(state.batchIndex - 1) })
  const next = root.querySelector('[data-batch-next]'); if (next) next.addEventListener('click', () => { if (state.batchIndex < state.batchRecords.length - 1) showBatchPreview(state.batchIndex + 1) })
  const reset1 = root.querySelector('[data-reset]'); if (reset1) reset1.addEventListener('click', onReset)
  const det = root.querySelector('[data-detect]'); if (det) det.addEventListener('click', onDetect)
  const detNext = root.querySelector('[data-detect-next]'); if (detNext) detNext.addEventListener('click', onDetectNext)
  const save = root.querySelector('[data-save-result]'); if (save) save.addEventListener('click', onSaveResult)
  const modelStatus = root.querySelector('[data-model-status]'); if (modelStatus) modelStatus.addEventListener('click', () => { state.modelStatusExpanded = !state.modelStatusExpanded; render() })
}

let _firstShow = true
export default {
  title: '心电检测', tab: 0,
  async mount(container) {
    root = container
    state.theme = globalData.theme
    const meta = buildHeaderMeta()
    state.latestResult = meta.latest
    state.healthTip = meta.healthTip
    checkModelStatus()
    render()
    if (globalData.pendingHistoryId) { _pendingHistoryId = globalData.pendingHistoryId; globalData.pendingHistoryId = null }
    if (_pendingHistoryId) { const id = _pendingHistoryId; _pendingHistoryId = null; setTimeout(() => loadHistoryRecord(id), 300) }
    if (!_firstShow) return
    _firstShow = false
    const skipped = getStorageSync('profileSkipped')
    if (!skipped) setTimeout(() => { try { profileSheet.show(true, () => {}) } catch (e) {} }, 600)
  },
  unmount() { stopWave(); if (_modelCheckTimer) { clearInterval(_modelCheckTimer); _modelCheckTimer = null } if (_confAnim) { cancelAnimationFrame(_confAnim); _confAnim = null } root = null },
  updateTheme(theme) { state.theme = theme; if (root) render() }
}
