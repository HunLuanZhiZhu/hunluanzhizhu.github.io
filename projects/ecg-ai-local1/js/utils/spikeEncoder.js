/**
 * spikeEncoder.js — ECG脉冲编码器 (JS移植版)
 *
 * 从 oldgui/data_processor.py 移植的脉冲编码逻辑。
 * 将原始ECG信号(260点)转换为20通道脉冲序列(20×259)，
 * 作为 SNNConv1dBiLSTMModel 的输入。
 *
 * 算法流程：
 *   1. 一阶差分 diff = ecg[1:] - ecg[:-1]
 *   2. 正负分量分离
 *   3. 10个对数空间阈值 k = exp(linspace(log(27), log(666), 10))
 *      每个阈值生成正负两通道，共20通道
 *   4. SNN脉冲发放：u += k*diff → u≥1时发放脉冲并重置为0
 *
 * 输入: Float32Array(260) 或 number[] — 原始ECG数据
 * 输出: Float32Array(5180) — 20×259 脉冲序列，可直接喂入ONNX模型
 */

/**
 * 对ECG数据进行脉冲编码
 * @param {Float32Array|number[]} ecgData - 原始ECG数据 (期望260点)
 * @returns {Float32Array} 编码后数据 (20 × 259 = 5180)，布局为 [20, 259]
 */
function spikeEncode(ecgData) {
  const T = ecgData.length
  const Tdiff = T - 1 // 差分后长度

  // --- Step 1: 一阶差分 ---
  const diff = new Float32Array(Tdiff)
  for (let i = 0; i < Tdiff; i++) {
    diff[i] = ecgData[i + 1] - ecgData[i]
  }

  // --- Step 2: 正负分量分离 ---
  const diffNeg = new Float32Array(Tdiff)
  const diffPos = new Float32Array(Tdiff)
  for (let i = 0; i < Tdiff; i++) {
    if (diff[i] < 0) {
      diffNeg[i] = diff[i]
    }
    if (diff[i] > 0) {
      diffPos[i] = diff[i]
    }
  }

  // --- Step 3: 10个对数空间阈值 → 20通道脉冲编码 ---
  // 输出布局: [channel, time]，即 output[ch * Tdiff + t]
  const output = new Float32Array(20 * Tdiff)

  // 对数空间生成10个阈值: k = exp(linspace(log(27), log(666), 10))
  const log27 = Math.log(27)
  const log666 = Math.log(666)

  for (let ch = 0; ch < 10; ch++) {
    // np.linspace(a, b, 10) → a + (b - a) * i / (10 - 1)
    const k = Math.exp(log27 + (log666 - log27) * ch / 9)

    // SNN脉冲发放（推理模式，对应 Python 的 eval 分支）
    let uNeg = 0.5
    let uPos = 0.5

    const baseNeg = ch * 2 * Tdiff
    const basePos = (ch * 2 + 1) * Tdiff

    for (let t = 0; t < Tdiff; t++) {
      // 膜电位更新
      uNeg -= k * diffNeg[t]
      uPos += k * diffPos[t]

      // 脉冲发放判定: u >= 1
      const sNeg = uNeg >= 1 ? 1.0 : 0.0
      const sPos = uPos >= 1 ? 1.0 : 0.0

      // 重置: 发放后归零
      if (sNeg === 1.0) {
        uNeg = 0.0
      }
      if (sPos === 1.0) {
        uPos = 0.0
      }

      // 写入输出
      output[baseNeg + t] = sNeg
      output[basePos + t] = sPos
    }
  }

  return output
}

/**
 * 批量脉冲编码
 * @param {number[][] | Float32Array[]} ecgBatch - 多条ECG数据
 * @returns {Float32Array} 编码后数据 (N × 20 × Tdiff)
 */
function spikeEncodeBatch(ecgBatch) {
  const N = ecgBatch.length
  const T = ecgBatch[0].length
  const Tdiff = T - 1
  const output = new Float32Array(N * 20 * Tdiff)

  for (let n = 0; n < N; n++) {
    const encoded = spikeEncode(ecgBatch[n])
    output.set(encoded, n * 20 * Tdiff)
  }

  return output
}

export { spikeEncode, spikeEncodeBatch }
