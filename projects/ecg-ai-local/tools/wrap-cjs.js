// tools/wrap-cjs.js — JS 文件 → define() 包装
// 用法: node tools/wrap-cjs.js
// 读取 pages/subpages/components/utils 下的 .js 源文件
// 生成 .wrapped.js 的 define('id', function(module,exports,require){ 原代码 })
// 不改写原代码内容，只做包装

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

// 要包装的源文件（相对 ROOT）
const TARGETS = [
  // 5 tab 页
  'pages/detect/detect.js', 'pages/history/history.js', 'pages/science/science.js',
  'pages/team/team.js', 'pages/mine/mine.js',
  // 5 子页
  'subpages/analysis/analysis.js', 'subpages/category-detail/category-detail.js',
  'subpages/info-detail/info-detail.js', 'subpages/member-detail/member-detail.js',
  'subpages/settings/settings.js',
  // 组件
  'components/profile-sheet.js',
  // utils
  'utils/spikeEncoder.js', 'utils/ecgSamples.js', 'utils/demoSamples.js',
  'utils/fileParser.js', 'utils/animateValue.js', 'utils/ecgModel.js',
  'utils/chartHelper.js', 'utils/exportHelper.js', 'utils/waveAnimator.js'
]

function wrap(id, code) {
  // 保留原代码（含注释与换行），包装进 factory
  return (
    '/* Auto-wrapped by tools/wrap-cjs.js — 原代码未改动 */\n' +
    '__defineModule(' + JSON.stringify(id) + ', function(module, exports, require) {\n' +
    code + '\n' +
    '});\n'
  )
}

TARGETS.forEach(function(rel) {
  const srcPath = path.join(ROOT, rel)
  if (!fs.existsSync(srcPath)) {
    console.log('跳过（不存在）:', rel)
    return
  }
  const code = fs.readFileSync(srcPath, 'utf-8')
  const wrapped = wrap(rel, code)
  const dest = srcPath.replace(/\.js$/, '.wrapped.js')
  fs.writeFileSync(dest, wrapped, 'utf-8')
  console.log('包装:', rel, '→', path.basename(dest))
})

// 单独处理 app-src.js → app.js（应用层包装，含差异点修改）
const appSrc = path.join(ROOT, 'app-src.js')
if (fs.existsSync(appSrc)) {
  console.log('app-src.js 需手动处理差异点后包装，跳过自动包装')
}

console.log('完成')
