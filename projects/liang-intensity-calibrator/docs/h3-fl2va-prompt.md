# H3 FL2VA 生成 Prompt v5 —— 滑动变祖器（六阶段进化）

**v5 修订**（基于 `vidios/test2.mp4` 逐帧 0.5s 步长拼图人工检查）：

v4 的动作已达标，但**背景仍然硬切**。逐帧证据：突变点全部精确落在镜头切换边界（1.0→1.5s 棚拍→格子间、3.0→3.5s 格子间→大堂、4.5→5.0s 大堂→黄昏、8.5→9.0s 天台→宫殿），镜头内背景驻留不动，切点处整体替换。唯一连续的是黄昏→夜晚——因为那是**同一空间的光线参数变化**。

**结论：6 镜头结构本身就是硬切元凶**。每个 `[Shot N] At 00:xx.xxx` 都会诱发模型整体渲染新场景后切换。H3 技能规范亦明确 FL2VA 倾向单镜头连续插值。v5 改为：

1. **单镜头、无剪辑**：整段 10 秒是一条连续拍摄，无镜头切换、无跳变；通过"by the X-second mark"进度表述锚定各阶段到达时间。
2. **空间物理形变链**：6 个场景互为"上一空间的变形"，而非并列场景：
   - 棚拍 → 格子间：灰色背景墙中**直接生长出**隔板与显示器，地面仍留灰棚质感逐渐溶解
   - 格子间 → 大堂：隔板**变薄升高为大理石柱**，天花打开，磨石地面铺开
   - 大堂 → 黄昏落地窗：大堂远墙**变为一扇巨窗**，日光转暮色
   - 黄昏落地窗 → 天台：窗玻璃**溶解**、四壁退去、地面远缘**变为矮女儿墙**——落地窗正是室内通向室外的桥
   - 天台 → 宫殿：城市灯火**下沉熄灭**，暗红宫墙从女儿墙外**升起**，金色浮雕在身后**点燃成形**
3. **灯光驱动过渡**：色调/色温变化是模型唯一能稳定渐变的维度，让它承担每一次场景转变的衔接。
4. **宫殿延迟完成**：8.5 秒只是"成形中"，完整细节只在最后一刻到达（test2 证明：一旦写出完整名词就硬切，所以全文不再出现已落定的完整场景名词）。
5. **负向指令**：显式写明「无硬切、无场景跳变、整段一条连续镜头」。

代价（需接受）：锚点时刻的场景不再是"完美成品"，而是"基本成形 + 边界残留过渡"的混合态——这正是连续性的代价，也是你要的效果。

## 阶段设计表（10 秒连续拍摄 · 首尾帧锚定）

| 时间锚点 | 阶段 | 脸型（渐进） | 服装（渐进） | 背景状态（连续形变） | 小动作（幅度小） |
|---|---|---|---|---|---|
| 0.00 | 小难梁 | 瘦削憔悴椭圆脸、脸颊凹陷（= 首帧） | 深藏青西装略宽松 + 浅蓝衬衫领口敞开（= 首帧） | 浅灰纯色棚拍（= 首帧） | 紧张吸气、肩微缩、目光躲闪垂落再收回 |
| 1.70 | 牢梁 | 稍充实，眉间忧虑略减 | 更深色合身西装 | 格子间**基本成形**（灰棚痕迹在边缘溶解中） | 头微抬几度、慢眨眼、目光定住 |
| 3.40 | 梁子 | 自然窄长基准脸 | 剪裁良好西装 + 白衬衫 | 大理石大堂**落定**，远墙开始变窗 | 极轻微点头、缓慢吸气 |
| 5.10 | 梁圣 | 眉骨/颧骨/下颌增强约三成 | 立领雏形渐现 + 暗红金边 | 黄昏落地窗**落定**，暮色入夜、玻璃溶解中 | 极慢眨眼一次、眉骨微压 |
| 6.80 | 梁神 | 方下颌明显增宽、眉压眼 | 深蓝黑立领装成型 | 天台夜景**落定**，灯火开始下沉 | 下颌微紧、极慢侧头几度再转回 |
| 8.50 | 梁祖 | 国字方脸、下颌极宽（渐进至尾帧） | 帝袍冕冠**成形中**（= 尾帧） | 宫殿成形中，金浮雕持续增亮（= 尾帧） | 头缓缓扬起、珠链轻晃、极轻微颔首 |
| 10.0 | 梁祖 | （= 尾帧完全体） | （= 尾帧完全体） | 金色龙云浮雕光轮 + 回纹宫墙完全体（= 尾帧） | 落定尾帧构图 |

**全程锚点**：同一男性 · 眼镜全程保留（半框→细框渐进）· 正对镜头居中 · 头肩以上近景 · 发型碎发→四六侧分渐进 · 相机全程不动不切 · 无文字水印。

## 生成参数

- **模式**：图生视频 FL2VA（首帧上传 `imgs/frist.png`，尾帧上传 `imgs/last.png`）
- **时长**：固定 **10 秒**（不要缩减）
- **快速试跑**：平台选**低分辨率/压缩画质**档即可
- **关闭平台水印**：测试版画面含「by @AI生成」水印与烧录时间戳，正式生成务必关闭
- **音频**：全程静音（`N/A`），不需要生成人声或配乐
- **仅此一种提示词**

---

## 唯一 Prompt（10 秒 · 单镜头连续拍摄）

```text
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the 10.00-second mark of the target video.

integrated_multimodal_description: [Shot 1] Photorealistic cinematic portraiture, a static medium close-up shot, one continuous unbroken take: the camera never moves and never cuts, the framing stays fixed on the same man shown in Picture 1, centered and facing the lens — his face, his clothes, and the space around him transform smoothly and gradually, element by element, with no hard scene changes and no jumps anywhere in the video. He begins exactly as in Picture 1: a thin, worn oval face with slightly hollowed cheeks, a neat but slightly tousled short black hairstyle with a light fringe, half-frame glasses with a thin black upper rim, a dark navy suit slightly loose on him, a light-blue shirt with the top button undone, a faint worried furrow between his brows, a downcast hollow gaze — a beaten, ingratiating, weary man waiting to be blamed — before a plain light-grey studio backdrop under soft even frontal lighting. He inhales with a nervous shiver, his shoulders hunching slightly; his gaze darts down and away for an instant before returning. Around the 1.5-second mark, pale office partitions and dark computer monitors begin to materialize directly out of the grey studio wall behind him, soft and translucent first and then more solid, while the grey seamless floor still shows underneath; by the 1.7-second mark the cubicle has mostly formed around him — partitions and monitors flanking him, a desk edge below frame, cold white fluorescent light — with traces of the grey studio still lingering at the edges and dissolving as the shot continues. His face has grown slightly fuller, his shoulders begin to open, the worried furrow relaxes a little as the ingratiating look gives way to mild restrained displeasure; he lifts his chin a few degrees, blinks slowly, and his gaze settles. From there the partitions thin out and rise into smooth white marble columns, the low ceiling opening upward and a polished marble floor spreading under him, so that by the 3.4-second mark he stands in a bright marble office lobby washed with daylight — the transformation completing fluidly without a break. His face has now settled into its natural baseline, a medium-narrow face with clean features, neater short black hair, thin glasses, a well-tailored dark suit over a white shirt, a neutral direct gaze with the quiet confidence of someone newly established; he gives a single barely perceptible nod and draws one slow, steady breath. Then the far wall of the lobby gradually turns into one huge floor-to-ceiling window as the daylight outside warms toward golden hour; by the 5.1-second mark he stands before the window at dusk, a city skyline stretched behind the glass and warm amber light rimming his silhouette, his brow bones, cheekbones, and jawline now noticeably firmer and wider, his suit beginning to give way to a black stand-collar outfit with faint dark-red and antique-gold trim at the collar; he blinks once, very slowly, as his brow presses down a fraction. Through the window the amber dusk darkens into night, and then the glass itself slowly dissolves, the walls around him receding and the far edge of the floor turning into a low parapet, so that by the 6.8-second mark he stands on a rooftop terrace under the open night sky with the neon city spread far behind him — the room becomes open air in one continuous fluid transformation. His brow ridge is more prominent, his cheekbones sharper, his square jaw widened considerably, his neck and shoulders thicker, wearing a dark navy-black stand-collar jacket, blue-and-magenta neon reflecting off his glasses; his jaw tightens faintly as with deliberate slowness he turns his head a few degrees and back, the motion heavy and unhurried, his gaze bearing down like a weight. From the 8-second mark on, the glittering city below slowly dims and sinks, dark reddish walls rise around the parapet and the silhouette of a great circular relief takes shape behind him, the palace hall gradually forming; by the 8.5-second mark the walls and the glowing relief are clearly present but still gaining density and brightness, continuing to solidify through the shot — his face now a broad, powerfully built square face with a very wide jaw, thick brows drawn into a stern v-shape, thin lips pressed firmly, the hard commanding gaze of an emperor; his short black hair parted neatly at four-to-six, a black imperial robe with intricate gold embroidery — a deep-red stand collar beneath, gold cloud-embroidered lapels sweeping over the shoulders, a large raised gold dragon crest on the chest — and a black mianguan crown with ornate gold openwork carving and, instead of a veiling bead curtain, two symmetric chains of deep-red beads with black tassels hanging beside his face, leaving his features fully visible; the thin-framed glasses remain on his nose. Warm Rembrandt lighting from one side casts deep shadows while the golden circular dragon-and-cloud relief grows into a radiant backlight outlining his head and shoulders, reaching its full glowing detail only in the final moment. He slowly raises his head to a commanding angle, the bead chains swaying faintly, and gives an almost imperceptible nod, settling precisely into the pose, framing, costume, lighting, and composition established by Picture 2 at the very end of the shot.

overall_soundscape: N/A

non_diegetic_music: N/A
```

---

## 生成后检查清单

- [ ] **背景连续性**：0.5s 步长抽帧，任意相邻两帧背景高度相似、逐帧渐变，**无任何两帧之间的场景突变**
- [ ] 场景形变链完整：棚拍→格子间→大堂→黄昏落地窗→天台→宫殿，中间态由模型自由发挥
- [ ] 8.5s 帧宫殿处于**成形中**（浮雕可见但未满亮），完整体只在最后 1 秒内到达
- [ ] 脸型路径 **瘦削凹陷 → 自然窄长 → 国字方** 单调渐进，无回跳
- [ ] 每阶段小动作清晰但幅度小（紧张躲闪 / 抬头定神 / 轻点头 / 慢眨眼压眉 / 缓慢侧头 / 扬首珠链轻晃）
- [ ] 眼镜全程保留；发型碎发 → 四六侧分
- [ ] 尾帧与 `last.png` 对齐；首帧与 `frist.png` 对齐
- [ ] **无水印、无烧录时间戳**
- [ ] 时长 10 秒

## 下一步

1. 用 v5 + `imgs/frist.png` / `imgs/last.png` 重新生成（低画质试跑，记得关平台水印）
2. 视频文件给我路径 → 我自动抽 0.5s 步长帧拼图检查背景连续性 → 达标后转码（逐帧精准 seek）→ 拆帧 → 构建页面 → 接入网站