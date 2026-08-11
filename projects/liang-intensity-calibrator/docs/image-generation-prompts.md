# 生图 Prompt —— 首尾帧重新生成（小难梁 v2 / 梁祖 v2）

用生图模型重新生成 FL2VA 的首帧与尾帧，原项目人像仅作**角色参考**，允许重新演绎细节。
两帧必须保持**锚点一致**，否则 FL2VA 插值会漂移：

> **锚点（两帧必须一致）**：男性 · 方脸 · 黑色短发（尾帧略增龄）· 细框眼镜（全程保留）· 正对镜头 · 画面居中 · 近景/中近景（头肩以上）

## 使用说明

- 生图平台若支持**参考图/角色参考**模式（如即梦角色参考、MJ `--cref`）：上传本项目 `references/` 下对应原图（首帧参考 `01-xiaoliang.png`，尾帧参考 `05-liangzu.png`），相似度选「中等」，保留五官与眼镜特征
- 若不支持参考图：直接粘贴 prompt 即可，人物特征已内嵌描述
- 推荐统一画风：**超写实数字人像摄影**（两帧同风格，进化才自然）

---

## Prompt ①：首帧 —— 小难梁 v2

### 中文版

```
超写实数字人像摄影，近景特写，一位约28-30岁的中国男性正对镜头，画面居中对称构图，取景头部至胸部以上。
人物：方形脸，下颌线条清晰，黑色短发约3-5厘米，刘海自然分开；佩戴半框细边眼镜（黑色上框、银色细腿），镜片透明；表情平静而温和，眼神直视镜头，眉间带着一丝下班后的倦意，嘴唇自然闭合，无明显笑容。
衣着：深蓝色（藏青）西装外套，面料有轻微质感，内搭浅蓝色衬衫，领口第一颗扣子未系，衣领微微敞开，正式中带一点松弛。
背景：纯浅灰色摄影棚背景，极轻微的由亮到暗渐变，干净无杂物。
灯光：柔和均匀的正面柔光箱打光，面部无强烈阴影，肤色自然偏暖，整体色调冷静中性，细节清晰（发丝、皮肤纹理、镜片反光）。
画风：高质量数码人像摄影，证件照般的整洁与写实感，无文字、无水印。
```

### English version

```
Hyper-realistic digital portrait photography, close-up medium shot, a Chinese man around 28-30 years old facing the camera directly, centered symmetric composition, framing from head to upper chest.
Subject: square face with a defined jawline, short black hair 3-5 cm with a naturally parted fringe; rimless half-frame glasses (black top rim, thin silver temples), transparent lenses; calm and gentle expression, eyes looking straight into the lens, a faint hint of after-work tiredness between the brows, lips naturally closed, no smile.
Attire: dark navy (藏青) suit jacket with subtle fabric texture, light-blue shirt underneath with the top button undone and collar slightly open — formal yet a little relaxed.
Background: plain light-grey studio backdrop with a very subtle brightness gradient, clean and empty.
Lighting: soft even frontal softbox lighting, no harsh shadows on the face, natural slightly warm skin tone, cool neutral overall palette, crisp details (hair strands, skin texture, lens reflections).
Style: high-quality digital portrait photography with an ID-photo-like neatness and realism, no text, no watermark.
```

---

## Prompt ②：尾帧 —— 梁祖 v2

### 中文版

```
超写实数字人像摄影，近景特写，一位约45-50岁的中国中年男性正对镜头，画面居中对称构图，取景头部至胸部以上。
人物：方形脸，下颌硬朗，黑色短发，额前整齐短刘海，眉浓且微上扬；目光锐利、不怒自威，嘴角微微下沉，表情庄严深沉；佩戴细边金属框眼镜（深色细框），镜片透明——眼镜与帝王装扮形成"古今碰撞"的视觉反差。
衣着：黑底金线帝王锦袍，满布五爪金龙与祥云刺绣，丝质光泽；立领处露出深红色内衬，领口与肩部有金色卷草纹滚边刺绣，华丽对称。
帝冕：头戴完整东方帝王冕冠——顶部黑色平直长方形冕板，冕板前后各垂数串青绿色玉珠串（玉珠与金珠相间），珠串末端金色收尾，珠帘自然下垂轻掩额头与眉眼；冠体黑色，正面中央有金色镂空龙纹雕饰。
背景：深红褐色宫廷大殿内景，身后一面巨大的金色圆形浮雕（对称卷草云纹），两侧隐约可见暗金殿柱轮廓，庄严肃穆。
灯光：伦勃朗式戏剧光，主光从一侧打来，面部一侧留下深邃阴影，另一侧高光；龙纹金线、玉珠与镜片边缘在光下微泛光泽。整体黑、金、红主色调，高饱和高对比，厚重奢华。
画风：超写实数字艺术，皮肤纹理、刺绣丝线、玉石光泽与金属反光均精细刻画，无文字、无水印。
```

### English version

```
Hyper-realistic digital portrait photography, close-up shot, a Chinese middle-aged man around 45-50 years old facing the camera directly, centered symmetric composition, framing from head to upper chest.
Subject: square face with a firm jawline, short black hair with a neat straight fringe, thick slightly raised brows; piercing sharp gaze, lips pressed with a slight downward turn, solemn and imposing expression; wearing thin metal-frame glasses (dark thin frames) with transparent lenses — the glasses against the imperial attire create a striking "ancient-meets-modern" contrast.
Attire: black imperial robe with gold embroidery of five-clawed dragons and auspicious clouds, silky sheen; a deep-red lining visible at the high collar, gold scrolling-vine trim embroidery along the collar and shoulders, ornate and symmetric.
Imperial crown (mianguan): a complete Eastern imperial crown — a flat black rectangular board on top, several strings of pale-green jade beads (alternating jade and gold beads) hanging from the front and back edges with gold finials at the ends, the bead strings falling naturally and softly veiling the forehead and brows; a black cap with an intricate gold openwork dragon ornament at the front center.
Background: deep reddish-brown palace hall interior, a huge gold circular relief of symmetric scrolling cloud motifs behind the subject, dim outlines of dark-gold hall pillars on both sides, solemn and majestic.
Lighting: dramatic Rembrandt lighting, key light from one side casting deep shadows on one side of the face and highlights on the other; the gold embroidery threads, jade beads, and glasses edges catch subtle glints of light. Overall black / gold / red palette, high saturation and contrast, heavy and luxurious.
Style: hyper-realistic digital art with finely rendered skin texture, embroidery threads, jade luster, and metal reflections, no text, no watermark.
```

---

## 生成后检查清单

- [ ] 两帧人物**同人**（脸型 / 发型 / 眼镜一致，仅年龄差异）
- [ ] 两帧构图一致（正对镜头、居中、头肩以上近景）
- [ ] 首帧：西装 / 浅灰棚 / 柔和光；尾帧：龙袍帝冕 / 深色宫廷 / 戏剧光
- [ ] 风格统一（都是超写实人像，进化才连贯）
- [ ] 无文字 / 无水印

## 下一步

把生成的两张图（首帧 v2 + 尾帧 v2）给我路径，我会：
1. 按新图修订 FL2VA prompt（人物细节以新图为准）
2. 更新 `docs/h3-fl2va-prompt.md` 中的参考图说明
3. 待视频生成后转码并集成网站
