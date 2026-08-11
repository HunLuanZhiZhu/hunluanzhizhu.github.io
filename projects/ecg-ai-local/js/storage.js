// js/storage.js — H5 本地存储封装 (替代 wx.getStorageSync/setStorageSync)
// key 与原小程序完全一致, 保证数据格式兼容

export function getStorageSync(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return ''
    try {
      return JSON.parse(raw)
    } catch (e) {
      return raw
    }
  } catch (e) {
    return ''
  }
}

export function setStorageSync(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('storage set failed:', key, e)
  }
}

export function removeStorageSync(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {}
}

export function clearStorageSync() {
  try {
    localStorage.clear()
  } catch (e) {}
}
