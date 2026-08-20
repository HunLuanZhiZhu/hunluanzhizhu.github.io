// js/profileSheet.js — 个人档案半屏面板 (H5, 三段式)
// 来源: components/profile-sheet/profile-sheet.wxml + profile-sheet.js
// 分段: 0=基础信息(姓名/性别/年限) 1=过敏史 2=慢性疾病(多选)
// 存储: userInfo 三段 + profileSkipped

import { getStorageSync, setStorageSync } from './storage.js'
import { globalData } from './app.js'

let el = null
let form = { name: '', gender: '', ageRange: '', hasAllergies: false, foodAllergies: '', drugAllergies: '', otherAllergies: '', hasChronicDisease: false, chronicDiseases: [], chronicOther: '' }
let activeTab = 0
let isFirstTime = false
let onSaveCallback = null

const AGE_RANGES = ['18-30', '31-45', '46-60', '60+']
const CHRONIC_OPTIONS = ['高血压', '冠心病', '糖尿病', '心律失常', '心力衰竭', '心肌病', '心脏瓣膜病', '高血脂']

function ensureEl() {
  if (el) return el
  el = document.createElement('div')
  el.className = 'profile-sheet-root'
  el.innerHTML =
    '<div class="mask" id="profileMask"><div class="sheet" id="profileSheet">'
    + '<div class="grabber"></div>'
    + '<div class="sheet-header"><div class="sheet-title" id="sheetTitle"></div><div class="sheet-desc">心韵深辨会结合您的个人条件，对心电检测结果进行更精准的综合研判，提供更具针对性的健康参考建议。</div></div>'
    + '<div class="tab-bar" id="profileTabBar">'
    + '<div class="tab-item" data-tab="0">基础信息</div><div class="tab-item" data-tab="1">过敏史</div><div class="tab-item" data-tab="2">慢性疾病</div>'
    + '</div>'
    + '<div class="form" id="form0"></div>'
    + '<div class="form" id="form1" style="display:none"></div>'
    + '<div class="form" id="form2" style="display:none"></div>'
    + '<div class="sheet-actions"><div class="btn-skip" id="btnSkip">跳过</div><div class="btn-save" id="btnSave">保存</div></div>'
    + '</div></div>'
  document.body.appendChild(el)
  bindSheetEvents()
  return el
}

function renderForm() {
  const f0 = el.querySelector('#form0')
  const f1 = el.querySelector('#form1')
  const f2 = el.querySelector('#form2')
  f0.style.display = activeTab === 0 ? '' : 'none'
  f1.style.display = activeTab === 1 ? '' : 'none'
  f2.style.display = activeTab === 2 ? '' : 'none'
  // tab active
  el.querySelectorAll('#profileTabBar .tab-item').forEach(t => t.classList.toggle('tab-active', parseInt(t.dataset.tab, 10) === activeTab))

  f0.innerHTML =
    '<div class="form-item"><div class="form-label">姓名 <span class="form-optional">选填</span></div><input class="form-input" id="inName" placeholder="请输入您的姓名" maxlength="20" value="' + escAttr(form.name) + '" /></div>'
    + '<div class="form-item"><div class="form-label">性别</div><div class="seg-control"><div class="seg-item ' + (form.gender === 'male' ? 'seg-active' : '') + '" data-gender="male">男</div><div class="seg-item ' + (form.gender === 'female' ? 'seg-active' : '') + '" data-gender="female">女</div></div></div>'
    + '<div class="form-item"><div class="form-label">年龄段</div><div class="seg-control seg-control-multi">' + AGE_RANGES.map(r => '<div class="seg-item ' + (form.ageRange === r ? 'seg-active' : '') + '" data-age="' + r + '">' + r + '</div>').join('') + '</div></div>'

  f1.innerHTML =
    '<div class="form-item"><div class="toggle-row"><div class="form-label">是否有过敏史</div><div class="toggle-switch ' + (form.hasAllergies ? 'toggle-on' : '') + '" data-toggle-allergy><div class="toggle-knob"></div></div></div></div>'
    + (form.hasAllergies
      ? '<div class="form-item"><div class="form-label">食物过敏</div><input class="form-input" placeholder="如：海鲜、花生、牛奶等" value="' + escAttr(form.foodAllergies) + '" data-field="foodAllergies" /></div>'
        + '<div class="form-item"><div class="form-label">药物过敏</div><input class="form-input" placeholder="如：青霉素、阿司匹林等" value="' + escAttr(form.drugAllergies) + '" data-field="drugAllergies" /></div>'
        + '<div class="form-item"><div class="form-label">其他过敏 <span class="form-optional">选填</span></div><input class="form-input" placeholder="如：花粉、尘螨等" value="' + escAttr(form.otherAllergies) + '" data-field="otherAllergies" /></div>'
      : '<div class="empty-hint"><div class="empty-hint-icon">✓</div><div class="empty-hint-text">暂无过敏史</div></div>')

  f2.innerHTML =
    '<div class="form-item"><div class="toggle-row"><div class="form-label">是否有慢性疾病</div><div class="toggle-switch ' + (form.hasChronicDisease ? 'toggle-on' : '') + '" data-toggle-chronic><div class="toggle-knob"></div></div></div></div>'
    + (form.hasChronicDisease
      ? '<div class="form-item"><div class="form-label">选择慢性疾病</div><div class="checkbox-grid">' + CHRONIC_OPTIONS.map(o => '<div class="checkbox-item ' + (form.chronicDiseases.includes(o) ? 'checkbox-checked' : '') + '" data-chronic="' + o + '">' + o + '</div>').join('') + '</div></div>'
        + '<div class="form-item"><div class="form-label">其他 <span class="form-optional">选填</span></div><input class="form-input" placeholder="请输入其他慢性疾病" value="' + escAttr(form.chronicOther) + '" data-field="chronicOther" /></div>'
      : '<div class="empty-hint"><div class="empty-hint-icon">✓</div><div class="empty-hint-text">暂无慢性疾病</div></div>')

  // re-bind dynamic inputs
  f0.querySelectorAll('[data-gender]').forEach(e => e.addEventListener('click', () => { form.gender = e.dataset.gender; renderForm() }))
  f0.querySelectorAll('[data-age]').forEach(e => e.addEventListener('click', () => { form.ageRange = e.dataset.age; renderForm() }))
  const ta = f1.querySelector('[data-toggle-allergy]'); if (ta) ta.addEventListener('click', () => { form.hasAllergies = !form.hasAllergies; renderForm() })
  const tc = f2.querySelector('[data-toggle-chronic]'); if (tc) tc.addEventListener('click', () => { form.hasChronicDisease = !form.hasChronicDisease; renderForm() })
  f2.querySelectorAll('[data-chronic]').forEach(e => e.addEventListener('click', () => {
    const v = e.dataset.chronic; const i = form.chronicDiseases.indexOf(v)
    if (i > -1) form.chronicDiseases.splice(i, 1); else form.chronicDiseases.push(v)
    renderForm()
  }))
  el.querySelectorAll('[data-field]').forEach(inp => inp.addEventListener('input', () => {
    const k = inp.dataset.field
    form[k] = inp.value
  }))
  const nameIn = el.querySelector('#inName'); if (nameIn) nameIn.addEventListener('input', () => { form.name = nameIn.value })
  el.querySelectorAll('#profileTabBar .tab-item').forEach(t => t.addEventListener('click', () => { activeTab = parseInt(t.dataset.tab, 10); renderForm() }))
}

function bindSheetEvents() {
  el.querySelector('#profileMask').addEventListener('click', e => { if (e.target.id === 'profileMask' && !isFirstTime) hide() })
  el.querySelector('#btnSkip').addEventListener('click', () => { setStorageSync('profileSkipped', true); hide() })
  el.querySelector('#btnSave').addEventListener('click', () => {
    const info = {
      name: form.name || '', gender: form.gender || '', ageRange: form.ageRange || '',
      hasAllergies: !!form.hasAllergies, foodAllergies: form.foodAllergies || '', drugAllergies: form.drugAllergies || '', otherAllergies: form.otherAllergies || '',
      hasChronicDisease: !!form.hasChronicDisease, chronicDiseases: form.chronicDiseases.slice(), chronicOther: form.chronicOther || '',
      filledAt: Date.now()
    }
    setStorageSync('userInfo', info)
    setStorageSync('profileSkipped', true)
    if (globalData) globalData.userInfo = info
    if (onSaveCallback) try { onSaveCallback(info) } catch (e) {}
    hide()
  })
}

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

export function show(isFirstTimeFlag, tabOrCallback, maybeCallback) {
  let tab = 0, cb = null
  if (typeof tabOrCallback === 'function') cb = tabOrCallback
  else if (typeof tabOrCallback === 'number') { tab = tabOrCallback; if (typeof maybeCallback === 'function') cb = maybeCallback }
  else if (tabOrCallback && typeof tabOrCallback === 'object') cb = null
  isFirstTime = !!isFirstTimeFlag
  activeTab = tab
  onSaveCallback = cb
  const existing = getStorageSync('userInfo') || {}
  form = {
    name: existing.name || '', gender: existing.gender || '', ageRange: existing.ageRange || '',
    hasAllergies: !!existing.hasAllergies, foodAllergies: existing.foodAllergies || '', drugAllergies: existing.drugAllergies || '', otherAllergies: existing.otherAllergies || '',
    hasChronicDisease: !!existing.hasChronicDisease, chronicDiseases: (existing.chronicDiseases || []).slice(), chronicOther: existing.chronicOther || ''
  }
  ensureEl()
  el.querySelector('#sheetTitle').textContent = isFirstTime ? '完善个人档案' : '编辑个人档案'
  el.querySelector('#btnSkip').style.display = isFirstTime ? '' : 'none'
  const mask = el.querySelector('#profileMask')
  mask.classList.add('show'); mask.querySelector('.sheet').classList.add('show')
  // 同步 sheet 深色（与全局 theme 一致）
  if (globalData && globalData.theme === 'dark') mask.classList.add('dark'); else mask.classList.remove('dark')
  renderForm()
}

export function hide() {
  if (!el) return
  const mask = el.querySelector('#profileMask')
  mask.classList.remove('show'); mask.querySelector('.sheet').classList.remove('show')
}
