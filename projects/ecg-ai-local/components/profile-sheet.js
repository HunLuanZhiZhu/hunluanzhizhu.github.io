// components/profile-sheet/profile-sheet.js — 个人档案半屏面板
// 首次启动自动弹出, 后续可在"我的"页编辑
// 重构: 三段式档案 — 个人基础信息 / 过敏史 / 慢性疾病
// 修改记录:
// P1: 合并姓名+性别+年龄段为"个人基础信息"一个区块
// P2: 新增"过敏史"区块(食物过敏、药物过敏、其他过敏)
// P3: 新增"慢性疾病"区块(常见慢性病多选 + 其他)
// P4: 移除 wx.hideTabBar/wx.showTabBar 调用 — 项目为自定义TabBar(custom:true),
//     该API只控制原生TabBar且showTabBar会把原生TabBar重新显示出来,
//     导致底部出现两套导航栏叠加; 全屏遮罩(z-index 10000 > TabBar 9999)
//     本身已覆盖TabBar, 无需也不应调用这两个API

var app = getApp()

Component({
  data: {
    visible: false,
    isFirstTime: true,
    theme: 'light',             // 主题模式（用于组件内深色模式样式）
    activeTab: 0,               // 当前激活的标签页: 0=基础信息, 1=过敏史, 2=慢性疾病
    ageRanges: ['18-30', '31-45', '46-60', '60+'],
    // 常见慢性疾病列表(多选)
    chronicOptions: [
      '高血压', '冠心病', '糖尿病', '心律失常',
      '心力衰竭', '心肌病', '心脏瓣膜病', '高血脂'
    ],
    form: {
      // === 个人基础信息 ===
      name: '',
      gender: '',
      ageRange: '',
      // === 过敏史 ===
      hasAllergies: false,       // 是否有过敏史
      foodAllergies: '',          // 食物过敏(文本输入)
      drugAllergies: '',          // 药物过敏(文本输入)
      otherAllergies: '',         // 其他过敏(文本输入)
      // === 慢性疾病 ===
      hasChronicDisease: false,   // 是否有慢性疾病
      chronicDiseases: [],         // 选中的慢性疾病列表
      chronicOther: ''             // 其他慢性疾病(文本输入)
    }
  },

  methods: {
    // 显示面板 (isFirstTime=true 首次, false 编辑)
    // activeTab: 指定打开哪个标签页 (0=基础信息, 1=过敏史, 2=慢性疾病)
    show: function(isFirstTime, activeTab) {
      var existing = wx.getStorageSync('userInfo') || {}
      this.setData({
        visible: true,
        isFirstTime: !!isFirstTime,
        activeTab: activeTab !== undefined ? Number(activeTab) : 0,
        theme: app.globalData.theme,
        'form.name': existing.name || '',
        'form.gender': existing.gender || '',
        'form.ageRange': existing.ageRange || '',
        'form.hasAllergies': existing.hasAllergies || false,
        'form.foodAllergies': existing.foodAllergies || '',
        'form.drugAllergies': existing.drugAllergies || '',
        'form.otherAllergies': existing.otherAllergies || '',
        'form.hasChronicDisease': existing.hasChronicDisease || false,
        'form.chronicDiseases': existing.chronicDiseases || [],
        'form.chronicOther': existing.chronicOther || ''
      })
      // 注意: 不再调用 wx.hideTabBar — 全屏遮罩(z-index 10000)已覆盖自定义TabBar
    },

    // 隐藏
    hide: function() {
      this.setData({ visible: false })
      // 注意: 不再调用 wx.showTabBar — 自定义TabBar模式下该API会把原生TabBar
      // 重新显示出来, 造成底部两个导航栏叠加(P4修复)
    },

    // === 标签页切换 ===
    // 注意: data-tab在WXML中是字符串, 必须转为数值才能与 activeTab === 0 比较
    onTabTap: function(e) {
      this.setData({ activeTab: Number(e.currentTarget.dataset.tab) })
    },

    // === 个人基础信息输入 ===
    onNameInput: function(e) {
      this.setData({ 'form.name': e.detail.value })
    },

    onGenderTap: function(e) {
      this.setData({ 'form.gender': e.currentTarget.dataset.val })
    },

    onAgeTap: function(e) {
      this.setData({ 'form.ageRange': e.currentTarget.dataset.val })
    },

    // === 过敏史输入 ===
    onAllergyToggle: function(e) {
      this.setData({ 'form.hasAllergies': !this.data.form.hasAllergies })
    },

    onFoodAllergyInput: function(e) {
      this.setData({ 'form.foodAllergies': e.detail.value })
    },

    onDrugAllergyInput: function(e) {
      this.setData({ 'form.drugAllergies': e.detail.value })
    },

    onOtherAllergyInput: function(e) {
      this.setData({ 'form.otherAllergies': e.detail.value })
    },

    // === 慢性疾病选择 ===
    onChronicToggle: function(e) {
      this.setData({ 'form.hasChronicDisease': !this.data.form.hasChronicDisease })
    },

    onChronicItemTap: function(e) {
      var disease = e.currentTarget.dataset.disease
      var diseases = this.data.form.chronicDiseases.slice()
      var index = diseases.indexOf(disease)
      if (index > -1) {
        diseases.splice(index, 1)
      } else {
        diseases.push(disease)
      }
      this.setData({ 'form.chronicDiseases': diseases })
    },

    onChronicOtherInput: function(e) {
      this.setData({ 'form.chronicOther': e.detail.value })
    },

    // 跳过 (仅首次)
    onSkip: function() {
      wx.setStorageSync('profileSkipped', true)
      this.hide()
    },

    // 保存 — 将三段数据合并存储到 userInfo
    onSave: function() {
      var form = this.data.form
      var info = {
        // 个人基础信息
        name: form.name || '',
        gender: form.gender || '',
        ageRange: form.ageRange || '',
        // 过敏史
        hasAllergies: form.hasAllergies,
        foodAllergies: form.foodAllergies || '',
        drugAllergies: form.drugAllergies || '',
        otherAllergies: form.otherAllergies || '',
        // 慢性疾病
        hasChronicDisease: form.hasChronicDisease,
        chronicDiseases: form.chronicDiseases || [],
        chronicOther: form.chronicOther || '',
        // 元数据
        filledAt: Date.now()
      }
      wx.setStorageSync('userInfo', info)
      wx.setStorageSync('profileSkipped', true)

      // 通知父级
      this.triggerEvent('save', info)
      this.hide()
    },

    // 点击遮罩(上方空白处)关闭 — 首次使用时不允许关闭
    onMaskTap: function() {
      if (this.data.isFirstTime) {
        return
      }
      this.hide()
    },

    // 阻止冒泡
    noop: function() {}
  }
})
