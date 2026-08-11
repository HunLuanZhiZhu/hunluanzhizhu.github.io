// pages/team.js — 团队介绍页 (H5 版)
// 由小程序 pages/team/team.js + team.wxml 转化

import { globalData } from '../app.js'
import { navigateTo } from '../router.js'

const MEMBERS = [
  {
    letter: 'A',
    name: '神秘人 A',
    avatar: 'assets/smr.png',
    role: '项目负责人',
    education: '计算机科学与技术 学士（2024），人工智能与计算机科学 硕士在读',
    research: '分数阶梯度优化、医学信号处理，在国内外高质量期刊发表多篇论文',
    responsibility: '负责项目整体规划与技术路线选型，主导系统架构设计与核心算法实现'
  },
  {
    letter: 'B',
    name: '神秘人 B',
    avatar: 'assets/smr.png',
    role: '算法工程师',
    education: '数学与应用数学 学士（2025），人工智能与计算机科学 硕士在读',
    research: '脉冲神经网络、分数阶微积分、类脑计算，在国内外高质量期刊发表多篇论文',
    responsibility: '负责模型的设计、训练、优化与部署，构建核心心电检测算法'
  },
  {
    letter: 'C',
    name: '神秘人 C',
    avatar: 'assets/smr.png',
    role: '前端开发',
    education: '计算机科学与技术 学士（2026），人工智能与计算机科学 硕士在读',
    research: '医学信号处理',
    responsibility: '负责小程序端开发与交互体验设计，实现检测流程与结果可视化展示'
  },
  {
    letter: 'D',
    name: '神秘人 D',
    avatar: 'assets/smr.png',
    role: '指导老师',
    education: '控制科学与工程 博士（2015），教授，多次入选全球前2%科学家，博导，主持完成多项国家自然基金青基与面上项目',
    research: '医学信号处理、非线性动力学、混合系统、模式识别、联想记忆',
    responsibility: '负责项目学术指导、方法论审核与经费支持'
  }
]

const BACKGROUNDS = [
  {
    icon: '❤️',
    title: '心血管疾病防控',
    short: '心血管疾病是全球致死率最高的疾病之一，心律失常的早期发现和干预对降低猝死风险具有重要意义。',
    detail: '据世界卫生组织统计，心血管疾病每年导致近1800万人死亡，占全球总死亡人数的32%。其中心律失常作为常见的心血管问题，往往具有隐匿性和突发性——许多患者在首次严重发作前几乎没有明显症状。早期筛查和持续监测能够显著降低心源性猝死的风险，尤其在医疗资源相对匮乏的乡村和偏远地区，便捷的心电检测手段更是弥足珍贵。'
  },
  {
    icon: '⚠️',
    title: '传统检测的局限',
    short: '常规心电图检测依赖专业医疗设备和医师判读，受限于就诊时间和地点，难以满足大规模筛查需求。',
    detail: '传统心电检测存在三重壁垒：一是设备壁垒，专业心电图机体积大、成本高，仅在医疗机构配备；二是人员壁垒，心电图判读需要经过专业训练的医师，基层医疗力量不足；三是时效壁垒，患者往往在出现明显症状后才就医，错过了最佳干预窗口。此外，动态心电图（Holter）虽可24小时监测，但佩戴不便且报告需事后分析，无法实时反馈。'
  },
  {
    icon: '💡',
    title: '智能检测新方案',
    short: '本项目将深度学习引入便携式心电检测，通过移动端实现实时心律失常识别，让用户足不出户即可进行初步心电健康评估。',
    detail: '心韵深辨将人工智能算法部署于微信小程序端，用户只需导入心电数据即可在手机上完成本地推理，无需联网上传数据。模型基于分数阶优化算法与时间卷积网络（TCN），能够在秒级时间内完成心搏分类，识别正常心搏（N）、室上性早搏（S）、室性早搏（V）、融合搏动（F）和未知搏动（Q）五大类型。这一方案打破了传统检测的设备、人员和时效壁垒，为大规模社区筛查和个人健康自测提供了全新可能。'
  }
]

const TECHS = [
  {
    num: '01',
    icon: '🔢',
    name: '分数阶优化算法',
    short: '引入基于 Caputo 分数阶的非因果寻优机制, 利用其全局探索能力对网络结构参数进行多维空间搜索, 显著提升模型收敛性与泛化能力。',
    detail: '传统梯度下降算法在处理高维非凸优化问题时，容易陷入局部最优解。本项目创新性地引入基于 Caputo 定义的分数阶微积分理论，构建非因果寻优机制：通过分数阶梯度算子的记忆特性，使优化过程能够利用历史梯度信息进行全局探索，而非仅依赖当前梯度方向。具体而言，变阶分数阶梯度算子会根据损失曲面的局部特征动态调整微分阶数——在平坦区域增大阶数以加速收敛，在陡峭区域减小阶数以精细搜索。这一机制在网络结构参数（如扩张因子、残差块深度、卷积核大小）的多维搜索空间中表现出显著优势，模型收敛速度提升约30%，泛化精度提升约5%。',
    color: 'red'
  },
  {
    num: '02',
    icon: '🌊',
    name: '时间卷积网络(TCN)',
    short: '采用时间卷积网络融合时间序列特征与频谱信息, 结合变阶分数阶梯度算子动态调整微分阶数, 强化对心电信号长期依赖的建模能力。',
    detail: '时间卷积网络（Temporal Convolutional Network）是一类专为时序数据设计的深度学习架构，相比传统RNN/LSTM具有三大优势：并行计算能力强、梯度稳定不消失、感受野可精确控制。本项目采用因果膨胀卷积（Causal Dilated Convolution）结构，通过逐层增大的膨胀因子实现指数级增长的感受野，使网络能够在不增加参数量的前提下捕捉心电信号中跨度较大的时序依赖关系。同时，融合时域特征与频谱信息进行综合判断：时域分支提取QRS波群形态、PR/ST间期等形态特征；频域分支通过短时傅里叶变换捕捉心率变异性的频域特征。两路特征在高层融合后送入分类器，实现对心电信号的全方位表征。',
    color: 'blue'
  },
  {
    num: '03',
    icon: '⚡',
    name: '半精度量化部署',
    short: '模型权重采用 FP16 半精度量化, 压缩至 1.4MB, 显著降低存储与内存开销, 实现移动端轻量化部署。',
    detail: '深度学习模型通常以FP32（32位浮点）格式存储权重，对于移动端部署而言体积过大。本项目采用FP16（16位半精度）量化技术，将每个权重参数从4字节压缩至2字节，模型体积从3.0MB缩减至1.4MB，压缩率达53%。量化过程中，我们验证了FP16精度下模型预测结果与FP32完全一致（5类测试样本预测标签相同，概率差异<1e-3），证明半精度量化对心电分类任务精度无损。部署时，权重以ZIP压缩格式存储于小程序代码包中，运行时解压并转换为Float32供TensorFlow.js推理使用。这一方案使模型完全在用户设备本地运行，无需网络请求，既保护了隐私又保证了实时性。',
    color: 'green'
  },
  {
    num: '04',
    icon: '📊',
    name: 'AAMI标准分类',
    short: '依据AAMI标准, 将心搏分为N/S/V/F/Q五类, 覆盖临床常见心律失常类型。',
    detail: '美国医疗器械促进协会（AAMI）制定的ANSI/AAMI EC57标准是心电信号分类的国际公认标准，将心搏分为五大类别：N类（正常心搏，包括窦性心律和房性逸搏）、S类（室上性异位搏动，包括房性早搏和交界性早搏）、V类（室性异位搏动，包括室性早搏和室性逸搏）、F类（融合搏动，正常与室性搏动的融合波）、Q类（不可分类搏动，因信号质量差或形态不典型而无法归类）。该分类体系覆盖了临床最常见的心律失常类型，具有明确的临床指导意义。本项目模型依据MIT-BIH心律失常数据库进行训练和验证，在该标准下实现了高精度的五分类识别，能够为用户提供有参考价值的心电健康评估。',
    color: 'orange'
  }
]

const state = { theme: 'light' }
let root = null

function setData(patch) {
  Object.assign(state, patch)
  render()
}

function themeClass() {
  return globalData.theme === 'dark' ? 'container page-team dark' : 'container page-team'
}

function render() {
  if (!root) return
  let html = '<div class="' + themeClass() + '">'

  // Hero区域
  html += '<div class="hero-section">' +
    '<div class="hero-bg-pattern"><div class="ecg-line"></div></div>' +
    '<div class="hero-content">' +
      '<div class="hero-logo"><img class="logo-img" src="assets/logo.jpg" alt="logo" /></div>' +
      '<div class="hero-name">心韵深辨</div>' +
      '<div class="hero-tagline">用心感知，以智辨析</div>' +
      '<div class="hero-desc">基于心电信号的智能心律失常检测系统，融合分数阶优化算法与时间卷积网络（TCN）深度学习技术，致力于为用户提供便捷、准确的心电健康自测体验。</div>' +
    '</div>' +
  '</div>'

  // 联系方式
  html += '<div class="contact-card card">' +
    '<div class="contact-header">' +
      '<div class="contact-icon"><div class="contact-dot"></div></div>' +
      '<div class="contact-title">联系我们</div>' +
    '</div>' +
    '<div class="contact-desc">如果您对心韵深辨项目有任何疑问、合作意向或使用反馈，欢迎通过下方入口与我们联系。</div>' +
    '<a class="feedback-btn" href="https://github.com/hunluanzhizhu" target="_blank" rel="noopener">GitHub 项目主页 →</a>' +
  '</div>'

  html += '<div class="section-header">' +
    '<div class="title-lg">团队成员</div>' +
    '<div class="subtitle">Our Team</div>' +
  '</div>'

  // 成员列表
  html += '<div class="member-list">'
  MEMBERS.forEach(function(m, index) {
    html += '<div class="card member-card" data-index="' + index + '" data-member>' +
      '<div class="member-avatar avatar-' + index + '">' +
        '<img class="avatar-img" src="' + m.avatar + '" alt="' + m.name + '" />' +
      '</div>' +
      '<div class="member-info">' +
        '<div class="member-name">' + m.name + '</div>' +
        '<div class="member-role tag ' + (m.role === '指导老师' ? 'role-mentor' : 'role-member') + '">' + m.role + '</div>' +
      '</div>' +
      '<span class="card-arrow">›</span>' +
    '</div>'
  })
  html += '</div>'

  // 项目背景
  html += '<div class="section-header">' +
    '<div class="title-lg">项目背景</div>' +
    '<div class="subtitle">Project Background</div>' +
  '</div>' +
  '<div class="card">'
  BACKGROUNDS.forEach(function(item, index) {
    html += '<div class="bg-item" data-index="' + index + '" data-bg>' +
      '<div class="bg-icon-wrap"><span class="bg-emoji">' + item.icon + '</span></div>' +
      '<div class="bg-text">' +
        '<div class="bg-title">' + item.title + '</div>' +
        '<div class="bg-desc">' + item.short + '</div>' +
      '</div>' +
      '<span class="bg-arrow">›</span>' +
    '</div>'
    if (index < BACKGROUNDS.length - 1) html += '<div class="divider"></div>'
  })
  html += '</div>'

  // 技术亮点
  html += '<div class="section-header">' +
    '<div class="title-lg">技术亮点</div>' +
    '<div class="subtitle">Technical Highlights</div>' +
  '</div>' +
  '<div class="card">'
  TECHS.forEach(function(item, index) {
    html += '<div class="tech-item" data-index="' + index + '" data-tech>' +
      '<div class="tech-emoji">' + item.icon + '</div>' +
      '<div class="tech-content">' +
        '<div class="tech-name"><span>' + item.name + '</span></div>' +
        '<div class="tech-desc">' + item.short + '</div>' +
      '</div>' +
      '<span class="tech-arrow">›</span>' +
    '</div>'
    if (index < TECHS.length - 1) html += '<div class="divider"></div>'
  })
  html += '</div>'

  html += '</div>'
  root.innerHTML = html
  bindEvents()
}

function bindEvents() {
  if (!root) return
  root.querySelectorAll('[data-bg]').forEach(function(el) {
    el.addEventListener('click', function() {
      const item = BACKGROUNDS[parseInt(el.dataset.index, 10)]
      globalData.infoDetail = { icon: item.icon, title: item.title, detail: item.detail }
      navigateTo('info-detail')
    })
  })

  root.querySelectorAll('[data-tech]').forEach(function(el) {
    el.addEventListener('click', function() {
      const item = TECHS[parseInt(el.dataset.index, 10)]
      globalData.infoDetail = { icon: item.icon, title: item.name, detail: item.detail }
      navigateTo('info-detail')
    })
  })

  root.querySelectorAll('[data-member]').forEach(function(el) {
    el.addEventListener('click', function() {
      const m = MEMBERS[parseInt(el.dataset.index, 10)]
      globalData.memberDetail = m
      navigateTo('member-detail')
    })
  })
}

export default {
  title: '团队介绍',
  tab: 3,

  async mount(container) {
    root = container
    setData({ theme: globalData.theme })
  },

  unmount() {
    root = null
  },

  updateTheme(theme) {
    setData({ theme: theme })
  }
}
