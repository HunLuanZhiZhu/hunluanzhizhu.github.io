// js/profileSheet.js — 个人档案半屏面板 (由小程序 components/profile-sheet 转化)
// 首次启动自动弹出, 后续可在"我的"页编辑

import { getStorageSync, setStorageSync } from './storage.js'

let el = null
let isFirstTime = false
let form = { name: '', gender: '', ageRange: '' }
let onSaveCallback = null

const AGE_RANGES = ['18-30', '31-45', '46-60', '60+']

// 创建面板 DOM (懒创建, 挂载到 body)
function ensureEl() {
  if (el) return el
  el = document.createElement('div')
  el.className = 'profile-sheet-root'
  el.innerHTML =
    '<div class="mask" id="profileMask">' +
      '<div class="sheet" id="profileSheet">' +
        '<div class="grabber"></div>' +
        '<div class="sheet-header">' +
          '<div class="sheet-title" id="sheetTitle"></div>' +
          '<div class="sheet-desc">心韵深辨会结合您的个人条件，对心电检测结果进行更精准的综合研判，提供更具针对性的健康参考建议。</div>' +
        '</div>' +
        '<div class="form">' +
          '<div class="form-item">' +
            '<div class="form-label">姓名 <span class="form-optional">选填</span></div>' +
            '<input class="form-input" id="profileNameInput" placeholder="请输入您的姓名" maxlength="20" />' +
          '</div>' +
          '<div class="form-item">' +
            '<div class="form-label">性别</div>' +
            '<div class="seg-control">' +
              '<div class="seg-item" data-val="male" data-gender>男</div>' +
              '<div class="seg-item" data-val="female" data-gender>女</div>' +
            '</div>' +
          '</div>' +
          '<div class="form-item">' +
            '<div class="form-label">年龄段</div>' +
            '<div class="seg-control seg-control-multi" id="ageSeg"></div>' +
          '</div>' +
        '</div>' +
        '<div class="sheet-actions">' +
          '<div class="btn-skip" id="btnSkip">跳过</div>' +
          '<div class="btn-save" id="btnSave">保存</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  document.body.appendChild(el)

  // 年龄分段
  const ageSeg = el.querySelector('#ageSeg')
  AGE_RANGES.forEach(function(range) {
    const seg = document.createElement('div')
    seg.className = 'seg-item'
    seg.dataset.val = range
    seg.dataset.age = '1'
    seg.textContent = range
    ageSeg.appendChild(seg)
  })

  // 事件
  el.querySelector('#profileMask').addEventListener('click', function(e) {
    if (e.target.id === 'profileMask') hide()
  })
  el.querySelector('#profileNameInput').addEventListener('input', function(e) {
    form.name = e.target.value
  })
  el.querySelectorAll('[data-gender]').forEach(function(seg) {
    seg.addEventListener('click', function() {
      form.gender = seg.dataset.val
      updateSegState()
    })
  })
  ageSeg.querySelectorAll('[data-age]').forEach(function(seg) {
    seg.addEventListener('click', function() {
      form.ageRange = seg.dataset.val
      updateSegState()
    })
  })
  el.querySelector('#btnSkip').addEventListener('click', function() {
    setStorageSync('profileSkipped', true)
    hide()
  })
  el.querySelector('#btnSave').addEventListener('click', function() {
    const info = {
      name: form.name || '',
      gender: form.gender || '',
      ageRange: form.ageRange || '',
      filledAt: Date.now()
    }
    setStorageSync('userInfo', info)
    setStorageSync('profileSkipped', true)
    if (onSaveCallback) onSaveCallback(info)
    hide()
  })
  return el
}

function updateSegState() {
  el.querySelectorAll('[data-gender]').forEach(function(seg) {
    seg.classList.toggle('seg-active', form.gender === seg.dataset.val)
  })
  el.querySelectorAll('[data-age]').forEach(function(seg) {
    seg.classList.toggle('seg-active', form.ageRange === seg.dataset.val)
  })
}

// 显示面板 (isFirstTime=true 首次, false 编辑)
export function show(isFirstTimeFlag, onSave) {
  isFirstTime = !!isFirstTimeFlag
  onSaveCallback = onSave || null
  const existing = getStorageSync('userInfo') || {}
  form = {
    name: existing.name || '',
    gender: existing.gender || '',
    ageRange: existing.ageRange || ''
  }
  ensureEl()
  el.querySelector('#sheetTitle').textContent = isFirstTime ? '完善个人档案' : '编辑个人档案'
  el.querySelector('#profileNameInput').value = form.name
  el.querySelector('#btnSkip').style.display = isFirstTime ? '' : 'none'
  updateSegState()
  const mask = el.querySelector('#profileMask')
  mask.classList.add('show')
  mask.querySelector('.sheet').classList.add('show')
}

// 隐藏
export function hide() {
  if (!el) return
  const mask = el.querySelector('#profileMask')
  mask.classList.remove('show')
  mask.querySelector('.sheet').classList.remove('show')
}
