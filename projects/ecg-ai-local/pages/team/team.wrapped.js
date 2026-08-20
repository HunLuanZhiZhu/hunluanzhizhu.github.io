/* Auto-wrapped */
__defineModule("pages/team/team.js", function(module, exports, require) {
// pages/team/team.js — 团队介绍页逻辑
var app = getApp()

Page({
  data: {
    theme: 'light',
    // 团队成员列表 — 头像使用个人照片(首字母拼音命名: xzw/zyh/zj), 3人无指导老师(赛制规范)
    members: [
      {
        name: '神秘人 A',
        role: '团队总负责人',
        avatar: 'assets/smr.jpg',
        education: '计算机技术专业在读硕士',
        research: '人工智能在心电信号分析与分类方面的应用',
        responsibility: '项目整体统筹与团队组织领导，以扎实的科研积累与组织领导能力支撑团队发展',
        achievements: ['以第一作者发表SCI二区论文', 'CCF-B类会议论文（第一作者）', 'EI会议论文（第一作者）', 'SCI一区论文1篇在审', '软件著作权2项', '主持校级研究生科研创新项目', '连续2年获得校级奖学金', '研究生科研成果奖与优秀研究生荣誉']
      },
      {
        name: '神秘人 B',
        role: '技术负责人',
        avatar: 'assets/smr.jpg',
        education: '计算机技术专业在读硕士',
        research: '脉冲神经网络与生物医学信号结合',
        responsibility: '团队组织与协调、项目整体推进，为科研任务提供技术支撑',
        achievements: ['脉冲神经网络与生物医学信号结合领域三篇论文在审', '全国大学生数学建模竞赛省二等奖', '美国大学生数学建模竞赛H奖', '华数杯一等奖', 'MathorCup大数据竞赛一等奖', '校级一等奖学金']
      },
      {
        name: '神秘人 C',
        role: '界面设计负责人',
        avatar: 'assets/smr.jpg',
        education: '计算机软件工程学士，即将进入计算机技术专业硕士阶段学习',
        research: '医学特征提取',
        responsibility: '项目界面设计与交互优化，围绕项目功能需求完成界面布局、视觉呈现及相关设计工作，提升项目整体展示效果与用户体验',
        achievements: ['校级三等奖学金', '扎实的编程基础与页面优化能力', '能够将专业知识有效应用于项目实践']
      }
    ],
    // 项目背景 — 每项含 sections 多段详情, 点击跳转 info-detail 页展示
    backgrounds: [
      {
        icon: '源',
        title: '项目起源',
        short: '基于分数阶优化的心电信号智能分析研究课题',
        sections: [
          { title: '研究背景', content: '心血管疾病是全球首位致死病因，其中心律失常因具有隐蔽性强、阵发性发作的特点，常规心电图检查往往难以捕捉异常信号。基层医疗资源匮乏，乡村地区居民难以获得专业心电诊断服务，延误诊治的情况时有发生。' },
          { title: '技术契机', content: '研究团队发现，传统整数阶模型难以精确描述心电信号的记忆特性和非线性动态行为，而分数阶微积分理论恰好能为这一问题提供新的数学工具。' },
          { title: '项目启动', content: '2026年5月25日，团队正式立项，确定了"分数阶优化算法 + 时间卷积网络（TCN）"的技术路线，旨在构建一套高精度、低延迟、可部署在移动端的智能心电分析系统，让基层用户也能获得专业级的心电健康评估服务。' }
        ]
      },
      {
        icon: '研',
        title: '研究基础',
        short: 'MIT-BIH + PhysioNet 国际标准数据库训练验证',
        sections: [
          { title: '数据来源', content: '模型训练与验证基于国际公认的MIT-BIH心律失常数据库（MIT-BIH Arrhythmia Database），该数据库包含47条长时间ECG记录，由美国波士顿Beth Israel医院录制，是心律失常检测研究的金标准数据集。同时引入PhysioNet平台提供的多源心电数据增强模型泛化能力。' },
          { title: '算法积累', content: '团队在分数阶微积分理论、深度学习心电分类领域已发表多篇SCI论文，积累了扎实的研究基础。前期工作验证了分数阶梯度算子在非凸优化问题中的全局探索能力，以及TCN架构在时序信号建模中的优势。' },
          { title: '工程能力', content: '团队成员具备深度学习模型训练、量化压缩、移动端部署的全栈工程能力。已熟练掌握TensorFlow/Keras模型训练、TensorFlow.js端侧推理、微信小程序开发等技术栈，为项目的产品化落地奠定了坚实基础。' }
        ]
      },
      {
        icon: '果',
        title: '核心成果',
        short: 'AAMI五分类准确率达98%以上',
        sections: [
          { title: '分类精度', content: '依据AAMI ANSI/EC57标准，模型在N（正常）、S（室上性异位）、V（室性异位）、F（融合搏动）、Q（不可分类）五大类别上实现了98%以上的分类准确率，显著优于传统机器学习方法（SVM约94%、随机森林约92%）和主流深度学习基线（LSTM约96%、CNN约97%）。' },
          { title: '模型优化', content: '创新性地将分数阶梯度算子引入TCN网络参数优化过程，通过变阶机制动态调整微分阶数，使模型在训练过程中能够利用历史梯度信息进行全局探索，有效避免陷入局部最优解。模型收敛速度提升约30%，泛化精度提升约5%。' },
          { title: '轻量化部署', content: '模型权重采用FP16半精度量化技术，体积从3.0MB压缩至1.4MB，压缩率达53%。在微信小程序端侧推理时延≤100ms，完全满足实时检测需求。经测试验证，FP16量化对分类精度无损，预测结果与FP32完全一致。' }
        ]
      },
      {
        icon: '品',
        title: '产品化',
        short: '微信小程序实现端侧AI推理，保护隐私安全',
        sections: [
          { title: '小程序方案', content: '选择微信小程序作为产品载体，具有无需下载安装、即用即走、跨平台兼容等优势。用户只需微信扫码即可使用心电检测服务，极大地降低了使用门槛，特别适合基层医疗场景和乡村地区推广。' },
          { title: '隐私保护', content: '所有心电信号分析与心律失常检测均在用户手机本地完成，不上传任何生理数据到服务器。这一端侧推理方案从根本上杜绝了医疗隐私泄露风险，符合《个人信息保护法》和医疗数据安全相关法规要求。' },
          { title: '用户价值', content: '产品面向乡村居民、基层医疗工作者及心律失常高风险人群，提供便捷的心电健康自检工具。通过可视化心电波形展示、AAMI五分类结果解读和健康评分，帮助用户及时发现潜在心脏问题，实现早发现、早干预、早治疗。' }
        ]
      }
    ],
    // 项目历程 — 重要里程碑用 highlight 标记（emerald 色）
    timeline: [
      { date: '2026年5月25日', text: '项目立项，确定分数阶优化+TCN技术路线', highlight: false },
      { date: '2026年6月', text: '模型训练完成，AAMI五分类准确率达98%', highlight: false },
      { date: '2026年7月', text: '模型量化压缩至1.4MB，适配小程序端侧推理', highlight: false },
      { date: '2026年8月', text: '小程序v1.0上线，支持ECG文件导入与实时推理', highlight: false },
      { date: '2026年8月', text: 'v2.0全面视觉升级（深色模式、自定义TabBar、健康评分、科普内容扩展）', highlight: true }
    ],
    // 技术亮点 — 每项含 sections 多段详情, 点击跳转 info-detail 页展示
    techs: [
      {
        num: '01',
        icon: 'F',              // Fractional — 分数阶
        name: '分数阶优化算法',
        short: '引入基于 Caputo 分数阶的非因果寻优机制, 利用其全局探索能力对网络结构参数进行多维空间搜索, 显著提升模型收敛性与泛化能力。',
        color: 'red',
        sections: [
          { title: '传统方法局限', content: '传统梯度下降算法（SGD、Adam等）在处理高维非凸优化问题时存在两个固有缺陷：一是容易陷入局部最优解，特别是在网络结构参数搜索空间中，损失曲面存在大量鞍点和局部极小值；二是收敛速度受限于学习率策略，固定学习率难以适应不同区域的曲面特征，导致训练效率低下。' },
          { title: '分数阶创新', content: '本项目创新性地引入基于 Caputo 定义的分数阶微积分理论，构建非因果寻优机制。分数阶梯度算子具有记忆特性——当前时刻的梯度更新不仅依赖当前梯度方向，还融合了历史梯度信息的加权积分。变阶机制根据损失曲面的局部特征动态调整微分阶数：在平坦区域增大阶数以加速收敛，在陡峭区域减小阶数以精细搜索，实现自适应优化策略。' },
          { title: '性能提升', content: '在TCN网络结构参数（扩张因子、残差块深度、卷积核大小）的多维搜索空间中，分数阶优化器表现出显著优势：模型收敛速度提升约30%，泛化精度提升约5%，且训练过程更加稳定，不同随机种子下的结果方差显著降低。' }
        ]
      },
      {
        num: '02',
        icon: 'T',              // TCN — 时间卷积网络
        name: '时间卷积网络(TCN)',
        short: '采用时间卷积网络融合时间序列特征与频谱信息, 结合变阶分数阶梯度算子动态调整微分阶数, 强化对心电信号长期依赖的建模能力。',
        color: 'blue',
        sections: [
          { title: '架构优势', content: '时间卷积网络（Temporal Convolutional Network）专为时序数据设计，相比传统RNN/LSTM具有三大核心优势：并行计算能力强，训练速度大幅提升；梯度传播稳定，不存在梯度消失/爆炸问题；感受野大小可精确控制，通过膨胀因子灵活调整。这些特性使TCN特别适合处理心电信号这类长序列时序数据。' },
          { title: '特征融合', content: '本项目采用双路特征融合架构：时域分支提取QRS波群形态、PR间期、ST段偏移等形态特征；频域分支通过短时傅里叶变换（STFT）捕捉心率变异性（HRV）的频域特征。两路特征在高层融合后送入分类器，实现对心电信号的全方位表征，兼顾形态学与生理学的双重判据。' },
          { title: '感受野设计', content: '采用因果膨胀卷积（Causal Dilated Convolution）结构，通过逐层增大的膨胀因子（1, 2, 4, 8, 16...）实现指数级增长的感受野。仅需5层卷积即可覆盖超过500个采样点的历史信息，在不增加参数量的前提下有效捕捉心电信号中跨度较大的时序依赖关系。' }
        ]
      },
      {
        num: '03',
        icon: 'Q',              // Quantization — 量化
        name: '半精度量化部署',
        short: '模型权重采用 FP16 半精度量化, 压缩至 1.4MB, 显著降低存储与内存开销, 实现移动端轻量化部署。',
        color: 'green',
        sections: [
          { title: '量化原理', content: '深度学习模型通常以FP32（32位浮点）格式存储权重，每个参数占用4字节。本项目采用FP16（16位半精度）量化技术，将每个权重参数从4字节压缩至2字节，模型体积从3.0MB缩减至1.4MB，压缩率达53%，显著降低了存储空间和运行时内存占用。' },
          { title: '精度验证', content: '量化过程中，团队对全部5类测试样本进行了逐一验证：FP16精度下模型预测结果与FP32完全一致（分类标签相同，概率差异<1e-3），证明半精度量化对心电分类任务精度无损。这一结论也与当前深度学习量化研究的主流共识一致——分类任务对数值精度容忍度较高。' },
          { title: '部署方案', content: '权重以ZIP压缩格式存储于小程序代码包中，运行时解压并转换为Float32供TensorFlow.js推理使用。整个推理过程在用户设备本地完成，无需网络请求，既保护了隐私又保证了实时性。端侧推理时延≤100ms，完全满足实时检测需求。' }
        ]
      },
      {
        num: '04',
        icon: 'A',              // AAMI — 标准分类
        name: 'AAMI标准分类',
        short: '依据AAMI标准, 将心搏分为N/S/V/F/Q五类, 覆盖临床常见心律失常类型。',
        color: 'orange',
        sections: [
          { title: '标准介绍', content: '美国医疗器械促进协会（AAMI）制定的ANSI/AAMI EC57标准是心电信号分类的国际公认标准。该标准将心搏分为五大类别，覆盖了临床最常见的心律失常类型，具有明确的临床指导意义，是评估心电分类算法性能的权威依据。' },
          { title: '五类详解', content: 'N类：正常心搏，包括窦性心律和房性逸搏，是健康心脏的典型表现。S类：室上性异位搏动，包括房性早搏和交界性早搏，提示心房或房室结异位起搏。V类：室性异位搏动，包括室性早搏和室性逸搏，需警惕器质性心脏病。F类：融合搏动，正常与室性搏动的融合波，具有混合形态特征。Q类：不可分类搏动，因信号质量差或形态不典型而无法归类。' },
          { title: '临床意义', content: '本项目模型依据MIT-BIH心律失常数据库进行训练和验证，在该标准下实现了98%以上的五分类准确率。通过清晰的分类结果展示和通俗的健康解读，帮助非专业用户理解自身心电状况，为基层医疗筛查和早期预警提供有价值的参考信息。' }
        ]
      }
    ]
  },

  onLoad() {
    // 性能优化: 标记首次加载, onShow据此跳过重复setData
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)
    this.setData({ theme: app.globalData.theme })
  },

  onShow() {
    // === TabBar选中态同步 (修复: 切换页面后底部按钮不高亮) ===
    // 官方推荐模式: onShow把本页下标硬编码同步给TabBar组件
    // attached路径嗅探仅是首渲染快速兜底; 页面缓存后attached不再触发, 必须在此同步
    var tabBar = typeof this.getTabBar === 'function' && this.getTabBar()
    if (tabBar) {
      tabBar.updateSelected(3)
      tabBar.updateTheme(app.globalData.theme)
    }

    // 同步页面背景色 (修复: onLaunch中调用wx.setBackgroundColor时页面尚未创建, 需在各页onShow中补调)
    app.applyThemeColors(app.globalData.theme)

    // 加固: 无条件校验主题状态 (防御性修复深色模式下页面未及时更新,
    // 即使onLoad的setData因边缘情况未生效, onShow也能兜底同步)
    if (this.data.theme !== app.globalData.theme) {
      this.setData({ theme: app.globalData.theme })
    }

    // 性能优化: 首次加载标记复位
    if (this._firstShow) {
      this._firstShow = false
    }
  },

  updateTheme(theme) {
    this.setData({ theme: theme })
  },

  onShareAppMessage() {
    return {
      title: '心韵深辨 — 团队介绍',
      path: '/pages/team/team'
    };
  },

  // 点击项目背景项 — 传递 sections 数据到详情页
  onBgTap(e) {
    var index = e.currentTarget.dataset.index
    var item = this.data.backgrounds[index]
    app.globalData.infoDetail = { icon: item.icon, title: item.title, sections: item.sections }
    wx.navigateTo({ url: '/subpackages/extra/info-detail/info-detail' })
  },

  // 点击技术亮点项 — 跳转详情页展示完整内容
  onTechTap(e) {
    var index = e.currentTarget.dataset.index
    var item = this.data.techs[index]
    app.globalData.infoDetail = { icon: item.icon, title: item.name, sections: item.sections }
    wx.navigateTo({ url: '/subpackages/extra/info-detail/info-detail' })
  },

  // 点击成员跳转详情 — 通过全局变量传递完整数据
  onMemberTap(e) {
    var index = e.currentTarget.dataset.index
    var m = this.data.members[index]
    app.globalData.memberDetail = m
    wx.navigateTo({ url: '/subpackages/extra/member-detail/member-detail' })
  }
});

});
