// pages/detect.js — 心电检测主页面 (H5 版)
// 由小程序 pages/detect/detect.js + detect.wxml 转化
// 功能: 文件导入 → 数据预览(动态波形) → 模型推理 → 结果展示

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
  result: null,
  confidencePercent: 0,
  probDisplay: [],
  batchRecords: [],
  batchIndex: 0,
  batchTotal: 0,
  batchLabel: '',
  hasBatchNext: false,
  demoSamples: DEMO_ECG_SAMPLES.map(function(s) {
    return { id: s.id, label: s.label, labelAbbr: s.labelAbbr }
  })
}

let root = null
let _wave = null
let _pendingHistoryId = null

function setData(patch) {
  Object.assign(state, patch)
  render()
}

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-detect dark' : 'container page-detect'
}

function render() {
  if (!root) return
  const s = state
  let html = '<div class="' + themeClass() + '">'

  // 顶部标题区
  html += '<div class="header">' +
    '<div class="title-xl">心电检测</div>' +
    '<div class="subtitle">导入心电数据，本地AI智能分析</div>' +
  '</div>'

  // 步骤1: 导入数据
  if (s.step === 'import') {
    html += '<div class="card">' +
      '<div class="step-badge">01</div>' +
      '<div class="title-lg">导入心电数据</div>' +
      '<div class="subtitle" style="margin-bottom: 16px;">支持 CSV / JSON / TXT 格式，需包含260个采样点</div>' +
      '<div class="import-zone" id="importZone">' +
        '<div class="import-icon">' +
          '<div class="import-icon-circle"><div class="import-plus"></div></div>' +
        '</div>' +
        '<div class="import-text">点击选择文件</div>' +
        '<div class="import-hint">从本地文件中选择</div>' +
      '</div>' +
      '<div class="demo-section">' +
        '<div class="demo-title">或选择示例数据体验</div>' +
        '<div class="demo-list">' +
          s.demoSamples.map(function(item, idx) {
            return '<div class="demo-item" data-idx="' + idx + '" data-demo>' +
              '<div class="demo-item-badge cat-' + item.labelAbbr + '">' + item.labelAbbr + '</div>' +
              '<div class="demo-item-label">' + item.label + '</div>' +
            '</div>'
          }).join('') +
        '</div>' +
        '<div class="demo-source">样本来自 MIT-BIH 心律失常数据库</div>' +
      '</div>' +
    '</div>'
  }

  // 步骤2: 数据预览
  if (s.step === 'preview') {
    html += '<div class="fade-in">'
    if (s.batchTotal > 1) {
      html += '<div class="batch-nav">' +
        '<div class="batch-btn ' + (s.batchIndex === 0 ? 'disabled' : '') + '" id="batchPrev">‹ 上一条</div>' +
        '<div class="batch-info">' +
          '<div class="batch-label">' + s.batchLabel + '</div>' +
          '<div class="batch-count">' + (s.batchIndex + 1) + ' / ' + s.batchTotal + '</div>' +
        '</div>' +
        '<div class="batch-btn ' + (s.batchIndex === s.batchTotal - 1 ? 'disabled' : '') + '" id="batchNext">下一条 ›</div>' +
      '</div>'
    }
    html += '<div class="card">' +
      '<div class="step-badge">02</div>' +
      '<div class="title-lg">数据预览</div>' +
      '<div class="subtitle" style="margin-bottom: 12px;">确认心电波形后开始检测</div>' +
      '<div class="ecg-chart"><canvas id="ecgCanvas" class="ecg-canvas"></canvas></div>' +
      '<div class="data-info">' +
        '<div class="data-info-item"><span class="data-label">采样点数</span><span class="data-value">' + s.ecgLength + '</span></div>' +
        '<div class="data-info-item"><span class="data-label">数据范围</span><span class="data-value">' + s.ecgMin + ' ~ ' + s.ecgMax + '</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="action-bar">' +
      '<div class="btn-secondary" id="btnReset">重新选择</div>' +
      '<div class="btn-primary" id="btnDetect">' +
        (s.detecting ? '<span class="pulse-animation">检测中...</span>' : '<span>开始检测</span>') +
      '</div>' +
    '</div>'
    html += '</div>'
  }

  // 步骤3: 检测结果
  if (s.step === 'result' && s.result) {
    html += '<div class="fade-in">'
    const r = s.result
    html += '<div class="card result-card ' + (r.isAbnormal ? 'result-abnormal' : 'result-normal') + '">' +
      '<div class="result-icon ' + (r.isAbnormal ? 'icon-abnormal' : 'icon-normal') + '">' +
        '<span class="result-icon-text">' + (r.isAbnormal ? '!' : '✓') + '</span>' +
      '</div>' +
      '<div class="result-class">' + r.className + '</div>' +
      '<div class="result-abbr">' + r.classAbbr + ' · ' + r.classDesc + '</div>' +
      '<div class="confidence-bar">' +
        '<span class="confidence-label">置信度</span>' +
        '<span class="confidence-value">' + s.confidencePercent + '%</span>' +
      '</div>' +
      '<div class="progress-bar"><div class="progress-fill" style="width: ' + s.confidencePercent + '%;"></div></div>' +
    '</div>'

    // 概率分布
    html += '<div class="card">' +
      '<div class="title-md" style="margin-bottom: 12px;">五类概率分布</div>' +
      '<div class="prob-list">' +
        s.probDisplay.map(function(item) {
          return '<div class="prob-item">' +
            '<div class="prob-header">' +
              '<span class="prob-abbr cat-' + item.abbr + '">' + item.abbr + '</span>' +
              '<span class="prob-name">' + item.name + '</span>' +
              '<span class="prob-percent">' + item.percent + '%</span>' +
            '</div>' +
            '<div class="prob-bar-bg"><div class="prob-bar-fill bar-' + item.abbr + '" style="width: ' + item.percent + '%;"></div></div>' +
          '</div>'
        }).join('') +
      '</div>' +
    '</div>'

    // ECG波形回放
    html += '<div class="card">' +
      '<div class="title-md" style="margin-bottom: 8px;">心电波形</div>' +
      '<div class="ecg-chart"><canvas id="ecgResultCanvas" class="ecg-canvas"></canvas></div>' +
    '</div>'

    // 分类详细介绍
    if (s.classInfo) {
      const ci = s.classInfo
      html += '<div class="card class-info-card">' +
        '<div class="info-header">' +
          '<div class="info-icon ' + (r.isAbnormal ? 'info-icon-abnormal' : 'info-icon-normal') + '"><span>' + ci.abbr + '</span></div>' +
          '<div class="info-title-area">' +
            '<div class="info-title">' + ci.name + '</div>' +
            '<div class="info-en">' + ci.desc + '</div>' +
          '</div>' +
          '<div class="tag ' + (r.isAbnormal ? 'tag-abnormal' : 'tag-normal') + '">' + (r.isAbnormal ? '异常' : '正常') + '</div>' +
        '</div>' +
        '<div class="info-section"><div class="info-section-title">分类介绍</div><div class="info-section-text">' + ci.intro + '</div></div>' +
        '<div class="info-section"><div class="info-section-title">波形特征</div><div class="info-features">' +
          ci.features.map(function(f) {
            return '<div class="info-feature-item"><div class="info-feature-dot ' + (r.isAbnormal ? 'dot-danger' : 'dot-success') + '"></div><span>' + f + '</span></div>'
          }).join('') +
        '</div></div>' +
        '<div class="info-section"><div class="info-section-title">健康建议</div><div class="info-section-text">' + ci.advice + '</div></div>' +
      '</div>'
    }

    // 免责声明
    html += '<div class="disclaimer-card">' +
      '<div class="disclaimer-icon">!</div>' +
      '<div class="disclaimer-text">本应用检测结果仅供参考，不构成医疗诊断建议。如有不适或紧急情况，请立即拨打120急救电话或前往就近医院就诊。</div>' +
    '</div>'

    // 操作按钮
    html += '<div class="action-bar">' +
      '<div class="btn-secondary" id="btnReset">再次检测</div>' +
      (s.hasBatchNext
        ? '<div class="btn-primary" id="btnDetectNext">检测下一条</div>'
        : '<div class="btn-text" id="btnSaveResult">保存结果</div>') +
    '</div>'
    html += '</div>'
  }

  // 模型状态指示
  if (!s.modelReady && s.step !== 'result') {
    html += '<div class="model-status glass">' +
      '<div class="status-dot ' + (s.modelLoading ? 'loading' : 'ready') + '"></div>' +
      '<span class="status-text">' + (s.modelLoading ? '模型加载中...' : '模型已就绪') + '</span>' +
    '</div>'
  }

  html += '</div>'
  root.innerHTML = html
  bindEvents()
}

// 文件导入 (H5: input file)
function triggerFileImport() {
  let input = document.getElementById('hiddenEcgFile')
  if (!input) {
    input = document.createElement('input')
    input.id = 'hiddenEcgFile'
    input.type = 'file'
    input.accept = '.csv,.json,.txt'
    input.className = 'hidden-file-input'
    input.addEventListener('change', function(e) {
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
  reader.onload = function(e) {
    try {
      const result = parseData(String(e.target.result), file.name)
      if (result.type === 'multi') {
        hideLoading()
        setData({
          batchRecords: result.records,
          batchIndex: 0,
          batchTotal: result.records.length
        })
        showBatchPreview(0)
        return
      }
      let data = result.data
      if (!data || data.length < 260) {
        hideLoading()
        showToast({ title: '数据不足260点', icon: 'none' })
        return
      }
      data = data.slice(0, 260)
      setData({ batchRecords: [], batchTotal: 0 })
      showPreview(data)
      hideLoading()
    } catch (err) {
      hideLoading()
      showToast({ title: '解析失败: ' + err.message, icon: 'none' })
    }
  }
  reader.onerror = function() {
    hideLoading()
    showToast({ title: '文件读取失败', icon: 'none' })
  }
  reader.readAsText(file)
}

// 多记录: 展示第idx条
function showBatchPreview(idx) {
  const records = state.batchRecords
  if (idx < 0 || idx >= records.length) return
  const record = records[idx]
  setData({
    batchIndex: idx,
    batchTotal: records.length,
    batchLabel: record.labelName || record.label || ('记录' + (idx + 1))
  })
  showPreview(record.data)
}

function onBatchNext() {
  const idx = state.batchIndex
  const total = state.batchRecords.length
  if (idx < total - 1) showBatchPreview(idx + 1)
}

function onBatchPrev() {
  if (state.batchIndex > 0) showBatchPreview(state.batchIndex - 1)
}

// 解析数据 (与原小程序 parseData 完全一致)
function parseData(content, fileName) {
  const ext = fileName.split('.').pop().toLowerCase()

  if (ext === 'json') {
    const obj = JSON.parse(content)
    if (obj.records && Array.isArray(obj.records)) {
      const records = []
      for (let i = 0; i < obj.records.length; i++) {
        const r = obj.records[i]
        const d = Array.isArray(r) ? r : r.data
        if (d && Array.isArray(d) && d.length >= 260) {
          records.push({
            label: r.label || ('记录' + (i + 1)),
            labelName: r.labelName || r.label || ('记录' + (i + 1)),
            data: d.slice(0, 260)
          })
        }
      }
      if (records.length > 0) return { type: 'multi', records: records }
      throw new Error('数据集中无有效记录')
    }
    if (Array.isArray(obj)) {
      if (obj.length > 0 && Array.isArray(obj[0])) {
        const multiRecords = []
        for (let mi = 0; mi < obj.length; mi++) {
          if (Array.isArray(obj[mi]) && obj[mi].length >= 260) {
            multiRecords.push({ label: '记录' + (mi + 1), labelName: '记录' + (mi + 1), data: obj[mi].slice(0, 260) })
          }
        }
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
    const firstAllNum = firstCells.every(function(c) { return !isNaN(parseFloat(c)) })

    if (firstAllNum && firstCells.length >= 260) {
      const csvRecs = []
      for (let ci = 0; ci < lines.length; ci++) {
        const cells = lines[ci].trim().split(',')
        const vals = []
        for (let ck = 0; ck < cells.length; ck++) {
          const v = parseFloat(cells[ck])
          if (!isNaN(v)) vals.push(v)
        }
        if (vals.length >= 260) {
          csvRecs.push({ label: '记录' + (ci + 1), labelName: '记录' + (ci + 1), data: vals.slice(0, 260) })
        }
      }
      if (csvRecs.length === 1) return { type: 'single', data: csvRecs[0].data }
      if (csvRecs.length > 1) return { type: 'multi', records: csvRecs }
      throw new Error('CSV中无有效数据')
    }

    if (!firstAllNum && firstCells.length > 2) {
      const oldRecs = []
      for (let ri = 1; ri < lines.length; ri++) {
        const parts = lines[ri].trim().split(',')
        if (parts.length < 3) continue
        const csvLabel = parts[1] || ('记录' + ri)
        const csvData = []
        for (let vi = 2; vi < parts.length; vi++) {
          const vv = parseFloat(parts[vi])
          if (!isNaN(vv)) csvData.push(vv)
        }
        if (csvData.length >= 260) {
          oldRecs.push({ label: csvLabel, labelName: csvLabel, data: csvData.slice(0, 260) })
        }
      }
      if (oldRecs.length > 0) return { type: 'multi', records: oldRecs }
    }

    const singleData = []
    for (let di = 0; di < lines.length; di++) {
      const v2 = parseFloat(lines[di].trim())
      if (!isNaN(v2)) singleData.push(v2)
    }
    if (singleData.length >= 260) return { type: 'single', data: singleData.slice(0, 260) }
    throw new Error('CSV中无有效数据')
  }

  if (ext === 'txt') {
    const trimmed = content.trim()
    const txtLines = trimmed.split('\n')
    if (txtLines.length > 1) {
      const txtRecs = []
      for (let ti = 0; ti < txtLines.length; ti++) {
        const parts = txtLines[ti].trim().split(/[, \t]+/)
        const vals = []
        for (let pi = 0; pi < parts.length; pi++) {
          const tv = parseFloat(parts[pi])
          if (!isNaN(tv)) vals.push(tv)
        }
        if (vals.length >= 260) {
          txtRecs.push({ label: '记录' + (ti + 1), labelName: '记录' + (ti + 1), data: vals.slice(0, 260) })
        }
      }
      if (txtRecs.length > 1) return { type: 'multi', records: txtRecs }
      if (txtRecs.length === 1) return { type: 'single', data: txtRecs[0].data }
    }
    const txtData = trimmed.split(/[, \n]+/).map(function(v) { return parseFloat(v) }).filter(function(v) { return !isNaN(v) })
    if (txtData.length >= 260) return { type: 'single', data: txtData.slice(0, 260) }
    throw new Error('TXT中无有效数据')
  }

  throw new Error('不支持的文件格式: ' + ext)
}

function onUseDemoSample(idx) {
  const sample = DEMO_ECG_SAMPLES[idx]
  if (!sample) return
  setData({ batchRecords: [], batchTotal: 0 })
  showPreview(sample.data)
}

function showPreview(ecgData) {
  stopWave()
  const min = Math.min.apply(null, ecgData)
  const max = Math.max.apply(null, ecgData)
  const hasBatchNext = state.batchTotal > 1 && state.batchIndex < state.batchTotal - 1
  setData({
    step: 'preview',
    ecgData: ecgData,
    ecgLength: ecgData.length,
    ecgMin: min.toFixed(3),
    ecgMax: max.toFixed(3),
    hasBatchNext: hasBatchNext
  })
  // step 切换后 canvas 需重新挂载, 留足时间等布局完成
  setTimeout(function() {
    _wave = waveAnimator.start({
      canvasId: 'ecgCanvas',
      data: ecgData,
      style: 'full',
      pointsPerFrame: 5,
      loop: true,
      loopDelay: 700,
      hudLabel: 'ECG · 250Hz'
    })
  }, 200)
}

function stopWave() {
  if (_wave) {
    _wave.stop()
    _wave = null
  }
}

// 开始检测当前预览的波形
function onDetect() {
  if (state.detecting) return
  stopWave()
  setData({ detecting: true })

  if (!globalData.isModelReady) {
    showLoading({ title: '加载模型中...' })
    loadModel().then(function() {
      setData({ modelReady: true })
      hideLoading()
      runDetect()
    }).catch(function() {
      hideLoading()
      showToast({ title: '模型加载失败', icon: 'none' })
      setData({ detecting: false })
    })
  } else {
    runDetect()
  }
}

function runDetect() {
  showLoading({ title: '检测分析中...' })
  runInference(state.ecgData).then(function(result) {
    const probDisplay = []
    for (let i = 0; i < 5; i++) {
      const p = result.probabilities[i] || 0
      probDisplay.push({
        abbr: AAMI_CLASSES[i].abbr,
        name: AAMI_CLASSES[i].name,
        abnormal: AAMI_CLASSES[i].abnormal,
        percent: (p * 100).toFixed(2)
      })
    }
    const classIdx = result.classIdx || 0
    const classInfo = AAMI_CLASSES[classIdx]
    const confPercent = (result.confidence * 100).toFixed(1)
    const hasBatchNext = state.batchTotal > 1 && state.batchIndex < state.batchTotal - 1

    setData({
      step: 'result',
      result: result,
      confidencePercent: confPercent,
      probDisplay: probDisplay,
      classInfo: classInfo,
      detecting: false,
      hasBatchNext: hasBatchNext
    })

    // 结果页动态波形
    setTimeout(function() {
      _wave = waveAnimator.start({
        canvasId: 'ecgResultCanvas',
        data: state.ecgData,
        style: 'full',
        pointsPerFrame: 5,
        loop: true,
        loopDelay: 700,
        hudLabel: 'ECG · ' + (result.classAbbr || '') + ' · 250Hz'
      })
    }, 200)

    hideLoading()
    saveToHistory(result)
  }).catch(function(e) {
    hideLoading()
    console.error('推理失败:', e)
    showToast({ title: '检测失败: ' + (e.message || '未知错误'), icon: 'none' })
    setData({ detecting: false })
  })
}

// 结果页: 检测下一条(批量模式)
function onDetectNext() {
  stopWave()
  const idx = state.batchIndex
  if (idx < state.batchRecords.length - 1) {
    showBatchPreview(idx + 1)
  }
}

function saveToHistory(result) {
  try {
    const history = getStorageSync('history') || []
    const record = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      className: result.className,
      classAbbr: result.classAbbr,
      classDesc: result.classDesc || '',
      isAbnormal: result.isAbnormal,
      confidence: result.confidence,
      confidencePercent: (result.confidence * 100).toFixed(1),
      ecgData: state.ecgData,
      probabilities: result.probabilities
    }
    history.unshift(record)
    if (history.length > 100) history = history.slice(0, 100)
    setStorageSync('history', history)
  } catch (e) {
    console.error('保存历史记录失败:', e)
  }
}

function onSaveResult() {
  showToast({ title: '已保存到历史', icon: 'success' })
}

function onReset() {
  stopWave()
  setData({
    step: 'import',
    ecgData: null,
    result: null,
    detecting: false
  })
}

function loadHistoryRecord(id) {
  const history = getStorageSync('history') || []
  let record = null
  for (let i = 0; i < history.length; i++) {
    if (history[i].id === id) {
      record = history[i]
      break
    }
  }
  if (!record) {
    showToast({ title: '记录不存在', icon: 'none' })
    return
  }

  const probDisplay = []
  const probs = record.probabilities || []
  for (let j = 0; j < 5; j++) {
    const p = probs[j] || 0
    probDisplay.push({
      abbr: AAMI_CLASSES[j].abbr,
      name: AAMI_CLASSES[j].name,
      abnormal: AAMI_CLASSES[j].abnormal,
      percent: (p * 100).toFixed(2)
    })
  }

  const confPercent = record.confidencePercent || ((record.confidence || 0) * 100).toFixed(1)
  let classInfo = null
  for (let k = 0; k < AAMI_CLASSES.length; k++) {
    if (AAMI_CLASSES[k].abbr === record.classAbbr) {
      classInfo = AAMI_CLASSES[k]
      break
    }
  }

  stopWave()
  setData({
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
    hasBatchNext: false
  })

  setTimeout(function() {
    _wave = waveAnimator.start({
      canvasId: 'ecgResultCanvas',
      data: record.ecgData,
      style: 'full',
      pointsPerFrame: 5,
      loop: true,
      loopDelay: 700,
      hudLabel: 'ECG · ' + (record.classAbbr || '') + ' · 250Hz'
    })
  }, 250)
}

function checkModelStatus() {
  const g = globalData
  if (g.isModelReady) {
    setData({ modelReady: true, modelLoading: false })
  } else if (g.modelLoading) {
    setData({ modelReady: false, modelLoading: true })
    const check = setInterval(function() {
      if (globalData.isModelReady) {
        setData({ modelReady: true, modelLoading: false })
        clearInterval(check)
      }
    }, 200)
  }
}

function bindEvents() {
  if (!root) return
  const importZone = root.querySelector('#importZone')
  if (importZone) importZone.addEventListener('click', triggerFileImport)

  root.querySelectorAll('[data-demo]').forEach(function(el) {
    el.addEventListener('click', function() {
      onUseDemoSample(parseInt(el.dataset.idx, 10))
    })
  })

  const batchPrev = root.querySelector('#batchPrev')
  if (batchPrev) batchPrev.addEventListener('click', onBatchPrev)
  const batchNext = root.querySelector('#batchNext')
  if (batchNext) batchNext.addEventListener('click', onBatchNext)

  const btnReset = root.querySelector('#btnReset')
  if (btnReset) btnReset.addEventListener('click', onReset)
  const btnDetect = root.querySelector('#btnDetect')
  if (btnDetect) btnDetect.addEventListener('click', onDetect)
  const btnDetectNext = root.querySelector('#btnDetectNext')
  if (btnDetectNext) btnDetectNext.addEventListener('click', onDetectNext)
  const btnSaveResult = root.querySelector('#btnSaveResult')
  if (btnSaveResult) btnSaveResult.addEventListener('click', onSaveResult)
}

export default {
  title: '心电检测',
  tab: 0,

  async mount(container, params) {
    root = container
    setData({ theme: globalData.theme })
    checkModelStatus()

    if (globalData.pendingHistoryId) {
      _pendingHistoryId = globalData.pendingHistoryId
      globalData.pendingHistoryId = null
    }
    if (_pendingHistoryId) {
      const loadId = _pendingHistoryId
      _pendingHistoryId = null
      setTimeout(function() { loadHistoryRecord(loadId) }, 300)
    }

    // 首次启动检查: 未填档案且未跳过 → 自动弹出
    const skipped = getStorageSync('profileSkipped')
    if (!skipped) {
      setTimeout(function() {
        profileSheet.show(true, function() {})
      }, 600)
    }
  },

  unmount() {
    stopWave()
    root = null
  },

  updateTheme(theme) {
    setData({ theme: theme })
  }
}
