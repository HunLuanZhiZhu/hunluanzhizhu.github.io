// 极简 WebGL2 glTF(.glb) 查看器 —— 无任何外部依赖。
// 只实现本项目用得到的部分：三角网格 + PBR 基础色 + 自发光 + 可选泛光(bloom)。
// 不含贴图、骨骼、动画、Draco 解压。需要更多能力请改用 <model-viewer> 或 three.js。
//
// 为什么需要泛光：自发光材质在 glTF 里只是一个"不发光的颜色值"，
// 单靠它渲染出来的只是一个比较亮的表面，看起来并不像在发光。
// 真正的发光感来自光溢出到周围像素 —— 也就是 bloom。Blender/EEVEE 会自动做这一步。

/* ---------- 列主序 4x4 矩阵 ---------- */
const M4 = {
  ident: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++)
        o[c * 4 + r] =
          a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  },
  perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  },
  lookAt(eye, center, up) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const z = norm(sub(eye, center)), x = norm(cross(up, z)), y = cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ]);
  },
  trs(n) {
    if (n.matrix) return new Float32Array(n.matrix);
    const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1];
    const [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    return new Float32Array([
      (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
      (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
      (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
      t[0], t[1], t[2], 1,
    ]);
  },
};

/* ---------- GLB 解包：12 字节头 + JSON 块 + BIN 块 ---------- */
const TYPES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const CTORS = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const CSIZE = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };

async function parseGLB(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("不是 GLB 文件");
  const jsonLen = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  return { json, bin: new Uint8Array(buf, 20 + jsonLen + 8) };
}

function readAccessor(g, i) {
  const a = g.json.accessors[i], bv = g.json.bufferViews[a.bufferView];
  const n = TYPES[a.type], Ctor = CTORS[a.componentType], cs = CSIZE[a.componentType];
  const base = g.bin.byteOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
  const stride = bv.byteStride || n * cs;
  if (stride === n * cs) return new Ctor(g.bin.buffer, base, a.count * n);
  const out = new Ctor(a.count * n);                    // 交错缓冲：先拆开
  for (let k = 0; k < a.count; k++)
    for (let c = 0; c < n; c++)
      out[k * n + c] = new Ctor(g.bin.buffer, base + k * stride + c * cs, 1)[0];
  return out;
}

/* ---------- 着色器 ---------- */
const SCENE_VS = `#version 300 es
in vec3 aPos; in vec3 aNrm;
uniform mat4 uMVP; uniform mat4 uModel;
out vec3 vN; out vec3 vW;
void main(){
  vN = mat3(uModel) * aNrm;
  vW = (uModel * vec4(aPos, 1.0)).xyz;
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const SCENE_FS = `#version 300 es
precision highp float;
#define MAXL 4
in vec3 vN; in vec3 vW;
uniform vec3 uColor;
uniform vec3 uEmissive;
uniform vec3 uCamPos;
uniform float uAmbient;        // 环境光上限：自发光为主的模型要压低它，否则漫反射先饱和
uniform float uLExposure;      // glTF 光源强度的曝光系数（坎德拉 → 渲染器工作单位）
uniform int   uNumLights;
uniform vec4  uLPos[MAXL];     // xyz 位置, w 衰减半径(0=无限)
uniform vec4  uLDir[MAXL];     // xyz 朝向(聚光灯), w 外锥角余弦
uniform vec4  uLCol[MAXL];     // rgb 颜色×强度, w 内锥角余弦
uniform int   uLType[MAXL];    // 0=点 1=聚光 2=平行
uniform float uFogNear;        // 距离雾：把远处地面融进背景色，否则会看见地面尽头的硬边
uniform float uFogFar;
uniform vec3  uBg;
out vec4 outColor;

// KHR_lights_punctual：点/聚光灯按 1/d² 衰减，聚光灯再乘一个锥角内的平滑过渡
vec3 punctual(vec3 n){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < MAXL; i++) {
    if (i >= uNumLights) break;
    vec3 Lv; float atten = 1.0;
    if (uLType[i] == 2) {
      Lv = uLDir[i].xyz;
    } else {
      Lv = uLPos[i].xyz - vW;
      float d = max(length(Lv), 1e-5);
      Lv /= d;
      atten = 1.0 / (d * d);
      if (uLPos[i].w > 0.0) {                              // 超出 range 平滑归零
        float t = clamp(1.0 - pow(d / uLPos[i].w, 4.0), 0.0, 1.0);
        atten *= t * t;
      }
      if (uLType[i] == 1) {
        float sc = dot(-Lv, normalize(uLDir[i].xyz));
        atten *= smoothstep(uLDir[i].w, uLCol[i].w, sc);
      }
    }
    float nl = max(dot(n, normalize(Lv)), 0.0);
    acc += uLCol[i].rgb * (nl * atten);
  }
  return acc;
}

void main(){
  vec3 n = normalize(vN);
  vec3 V = normalize(uCamPos - vW);
  vec3 L = normalize(vec3(0.55, 0.80, 0.60));
  float diff = max(dot(n, L), 0.0);
  float sky  = 0.34 + 0.22 * (0.5 + 0.5 * n.y);            // 半球环境光
  // 边缘光：墨色骨架的基础色接近纯黑，没有它整个灯骨会塌成死黑剪影
  float rim  = pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.30;
  vec3 c = uColor * (sky + 0.68 * diff) * uAmbient
         + uColor * punctual(n) * uLExposure
         + uEmissive
         + rim * vec3(0.58, 0.64, 0.76);
  c = mix(c, uBg, smoothstep(uFogNear, uFogFar, distance(uCamPos, vW)));
  outColor = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);           // 转到显示空间
}`;

const BG = [0.055, 0.058, 0.065];

// 全屏三角形对
const QUAD_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// 亮部提取：只有超过阈值的像素才参与泛光
const BRIGHT_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform float uThreshold;
out vec4 outColor;
void main(){
  vec3 c = texture(uTex, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  outColor = vec4(c * smoothstep(uThreshold, uThreshold + 0.18, l), 1.0);
}`;

// 可分离高斯模糊（横向 / 纵向各跑一次）
const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir;
out vec4 outColor;
void main(){
  vec3 s  = texture(uTex, vUv).rgb * 0.227027;
  s += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
  s += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0702702;
  outColor = vec4(s, 1.0);
}`;

const COMP_FS = `#version 300 es
precision highp float;
in vec2 vUv; uniform sampler2D uScene; uniform sampler2D uBloom; uniform float uStrength;
out vec4 outColor;
void main(){
  outColor = vec4(texture(uScene, vUv).rgb + texture(uBloom, vUv).rgb * uStrength, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
function target(gl, w, h, withDepth) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  let rb = null;
  if (withDepth) {
    rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, rb };
}

/* ---------- 查看器 ---------- */
export async function makeViewer(canvas, url, opts = {}) {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false });
  if (!gl) throw new Error("浏览器不支持 WebGL2");

  const sceneProg = program(gl, SCENE_VS, SCENE_FS);
  const uMVP = gl.getUniformLocation(sceneProg, "uMVP");
  const uModel = gl.getUniformLocation(sceneProg, "uModel");
  const uColor = gl.getUniformLocation(sceneProg, "uColor");
  const uEmis = gl.getUniformLocation(sceneProg, "uEmissive");
  const uCamPos = gl.getUniformLocation(sceneProg, "uCamPos");
  const uAmbient = gl.getUniformLocation(sceneProg, "uAmbient");
  const uLExposure = gl.getUniformLocation(sceneProg, "uLExposure");
  const uNumLights = gl.getUniformLocation(sceneProg, "uNumLights");
  const uLPos = gl.getUniformLocation(sceneProg, "uLPos");
  const uLDir = gl.getUniformLocation(sceneProg, "uLDir");
  const uLCol = gl.getUniformLocation(sceneProg, "uLCol");
  const uLType = gl.getUniformLocation(sceneProg, "uLType");
  const uFogNear = gl.getUniformLocation(sceneProg, "uFogNear");
  const uFogFar = gl.getUniformLocation(sceneProg, "uFogFar");
  const uBg = gl.getUniformLocation(sceneProg, "uBg");
  const ambient = opts.ambient ?? 1.0;
  const lExposure = opts.lightExposure ?? 1.0;
  gl.useProgram(sceneProg);
  gl.uniform3fv(uBg, new Float32Array(BG));

  const useBloom = !!opts.bloom;
  let quadVao = null, brightProg = null, blurProg = null, compProg = null;
  if (useBloom) {
    quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    brightProg = program(gl, QUAD_VS, BRIGHT_FS);
    blurProg = program(gl, QUAD_VS, BLUR_FS);
    compProg = program(gl, QUAD_VS, COMP_FS);
    gl.useProgram(brightProg);
    gl.uniform1i(gl.getUniformLocation(brightProg, "uTex"), 0);
    gl.uniform1f(gl.getUniformLocation(brightProg, "uThreshold"), opts.bloomThreshold ?? 0.78);
    gl.useProgram(blurProg);
    gl.uniform1i(gl.getUniformLocation(blurProg, "uTex"), 0);
    gl.useProgram(compProg);
    gl.uniform1i(gl.getUniformLocation(compProg, "uScene"), 0);
    gl.uniform1i(gl.getUniformLocation(compProg, "uBloom"), 1);
    gl.uniform1f(gl.getUniformLocation(compProg, "uStrength"), opts.bloomStrength ?? 1.15);
  }
  let sceneRT = null, bloomA = null, bloomB = null, rtW = 0, rtH = 0;

  /* ---- 载入模型 ---- */
  const g = await parseGLB(url);
  const prims = [];
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];

  function upload(pos, nrm, idx, model, color, emissive) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const attr = (data, loc) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    };
    attr(pos, 0);
    attr(nrm || pos, 1);                                   // 没法线时用位置兜底
    let ib = null, count = 0, type = gl.UNSIGNED_INT;
    if (idx) {
      ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      count = idx.length;
      type = idx instanceof Uint16Array ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
    }
    prims.push({ vao, ib, count, type, model, color, emissive });
  }

  // KHR_lights_punctual：光源定义在文件顶层，节点通过索引引用它
  const lightDefs = g.json.extensions?.KHR_lights_punctual?.lights || [];
  const lights = [];
  const exclude = opts.frameExclude ?? [];

  function walk(nodeIdx, parent) {
    const node = g.json.nodes[nodeIdx];
    const model = M4.mul(parent, M4.trs(node));

    const ref = node.extensions?.KHR_lights_punctual;
    if (ref) {
      const d = lightDefs[ref.light];
      if (d) {
        const dir = [-model[8], -model[9], -model[10]];      // glTF 光源沿节点 -Z 指向
        const len = Math.hypot(...dir) || 1;
        lights.push({
          type: d.type === "spot" ? 1 : d.type === "directional" ? 2 : 0,
          pos: [model[12], model[13], model[14]],
          dir: dir.map((v) => v / len),
          color: d.color || [1, 1, 1],
          intensity: d.intensity ?? 1,
          range: d.range ?? 0,
          innerCos: Math.cos(d.spot?.innerConeAngle ?? 0),
          outerCos: Math.cos(d.spot?.outerConeAngle ?? Math.PI / 4),
        });
      }
    }

    if (node.mesh !== undefined) {
      const meshName = g.json.meshes[node.mesh].name ?? "";
      const skipFrame = exclude.some((s) => (node.name ?? "").includes(s) || meshName.includes(s));
      for (const p of g.json.meshes[node.mesh].primitives) {
        const pos = readAccessor(g, p.attributes.POSITION);
        const nrm = p.attributes.NORMAL !== undefined ? readAccessor(g, p.attributes.NORMAL) : null;
        const idx = p.indices !== undefined ? readAccessor(g, p.indices) : null;
        const mat = p.material !== undefined ? g.json.materials[p.material] : null;
        const color = mat?.pbrMetallicRoughness?.baseColorFactor || [0.8, 0.8, 0.8, 1];
        const em = mat?.emissiveFactor || [0, 0, 0];
        const emStrength = mat?.extensions?.KHR_materials_emissive_strength?.emissiveStrength ?? 1;
        // 巨大地面会把包围盒撑爆、让主体缩成一点，所以取景时跳过它（但它照常渲染）
        if (!skipFrame)
          for (let k = 0; k < pos.length; k += 3)
            for (let c = 0; c < 3; c++) {
              if (pos[k + c] < lo[c]) lo[c] = pos[k + c];
              if (pos[k + c] > hi[c]) hi[c] = pos[k + c];
            }
        upload(pos, nrm, idx, model, color, em.map((v) => v * emStrength));
      }
    }
    for (const c of node.children || []) walk(c, model);
  }
  for (const root of g.json.scenes[g.json.scene ?? 0].nodes) walk(root, M4.ident());

  const center = [0, 1, 2].map((c) => (lo[c] + hi[c]) / 2);
  const radius = Math.max(...[0, 1, 2].map((c) => hi[c] - lo[c])) * 0.5 || 1;

  /* ---- 相机 ---- */
  let yaw = opts.yaw ?? 0.55, pitch = opts.pitch ?? 0.15, dist = radius * (opts.zoom ?? 3.2);
  let dirty = true;
  let dragging = false, px = 0, py = 0;

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; px = e.clientX; py = e.clientY;
    canvas.setPointerCapture(e.pointerId); canvas.classList.add("grabbing");
  });
  const release = (e) => {
    dragging = false; canvas.classList.remove("grabbing");
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    yaw -= (e.clientX - px) * 0.01;
    pitch = Math.max(-1.4, Math.min(1.4, pitch + (e.clientY - py) * 0.01));
    px = e.clientX; py = e.clientY;
    dirty = true;
    opts.onInteract?.();
  });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(radius * 1.25, Math.min(radius * 14, dist * (1 + e.deltaY * 0.0012)));
    dirty = true;
  }, { passive: false });
  new ResizeObserver(() => { dirty = true; }).observe(canvas);

  function drawQuad() {
    gl.bindVertexArray(quadVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function render() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; dirty = true; }

    const eye = [
      center[0] + dist * Math.cos(pitch) * Math.sin(yaw),
      center[1] + dist * Math.sin(pitch),
      center[2] + dist * Math.cos(pitch) * Math.cos(yaw),
    ];
    const vp = M4.mul(
      M4.perspective(Math.PI / 4, w / h, radius * 0.01, radius * 80),
      M4.lookAt(eye, center, [0, 1, 0]),
    );

    if (useBloom) {
      if (w !== rtW || h !== rtH) {
        [sceneRT, bloomA, bloomB].forEach((t) => {
          if (!t) return;
          gl.deleteFramebuffer(t.fb); gl.deleteTexture(t.tex);
          if (t.rb) gl.deleteRenderbuffer(t.rb);
        });
        sceneRT = target(gl, w, h, true);
        bloomA = target(gl, w >> 1, h >> 1, false);
        bloomB = target(gl, w >> 1, h >> 1, false);
        rtW = w; rtH = h;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneRT.fb);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.viewport(0, 0, w, h);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.055, 0.058, 0.065, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(sceneProg);
    gl.uniform3fv(uCamPos, new Float32Array(eye));
    gl.uniform1f(uAmbient, ambient);
    gl.uniform1f(uLExposure, lExposure);
    gl.uniform1f(uFogNear, radius * 3.0);
    gl.uniform1f(uFogFar, radius * 11.0);
    const nL = Math.min(lights.length, 4);
    gl.uniform1i(uNumLights, nL);
    if (nL > 0) {
      const lp = new Float32Array(16), ld = new Float32Array(16), lc = new Float32Array(16);
      const lt = new Int32Array(4);
      lights.slice(0, 4).forEach((L, i) => {
        lp.set([L.pos[0], L.pos[1], L.pos[2], L.range], i * 4);
        ld.set([L.dir[0], L.dir[1], L.dir[2], L.outerCos], i * 4);
        lc.set([L.color[0] * L.intensity, L.color[1] * L.intensity, L.color[2] * L.intensity, L.innerCos], i * 4);
        lt[i] = L.type;
      });
      gl.uniform4fv(uLPos, lp);
      gl.uniform4fv(uLDir, ld);
      gl.uniform4fv(uLCol, lc);
      gl.uniform1iv(uLType, lt);
    }
    for (const p of prims) {
      gl.bindVertexArray(p.vao);
      gl.uniformMatrix4fv(uMVP, false, M4.mul(vp, p.model));
      gl.uniformMatrix4fv(uModel, false, p.model);
      gl.uniform3fv(uColor, [p.color[0], p.color[1], p.color[2]]);
      gl.uniform3fv(uEmis, p.emissive);
      if (p.ib) gl.drawElements(gl.TRIANGLES, p.count, p.type, 0);
    }

    if (useBloom) {
      const hw = w >> 1, hh = h >> 1;
      gl.disable(gl.DEPTH_TEST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fb);
      gl.viewport(0, 0, hw, hh);
      gl.useProgram(brightProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneRT.tex);
      drawQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fb);
      gl.useProgram(blurProg);
      gl.uniform2f(gl.getUniformLocation(blurProg, "uDir"), 1 / hw, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      drawQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fb);
      gl.uniform2f(gl.getUniformLocation(blurProg, "uDir"), 0, 1 / hh);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
      drawQuad();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(compProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneRT.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      drawQuad();
    }
  }

  // 只在相机变化或尺寸变化时重绘，静止时不空转
  (function loop() {
    if (dirty) { dirty = false; render(); }
    requestAnimationFrame(loop);
  })();

  return { tris: prims.reduce((a, p) => a + p.count / 3, 0), prims: prims.length, bloom: useBloom };
}
