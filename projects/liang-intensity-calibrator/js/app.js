/* ============================================================
 * 滑动变祖器 · Liang Intensity Calibrator
 * 静态移植版（原项目为 Vite + TypeScript，此处合并为单文件无依赖 JS）
 * 对应参考项目源码：src/progression.ts / src/app.ts /
 *                  src/video-renderer.ts / src/main.ts
 * ============================================================ */
(() => {
  "use strict";

  /* ---------------- 进程模型（progression.ts 移植） ---------------- */

  const STAGES = ["小难梁", "牢梁", "梁子", "梁圣", "梁神", "梁祖"];
  const MAX_LEVEL = 30;
  const LEVELS_PER_STAGE = 6;

  function clampPosition(rawPosition) {
    return Math.min(MAX_LEVEL, Math.max(0, rawPosition));
  }

  function getProgression(rawLevel) {
    const level = Math.round(clampPosition(rawLevel));
    const stageIndex = Math.floor(level / LEVELS_PER_STAGE);
    const isFinalStage = stageIndex === STAGES.length - 1;
    const localProgress = isFinalStage
      ? 0
      : (level - stageIndex * LEVELS_PER_STAGE) / LEVELS_PER_STAGE;

    return {
      level,
      stage: STAGES[stageIndex],
      stageIndex,
      localProgress,
      strength: level / MAX_LEVEL,
    };
  }

  /* ---------------- 视频渲染（video-renderer.ts 移植） ---------------- */

  const VIDEO_FPS = 24; // 源视频实际帧率（H3 FL2VA 输出；替换正式素材时按新视频帧率修改）
  const INTERPOLATION_FACTOR = 8; // 每级帧数：30 级 × 8 = 240 段 → 241 个展示帧
  // 「裁掉首尾帧」通过映射实现，而非裁剪文件（免转码、零画质损失）：
  // 原始 243 帧（24fps × 10.125s）只展示第 1..241 帧 —— 跳过 H3 锚点帧 0（Picture 1）
  // 与末帧 242（Picture 2）。滑杆档位 k（0..240，步长 0.125）精确对应展示帧 k+1，
  // 帧号线性映射零漂移：每一帧都能被看到，无跳帧。
  const HEAD_SKIP = 1;
  const TAIL_SKIP = 1;
  // 滑杆步长 = 1/8 级 = 视频的一帧；方向键每按一次前进一帧
  const SLIDER_STEP = 1 / INTERPOLATION_FACTOR;

  // ★ 素材替换点：正式视频就位后，覆盖 video/liang-evolution.mp4 即可；
  //   需要 WebM 回退时，取消下一行注释并把对应文件放入 video/。
  //   注意：MP4 不声明 codecs —— 声明与文件实际编码不符时 Chrome 会令 seek 失效
  //   （seekable 变 [0,0]），让浏览器嗅探实际 codec 对任意 H3 素材都稳健。
  const VIDEO_SOURCES = [
    // { src: "video/liang-evolution.webm", type: 'video/webm; codecs="vp9"' },
    { src: "video/liang-evolution.mp4" },
  ];

  function positionToVideoTime(position) {
    // 帧号线性映射：档位 k = round(p × 8)，展示帧 = k + HEAD_SKIP
    const k = Math.round(clampPosition(position) * INTERPOLATION_FACTOR);
    return (k + HEAD_SKIP) / VIDEO_FPS;
  }

  function resizeCanvasToDisplaySize(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function createEvolutionVideoRenderer(canvas) {
    const video = document.createElement("video");
    video.className = "evolution-video";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.tabIndex = -1;
    video.setAttribute("aria-hidden", "true");

    VIDEO_SOURCES.forEach((source) => {
      const node = document.createElement("source");
      node.src = source.src;
      // 仅当显式给出 type 时才设置（缺省时让浏览器嗅探实际 codec；
      // 无条件赋值会把 undefined 变成非法 MIME "undefined"，导致源被拒绝）
      if (source.type) {
        node.type = source.type;
      }
      video.append(node);
    });

    canvas.after(video);

    // 追帧模型：UI 每帧只更新 desiredTime（最新目标），seek 严格串行——
    // 进行中的 seek 绝不被新目标打断（打断 = 取消，画面会一直卡到松手才更新，
    // 后半段解码链长时尤其明显）；每次 seek 完成立即绘制，目标若又前进则马上追。
    let desiredTime = null;
    let seekInFlight = false;
    let lastSeekTarget = null;

    const drawNow = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      resizeCanvasToDisplaySize(canvas);
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("当前浏览器不支持 Canvas 2D");
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    const chase = () => {
      if (seekInFlight || desiredTime === null || video.readyState < 1) {
        return;
      }

      // 可显示的最末帧时间 = (总帧数 - 1 - 尾跳帧) / 帧率
      const totalFrames = Math.round((video.duration || 0) * VIDEO_FPS);
      const lastFrameTime = Math.max(
        0,
        (totalFrames - 1 - TAIL_SKIP) / VIDEO_FPS,
      );
      const target = Math.min(desiredTime, lastFrameTime);

      if (Math.abs(video.currentTime - target) < 1 / 240) {
        // 目标帧已就位：直接重绘，避免无意义的重复 seek
        desiredTime = null;
        drawNow();
        return;
      }
      seekInFlight = true;
      lastSeekTarget = target;
      video.currentTime = target;
    };

    // 每次 seek 完成：解除占用 → 绘制当前帧 → 若期间目标又前进则立即追下一次。
    // 防空转：若 seek 完成后目标并未前进（等于本次 seek 目标），说明已达成或
    // seek 静默失败（如素材与解码器不匹配），直接绘制并停止，绝不无限重试。
    video.addEventListener("seeked", () => {
      seekInFlight = false;
      if (
        desiredTime !== null &&
        Math.abs(desiredTime - lastSeekTarget) > 1 / 240
      ) {
        chase();
      } else {
        desiredTime = null;
        drawNow();
      }
    });

    // rVFC 兜底：视频每呈现一个新帧再补一次重绘（幂等，仅加强实时性）
    let frameLoopStarted = false;
    const startFrameLoop = () => {
      if (
        frameLoopStarted ||
        typeof video.requestVideoFrameCallback !== "function"
      ) {
        return;
      }
      frameLoopStarted = true;
      const loop = () => {
        drawNow();
        video.requestVideoFrameCallback(loop);
      };
      video.requestVideoFrameCallback(loop);
    };

    const render = (position) => {
      const clampedPosition = clampPosition(position);
      desiredTime = positionToVideoTime(clampedPosition);
      canvas.dataset.frame = String(
        Math.round(clampedPosition * INTERPOLATION_FACTOR) + HEAD_SKIP,
      ).padStart(3, "0");

      chase();
    };

    return {
      video,
      load() {
        return new Promise((resolve, reject) => {
          const handleReady = () => {
            drawNow();
            startFrameLoop();
            resolve();
          };
          const handleError = () => {
            reject(new Error("连续人像视频加载失败"));
          };

          video.addEventListener("loadeddata", handleReady, { once: true });
          video.addEventListener("error", handleError, { once: true });
          video.load();
        });
      },
      render,
      redraw: drawNow,
    };
  }

  /* ---------------- 应用挂载（app.ts 移植） ---------------- */

  function createTicks() {
    return Array.from(
      { length: MAX_LEVEL + 1 },
      (_, level) =>
        `<i class="tick" data-level="${level}" aria-hidden="true"></i>`,
    ).join("");
  }

  function createStageMarkers() {
    return STAGES.map(
      (stage, index) =>
        `<li class="stage-marker" data-level="${index * 6}" style="--marker-index: ${index}">${stage}</li>`,
    ).join("");
  }

  function mountApp(root, onLevelChange = () => undefined) {
    root.innerHTML = `
      <div class="experience" data-stage="0">
        <header class="masthead">
          <div>
            <p class="eyebrow">LIANG INTENSITY CALIBRATOR</p>
            <h1>AI 连续版 · 滑动变祖器</h1>
            <p class="techline">OpenAI Image2 生成首尾帧 · MiniMax H3 连续插帧</p>
          </div>
          <div class="level-meter" aria-live="polite">
            <span>梁系强度</span>
            <output class="level-output" for="strength-slider">00 / 30</output>
          </div>
        </header>

        <section class="portrait-zone" aria-labelledby="current-stage-label">
          <p class="stage-ghost" aria-hidden="true">小难梁</p>
          <div class="portrait-shell">
            <div class="imperial-halo" aria-hidden="true"></div>
            <canvas class="portrait-canvas" role="img" aria-label="当前形态：小难梁"></canvas>
            <div class="scan-grid" aria-hidden="true"></div>
            <span class="frame-corner frame-corner--tl" aria-hidden="true"></span>
            <span class="frame-corner frame-corner--tr" aria-hidden="true"></span>
            <span class="frame-corner frame-corner--bl" aria-hidden="true"></span>
            <span class="frame-corner frame-corner--br" aria-hidden="true"></span>
            <div class="load-state" role="status">载入连续祖力…</div>
          </div>

          <div class="stage-readout">
            <span id="current-stage-label">当前状态</span>
            <p class="stage-name" aria-live="polite">小难梁</p>
            <span class="stage-index">阶段 01 / 06</span>
          </div>
        </section>

        <section class="control-panel" aria-label="梁系强度控制">
          <div class="range-wrap">
            <div class="tick-track">${createTicks()}</div>
            <input
              id="strength-slider"
              class="strength-slider"
              type="range"
              min="0"
              max="30"
              step="${SLIDER_STEP}"
              value="0"
              aria-label="梁系强度"
              aria-valuetext="小难梁，0 级，共 30 级"
              disabled
            />
          </div>
          <ol class="stage-markers">${createStageMarkers()}</ol>
          <p class="drag-hint"><span aria-hidden="true">←</span> 拖动或按 ← → 键逐帧调整 <span aria-hidden="true">→</span></p>
        </section>

        <footer class="footer-note">
          <span>241 帧原生连续进化</span>
          <span>正脸识别协议：已启用</span>
        </footer>
      </div>
    `;

    const experience = root.querySelector(".experience");
    const canvas = root.querySelector(".portrait-canvas");
    const slider = root.querySelector("#strength-slider");
    const output = root.querySelector(".level-output");
    const stageName = root.querySelector(".stage-name");
    const stageGhost = root.querySelector(".stage-ghost");
    const stageIndex = root.querySelector(".stage-index");
    const loadState = root.querySelector(".load-state");
    const ticks = Array.from(root.querySelectorAll(".tick"));
    const markers = Array.from(root.querySelectorAll(".stage-marker"));
    let currentPosition = 0;

    const setLevel = (rawLevel) => {
      const position = clampPosition(rawLevel);
      const state = getProgression(position);
      currentPosition = position;
      slider.value = String(position);
      slider.setAttribute(
        "aria-valuetext",
        `${state.stage}，${state.level} 级，共 ${MAX_LEVEL} 级`,
      );
      output.textContent = `${String(state.level).padStart(2, "0")} / ${MAX_LEVEL}`;
      stageName.textContent = state.stage;
      stageGhost.textContent = state.stage;
      stageIndex.textContent = `阶段 ${String(state.stageIndex + 1).padStart(2, "0")} / 06`;
      canvas.setAttribute("aria-label", `当前形态：${state.stage}`);
      experience.dataset.stage = String(state.stageIndex);
      experience.style.setProperty("--strength", String(position / MAX_LEVEL));
      experience.style.setProperty("--stage-progress", String(state.localProgress));

      ticks.forEach((tick, index) => {
        tick.classList.toggle("is-active", index <= state.level);
      });
      markers.forEach((marker, index) => {
        marker.classList.toggle("is-current", index === state.stageIndex);
        marker.classList.toggle("is-passed", index < state.stageIndex);
      });

      onLevelChange(position);
    };

    slider.addEventListener("input", () => {
      setLevel(Number(slider.value));
    });

    // 全局方向键：无需先点击滑杆，进入页面即可控制。
    // ←/→ 每按一帧（SLIDER_STEP 级）；PageUp/PageDown 每按一级；Home/End 直达两端。
    // 焦点在输入框时不劫持按键（此时由滑杆原生行为接管）。
    const handleGlobalKey = (event) => {
      const target = event.target;
      const tag = target && target.tagName ? target.tagName : "";
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (target && target.isContentEditable)
      ) {
        return;
      }

      let next = null;
      if (event.key === "ArrowRight") {
        next = clampPosition(currentPosition + SLIDER_STEP);
      } else if (event.key === "ArrowLeft") {
        next = clampPosition(currentPosition - SLIDER_STEP);
      } else if (event.key === "PageUp") {
        next = clampPosition(currentPosition + 1);
      } else if (event.key === "PageDown") {
        next = clampPosition(currentPosition - 1);
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = MAX_LEVEL;
      }

      if (next !== null) {
        event.preventDefault();
        setLevel(next);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);

    setLevel(0);

    return {
      canvas,
      slider,
      get level() {
        return currentPosition;
      },
      setLevel,
      setLoading(loaded, total) {
        loadState.textContent =
          loaded >= total ? "连续祖力已就绪" : "载入连续祖力…";
      },
      setReady() {
        slider.disabled = false;
        loadState.hidden = true;
      },
      setError(message) {
        slider.disabled = true;
        loadState.hidden = false;
        loadState.classList.add("is-error");
        loadState.textContent = message;
      },
    };
  }

  /* ---------------- 启动（main.ts 移植） ---------------- */

  const app = document.querySelector("#app");

  if (!app) {
    throw new Error("找不到应用挂载节点");
  }

  let controller = null;
  let renderer = null;

  const requestDraw = (level) => {
    renderer && renderer.render(level);
  };

  controller = mountApp(app, requestDraw);
  renderer = createEvolutionVideoRenderer(controller.canvas);
  controller.setLoading(0, 1);

  renderer
    .load()
    .then(() => {
      controller.setReady();
      requestDraw(controller.level);
    })
    .catch(() => {
      controller.setError("图像加载失败，请刷新重试");
    });

  window.addEventListener("resize", () => {
    renderer && renderer.redraw();
  });
})();