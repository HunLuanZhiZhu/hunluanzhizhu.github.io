/* Auto-wrapped by tools/wrap-cjs.js — 原代码未改动 */
__defineModule("utils/fileParser.js", function(module, exports, require) {
// utils/fileParser.js — ECG数据文件解析器
// 从 detect.js 提取, 支持 JSON/CSV/TXT 三种格式
// 性能优化: 懒加载模块, 仅在实际导入文件时才加载(节省约5.5KB首页解析开销)

/**
 * 解析心电数据文件内容
 * @param {string} content - 文件原始内容
 * @param {string} fileName - 文件名(用于判断扩展名)
 * @returns {{ type: 'single'|'multi', data?: number[], records?: Array }}
 */
function parseData(content, fileName) {
  var ext = fileName.split('.').pop().toLowerCase()

  if (ext === 'json') {
    var obj = JSON.parse(content)
    if (obj.records && Array.isArray(obj.records)) {
      var records = []
      for (var i = 0; i < obj.records.length; i++) {
        var r = obj.records[i]
        var d = Array.isArray(r) ? r : r.data
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
        var multiRecords = []
        for (var mi = 0; mi < obj.length; mi++) {
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
    var lines = content.trim().split('\n')
    var firstCells = lines[0].trim().split(',')
    var firstAllNum = firstCells.every(function(c) { return !isNaN(parseFloat(c)) })

    if (firstAllNum && firstCells.length >= 260) {
      var csvRecs = []
      for (var ci = 0; ci < lines.length; ci++) {
        var cells = lines[ci].trim().split(',')
        var vals = []
        for (var ck = 0; ck < cells.length; ck++) {
          var v = parseFloat(cells[ck])
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
      var oldRecs = []
      for (var ri = 1; ri < lines.length; ri++) {
        var parts = lines[ri].trim().split(',')
        if (parts.length < 3) continue
        var csvLabel = parts[1] || ('记录' + ri)
        var csvData = []
        for (var vi = 2; vi < parts.length; vi++) {
          var vv = parseFloat(parts[vi])
          if (!isNaN(vv)) csvData.push(vv)
        }
        if (csvData.length >= 260) {
          oldRecs.push({ label: csvLabel, labelName: csvLabel, data: csvData.slice(0, 260) })
        }
      }
      if (oldRecs.length > 0) return { type: 'multi', records: oldRecs }
    }

    var singleData = []
    for (var di = 0; di < lines.length; di++) {
      var v2 = parseFloat(lines[di].trim())
      if (!isNaN(v2)) singleData.push(v2)
    }
    if (singleData.length >= 260) return { type: 'single', data: singleData.slice(0, 260) }
    throw new Error('CSV中无有效数据')
  }

  if (ext === 'txt') {
    var trimmed = content.trim()
    var txtLines = trimmed.split('\n')
    if (txtLines.length > 1) {
      var txtRecs = []
      for (var ti = 0; ti < txtLines.length; ti++) {
        var parts = txtLines[ti].trim().split(/[, \t]+/)
        var vals = []
        for (var pi = 0; pi < parts.length; pi++) {
          var tv = parseFloat(parts[pi])
          if (!isNaN(tv)) vals.push(tv)
        }
        if (vals.length >= 260) {
          txtRecs.push({ label: '记录' + (ti + 1), labelName: '记录' + (ti + 1), data: vals.slice(0, 260) })
        }
      }
      if (txtRecs.length > 1) return { type: 'multi', records: txtRecs }
      if (txtRecs.length === 1) return { type: 'single', data: txtRecs[0].data }
    }
    var txtData = trimmed.split(/[, \n]+/).map(function(v) { return parseFloat(v) }).filter(function(v) { return !isNaN(v) })
    if (txtData.length >= 260) return { type: 'single', data: txtData.slice(0, 260) }
    throw new Error('TXT中无有效数据')
  }

  throw new Error('不支持的文件格式: ' + ext)
}

module.exports = { parseData: parseData }

});
