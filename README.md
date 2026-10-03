<div align="center">

<img src="./assets/browser-lab-banner.svg" width="100%" alt="HunLuanZhiZhu Browser Lab" />

<br/>

<a href="./READMEch.md"><img src="https://img.shields.io/badge/中文文档-READMEch.md-2563EB?style=for-the-badge" alt="Chinese README"/></a>
<a href="https://zyh.sryze.cc/"><img src="https://img.shields.io/badge/Live_Site-zyh.sryze.cc-B8FF55?style=for-the-badge" alt="Live site"/></a>
<img src="https://img.shields.io/badge/Static-HTML_%2B_CSS_%2B_JS-79E8FF?style=for-the-badge" alt="Static HTML CSS JS"/>
<img src="https://img.shields.io/badge/Build_Step-none-D0B2FF?style=for-the-badge" alt="No build step"/>
<a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-6B7280?style=for-the-badge" alt="MIT License"/></a>

<br/><br/>

**A personal Browser Lab for experiments, games, research demos, slides, and small useful tools.**

</div>

---

## About

This repository hosts my personal static website and a collection of browser-based projects.

**Live:** https://zyh.sryze.cc/

It is intentionally not a unified framework and has no build system. The root `index.html` acts as the interactive project index, while each project lives under `projects/<slug>/` and can use its own HTML, CSS, JavaScript, WASM, WebGL, or other browser technologies.

The core idea is simple:

<div align="center">

**one index · independent projects · browser first**

</div>

<table>
<tr>
<td width="33%" valign="top">

### 🧪 Browser experiments
Canvas, WebGL, SVG, WASM, procedural graphics, and experiments that do not fit neatly into a conventional portfolio.

</td>
<td width="33%" valign="top">

### 🧠 Research & demos
Research visualizations, AI evaluations, group-meeting slides, and small model / algorithm demos.

</td>
<td width="33%" valign="top">

### 🧰 Small tools
Useful pages and utilities designed to run locally in the browser without a backend or complicated deployment.

</td>
</tr>
</table>

---

## Featured projects

| # | Project | What it is | Stack |
|---:|---|---|---|
| 01 | [Minecraft Web](https://zyh.sryze.cc/projects/minecraft-web/) | A 3D sandbox experiment compiled from Rust + Bevy to the browser | Rust · Bevy · WASM |
| 02 | [Neon Pulse](https://zyh.sryze.cc/projects/neon-pulse/) | A neon Canvas arcade / dodge game | Canvas · Arcade |
| 03 | [Group Meeting PPTs](https://zyh.sryze.cc/projects/group-meeting-ppts/) | Browser-based index for research presentation decks | Slides · KaTeX · SVG · WebGL |
| 04 | [GUON Optimizer](https://zyh.sryze.cc/projects/guon-paper/) | Experimental optimizer / LLM research presentation | LLM · Optimizer · Satire |
| 05 | [ECG AI Local](https://zyh.sryze.cc/projects/ecg-ai-local/) | Local-in-browser ECG AI experiment | TensorFlow.js · SNN · Local AI |
| 06 | [Liang Intensity Calibrator](https://zyh.sryze.cc/projects/liang-intensity-calibrator/) | Video / image driven continuous intensity calibrator | Video · Canvas · AI |
| 07 | [Game Studio Eval · Season 2](https://zyh.sryze.cc/projects/game-studio-eval-s2/) | Browser-facing evaluation of AI game generation | Benchmark · Godot · WASM |
| 08 | [Dynamic SVG Pelican](https://zyh.sryze.cc/projects/svg-pelican/) | Dynamic SVG / SMIL drawing experiment | SVG · SMIL |
| 09 | [Blender 3D](https://zyh.sryze.cc/projects/blender-3d/) | Blender → glTF → WebGL 3D presentation experiment | Blender · glTF · WebGL |
| 10 | [Open Design Test](https://zyh.sryze.cc/projects/open-design-test/) | WebGL2 shaders and open-ended visual design experiments | WebGL2 · Shader |

### Client / commissioned work

| Project | Path | Stack |
|---|---|---|
| [Breakout](https://zyh.sryze.cc/projects/clients/breakout/) | `/projects/clients/breakout/` | Godot · SVG · WASM |
| [Fund Manager](https://zyh.sryze.cc/projects/fund-manager/) | `/projects/fund-manager/` | IndexedDB · SheetJS · Single-page |

Some historical or auxiliary pages remain under `projects/` without appearing in the main homepage index. The first Game Studio Eval and an earlier ECG page are examples.

---

## Homepage design

The root homepage is a **single-file HTML application**:

~~~text
index.html
├── inline fonts
├── inline CSS
├── inline JavaScript
├── project registry
├── Canvas 2D hero
├── project-card renderers
├── WebGL star field
├── search / filters
└── bilingual UI
~~~

There is no runtime dependency on a frontend framework, package manager, or injected build artifact.

The homepage currently includes:

- **Browser Lab Hero** — a realtime Canvas 2D trefoil-knot wireframe;
- **Project index** — 3 columns on desktop, 2 on tablet, 1 on mobile;
- **Search** — button, `/`, and `Ctrl K` / `Cmd K` shortcuts;
- **Category filtering** — persisted in the URL through `?category=`;
- **Search state** — persisted through `?q=`;
- **ZH / EN** — language preference stored in `localStorage`;
- **Motion toggle** — manually pause site-wide animation;
- **WebGL star field** — falls back to a static 2D background when unavailable;
- **Spider interaction** — a small page-level interaction experiment;
- **Native scrolling** — no scroll hijacking.

---

## Visual system

Most homepage visuals are rendered at runtime rather than shown as screenshots:

~~~text
Canvas 2D
  ├── hero wireframe
  ├── voxel lattice
  ├── arcade corridor
  ├── slide fan
  ├── optimizer landscape
  ├── ECG strip
  └── project-specific diagrams

WebGL
  └── background star field

SVG / CSS
  └── interface details and project assets
~~~

Project-card renderers adapt their animation frequency according to hover, focus, touch, and viewport visibility.

The site uses **Bricolage Grotesque** for display typography and **Cascadia Mono** for metadata. Font subsets are embedded directly into the homepage, so no font requests are needed at runtime.

---

## Repository structure

~~~text
hunluanzhizhu.github.io/
├── index.html
├── 404.html
├── CNAME
├── LICENSE
│
├── projects/
│   ├── minecraft-web/
│   ├── neon-pulse/
│   ├── group-meeting-ppts/
│   ├── guon-paper/
│   ├── ecg-ai-local/
│   ├── liang-intensity-calibrator/
│   ├── game-studio-eval-s2/
│   ├── svg-pelican/
│   ├── blender-3d/
│   ├── open-design-test/
│   └── ...
│
├── tools/
│   ├── subset-font.py
│   └── make-images.py
│
├── og.png
├── favicon.svg
├── favicon.ico
├── apple-touch-icon.png
├── robots.txt
├── sitemap.xml
└── site.webmanifest
~~~

---

## Local preview

For most pages, a normal Python static server is enough:

~~~bash
python -m http.server 8000
~~~

Then open:

~~~text
http://localhost:8000/
~~~

### Video / Range requests

`liang-intensity-calibrator` depends on frame-accurate video seeking and therefore needs HTTP Range request support.

For that project, use the repository server:

~~~bash
python serve8000.py 8000
~~~

---

## Adding a project

Adding a new project normally takes four steps:

1. create a directory under `projects/`;
2. add its standalone `index.html` and assets;
3. register the project in the root `index.html` project data;
4. update `sitemap.xml`.

Example registry entry:

~~~js
{
  id: '11',
  slug: 'my-thing',
  title: 'MY THING',
  tag: 'DEMO',
  kind: 'app',
  stack: ['canvas'],
  fig: 'voxel',
  labelZh: '体素晶格',
  labelEn: 'VOXEL LATTICE',
  descZh: '一句话描述。',
  descEn: 'One line.'
}
~~~

`fig` may reuse an existing renderer or point to a newly added renderer in the homepage graphics registry.

There is no npm install, bundling step, or CI build requirement. Commit the static files and deploy.

---

## Generated assets

A small number of bitmap files are generated site assets rather than runtime dependencies:

- `og.png` — social preview image;
- `apple-touch-icon.png` — Apple touch icon.

Regenerate them with:

~~~bash
python tools/make-images.py
~~~

Font subset utilities:

~~~bash
python tools/subset-font.py --inject index.html 404.html
python tools/subset-font.py --report
~~~

These tools run locally and are not part of the deployment pipeline.

---

<details>
<summary><strong>Implementation notes</strong></summary>

### Animation budget

The page uses a shared `requestAnimationFrame` loop:

- Hero rendering is capped at about 30 fps;
- actively interacted project graphics can reach about 60 fps;
- idle graphics in the viewport update less frequently;
- offscreen renderers stop drawing;
- the loop stops when the page is hidden or motion is paused.

### Group Meeting PPTs

`/projects/group-meeting-ppts/` is an aggregate page linking two independent presentation decks:

- `group-meeting-eml/` — 32 slides;
- `group-meeting-ct/` — 43 slides.

The source repository for the presentation system is [HunLuanZhiZhu/zuhui-ppt](https://github.com/HunLuanZhiZhu/zuhui-ppt).

### Legacy project paths

- `/projects/game-studio-eval/` preserves the first evaluation season;
- `/projects/ecg-ai-local1/` is an earlier page;
- both remain deployed but are not primary homepage cards.

### Large assets

`projects/minecraft-web/minecraft_web_bg.wasm` is a relatively large WASM artifact. It is currently committed directly to the repository; future large binary assets may be better suited to Git LFS or GitHub Releases.

</details>

---

## Deployment

This repository is deployed as a GitHub Pages static site.

Custom domain:

**https://zyh.sryze.cc/**

`CNAME`, `robots.txt`, `sitemap.xml`, Open Graph metadata, and the Web App Manifest are all kept directly in the repository.

---

## License

MIT — see [LICENSE](./LICENSE).

For the Chinese version, see **[READMEch.md](./READMEch.md)**.
