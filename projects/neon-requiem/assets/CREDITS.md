# Asset Credits — NEON REQUIEM

本目录内所有资产均已本地化，运行时**不依赖任何外网地址**（无 CDN / Google Fonts 在线引用）。

## Poly Haven — CC0 1.0 Universal

所有 3D 模型、PBR 纹理与 HDRI 来自 [Poly Haven](https://polyhaven.com/)，采用
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)（公有领域）许可。
可自由用于商业项目，无需署名；本文件为自愿性来源记录。

下载方式：逐个调用官方文件 API `https://api.polyhaven.com/files/{slug}` 取得真实 URL，
按 API 返回的 `size` 与 `md5` 校验后落盘（2026-11-04）。未手工拼接下载地址。

### 纹理（Diffuse / nor_gl / arm，arm = R:AO G:Rough B:Metal）

| 用途 key | Poly Haven slug | 分辨率 | Diffuse | Normal (GL) | ARM | 来源 |
| --- | --- | --- | --- | --- | --- | --- |
| brick_wall | `brick_wall_11` | 1k | `brick_wall_11_diff_1k.jpg` | `brick_wall_11_nor_gl_1k.jpg` | `brick_wall_11_arm_1k.jpg` | https://polyhaven.com/a/brick_wall_11 |
| concrete_wall | `concrete_wall_008` | 1k | `concrete_wall_008_diff_1k.jpg` | `concrete_wall_008_nor_gl_1k.jpg` | `concrete_wall_008_arm_1k.jpg` | https://polyhaven.com/a/concrete_wall_008 |
| dirty_concrete | `dirty_concrete` | 1k | `dirty_concrete_diff_1k.jpg` | `dirty_concrete_nor_gl_1k.jpg` | `dirty_concrete_arm_1k.jpg` | https://polyhaven.com/a/dirty_concrete |
| painted_metal_shutter | `painted_metal_shutter` | 1k | `painted_metal_shutter_diff_1k.jpg` | `painted_metal_shutter_nor_gl_1k.jpg` | `painted_metal_shutter_arm_1k.jpg` | https://polyhaven.com/a/painted_metal_shutter |
| rusty_metal | `rusty_metal_02` | 1k | `rusty_metal_02_diff_1k.jpg` | `rusty_metal_02_nor_gl_1k.jpg` | `rusty_metal_02_arm_1k.jpg` | https://polyhaven.com/a/rusty_metal_02 |
| corrugated_iron | `corrugated_iron_02` | 1k | `corrugated_iron_02_diff_1k.jpg` | `corrugated_iron_02_nor_gl_1k.jpg` | `corrugated_iron_02_arm_1k.jpg` | https://polyhaven.com/a/corrugated_iron_02 |
| asphalt | `asphalt_02` | 2k | `asphalt_02_diff_2k.jpg` | `asphalt_02_nor_gl_2k.jpg` | `asphalt_02_arm_2k.jpg` | https://polyhaven.com/a/asphalt_02 |
| metal_grate_rusty | `metal_grate_rusty` | 1k | `metal_grate_rusty_diff_1k.jpg` | `metal_grate_rusty_nor_gl_1k.jpg` | `metal_grate_rusty_arm_1k.jpg` | https://polyhaven.com/a/metal_grate_rusty |
| metal_plate | `metal_plate_02` | 1k | `metal_plate_02_diff_1k.jpg` | `metal_plate_02_nor_gl_1k.jpg` | `metal_plate_02_arm_1k.jpg` | https://polyhaven.com/a/metal_plate_02 |
| damaged_plaster | `damaged_plaster` | 1k | `damaged_plaster_diff_1k.jpg` | `damaged_plaster_nor_gl_1k.jpg` | `damaged_plaster_arm_1k.jpg` | https://polyhaven.com/a/damaged_plaster |
| concrete_pavement | `concrete_pavement_02` | 2k | `concrete_pavement_02_diff_2k.jpg` | `concrete_pavement_02_nor_gl_2k.jpg` | `concrete_pavement_02_arm_2k.jpg` | https://polyhaven.com/a/concrete_pavement_02 |
| wood | `dark_wood` | 1k | `dark_wood_diff_1k.jpg` | `dark_wood_nor_gl_1k.jpg` | `dark_wood_arm_1k.jpg` | https://polyhaven.com/a/dark_wood |

### 模型（glTF 2.0）

每个目录包含 `.gltf`、`.bin` 与 `textures/` 下全部 include 纹理，glTF 内相对路径原样保留，`GLTFLoader` 可直接解析。

| 用途 key | Poly Haven slug | 分辨率 | 文件 | 来源 |
| --- | --- | --- | --- | --- |
| street_lamp | `street_lamp_01` | 1k | `street_lamp_01/street_lamp_01_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/street_lamp_01 |
| trash_can | `metal_trash_can` | 1k | `metal_trash_can/metal_trash_can_1k.gltf` + 7 个 include 文件 | https://polyhaven.com/a/metal_trash_can |
| fire_hydrant | `fire_hydrant` | 1k | `fire_hydrant/fire_hydrant_1k.gltf` + 7 个 include 文件 | https://polyhaven.com/a/fire_hydrant |
| road_barrier | `concrete_road_barrier` | 1k | `concrete_road_barrier/concrete_road_barrier_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/concrete_road_barrier |
| manhole_cover | `water_manhole_cover` | 1k | `water_manhole_cover/water_manhole_cover_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/water_manhole_cover |
| trashbag | `trashbag` | 1k | `trashbag/trashbag_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/trashbag |
| cardboard_box | `cardboard_box_01` | 1k | `cardboard_box_01/cardboard_box_01_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/cardboard_box_01 |
| aircon_unit | `exterior_aircon_unit` | 1k | `exterior_aircon_unit/exterior_aircon_unit_1k.gltf` + 13 个 include 文件 | https://polyhaven.com/a/exterior_aircon_unit |
| wooden_crate | `wooden_crate_01` | 1k | `wooden_crate_01/wooden_crate_01_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/wooden_crate_01 |
| barrel | `Barrel_01` | 1k | `barrel_01/Barrel_01_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/Barrel_01 |
| utility_box | `utility_box_01` | 1k | `utility_box_01/utility_box_01_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/utility_box_01 |
| plastic_crate | `plastic_crate_01` | 1k | `plastic_crate_01/plastic_crate_01_1k.gltf` + 4 个 include 文件 | https://polyhaven.com/a/plastic_crate_01 |
| weapon_pistol | `service_pistol` | 2k | `pistol/service_pistol_2k.gltf` + .bin + 3 张 2k include 纹理（2026-11-05 下载；1k/2k 文件均按 API md5 复核） | https://polyhaven.com/a/service_pistol |

说明：`barrel_01` 在 Poly Haven 的真实 slug 为 `Barrel_01`（首字母大写），目录名规范化为 `barrel_01`，
但内部文件名保留原名（`Barrel_01.bin` / `Barrel_01_1k.gltf` / `textures/Barrel_01_*.jpg`），以保证 glTF 相对路径不变。

### HDRI

- `hdri/cobblestone_street_night_1k.hdr` — [cobblestone_street_night](https://polyhaven.com/a/cobblestone_street_night)，1k HDR，CC0。
  按 BRIEF §5 仅用于环境底光，不作为背景直接显示。

## 字体 — SIL Open Font License 1.1

woff2 通过 Google Fonts CSS API（桌面浏览器 UA）取得 latin 子集；字体本身以 OFL 1.1 发布，
许可证全文随文件放在 `fonts/` 下。

| 字体 | 字重 | 文件 | 许可 | 来源 |
| --- | --- | --- | --- | --- |
| Chakra Petch | 500 | `ChakraPetch-500-latin.woff2` | OFL-1.1 | https://fonts.google.com/specimen/Chakra+Petch |
| Chakra Petch | 700 | `ChakraPetch-700-latin.woff2` | OFL-1.1 | https://fonts.google.com/specimen/Chakra+Petch |
| Share Tech Mono | 400 | `ShareTechMono-400-latin.woff2` | OFL-1.1 | https://fonts.google.com/specimen/Share+Tech+Mono |

- Chakra Petch — Copyright 2018 The Chakra Petch Project Authors；许可证全文：`fonts/OFL-ChakraPetch.txt`。
- Share Tech Mono — Copyright (c) 2012, Carrois Type Design, Ralph du Carrois；许可证全文：`fonts/OFL-ShareTechMono.txt`。

## 许可边界

- 本目录不含任何来源不明素材。
- 字体为 OFL，不是 CC0：分发时须保留 `fonts/OFL-*.txt`，且不得单独售卖字体。
- 资产清单见 `manifest.json`；所有路径相对 `public/`，形如 `assets/...`。


## Hand model

- **Realistic Hand** — J-Toastie, licensed **CC-BY 3.0**, via Poly Pizza: https://poly.pizza/m/2lEkhDqfQf
  - File: `public/assets/models/hands/realistic_hand.glb` (rigged low-poly character hand + forearm, `hooded_char_LP`, 25 bones, Grab animation, hand albedo/normal maps embedded).
  - Modifications: frozen in its Grab pose, scaled, mirrored, baked vertex colours ignored and re-tinted to worn leather; the project's procedural glove grain normal/roughness maps are applied at runtime. Loaded twice for the left support hand and right firing hand; the right index chain is retired in favor of a dedicated trigger finger. No topology or texture content redistributed beyond the original asset.
  - Attribution is required by CC-BY 3.0 and is retained in this file and the project README.
