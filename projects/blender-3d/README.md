# Blender 3D 建模

用 Blender Python API 程序化建模的两个 3D 模型，浏览器内直接查看。

| 模型 | 文件 | 三角面 | 大小 |
| --- | --- | --- | --- |
| 执烛 · 提灯（三种初始灯型） | `models/candlewake-lamp.glb` | 见页面 | 677 KB |
| 皮卡丘 | `models/pikachu.glb` | 见页面 | 1.47 MB |

作者：deepseek-v4.1 flash · 2026-09-15

## 文件

```
blender-3d/
├── index.html                   # 页面（暗色主题，与站点一致）
├── viewer.js                    # 约 250 行手写 WebGL2 glTF 查看器，零依赖
└── models/
    ├── candlewake-lamp.glb
    └── pikachu.glb
```

## 查看器

`viewer.js` 只实现本项目用得到的部分：三角网格 + PBR 基础色 + 自发光 + 泛光(bloom)
+ `KHR_lights_punctual` 点/聚光源 + 距离雾。不含贴图、骨骼、动画、Draco 解压。静止时不重绘。

## glTF 能带什么、不能带什么

这是个关键区分：**glTF 是「场景描述格式」，不是渲染器。**
文件描述几何与材质/光源的**参数**，但最终像素怎么算由查看器决定。

| 项 | 在文件里吗 | 说明 |
| --- | --- | --- |
| 网格、法线、UV | ✅ | |
| PBR 基础色 / 粗糙度 / 金属度 | ✅ | metallic-roughness |
| 自发光强度 | ✅ | `KHR_materials_emissive_strength` |
| 点 / 聚光 / 平行光源 | ✅ | `KHR_lights_punctual` |
| 地面上的光斑 | ⚠️ | 光源参数在文件里，但**照亮结果要查看器算** |
| 泛光 / 辉光 | ❌ | 后期效果，任何查看器的实现细节 |
| 色调映射 / 曝光 | ❌ | 由查看器决定 |
| 全局光照（自发光照亮别的东西） | ❌ | 需要 GI 或光照贴图，文件不携带 |
| 光照链接（限定某光只照某物） | ❌ | Blender 特性，glTF 无对应表达 |
| 区域光(AREA) | ❌ | glTF 只有点/聚光/平行三种 |
| 节点驱动的程序化材质 | ❌ | 导出时会退化，见下方「已知坑」 |

所以"网页里为什么没有 X"通常有两类原因：
X 的参数不在文件里（如泛光、GI），或者 X 在文件里但查看器没实现（如本项目的
`KHR_lights_punctual` —— 提灯的地面光斑一度就是这样丢的）。

本项目提灯的**地面光斑**由文件里的三盏聚光灯算出：Blender 里它们是
`Pool_0/1/2`（暖色 `#F2A93B`、外锥角 0.401 rad、强度 2826 cd、位于每个灯笼正上方 0.55 m）。

导出时的一处妥协：原始场景里这三盏灯靠**光照链接**（light linking）限定为只照地面，
而 glTF 没有对应表达。所以导出后它们会一并照亮灯顶 —— 因为聚光灯从上方打下来，
灯罩侧壁的法线近水平、`N·L ≈ 0`，实际额外的照明集中在顶盖上，尚可接受。

查看器侧另有两个非 glTF 参数需要人工给定：

| 参数 | 值 | 原因 |
| --- | --- | --- |
| `lightExposure` | `7e-5` | glTF 用坎德拉（2826 cd），查看器需要曝光系数换算到工作单位 |
| `ambient` | `0.30` | 半球环境光上限，纯属查看器自身的补光，文件里没有 |
| `frameExclude` | `["Ground","平面"]` | 21 m 的地面会把包围盒撑爆、把主体缩成一点，取景时跳过它（照常渲染） |

### 为什么需要额外做泛光

glTF 的自发光（`emissiveFactor`）只是一个**颜色值**，不是光源。
只把它加进着色器，渲染出来的只是一个"比较亮的表面"，看起来并不像在发光。

发光感来自光溢出到相邻像素 —— 也就是 bloom。Blender 那边由 EEVEE 自动完成，
搬到网页就得自己补：亮部提取 → 可分离高斯模糊（半分辨率，横纵各一次）→ 叠加合成。

### 只给提灯开的两个开关

| 参数 | 值 | 作用 |
| --- | --- | --- |
| `bloom` | `true` | 开启泛光链（皮卡丘不开，它的亮黄色会误触发） |
| `bloomThreshold` | `0.74` | 只有亮度超过这个值的像素参与泛光 |
| `lightScale` | `0.38` | 压低漫反射，否则纸罩会被光照先推到饱和、叠上自发光就变纯白，暖金色丢失 |

`lightScale` 调低后墨色骨架会接近死黑，所以着色器里另加了**边缘光**（视方向菲涅尔项）
把轮廓勾回来。

要做更复杂的模型，建议直接换成 [`<model-viewer>`](https://modelviewer.dev/)：

```html
<script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
<model-viewer src="models/pikachu.glb" camera-controls auto-rotate></model-viewer>
```

换用 `<model-viewer>` 后即可导出 Draco 压缩版（Blender 导出时勾选
Mesh Compression → Draco），同等模型可缩到约 196 KB，但**需要 CDN 或自托管解码器**，
当前手写查看器无法解压 Draco，所以仓库里放的是未压缩版本。

## 本地预览

查看器和模型都用 `fetch` 加载，**必须走 HTTP**，不能双击 HTML 用 `file://` 打开：

```bash
# 在仓库根目录
python -m http.server 8000
# 访问 http://localhost:8000/projects/blender-3d/
```

## 重新生成模型

模型由 Blender 脚本生成，不存在 `.blend` 源文件于本仓库中。导出流程：

1. Blender 中运行 `bpy` 建模脚本（UV 球 / 锥体 / 立方体 + 布尔并集 + 体素重构）
2. 选中目标网格（排除地面、灯光、相机）
3. `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB', use_selection=True, export_apply=True)`

### 已知坑

- **Node 驱动的程序化材质不会被导出。** glTF 无法表达 Blender 节点树，
  导出器会把基础色退回 `(1,1,1)`。皮卡丘的身体一度因此变成纯白。
  解决方式是把这类外观落成真实材质分配，或提前烘焙成贴图
  （烘焙需要 Cycles，若 Blender 只编译了 EEVEE 则不可用）。
- **`open_mainfile()` 之后当前上下文会失效**，同一脚本内立即导出会报
  `Context object has no attribute 'active_object'`，需拆成两次调用。
- 导出时排除地面平面，否则查看器里会出现一大块地板。
