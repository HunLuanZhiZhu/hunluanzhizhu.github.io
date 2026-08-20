// utils/ecgModel.js
// 心电检测模型 TF.js 推理器
// 使用 TF.js 函数式API (非实例方法), 兼容小程序构建npm环境
//
// 模型: SNNConv1d(Conv1d+脉冲发放) → BiLSTM(2层) → FC(256→256→BN→128→5)

var tf = require('@tensorflow/tfjs-core')
var spikeEncode = require('./spikeEncoder').spikeEncode

// fp16 → float32 解码
function fp16ToFloat32(fp16Array) {
  var len = fp16Array.length
  var result = new Float32Array(len)
  for (var i = 0; i < len; i++) {
    var h = fp16Array[i]
    var sign = (h >> 15) & 0x1
    var exp = (h >> 10) & 0x1f
    var frac = h & 0x3ff
    var val
    if (exp === 0) {
      val = frac === 0 ? 0 : Math.pow(2, -14) * (frac / 1024)
    } else if (exp === 31) {
      val = frac === 0 ? Infinity : NaN
    } else {
      val = Math.pow(2, exp - 15) * (1 + frac / 1024)
    }
    result[i] = sign ? -val : val
  }
  return result
}

// 从二进制数据加载权重
// buffer: ArrayBuffer, meta: { layers: [{name, shape, offset}] }
// offset以字节为单位 (fp16每个元素2字节, 这里除以2转为元素偏移)
function loadWeights(buffer, meta) {
  var fp16Data = new Uint16Array(buffer)
  var weights = {}
  for (var i = 0; i < meta.layers.length; i++) {
    var layer = meta.layers[i]
    var offset = Math.floor(layer.offset / 2)  // 字节偏移 → fp16元素偏移
    var size = 1
    for (var j = 0; j < layer.shape.length; j++) {
      size *= layer.shape[j]
    }
    var slice = fp16Data.slice(offset, offset + size)
    var f32 = fp16ToFloat32(slice)
    weights[layer.name] = { data: Array.from(f32), shape: layer.shape }
  }
  console.log('loadWeights完成, 共', Object.keys(weights).length, '个权重')
  // 验证关键权重是否存在
  var requiredKeys = [
    'snn_conv1d.conv1d.weight', 'snn_conv1d.conv1d.bias',
    'lstm.weight_ih_l0', 'lstm.weight_hh_l0', 'lstm.bias_ih_l0', 'lstm.bias_hh_l0',
    'lstm.weight_ih_l0_reverse', 'lstm.weight_hh_l0_reverse',
    'lstm.bias_ih_l0_reverse', 'lstm.bias_hh_l0_reverse',
    'lstm.weight_ih_l1', 'lstm.weight_hh_l1', 'lstm.bias_ih_l1', 'lstm.bias_hh_l1',
    'lstm.weight_ih_l1_reverse', 'lstm.weight_hh_l1_reverse',
    'lstm.bias_ih_l1_reverse', 'lstm.bias_hh_l1_reverse',
    'fc.0.weight', 'fc.0.bias',
    'fc.2.weight', 'fc.2.bias', 'fc.2.running_mean', 'fc.2.running_var',
    'fc.3.weight', 'fc.3.bias',
    'fc.6.weight', 'fc.6.bias'
  ]
  for (var k = 0; k < requiredKeys.length; k++) {
    if (!weights[requiredKeys[k]]) {
      console.error('缺少权重:', requiredKeys[k])
    }
  }
  return weights
}

// 安全创建tensor: 检查weights是否存在
function safeTensor(weights, key) {
  var w = weights[key]
  if (!w) {
    throw new Error('权重不存在: ' + key)
  }
  if (!w.data || w.data.length === 0) {
    throw new Error('权重数据为空: ' + key)
  }
  if (w.shape && w.shape.length > 0) {
    return tf.tensor(w.data, w.shape)
  } else {
    // 1D bias等
    return tf.tensor(w.data, [w.data.length])
  }
}

// SNN脉冲发放 (eval模式)
// deltaU: [channels, seq_len] tensor → output: [channels, seq_len] tensor
function snnSpike(deltaU) {
  var channels = deltaU.shape[0]
  var seqLen = deltaU.shape[1]
  var u = tf.fill([channels], 0.5)
  var outputs = []

  for (var t = 0; t < seqLen; t++) {
    // u += deltaU[:, t]
    var du = tf.squeeze(tf.slice(deltaU, [0, t], [channels, 1]), [1])  // [channels]
    u = tf.add(u, du)
    // st = u >= 1
    var st = tf.greaterEqual(u, 1)
    // u = where(st, 0, u).relu()
    u = tf.relu(tf.where(st, tf.zerosLike(u), u))
    // s[t] = st (float32)
    outputs.push(tf.cast(st, 'float32'))
    du.dispose()
    st.dispose()
  }

  var result = tf.stack(outputs, 1)  // [channels, seqLen]
  u.dispose()
  for (var i = 0; i < outputs.length; i++) {
    outputs[i].dispose()
  }
  return result
}

// LSTM单步计算
// PyTorch LSTM门控顺序: i, f, g, o
function lstmStep(x, h, c, wIh, wHh, bIh, bHh, hidden) {
  var xT = tf.expandDims(x, 0)  // [1, input_dim]
  var hT = tf.expandDims(h, 0)  // [1, hidden]

  // wIh: [4*hidden, input_dim] → 转置为 [input_dim, 4*hidden]
  var wIhT = tf.transpose(wIh, [1, 0])
  var wHhT = tf.transpose(wHh, [1, 0])
  var gatesIh = tf.matMul(xT, wIhT)  // [1, 4*hidden]
  var gatesHh = tf.matMul(hT, wHhT)  // [1, 4*hidden]
  var gates = tf.add(tf.add(gatesIh, gatesHh), tf.add(bIh, bHh))

  var i_gate = tf.sigmoid(tf.slice(gates, [0, 0], [1, hidden]))
  var f_gate = tf.sigmoid(tf.slice(gates, [0, hidden], [1, hidden]))
  var g_gate = tf.tanh(tf.slice(gates, [0, 2 * hidden], [1, hidden]))
  var o_gate = tf.sigmoid(tf.slice(gates, [0, 3 * hidden], [1, hidden]))

  var cNew = tf.add(tf.mul(f_gate, tf.expandDims(c, 0)), tf.mul(i_gate, g_gate))
  var hNew = tf.mul(o_gate, tf.tanh(cNew))

  xT.dispose(); hT.dispose(); wIhT.dispose(); wHhT.dispose()
  gatesIh.dispose(); gatesHh.dispose(); gates.dispose()
  i_gate.dispose(); f_gate.dispose(); g_gate.dispose(); o_gate.dispose()

  return { h: tf.squeeze(hNew, [0]), c: tf.squeeze(cNew, [0]) }
}

// 创建LSTM方向权重集合
// layer: 'l0', 'l0_reverse', 'l1', 'l1_reverse'
// 实际权重key格式: lstm.weight_ih_l0, lstm.bias_hh_l0_reverse 等
function makeLstmWeights(weights, layer) {
  return {
    wIh: safeTensor(weights, 'lstm.weight_ih_' + layer),
    wHh: safeTensor(weights, 'lstm.weight_hh_' + layer),
    bIh: safeTensor(weights, 'lstm.bias_ih_' + layer),
    bHh: safeTensor(weights, 'lstm.bias_hh_' + layer)
  }
}

// 运行LSTM一个方向
function runLstmDirection(inputT, weightSet, hidden, seqLen, channels, isForward) {
  var h = tf.zeros([hidden])
  var c = tf.zeros([hidden])
  var outputs = new Array(seqLen)

  if (isForward) {
    for (var t = 0; t < seqLen; t++) {
      var x = tf.squeeze(tf.slice(inputT, [t, 0], [1, channels]), [0])
      var result = lstmStep(x, h, c, weightSet.wIh, weightSet.wHh, weightSet.bIh, weightSet.bHh, hidden)
      h.dispose(); c.dispose()
      h = result.h; c = result.c
      outputs[t] = tf.clone(h)
      x.dispose()
    }
  } else {
    for (var t2 = seqLen - 1; t2 >= 0; t2--) {
      var x2 = tf.squeeze(tf.slice(inputT, [t2, 0], [1, channels]), [0])
      var result2 = lstmStep(x2, h, c, weightSet.wIh, weightSet.wHh, weightSet.bIh, weightSet.bHh, hidden)
      h.dispose(); c.dispose()
      h = result2.h; c = result2.c
      outputs[t2] = tf.clone(h)
      x2.dispose()
    }
  }
  h.dispose(); c.dispose()
  return outputs
}

// 释放LSTM权重集合
function disposeLstmWeights(ws) {
  ws.wIh.dispose(); ws.wHh.dispose(); ws.bIh.dispose(); ws.bHh.dispose()
}

// 双向LSTM (2层)
function bilstm(input, weights, hidden) {
  var channels = input.shape[0]
  var seqLen = input.shape[1]
  var inputT = tf.transpose(input, [1, 0])  // [seq_len, channels]

  // 创建所有LSTM权重
  var wL0 = makeLstmWeights(weights, 'l0')
  var wL0R = makeLstmWeights(weights, 'l0_reverse')
  var wL1 = makeLstmWeights(weights, 'l1')
  var wL1R = makeLstmWeights(weights, 'l1_reverse')

  // 层0: 正向 + 反向
  var fwd0 = runLstmDirection(inputT, wL0, hidden, seqLen, channels, true)
  var bwd0 = runLstmDirection(inputT, wL0R, hidden, seqLen, channels, false)

  // 拼接层0输出: [seqLen, 2*hidden]
  var layer0Out = new Array(seqLen)
  for (var t = 0; t < seqLen; t++) {
    layer0Out[t] = tf.concat([fwd0[t], bwd0[t]], 0)
  }
  var layer0Seq = tf.stack(layer0Out, 0)  // [seqLen, 2*hidden]

  // 释放层0
  for (var i0 = 0; i0 < seqLen; i0++) {
    fwd0[i0].dispose(); bwd0[i0].dispose(); layer0Out[i0].dispose()
  }
  disposeLstmWeights(wL0)
  disposeLstmWeights(wL0R)

  // 层1: 正向 + 反向 (输入是层0的拼接输出, channels=2*hidden)
  var channelsL1 = channels * 2
  var fwd1 = runLstmDirection(layer0Seq, wL1, hidden, seqLen, channelsL1, true)
  var bwd1 = runLstmDirection(layer0Seq, wL1R, hidden, seqLen, channelsL1, false)

  // PyTorch LSTM output[t] = [h_fwd[t], h_bwd[t]]
  // output[-1] = [h_fwd[seqLen-1], h_bwd[seqLen-1]]
  // 注意: h_bwd[seqLen-1] 是反向LSTM最先处理的那个时间步的输出
  var lastOutput = tf.concat([fwd1[seqLen - 1], bwd1[seqLen - 1]], 0)

  // 清理层1
  for (var i1 = 0; i1 < seqLen; i1++) {
    fwd1[i1].dispose(); bwd1[i1].dispose()
  }
  disposeLstmWeights(wL1)
  disposeLstmWeights(wL1R)

  layer0Seq.dispose()
  inputT.dispose()

  return lastOutput
}

// FC层
function fc(input, weights) {
  var x = tf.expandDims(input, 0)  // [1, 256]

  // fc.0: Linear(256, 256)
  var w0 = safeTensor(weights, 'fc.0.weight')
  var b0 = safeTensor(weights, 'fc.0.bias')
  x = tf.add(tf.matMul(x, tf.transpose(w0, [1, 0])), b0)
  w0.dispose(); b0.dispose()

  // fc.1: LeakyReLU
  x = tf.leakyRelu(x, 0.1)

  // fc.2: BatchNorm
  var bnW = safeTensor(weights, 'fc.2.weight')
  var bnB = safeTensor(weights, 'fc.2.bias')
  var bnMean = safeTensor(weights, 'fc.2.running_mean')
  var bnVar = safeTensor(weights, 'fc.2.running_var')
  x = tf.add(
    tf.mul(
      tf.div(tf.sub(x, bnMean), tf.sqrt(tf.add(bnVar, 1e-5))),
      bnW
    ),
    bnB
  )
  bnW.dispose(); bnB.dispose(); bnMean.dispose(); bnVar.dispose()

  // fc.3: Linear(256, 128)
  var w3 = safeTensor(weights, 'fc.3.weight')
  var b3 = safeTensor(weights, 'fc.3.bias')
  x = tf.add(tf.matMul(x, tf.transpose(w3, [1, 0])), b3)
  w3.dispose(); b3.dispose()

  // fc.4: LeakyReLU
  x = tf.leakyRelu(x, 0.1)

  // fc.6: Linear(128, 5)
  var w6 = safeTensor(weights, 'fc.6.weight')
  var b6 = safeTensor(weights, 'fc.6.bias')
  x = tf.add(tf.matMul(x, tf.transpose(w6, [1, 0])), b6)
  w6.dispose(); b6.dispose()

  var result = tf.squeeze(x, [0])
  x.dispose()
  return result
}

// 完整推理 (不使用tf.tidy, 手动管理内存)
async function predict(ecgData, weights) {
  console.log('predict开始, ecgData长度:', ecgData.length)
  console.log('weights keys数量:', Object.keys(weights).length)

  // 1. 脉冲编码
  var spikeData = Array.from(spikeEncode(new Float32Array(ecgData)))
  console.log('脉冲编码完成, 长度:', spikeData.length)

  // 2. Conv1d
  // spikeEncode输出布局是[20, 259] (channels, seq_len), 行优先
  // PyTorch: x = spike[np.newaxis] → [1, 20, 259] (batch, in_ch, seq_len)
  // TF.js conv1d需要[batch, seq_len, in_ch] = [1, 259, 20]
  // 必须用transpose, 不能直接reshape!
  var spikeRaw = tf.tensor(spikeData, [1, 20, 259])  // 正确: [batch, in_ch, seq_len]
  var spikeInput = tf.transpose(spikeRaw, [0, 2, 1])  // → [1, 259, 20] (batch, seq_len, in_ch)
  spikeRaw.dispose()
  var convW = safeTensor(weights, 'snn_conv1d.conv1d.weight')
  var convB = safeTensor(weights, 'snn_conv1d.conv1d.bias')
  console.log('convW shape:', convW.shape, 'convB shape:', convB.shape)

  // PyTorch: [out_ch, in_ch, kernel] → TF.js: [kernel, in_ch, out_ch]
  var convWTransposed = tf.transpose(convW, [2, 1, 0])
  // 手动zeros padding: (259+2-5)/1+1 = 257
  var padded = tf.pad(spikeInput, [[0, 0], [1, 1], [0, 0]])
  var convOut = tf.add(tf.conv1d(padded, convWTransposed, 1, 'valid'), convB)
  // [1, 257, 128] → [128, 257]
  var deltaU = tf.transpose(tf.squeeze(convOut, [0]), [1, 0])
  console.log('Conv1d完成, deltaU shape:', deltaU.shape)

  // 释放Conv1d中间tensor
  spikeInput.dispose(); convW.dispose(); convB.dispose()
  convWTransposed.dispose(); padded.dispose(); convOut.dispose()

  // 3. SNN脉冲发放
  var snnOut = snnSpike(deltaU)
  deltaU.dispose()
  console.log('SNN完成, snnOut shape:', snnOut.shape)

  // 4. BiLSTM
  var lstmOut = bilstm(snnOut, weights, 128)
  snnOut.dispose()
  console.log('BiLSTM完成, lstmOut shape:', lstmOut.shape)

  // 5. FC
  var logits = fc(lstmOut, weights)
  lstmOut.dispose()
  console.log('FC完成, logits shape:', logits.shape)

  // 6. Softmax
  var probs = tf.softmax(logits)

  return { logits: logits, probs: probs }
}

module.exports = { loadWeights: loadWeights, predict: predict, fp16ToFloat32: fp16ToFloat32 }
