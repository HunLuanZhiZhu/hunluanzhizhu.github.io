// shim/template.js — WXML 渲染引擎
// 转换后的 HTML 保留 {{expr}} + data-wx-if/for/else + data-bind 指令
// render(template, data) 递归处理指令并求值插值

(function(global) {
  var exprCache = {}

  // 求值 {{expr}} 内的表达式（无方法调用，安全）
  function evalExpr(expr, data) {
    var key = expr
    var fn = exprCache[key]
    if (!fn) {
      try {
        fn = new Function('data', 'with(data||{}){return (' + expr + ')}')
      } catch (e) {
        fn = function() { return '' }
      }
      exprCache[key] = fn
    }
    try {
      var v = fn(data)
      return v === undefined || v === null ? '' : v
    } catch (e) {
      return ''
    }
  }

  // 替换字符串中所有 {{expr}}
  function interpolate(str, data) {
    if (str.indexOf('{{') < 0) return str
    return str.replace(/\{\{([^}]+)\}\}/g, function(_, expr) {
      return evalExpr(expr.trim(), data)
    })
  }

  // 清洗表达式：剥掉 {{ }} 与两端空白
  function cleanExpr(expr) {
    if (!expr) return expr
    expr = String(expr).trim()
    if (expr.indexOf('{{') === 0 && expr.lastIndexOf('}}') === expr.length - 2) {
      expr = expr.slice(2, -2).trim()
    }
    // 去掉包裹引号（如 data-wx-if="{{'x'}}"）
    if ((expr[0] === '"' && expr[expr.length-1] === '"') || (expr[0] === "'" && expr[expr.length-1] === "'")) {
      expr = expr.slice(1, -1)
    }
    return expr
  }

  // 解析 data-wx-if / data-wx-for 表达式（含 for-item）
  // wx:for="{{list}}" wx:for-item="item" wx:key="id"
  function parseDirectives(el, data) {
    var out = { show: true, forEach: null, itemVar: 'item', indexVar: 'index' }

    var ifExpr = el.getAttribute ? el.getAttribute('data-wx-if') : null
    if (ifExpr !== null && ifExpr !== undefined) {
      out.show = !!evalExpr(cleanExpr(ifExpr), data)
    }
    var elseAttr = el.getAttribute ? el.getAttribute('data-wx-else') : null
    if (elseAttr !== null && elseAttr !== undefined) {
      // wx:else 需要结合前一个兄弟节点，由 render 层处理
      out.isElse = true
    }
    var forExpr = el.getAttribute ? el.getAttribute('data-wx-for') : null
    if (forExpr !== null && forExpr !== undefined) {
      out.forEach = evalExpr(cleanExpr(forExpr), data) || []
    }
    var itemVar = el.getAttribute && el.getAttribute('data-wx-for-item')
    if (itemVar) out.itemVar = itemVar
    var indexVar = el.getAttribute && el.getAttribute('data-wx-for-index')
    if (indexVar) out.indexVar = indexVar
    return out
  }

  // 生成元素 HTML（含子节点递归 + 插值 + 指令）
  function renderNode(node, data) {
    if (node.nodeType === 3) {
      // 文本节点
      return interpolate(node.nodeValue, data)
    }
    if (node.nodeType !== 1) return ''

    var tag = node.tagName.toLowerCase()
    // block 无实际元素，直接渲染子节点
    if (tag === 'block') {
      return renderChildren(node, data)
    }
    if (tag === 'page-meta') return '' // 移除
    // 自定义组件 <profile-sheet> → 占位，由 runtime 挂组件
    if (tag.indexOf('-') > 0 && tag !== 'scroll-view') {
      return '<div data-wx-component="' + tag + '" data-component-id="' + (node.getAttribute('id') || '') + '"></div>'
    }

    var dirs = parseDirectives(node, data)

    // wx:if 处理（含 wx:else 由调用方处理，这里只处理自身 if）
    if (dirs.isElse === undefined && !dirs.show) return ''
    if (dirs.isElse !== undefined && !node._elseShow) return ''

    // wx:for 展开
    if (dirs.forEach !== undefined && dirs.forEach !== null) {
      var items = dirs.forEach
      var html = ''
      for (var i = 0; i < items.length; i++) {
        var itemData = Object.assign({}, data)
        itemData[dirs.itemVar] = items[i]
        itemData[dirs.indexVar] = i
        // wx:key="id" / "abbr" / "*this"
        html += renderNodeWithData(node, itemData)
      }
      return html
    }

    return renderNodeWithData(node, data)
  }

  // 渲染单个节点（data 已含 item/index 作用域）
  function renderNodeWithData(node, data) {
    // 处理 wx:else 兄弟链：找前一个兄弟是否有 wx:if 且为假
    var tag = node.tagName.toLowerCase()
    var html = '<' + tag

    // 属性：插值 + 移除指令属性
    for (var i = 0; i < node.attributes.length; i++) {
      var attr = node.attributes[i]
      var name = attr.name
      var value = attr.value
      if (name.indexOf('data-wx-') === 0) continue
      if (name === 'data-bind') continue
      if (name === 'data-component-id') continue
      if (name === 'data-wx-component') continue
      // 布尔属性
      var val = interpolate(value, data)
      html += ' ' + name + '="' + val.replace(/"/g, '&quot;') + '"'
    }

    // data-bind 保留（事件委托用）
    var bind = node.getAttribute('data-bind')
    if (bind) html += ' data-bind="' + bind + '"'

    html += '>'
    html += renderChildren(node, data)
    html += '</' + tag + '>'
    return html
  }

  function renderChildren(node, data) {
    var html = ''
    var children = node.childNodes
    for (var i = 0; i < children.length; i++) {
      var child = children[i]
      // 处理 wx:else：若前一个兄弟是 wx:if 且条件为假，则渲染本节点
      if (child.nodeType === 1 && child.getAttribute && child.getAttribute('data-wx-else') !== null) {
        var prev = children[i - 1]
        var prevShow = true
        if (prev && prev.nodeType === 1) {
          var prevIf = prev.getAttribute && prev.getAttribute('data-wx-if')
          if (prevIf !== null && prevIf !== undefined) {
            prevShow = !!evalExpr(cleanExpr(prevIf), data)
          }
        }
        if (!prevShow) {
          child._elseShow = true
          html += renderNode(child, data)
          child._elseShow = undefined
          continue
        } else {
          continue // 前一个 wx:if 为真，跳过 else
        }
      }
      html += renderNode(child, data)
    }
    return html
  }

  // 渲染完整模板
  function render(templateStr, data) {
    var wrapper = document.createElement('div')
    wrapper.innerHTML = templateStr
    var root = wrapper.firstChild
    if (!root) return ''
    return renderNode(root, data || {})
  }

  // 从模板字符串构建 DOM（用于事件委托，返回根元素）
  function build(templateStr, data) {
    var wrapper = document.createElement('div')
    wrapper.innerHTML = render(templateStr, data)
    return wrapper
  }

  global.__template = {
    render: render,
    build: build,
    evalExpr: evalExpr,
    interpolate: interpolate
  }
})(window)
