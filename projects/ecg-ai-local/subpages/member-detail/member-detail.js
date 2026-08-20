// pages/member-detail/member-detail.js — 成员详情页
// 优先从 app.globalData.memberDetail 读取数据，为空则回退到本地数据
var app = getApp()

// 本地回退数据 — 与 team.js 保持一致（3人匿名化）
var FALLBACK_MEMBERS = [
  {
    name: '神秘人 A', role: '团队总负责人', avatar: '/assets/smr.jpg',
    education: '计算机技术专业在读硕士',
    research: '人工智能在心电信号分析与分类方面的应用',
    responsibility: '项目整体统筹与团队组织领导，以扎实的科研积累与组织领导能力支撑团队发展',
    achievements: ['以第一作者发表SCI二区论文', 'CCF-B类会议论文（第一作者）', 'EI会议论文（第一作者）', 'SCI一区论文1篇在审', '软件著作权2项', '主持校级研究生科研创新项目', '连续2年获得校级奖学金', '研究生科研成果奖与优秀研究生荣誉']
  },
  {
    name: '神秘人 B', role: '技术负责人', avatar: '/assets/smr.jpg',
    education: '计算机技术专业在读硕士',
    research: '脉冲神经网络与生物医学信号结合',
    responsibility: '团队组织与协调、项目整体推进，为科研任务提供技术支撑',
    achievements: ['脉冲神经网络与生物医学信号结合领域三篇论文在审', '全国大学生数学建模竞赛省二等奖', '美国大学生数学建模竞赛H奖', '华数杯一等奖', 'MathorCup大数据竞赛一等奖', '校级一等奖学金']
  },
  {
    name: '神秘人 C', role: '界面设计负责人', avatar: '/assets/smr.jpg',
    education: '计算机软件工程学士，即将进入计算机技术专业硕士阶段学习',
    research: '医学特征提取',
    responsibility: '项目界面设计与交互优化，围绕项目功能需求完成界面布局、视觉呈现及相关设计工作，提升项目整体展示效果与用户体验',
    achievements: ['校级三等奖学金', '扎实的编程基础与页面优化能力', '能够将专业知识有效应用于项目实践']
  }
]

Page({
  data: {
    member: {
      name: '', role: '', avatar: '/assets/smr.jpg',
      education: '', research: '', responsibility: '',
      achievements: []
    },
    theme: 'light'
  },

  onLoad: function(options) {
    this._firstShow = true
    app.applyThemeColors(app.globalData.theme)
    // 优先从全局变量读取数据（由 team.js 传递）
    var member = app.globalData.memberDetail

    // 如果全局变量为空，回退到本地数据
    if (!member) {
      var idx = parseInt(options.index) || 0
      member = FALLBACK_MEMBERS[idx] || FALLBACK_MEMBERS[0]
    }

    this.setData({
      member: member,
      theme: app.globalData.theme
    })

    // 设置导航栏标题为成员姓名
    if (member.name) {
      wx.setNavigationBarTitle({ title: member.name })
    }
  },

  // v3优化: 仅主题变化时setData, 避免无意义重渲染
  // 加固: theme校验放在_firstShow判断之前, 无条件兜底同步(防御性修复深色模式偶发不同步)
  onShow() {
    app.applyThemeColors(app.globalData.theme)
    if (this.data.theme !== app.globalData.theme) {
      this.setData({ theme: app.globalData.theme })
    }
    if (this._firstShow) {
      this._firstShow = false
    }
  },

  updateTheme(theme) {
    this.setData({ theme: theme })
  }
});
