// shim/ui.js — H5 自研 UI 组件（替代 wx.showToast/showLoading/showModal/showActionSheet）

(function(global) {
  var toastTimer = null
  var loadingCount = 0

  function removeEl(sel) {
    var el = document.querySelector(sel)
    if (el) el.remove()
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // ===== Toast =====
  function showToast(opts) {
    opts = opts || {}
    var title = opts.title || ''
    var icon = opts.icon || 'none'
    var duration = opts.duration || 2000
    removeEl('.ui-toast')
    var el = document.createElement('div')
    el.className = 'ui-toast'
    var iconMap = { success: '✓', error: '!', none: '' }
    var iconChar = iconMap[icon] || ''
    el.innerHTML = (iconChar ? '<span class="ui-toast-icon">' + iconChar + '</span>' : '') +
      '<span class="ui-toast-text">' + escapeHtml(title) + '</span>'
    document.body.appendChild(el)
    requestAnimationFrame(function() { el.classList.add('show') })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(function() {
      el.classList.remove('show')
      setTimeout(function() { el.remove() }, 300)
    }, duration)
  }

  // ===== Loading =====
  function showLoading(opts) {
    opts = opts || {}
    var title = opts.title || '加载中...'
    loadingCount++
    var el = document.querySelector('.ui-loading')
    if (!el) {
      el = document.createElement('div')
      el.className = 'ui-loading'
      el.innerHTML = '<div class="ui-loading-spinner"></div><div class="ui-loading-text">' + escapeHtml(title) + '</div>'
      document.body.appendChild(el)
    }
    el.classList.add('show')
  }

  function hideLoading() {
    loadingCount = Math.max(0, loadingCount - 1)
    if (loadingCount === 0) {
      var el = document.querySelector('.ui-loading')
      if (el) {
        el.classList.remove('show')
        setTimeout(function() { el.remove() }, 300)
      }
    }
  }

  // ===== Modal =====
  function showModal(opts) {
    opts = opts || {}
    var title = opts.title || ''
    var content = opts.content || ''
    var confirmText = opts.confirmText || '确定'
    var cancelText = opts.cancelText || '取消'
    var showCancel = opts.showCancel !== false
    var confirmColor = opts.confirmColor || '#007AFF'
    var onConfirm = opts.success && function(res) { if (res && res.confirm) opts.success(res) }
    var onCancel = opts.success && function() { opts.success({ confirm: false }) }

    removeEl('.ui-modal')
    var mask = document.createElement('div')
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
    requestAnimationFrame(function() { mask.classList.add('show') })

    function close() {
      mask.classList.remove('show')
      setTimeout(function() { mask.remove() }, 250)
    }
    mask.querySelector('.ui-modal-mask').addEventListener('click', function() { close(); if (onCancel) onCancel() })
    var cancelBtn = mask.querySelector('.ui-modal-cancel')
    if (cancelBtn) cancelBtn.addEventListener('click', function() { close(); if (onCancel) onCancel() })
    mask.querySelector('.ui-modal-confirm').addEventListener('click', function() { close(); if (onConfirm) onConfirm({ confirm: true }) })
  }

  // ===== ActionSheet =====
  function showActionSheet(opts) {
    opts = opts || {}
    var itemList = opts.itemList || []
    var success = opts.success || function() {}

    removeEl('.ui-sheet')
    var mask = document.createElement('div')
    mask.className = 'ui-sheet'
    mask.innerHTML =
      '<div class="ui-sheet-mask"></div>' +
      '<div class="ui-sheet-panel">' +
        '<div class="ui-sheet-list">' +
          itemList.map(function(item, i) {
            return '<button class="ui-sheet-item" data-idx="' + i + '">' + escapeHtml(item) + '</button>'
          }).join('') +
        '</div>' +
        '<button class="ui-sheet-cancel">取消</button>' +
      '</div>'
    document.body.appendChild(mask)
    requestAnimationFrame(function() { mask.classList.add('show') })

    function close() {
      mask.classList.remove('show')
      setTimeout(function() { mask.remove() }, 250)
    }
    mask.querySelector('.ui-sheet-mask').addEventListener('click', close)
    mask.querySelector('.ui-sheet-cancel').addEventListener('click', close)
    mask.querySelectorAll('.ui-sheet-item').forEach(function(btn) {
      btn.addEventListener('click', function() {
        close()
        success({ tapIndex: parseInt(btn.dataset.idx, 10) })
      })
    })
  }

  global.__ui = {
    showToast: showToast,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showModal: showModal,
    showActionSheet: showActionSheet
  }
})(window)
