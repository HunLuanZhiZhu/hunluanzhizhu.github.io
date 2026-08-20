// tools/wxml2html.js — WXML → HTML 转换脚本（v2 逐字符解析器）
// 用法: node tools/wxml2html.js
// 正确处理属性值内的 {{expr}} 含 > < 的情况

const fs = require('fs')
const path = require('path')

const SRC_DIR = path.join(__dirname, '..', 'templates')
const EXT_MAP = {
  view: 'div', text: 'span', block: 'block', image: 'img', input: 'input',
  button: 'button', canvas: 'canvas', 'scroll-view': 'div', swiper: 'div',
  'swiper-item': 'div', label: 'label', textarea: 'textarea', navigator: 'div',
  'page-meta': 'page-meta'
}

// ===== 逐字符 WXML 解析器 =====
// 返回 DOM 树: {tag, attrs:[[name,value]], children:[node|string]}
function parseWxml(src) {
  let pos = 0
  const len = src.length

  function parseNode() {
    // 跳过空白
    while (pos < len && /\s/.test(src[pos])) pos++
    if (pos >= len) return null

    if (src[pos] === '<') {
      // 注释
      if (src.startsWith('<!--', pos)) {
        const end = src.indexOf('-->', pos)
        pos = end > 0 ? end + 3 : len
        return parseNode()
      }
      // 结束标签
      if (src[pos + 1] === '/') {
        const gt = src.indexOf('>', pos)
        pos = gt + 1
        return { closing: true, tag: src.slice(pos, gt).trim() } // 简化：由上层处理
      }
      // 开始标签
      pos++ // 跳过 <
      let tagName = ''
      while (pos < len && !/\s/.test(src[pos]) && src[pos] !== '>' && src[pos] !== '/') {
        tagName += src[pos++]
      }
      // 解析属性
      const attrs = []
      while (pos < len && src[pos] !== '>') {
        if (src[pos] === '/') { pos++; continue } // 自闭合
        if (/\s/.test(src[pos])) { pos++; continue }
        // 属性名
        let name = ''
        while (pos < len && !/[\s=/>]/.test(src[pos])) { name += src[pos++] }
        // 跳过空白与 =
        while (pos < len && (/\s/.test(src[pos]) || src[pos] === '=')) pos++
        let value = ''
        if (src[pos] === '"' || src[pos] === "'") {
          const quote = src[pos++]
          while (pos < len && src[pos] !== quote) { value += src[pos++] }
          pos++ // 跳过闭合引号
        } else if (src[pos] === '{' && src[pos + 1] === '{') {
          // 无引号 {{}} 属性（少见）
          const end = src.indexOf('}}', pos) + 2
          value = src.slice(pos, end)
          pos = end
        }
        attrs.push({ name: name, value: value })
      }
      // 检查是否自闭合（/> 或 无子内容）
      const selfClosing = src[pos - 1] === '/' || src.slice(pos - 2, pos) === ' /' || src.slice(pos - 1, pos) === '/'
      // 向前看：是 /> 结束还是 > 结束
      // 我们已经消费了 '>'，回溯判断
      const beforeGt = src.slice(0, pos)
      const isSelfClose = /\/\s*>$/.test(beforeGt.slice(beforeGt.lastIndexOf('<')) || '')
      // 简化：检查标签后面是否是立即结束标签
      pos++ // 跳过 >

      // 自闭合标签
      if (isSelfClose || ['img', 'input', 'br', 'page-meta', 'image'].indexOf(tagName) >= 0) {
        return { tag: tagName, attrs: attrs, children: [], selfClosing: true }
      }

      // 解析子节点直到匹配的结束标签
      const children = []
      const closeTag = '</' + tagName + '>'
      while (pos < len) {
        // 找下一个 <
        const nextLt = src.indexOf('<', pos)
        if (nextLt < 0) {
          const text = src.slice(pos).replace(/\s+/g, ' ').trim()
          if (text) children.push(text)
          pos = len
          break
        }
        // 文本节点
        if (nextLt > pos) {
          const text = src.slice(pos, nextLt)
          if (text.trim()) children.push(text.trim())
          pos = nextLt
        }
        // 注释
        if (src.startsWith('<!--', pos)) {
          const end = src.indexOf('-->', pos)
          pos = end > 0 ? end + 3 : len
          continue
        }
        // 结束标签
        if (src.startsWith(closeTag, pos)) {
          pos += closeTag.length
          return { tag: tagName, attrs: attrs, children: children }
        }
        // 其他标签（可能是不匹配的结束）
        if (src[pos + 1] === '/') {
          // 不匹配的结束标签，跳到 >
          const gt = src.indexOf('>', pos)
          pos = gt + 1
          continue
        }
        // 子元素
        const child = parseNode()
        if (child) children.push(child)
      }
      return { tag: tagName, attrs: attrs, children: children }
    }

    // 裸文本（模板开始处）
    const lt = src.indexOf('<', pos)
    if (lt < 0) {
      const text = src.slice(pos).replace(/\s+/g, ' ').trim()
      pos = len
      return text ? text : null
    }
    const text = src.slice(pos, lt)
    pos = lt
    return text.trim() ? text : null
  }

  const root = { tag: '#root', attrs: [], children: [] }
  while (pos < len) {
    const node = parseNode()
    if (node && typeof node === 'object' && !node.closing) root.children.push(node)
  }
  return root
}

// ===== 渲染 =====
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function renderNode(node, out) {
  if (typeof node === 'string') {
    out.push(node)
    return
  }
  const tag = node.tag
  const lower = tag.toLowerCase()

  if (lower === 'block') {
    for (const child of node.children) renderNode(child, out)
    return
  }
  if (lower === 'page-meta') return

  // 自定义组件（含 - 且非 scroll-view）→ data-wx-component 占位
  if (lower.indexOf('-') > 0 && lower !== 'scroll-view') {
    var compId = ''
    for (var ci = 0; ci < node.attrs.length; ci++) {
      if (node.attrs[ci].name === 'id') compId = node.attrs[ci].value
    }
    out.push('<div data-wx-component="' + lower + '" data-component-id="' + compId + '"')
    // 保留 bind:save 等事件
    for (var ce = 0; ce < node.attrs.length; ce++) {
      var an = node.attrs[ce].name
      var av = node.attrs[ce].value || ''
      if (an.startsWith('bind:')) {
        out.push(' data-bind="custom:' + av + '"')
      }
    }
    out.push('></div>')
    return
  }

  const htmlTag = EXT_MAP[lower] || 'div'
  out.push('<' + htmlTag)

  for (const attr of node.attrs) {
    const name = attr.name
    let value = attr.value || ''
    if (name === 'wx:if') { out.push(' data-wx-if="' + esc(value) + '"'); continue }
    if (name === 'wx:else') { out.push(' data-wx-else'); continue }
    if (name === 'wx:for') { out.push(' data-wx-for="' + esc(value) + '"'); continue }
    if (name === 'wx:for-item') { out.push(' data-wx-for-item="' + esc(value) + '"'); continue }
    if (name === 'wx:for-index') { out.push(' data-wx-for-index="' + esc(value) + '"'); continue }
    if (name === 'wx:key') { out.push(' data-wx-key="' + esc(value) + '"'); continue }

    if (name.startsWith('catch')) {
      const method = value
      out.push(' data-bind="catch:' + method + '"')
      continue
    }
    if (name.startsWith('bind:')) {
      const method = value
      out.push(' data-bind="custom:' + method + '"')
      continue
    }
    if (name.startsWith('bind')) {
      const eventName = name.slice(4)
      const method = value
      // bindtap → tap, bindinput → input, bindchange → change, bindscroll → scroll
      const typeMap = { tap: 'tap', input: 'input', change: 'change', scroll: 'scroll' }
      out.push(' data-bind="' + (typeMap[eventName] || 'tap') + ':' + method + '"')
      continue
    }

    // 布尔属性
    if (value === '' && ['disabled', 'autoplay', 'circular'].indexOf(name) >= 0) {
      out.push(' ' + name)
      continue
    }

    out.push(' ' + name + '="' + esc(value) + '"')
  }

  out.push('>')
  for (const child of node.children) renderNode(child, out)
  out.push('</' + htmlTag + '>')
}

function convertFile(file) {
  const src = fs.readFileSync(file, 'utf-8')
  const tree = parseWxml(src)
  const out = []
  for (const child of tree.children) renderNode(child, out)
  const html = out.join('')
  const dest = file.replace(/\.wxml$/, '.html')
  fs.writeFileSync(dest, html, 'utf-8')
  console.log('转换:', path.basename(file), '→', html.length, 'bytes')
}

const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.wxml'))
files.forEach(f => convertFile(path.join(SRC_DIR, f)))
console.log('完成，共转换', files.length, '个模板')
