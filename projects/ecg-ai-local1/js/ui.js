// js/ui.js — H5 自研 UI 组件 (替代 wx.showToast/showLoading/showModal/showActionSheet)
// 所有组件动态挂载到 body, 自动清理

let toastTimer = null
let loadingCount = 0

// ===== Toast =====
export function showToast({ title = '', icon = 'none', duration = 2000 } = {}) {
  removeEl('.ui-toast')
  const el = document.createElement('div')
  el.className = 'ui-toast'
  const iconMap = { success: '✓', none: '', error: '!' }
  const iconChar = iconMap[icon] || ''
  el.innerHTML = (iconChar ? '<span class="ui-toast-icon">' + iconChar + '</span>' : '') +
    '<span class="ui-toast-text">' + escapeHtml(title) + '</span>'
  document.body.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => el.remove(), 300)
  }, duration)
}

// ===== Loading =====
export function showLoading({ title = '加载中...' } = {}) {
  loadingCount++
  let el = document.querySelector('.ui-loading')
  if (!el) {
    el = document.createElement('div')
    el.className = 'ui-loading'
    el.innerHTML = '<div class="ui-loading-spinner"></div>' +
      '<div class="ui-loading-text">' + escapeHtml(title) + '</div>'
    document.body.appendChild(el)
  }
  el.classList.add('show')
}

export function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    const el = document.querySelector('.ui-loading')
    if (el) {
      el.classList.remove('show')
      setTimeout(() => el.remove(), 300)
    }
  }
}

// ===== Modal (确认对话框) =====
export function showModal({
  title = '',
  content = '',
  confirmText = '确定',
  cancelText = '取消',
  showCancel = true,
  confirmColor = '#007AFF',
  onConfirm = function() {},
  onCancel = function() {}
} = {}) {
  removeEl('.ui-modal')
  const mask = document.createElement('div')
  mask.className = 'ui-modal'
  mask.innerHTML =
    '<div class="ui-modal-mask"></div>' +
    '<div class="ui-modal-box">' +
      (title ? '<div class="ui-modal-title">' + escapeHtml(title) + '</div>' : '') +
      '<div class="ui-modal-content">' + escapeHtml(content).replace(/\n/g, '<br>') + '</div>' +
      '<div class="ui-modal-actions">' +
        (showCancel ? '<button class="ui-modal-btn ui-modal-cancel">' + escapeHtml(cancelText) + '</button>' : '') +
        '<button class="ui-modal-btn ui-modal-confirm" style="color:' + confirmColor + '">' + escapeHtml(confirmText) + '</button>' +
      '</div>' +
    '</div>'
  document.body.appendChild(mask)
  requestAnimationFrame(() => mask.classList.add('show'))

  function close() { mask.classList.remove('show'); setTimeout(() => mask.remove(), 250) }
  mask.querySelector('.ui-modal-mask').addEventListener('click', function() { close(); onCancel() })
  const cancelBtn = mask.querySelector('.ui-modal-cancel')
  if (cancelBtn) cancelBtn.addEventListener('click', function() { close(); onCancel() })
  mask.querySelector('.ui-modal-confirm').addEventListener('click', function() { close(); onConfirm() })
}

// ===== ActionSheet (底部菜单) =====
export function actionSheet({ itemList = [], onSelect = function() {}, cancelText = '取消' } = {}) {
  removeEl('.ui-sheet')
  const mask = document.createElement('div')
  mask.className = 'ui-sheet'
  mask.innerHTML =
    '<div class="ui-sheet-mask"></div>' +
    '<div class="ui-sheet-panel">' +
      '<div class="ui-sheet-list">' +
        itemList.map(function(item, i) {
          return '<button class="ui-sheet-item" data-idx="' + i + '">' + escapeHtml(item) + '</button>'
        }).join('') +
      '</div>' +
      '<button class="ui-sheet-cancel">' + escapeHtml(cancelText) + '</button>' +
    '</div>'
  document.body.appendChild(mask)
  requestAnimationFrame(() => mask.classList.add('show'))

  function close() { mask.classList.remove('show'); setTimeout(() => mask.remove(), 250) }
  mask.querySelector('.ui-sheet-mask').addEventListener('click', close)
  mask.querySelector('.ui-sheet-cancel').addEventListener('click', close)
  mask.querySelectorAll('.ui-sheet-item').forEach(function(btn) {
    btn.addEventListener('click', function() {
      close()
      onSelect(parseInt(btn.dataset.idx, 10))
    })
  })
}

function removeEl(sel) {
  const el = document.querySelector(sel)
  if (el) el.remove()
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
