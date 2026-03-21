/* Bear
   Homepage graphite field
   Injects and drives a localized field layer behind the homepage content panel. */

(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
      return;
    }

    fn();
  }

  function isHomePage() {
    var body = document.body;
    if (!body) return false;
    if (body.classList.contains("home")) return true;

    var path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    return path === "/";
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function supportsReactiveField() {
    if (!window.matchMedia) return true;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    var noHover = window.matchMedia("(hover: none)").matches;

    return !reducedMotion && !coarsePointer && !noHover;
  }

  function ensureField(body) {
    var field = body.querySelector(".home-panel-field");
    if (!field) {
      field = document.createElement("div");
      field.className = "home-panel-field";
      field.setAttribute("aria-hidden", "true");
      body.insertBefore(field, body.firstChild);
    }

    var canvas = field.querySelector(".home-panel-field__canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "home-panel-field__canvas";
      canvas.setAttribute("aria-hidden", "true");
      field.appendChild(canvas);
    }

    return {
      field: field,
      canvas: canvas,
      context: canvas.getContext("2d", { alpha: true })
    };
  }

  function setFieldState(field, x, y, active) {
    field.style.setProperty("--field-x", x.toFixed(2) + "%");
    field.style.setProperty("--field-y", y.toFixed(2) + "%");
    field.style.setProperty("--field-active", String(active));
  }

  function setFieldAnchor(field, name, x, y) {
    field.style.setProperty("--field-" + name + "-x", clamp(x, 2, 98).toFixed(2) + "%");
    field.style.setProperty("--field-" + name + "-y", clamp(y, 4, 96).toFixed(2) + "%");
  }

  function viewportPercent(value, size, fallback) {
    if (!size) return fallback;
    return clamp((value / size) * 100, 2, 98);
  }

  function gaussian(x, y, anchorX, anchorY, radiusX, radiusY) {
    var dx = (x - anchorX) / radiusX;
    var dy = (y - anchorY) / radiusY;
    return Math.exp(-((dx * dx) + (dy * dy)));
  }

  function renderField(context, state) {
    if (!context || !state.width || !state.height) return;

    var width = state.width;
    var height = state.height;
    var step = state.step;
    var offset = Math.round(step * 0.5);
    var baseSize = width <= 767 ? 1 : 1.2;
    var pointerWeight = state.pointer.active ? state.pointer.active : 0;
    var hero = state.anchors.hero;
    var thinking = state.anchors.thinking;
    var systems = state.anchors.systems;
    var seam = state.anchors.seam;
    var pointer = state.pointer;
    var y;
    var x;

    context.clearRect(0, 0, width, height);

    for (y = offset; y < height; y += step) {
      for (x = offset; x < width; x += step) {
        var heroLift = gaussian(x, y, hero.x, hero.y, step * 10.8, step * 7.6);
        var warmLift = gaussian(x, y, thinking.x, thinking.y, step * 10.6, step * 8.6);
        var coolLift = gaussian(x, y, systems.x, systems.y, step * 10.6, step * 8.6);
        var seamLift = gaussian(x, y, seam.x, seam.y, step * 18, step * 4.8);
        var pointerLift = pointerWeight ? gaussian(x, y, pointer.x, pointer.y, step * 6.8, step * 5.2) * pointerWeight : 0;
        var lift = (heroLift * 0.72) + (warmLift * 0.14) + (coolLift * 0.14) + (seamLift * 0.06) + (pointerLift * 0.32);
        var warmBias = (heroLift * 0.18) + (warmLift * 0.44) + (pointerLift * 0.08);
        var coolBias = (coolLift * 0.44) + (pointerLift * 0.05);
        var alpha = clamp(0.16 + (lift * 0.38), 0.12, 0.76);
        var size = clamp(baseSize + (lift * 1.6), 1, step - 5);
        var roundedSize = Math.max(1, Math.round(size));
        var left = Math.round(x - (roundedSize * 0.5));
        var top = Math.round(y - (roundedSize * 0.5));
        var red = Math.round(88 + (lift * 92) + (warmBias * 24) + (coolBias * 8));
        var green = Math.round(84 + (lift * 82) + (warmBias * 15) + (coolBias * 10));
        var blue = Math.round(79 + (lift * 72) + (warmBias * 4) + (coolBias * 22));

        context.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + alpha.toFixed(3) + ")";
        context.fillRect(left, top, roundedSize, roundedSize);
      }
    }
  }

  function initField() {
    if (!isHomePage()) return;

    var body = document.body;
    var main = document.querySelector("main");
    if (!body || !main || body.dataset.homePanelFieldReady === "true") return;

    var fieldParts = ensureField(body);
    var field = fieldParts.field;
    var canvas = fieldParts.canvas;
    var context = fieldParts.context;
    if (!context) return;

    var restX = 52;
    var restY = 18;
    var restActive = 0.06;
    var staticActive = 0.11;
    var layoutFrame = 0;
    var renderFrame = 0;
    var state = {
      width: 0,
      height: 0,
      dpr: 1,
      step: 10,
      anchors: {
        hero: { x: 0, y: 0 },
        thinking: { x: 0, y: 0 },
        systems: { x: 0, y: 0 },
        seam: { x: 0, y: 0 }
      },
      pointer: {
        x: 0,
        y: 0,
        active: 0
      }
    };

    body.dataset.homePanelFieldReady = "true";

    function resizeCanvas() {
      var width = window.innerWidth || document.documentElement.clientWidth || 0;
      var height = window.innerHeight || document.documentElement.clientHeight || 0;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!width || !height) return;

      state.width = width;
      state.height = height;
      state.dpr = dpr;
      state.step = width <= 767 ? 14 : width <= 1100 ? 12 : 10;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
    }

    function updateAnchors() {
      var width = window.innerWidth || document.documentElement.clientWidth || 0;
      var height = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!width || !height) return;

      var hero = document.querySelector(".hero-title.hero-typecode") || document.querySelector(".hero-title");
      var streamHeadings = body.querySelectorAll(".streams .stream > h2");
      var thinkingHeading = streamHeadings[0] || null;
      var systemsHeading = streamHeadings[1] || null;

      var heroX = 34;
      var heroY = 19;
      var thinkingX = 28;
      var thinkingY = 46;
      var systemsX = 71;
      var systemsY = 46;

      if (hero) {
        var heroRect = hero.getBoundingClientRect();
        heroX = viewportPercent(
          heroRect.right + Math.min(width * 0.08, Math.max(heroRect.width * 0.28, 90)),
          width,
          heroX
        );
        heroY = viewportPercent(heroRect.top + (heroRect.height * 0.72), height, heroY);
      }

      if (thinkingHeading) {
        var thinkingRect = thinkingHeading.getBoundingClientRect();
        thinkingX = viewportPercent(thinkingRect.left + (thinkingRect.width * 0.42), width, thinkingX);
        thinkingY = viewportPercent(thinkingRect.top + (thinkingRect.height * 1.55), height, thinkingY);
      }

      if (systemsHeading) {
        var systemsRect = systemsHeading.getBoundingClientRect();
        systemsX = viewportPercent(systemsRect.left + (systemsRect.width * 0.54), width, systemsX);
        systemsY = viewportPercent(systemsRect.top + (systemsRect.height * 1.5), height, systemsY);
      }

      setFieldAnchor(field, "hero", heroX, heroY);
      setFieldAnchor(field, "thinking", thinkingX, thinkingY);
      setFieldAnchor(field, "systems", systemsX, systemsY);
      setFieldAnchor(field, "seam", (thinkingX + systemsX) / 2, (thinkingY + systemsY) / 2 - 8);

      state.anchors.hero.x = (heroX / 100) * width;
      state.anchors.hero.y = (heroY / 100) * height;
      state.anchors.thinking.x = (thinkingX / 100) * width;
      state.anchors.thinking.y = (thinkingY / 100) * height;
      state.anchors.systems.x = (systemsX / 100) * width;
      state.anchors.systems.y = (systemsY / 100) * height;
      state.anchors.seam.x = ((thinkingX + systemsX) / 200) * width;
      state.anchors.seam.y = (((thinkingY + systemsY) / 2 - 8) / 100) * height;
    }

    function scheduleRender() {
      if (renderFrame) return;

      renderFrame = window.requestAnimationFrame(function () {
        renderFrame = 0;
        renderField(context, state);
      });
    }

    function scheduleAnchors() {
      if (layoutFrame) return;

      layoutFrame = window.requestAnimationFrame(function () {
        layoutFrame = 0;
        resizeCanvas();
        updateAnchors();
        scheduleRender();
      });
    }

    resizeCanvas();
    updateAnchors();
    state.pointer.x = (restX / 100) * state.width;
    state.pointer.y = (restY / 100) * state.height;
    state.pointer.active = restActive;

    if (!supportsReactiveField()) {
      field.dataset.fieldMode = "static";
      setFieldState(field, restX, restY, staticActive);
      state.pointer.active = staticActive;
      scheduleRender();
      window.addEventListener("resize", scheduleAnchors, { passive: true });
      window.addEventListener("scroll", scheduleAnchors, { passive: true });
      return;
    }

    field.dataset.fieldMode = "interactive";
    setFieldState(field, restX, restY, restActive);
    scheduleRender();

    var nextX = restX;
    var nextY = restY;
    var nextActive = restActive;
    var frame = 0;

    function flush() {
      frame = 0;
      setFieldState(field, nextX, nextY, nextActive);
      state.pointer.x = (nextX / 100) * state.width;
      state.pointer.y = (nextY / 100) * state.height;
      state.pointer.active = nextActive;
      scheduleRender();
    }

    function schedule(x, y, active) {
      nextX = clamp(x, 2, 98);
      nextY = clamp(y, 4, 96);
      nextActive = active;

      if (frame) return;
      frame = window.requestAnimationFrame(flush);
    }

    function handlePointerMove(event) {
      if (event.pointerType === "touch") return;

      var width = window.innerWidth || document.documentElement.clientWidth || 0;
      var height = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!width || !height) return;

      var pointerX = (event.clientX / width) * 100;
      var pointerY = (event.clientY / height) * 100;
      var x = restX + ((pointerX - restX) * 0.38);
      var y = restY + ((pointerY - restY) * 0.34);

      schedule(x, y, 0.58);
    }

    function resetField() {
      schedule(restX, restY, restActive);
    }

    body.addEventListener("pointerenter", handlePointerMove, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    body.addEventListener("pointerleave", resetField, { passive: true });
    body.addEventListener("pointercancel", resetField, { passive: true });
    window.addEventListener("blur", resetField);
    window.addEventListener("resize", scheduleAnchors, { passive: true });
    window.addEventListener("scroll", scheduleAnchors, { passive: true });
  }

  ready(initField);
})();
