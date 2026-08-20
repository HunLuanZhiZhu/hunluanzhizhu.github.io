/* Auto-wrapped */
__defineModule("utils/exportHelper.js", function(module, exports, require) {
// utils/exportHelper.js — 历史记录导出工具（H5 适配版）
// 原版用 wx 文件系统+shareFileMessage，H5 改为 Blob + <a download>
// 导出数据结构与原版完全一致

function getDateStr() {
  var d = new Date()
  var pad = function(n) { return n < 10 ? '0' + n : '' + n }
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
}

// 触发浏览器下载
function downloadBlob(content, filename, mime) {
  var blob = new Blob([content], { type: mime })
  var url = URL.createObjectURL(blob)
  var a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(function() { URL.revokeObjectURL(url) }, 2000)
}

// 导出历史记录: ActionSheet 选格式 → Blob 下载
function exportAndShare(history) {
  if (!history || history.length === 0) {
    wx.showToast({ title: '暂无历史记录', icon: 'none' })
    return
  }

  wx.showActionSheet({
    itemList: ['导出为 JSON', '导出为 CSV'],
    success: function(res) {
      if (res.tapIndex === 0) {
        exportJSON(history)
      } else if (res.tapIndex === 1) {
        exportCSV(history)
      }
    }
  })
}

function exportJSON(history) {
  var exportData = {
    app: '心韵深辨',
    exportTime: new Date().toLocaleString(),
    totalRecords: history.length,
    records: history.map(function(r) {
      return {
        id: r.id,
        time: new Date(r.timestamp).toLocaleString(),
        classification: r.className + ' (' + r.classAbbr + ')',
        isAbnormal: r.isAbnormal,
        confidence: r.confidencePercent + '%',
        ecgData: r.ecgData,
        probabilities: r.probabilities
      }
    })
  }
  var jsonStr = JSON.stringify(exportData, null, 2)
  downloadBlob(jsonStr, '心韵深辨_检测记录_' + getDateStr() + '.json', 'application/json')
  wx.showToast({ title: '已导出', icon: 'success' })
}

function exportCSV(history) {
  var header = '序号,时间,分类,缩写,是否异常,置信度,ECG数据\n'
  var rows = history.map(function(r, i) {
    var ecgStr = (r.ecgData || []).join(';')
    var row = [
      i + 1,
      new Date(r.timestamp).toLocaleString(),
      r.className,
      r.classAbbr,
      r.isAbnormal ? '异常' : '正常',
      r.confidencePercent + '%',
      ecgStr
    ].map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"' }).join(',')
    return row
  })
  var csvContent = '\uFEFF' + header + rows.join('\n')
  downloadBlob(csvContent, '心韵深辨_检测记录_' + getDateStr() + '.csv', 'text/csv;charset=utf-8')
  wx.showToast({ title: '已导出', icon: 'success' })
}

module.exports = {
  exportAndShare: exportAndShare
}

});
