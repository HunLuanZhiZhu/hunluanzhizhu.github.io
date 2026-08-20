// js/app.js — 心韵深辨 H5 全局逻辑 (由小程序 app.js 转化)
// 负责: TF.js初始化(浏览器原生)、模型权重加载(fetch简化)、全局状态管理、主题切换

import { loadWeights, predict } from './utils/ecgModel.js'
import { getStorageSync, setStorageSync } from './storage.js'

// 权重元数据 (offset以字节为单位, loadWeights内部会除以2转为fp16元素偏移)
// 与原小程序 app.js 中的硬编码完全一致
export const WEIGHTS_META = {
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

// AAMI分类标签 (与原小程序一致)
export const AAMI_CLASSES = [
  { idx: 0, abbr: 'F', name: '融合搏动', desc: 'Fusion beat', abnormal: true },
  { idx: 1, abbr: 'N', name: '正常心搏', desc: 'Normal beat', abnormal: false },
  { idx: 2, abbr: 'Q', name: '未知搏动', desc: 'Unclassifiable beat', abnormal: true },
  { idx: 3, abbr: 'S', name: '室上性早搏', desc: 'Supraventricular ectopic', abnormal: true },
  { idx: 4, abbr: 'V', name: '室性早搏', desc: 'Ventricular ectopic', abnormal: true }
]

// 全局状态 (对应小程序 app.globalData)
export const globalData = {
  weights: null,
  isModelReady: false,
  tfReady: false,
  modelLoading: false,
  pendingHistoryId: null,
  theme: 'light',  // 'light' or 'dark'
  userInfo: null,
  memberDetail: null,
  infoDetail: null
}

// 主题订阅者 (各页面注册, 主题切换时回调)
const themeListeners = []

export function onThemeChange(fn) {
  themeListeners.push(fn)
}

// 主题切换
export function toggleTheme() {
  const newTheme = globalData.theme === 'dark' ? 'light' : 'dark'
  globalData.theme = newTheme
  setStorageSync('theme', newTheme)
  applyThemeColors(newTheme)
  themeListeners.forEach(function(fn) {
    try { fn(newTheme) } catch (e) {}
  })
  return newTheme
}

// 应用主题到 body (对应 wx.setNavigationBarColor/setBackgroundColor)
export function applyThemeColors(theme) {
  const isDark = theme === 'dark'
  document.body.classList.toggle('dark', isDark)
  // 同步 meta theme-color (浏览器地址栏配色)
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = isDark ? '#000000' : '#F2F2F7'
}

// 初始化主题
export function initTheme() {
  const saved = getStorageSync('theme')
  if (saved && (saved === 'dark' || saved === 'light')) {
    globalData.theme = saved
  }
  applyThemeColors(globalData.theme)
  return globalData.theme
}

// 初始化TF.js (H5: 浏览器原生, 无polyfill/platform注入)
// 尝试 WebGL 后端, 失败降级 CPU (与原逻辑一致)
export async function initTF() {
  try {
    if (globalThis.tf && globalThis.tf.ready) {
      try {
        await globalThis.tf.setBackend('webgl')
      } catch (e) {
        console.log('WebGL后端不可用, 降级CPU:', e.message)
        await globalThis.tf.setBackend('cpu')
      }
      await globalThis.tf.ready()
      globalData.tfReady = true
      console.log('TF.js初始化成功, 后端:', globalThis.tf.getBackend())
    } else {
      console.error('TF.js未加载 (vendor/tf-core.min.js 缺失?)')
    }
  } catch (e) {
    console.error('TF.js初始化失败:', e)
    try {
      await globalThis.tf.setBackend('cpu')
      await globalThis.tf.ready()
      globalData.tfReady = true
      console.log('TF.js降级初始化成功')
    } catch (e2) {
      console.error('TF.js完全失败:', e2)
    }
  }
}

// 加载模型权重 (H5简化: fetch 静态 .bin, 删除解压/缓存链路)
export async function loadModel() {
  if (globalData.isModelReady) return globalData.weights
  if (globalData.modelLoading) {
    while (globalData.modelLoading) {
      await new Promise(r => setTimeout(r, 100))
    }
    return globalData.weights
  }

  globalData.modelLoading = true

  try {
    const res = await fetch('assets/weights_fp16.bin')
    if (!res.ok) throw new Error('权重下载失败: HTTP ' + res.status)
    const buffer = await res.arrayBuffer()
    console.log('权重加载, buffer size:', buffer.byteLength)

    globalData.weights = loadWeights(buffer, WEIGHTS_META)
    globalData.isModelReady = true
    console.log('模型权重加载完成')
    return globalData.weights
  } catch (e) {
    console.error('模型加载失败:', e)
    throw e
  } finally {
    globalData.modelLoading = false
  }
}

// 执行推理 (与原小程序完全一致)
export async function runInference(ecgData) {
  const weights = await loadModel()
  const result = await predict(ecgData, weights)

  const probsData = result.probs.dataSync()
  const logitsData = result.logits.dataSync()
  console.log('[推理] logits:', Array.from(logitsData))
  console.log('[推理] probsData:', Array.from(probsData))

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

  // 转为普通数组
  const probsArr = []
  for (let i = 0; i < probsData.length; i++) {
    probsArr.push(Number(probsData[i]))
  }
  const logitsArr = []
  for (let i = 0; i < logitsData.length; i++) {
    logitsArr.push(Number(logitsData[i]))
  }

  try {
    result.logits.dispose()
    result.probs.dispose()
  } catch (e) {}

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
