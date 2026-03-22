import * as THREE from "./vendor/three-0.161.0.module.js";

const ROUTE_PATHS = new Set(["/", "/blog", "/research", "/projects", "/til"]);
const BAYER_8X8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21]
];
const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform vec4 uPanelRect;
uniform vec2 uHeroAnchor;
uniform vec2 uWarmAnchor;
uniform vec2 uCoolAnchor;
uniform vec2 uPointerAnchor;
uniform float uPointerActive;
uniform float uTime;
uniform float uSquareSize;
uniform float uMatrixScale;
uniform float uOpacity;
uniform float uDensity;
uniform float uMotion;
uniform float uPointerStrength;
uniform float uFill;
uniform float uBalance;
uniform float uPanelSuppression;
uniform vec3 uNeutralColor;
uniform vec3 uWarmColor;
uniform vec3 uCoolColor;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i += 1) {
    value += amplitude * noise(p);
    p = (p * 2.02) + vec2(13.7, 9.2);
    amplitude *= 0.52;
  }

  return value;
}

float gaussian(vec2 uv, vec2 anchor, vec2 radius) {
  vec2 delta = (uv - anchor) / radius;
  return exp(-dot(delta, delta));
}

float bayer8(vec2 coord) {
  int x = int(mod(coord.x, 8.0));
  int y = int(mod(coord.y, 8.0));

  if (y == 0) {
    if (x == 0) return 0.0 / 64.0;
    if (x == 1) return 48.0 / 64.0;
    if (x == 2) return 12.0 / 64.0;
    if (x == 3) return 60.0 / 64.0;
    if (x == 4) return 3.0 / 64.0;
    if (x == 5) return 51.0 / 64.0;
    if (x == 6) return 15.0 / 64.0;
    return 63.0 / 64.0;
  }

  if (y == 1) {
    if (x == 0) return 32.0 / 64.0;
    if (x == 1) return 16.0 / 64.0;
    if (x == 2) return 44.0 / 64.0;
    if (x == 3) return 28.0 / 64.0;
    if (x == 4) return 35.0 / 64.0;
    if (x == 5) return 19.0 / 64.0;
    if (x == 6) return 47.0 / 64.0;
    return 31.0 / 64.0;
  }

  if (y == 2) {
    if (x == 0) return 8.0 / 64.0;
    if (x == 1) return 56.0 / 64.0;
    if (x == 2) return 4.0 / 64.0;
    if (x == 3) return 52.0 / 64.0;
    if (x == 4) return 11.0 / 64.0;
    if (x == 5) return 59.0 / 64.0;
    if (x == 6) return 7.0 / 64.0;
    return 55.0 / 64.0;
  }

  if (y == 3) {
    if (x == 0) return 40.0 / 64.0;
    if (x == 1) return 24.0 / 64.0;
    if (x == 2) return 36.0 / 64.0;
    if (x == 3) return 20.0 / 64.0;
    if (x == 4) return 43.0 / 64.0;
    if (x == 5) return 27.0 / 64.0;
    if (x == 6) return 39.0 / 64.0;
    return 23.0 / 64.0;
  }

  if (y == 4) {
    if (x == 0) return 2.0 / 64.0;
    if (x == 1) return 50.0 / 64.0;
    if (x == 2) return 14.0 / 64.0;
    if (x == 3) return 62.0 / 64.0;
    if (x == 4) return 1.0 / 64.0;
    if (x == 5) return 49.0 / 64.0;
    if (x == 6) return 13.0 / 64.0;
    return 61.0 / 64.0;
  }

  if (y == 5) {
    if (x == 0) return 34.0 / 64.0;
    if (x == 1) return 18.0 / 64.0;
    if (x == 2) return 46.0 / 64.0;
    if (x == 3) return 30.0 / 64.0;
    if (x == 4) return 33.0 / 64.0;
    if (x == 5) return 17.0 / 64.0;
    if (x == 6) return 45.0 / 64.0;
    return 29.0 / 64.0;
  }

  if (y == 6) {
    if (x == 0) return 10.0 / 64.0;
    if (x == 1) return 58.0 / 64.0;
    if (x == 2) return 6.0 / 64.0;
    if (x == 3) return 54.0 / 64.0;
    if (x == 4) return 9.0 / 64.0;
    if (x == 5) return 57.0 / 64.0;
    if (x == 6) return 5.0 / 64.0;
    return 53.0 / 64.0;
  }

  if (x == 0) return 42.0 / 64.0;
  if (x == 1) return 26.0 / 64.0;
  if (x == 2) return 38.0 / 64.0;
  if (x == 3) return 22.0 / 64.0;
  if (x == 4) return 41.0 / 64.0;
  if (x == 5) return 25.0 / 64.0;
  if (x == 6) return 37.0 / 64.0;
  return 21.0 / 64.0;
}

float rectMask(vec2 uv, vec4 rect, float blur) {
  float left = smoothstep(rect.x - blur, rect.x + blur, uv.x);
  float right = 1.0 - smoothstep(rect.z - blur, rect.z + blur, uv.x);
  float top = smoothstep(rect.y - blur, rect.y + blur, uv.y);
  float bottom = 1.0 - smoothstep(rect.w - blur, rect.w + blur, uv.y);
  return left * right * top * bottom;
}

void main() {
  float aspect = max(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 pixelUv = vUv;
  vec2 gridUv = vec2(pixelUv.x * aspect, pixelUv.y);
  vec2 cellIndex = floor(gl_FragCoord.xy / uSquareSize);
  vec2 cellCenter = ((cellIndex * uSquareSize) + (uSquareSize * 0.5)) / uResolution.xy;
  vec2 cellUv = vec2(cellCenter.x, cellCenter.y);
  vec2 cellGridUv = vec2(cellUv.x * aspect, cellUv.y);

  float driftA = fbm((cellGridUv * 3.2) + vec2(uTime * 0.022, -uTime * 0.018) * uMotion);
  float driftB = fbm((cellGridUv * 6.4) + vec2(-uTime * 0.017, uTime * 0.011) * uMotion);
  float heroLift = gaussian(cellUv, uHeroAnchor, vec2(0.24, 0.18));
  float warmLift = gaussian(cellUv, uWarmAnchor, vec2(0.22, 0.24));
  float coolLift = gaussian(cellUv, uCoolAnchor, vec2(0.22, 0.24));
  float pointerLift = gaussian(cellUv, uPointerAnchor, vec2(0.13, 0.16)) * uPointerActive * uPointerStrength;
  float panelMask = rectMask(cellUv, uPanelRect, 0.025);
  float suppression = mix(1.0, 1.0 - uPanelSuppression, panelMask);

  float cluster = max(heroLift * 1.08, max(warmLift * 0.92, coolLift * 0.92));
  float density = 0.0;
  density += cluster * (0.7 + (uDensity * 0.22));
  density += driftA * (0.18 * cluster);
  density += driftB * (0.12 * cluster);
  density += pointerLift * 0.08;
  density *= suppression;
  density = clamp(density, 0.0, 1.0);

  float threshold = bayer8(mod(floor(cellIndex / max(uMatrixScale, 1.0)), 8.0));
  float on = step(threshold, density);

  vec2 local = fract(gl_FragCoord.xy / uSquareSize);
  float pad = clamp((1.0 - uFill) * 0.5, 0.05, 0.36);
  float squareMask = step(pad, local.x) * step(pad, local.y) *
    step(local.x, 1.0 - pad) * step(local.y, 1.0 - pad);

  float warmMix = clamp((heroLift * 0.22) + (warmLift * 0.9) + (pointerLift * 0.26), 0.0, 1.0);
  float coolMix = clamp(coolLift * 0.94, 0.0, 1.0);
  vec3 tint = mix(uNeutralColor, uWarmColor, warmMix * (0.54 + (uBalance * 0.18)));
  tint = mix(tint, uCoolColor, coolMix * (0.46 + ((1.0 - uBalance) * 0.16)));

  float alpha = on * squareMask * uOpacity * clamp(0.58 + (density * 0.52), 0.4, 0.76);
  if (alpha < 0.001) discard;

  gl_FragColor = vec4(tint, alpha);
}
`;

if (typeof window !== "undefined") {
  window.__foStageDitherRequested = true;
}

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
    return;
  }

  fn();
}

function normalizePathname(pathname) {
  return ((pathname || "/").replace(/\/+$/, "") || "/").toLowerCase();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function parseNumber(value, fallback) {
  var parsed = Number.parseFloat(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTriplet(value, fallback) {
  var match = String(value || "").trim().match(/(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/);
  if (!match) return fallback.slice();

  return [
    clamp(Number.parseFloat(match[1]) / 255, 0, 1),
    clamp(Number.parseFloat(match[2]) / 255, 0, 1),
    clamp(Number.parseFloat(match[3]) / 255, 0, 1)
  ];
}

function supportsStageRoute(body) {
  if (!body) return false;
  if (body.classList.contains("context-page")) return false;
  if (
    body.classList.contains("home") ||
    body.classList.contains("blog") ||
    body.classList.contains("projects") ||
    body.classList.contains("papers-homepage") ||
    body.classList.contains("paper") ||
    body.classList.contains("page")
  ) {
    return true;
  }

  return ROUTE_PATHS.has(normalizePathname(window.location.pathname));
}

function allowsPointerInfluence() {
  if (!window.matchMedia) return true;
  return !window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(hover: none)").matches;
}

function prefersReducedMotion() {
  if (!window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function findDirectChildByClass(parent, className) {
  return Array.from(parent.children || []).find(function (node) {
    return node.classList && node.classList.contains(className);
  }) || null;
}

function ensureField(body) {
  var legacyField = body.querySelector(".home-panel-field");
  if (legacyField) legacyField.remove();

  var field = findDirectChildByClass(body, "stage-dither-field");
  if (!field) {
    field = document.createElement("div");
    field.className = "stage-dither-field";
    field.setAttribute("aria-hidden", "true");
    body.insertBefore(field, body.firstChild);
  }

  return field;
}

function getRouteKind(body) {
  if (body.classList.contains("paper")) return "paper";
  if (body.classList.contains("papers-homepage")) return "papers-homepage";
  if (body.classList.contains("blog")) return "blog";
  if (body.classList.contains("projects")) return "projects";
  if (body.classList.contains("home")) return "home";
  if (body.classList.contains("page")) return "page";

  var path = normalizePathname(window.location.pathname);
  if (path === "/") return "home";
  if (path === "/research") return "papers-homepage";
  if (path === "/blog" || path === "/til") return "blog";
  if (path === "/projects") return "projects";
  return "page";
}

function getRectAnchor(rect, viewport, biasX, biasY, fallbackX, fallbackY) {
  if (!rect || !viewport.width || !viewport.height) {
    return { x: fallbackX, y: fallbackY };
  }

  return {
    x: clamp((rect.left + (rect.width * biasX)) / viewport.width, 0.02, 0.98),
    y: clamp((rect.top + (rect.height * biasY)) / viewport.height, 0.02, 0.98)
  };
}

function buildRouteAnchors(body, main, viewport, routeKind) {
  var anchors = {
    hero: { x: 0.5, y: 0.16 },
    warm: { x: 0.28, y: 0.34 },
    cool: { x: 0.74, y: 0.36 }
  };
  var hero;
  var heading;
  var streamHeadings;
  var cards;
  var mainRect;

  if (!main) return anchors;

  mainRect = main.getBoundingClientRect();
  hero =
    main.querySelector(".hero-title.hero-typecode") ||
    main.querySelector(".hero-title") ||
    main.querySelector("h1") ||
    main.querySelector("h2");

  anchors.hero = getRectAnchor(hero && hero.getBoundingClientRect(), viewport, 0.62, 0.8, anchors.hero.x, anchors.hero.y);

  if (routeKind === "home") {
    streamHeadings = main.querySelectorAll(".streams .stream > h2");
    anchors.warm = getRectAnchor(streamHeadings[0] && streamHeadings[0].getBoundingClientRect(), viewport, 0.34, 1.3, 0.27, 0.48);
    anchors.cool = getRectAnchor(streamHeadings[1] && streamHeadings[1].getBoundingClientRect(), viewport, 0.64, 1.26, 0.72, 0.48);
    return anchors;
  }

  if (routeKind === "papers-homepage") {
    cards = main.querySelectorAll(".research-card");
    anchors.warm = getRectAnchor(cards[0] && cards[0].getBoundingClientRect(), viewport, 0.26, 0.3, 0.28, 0.42);
    anchors.cool = getRectAnchor(cards[1] && cards[1].getBoundingClientRect(), viewport, 0.76, 0.34, 0.72, 0.46);
    return anchors;
  }

  if (routeKind === "paper") {
    anchors.hero = getRectAnchor(hero && hero.getBoundingClientRect(), viewport, 0.5, 0.72, 0.48, 0.12);
    anchors.warm = {
      x: clamp((mainRect.left - Math.min(viewport.width * 0.06, 72)) / viewport.width, 0.08, 0.42),
      y: clamp((mainRect.top + Math.min(mainRect.height * 0.12, 88)) / viewport.height, 0.1, 0.42)
    };
    anchors.cool = {
      x: clamp((mainRect.right + Math.min(viewport.width * 0.05, 68)) / viewport.width, 0.56, 0.92),
      y: clamp((mainRect.top + Math.min(mainRect.height * 0.16, 108)) / viewport.height, 0.12, 0.46)
    };
    return anchors;
  }

  heading = main.querySelector("h1, h2");
  anchors.warm = getRectAnchor(heading && heading.getBoundingClientRect(), viewport, 0.24, 0.92, 0.28, 0.26);
  anchors.cool = {
    x: clamp((mainRect.right - (mainRect.width * 0.1)) / viewport.width, 0.58, 0.9),
    y: clamp((mainRect.top + (mainRect.height * 0.18)) / viewport.height, 0.16, 0.52)
  };
  return anchors;
}

function buildPanelRect(main, viewport, suppressionFallback) {
  if (!main || !viewport.width || !viewport.height) {
    return {
      rect: { x: 0.16, y: 0.18, z: 0.84, w: 0.76 },
      suppression: suppressionFallback
    };
  }

  var rect = main.getBoundingClientRect();
  return {
    rect: {
      x: clamp(rect.left / viewport.width, 0, 1),
      y: clamp(rect.top / viewport.height, 0, 1),
      z: clamp(rect.right / viewport.width, 0, 1),
      w: clamp(rect.bottom / viewport.height, 0, 1)
    },
    suppression: suppressionFallback
  };
}

function readConfig(body) {
  var style = window.getComputedStyle(body);
  return {
    squareSize: parseNumber(style.getPropertyValue("--stage-field-square-size"), 10),
    matrixScale: parseNumber(style.getPropertyValue("--stage-field-matrix-scale"), 1),
    opacity: parseNumber(style.getPropertyValue("--stage-field-opacity"), 0.74),
    density: parseNumber(style.getPropertyValue("--stage-field-density"), 0.58),
    motion: parseNumber(style.getPropertyValue("--stage-field-motion"), 0.92),
    pointer: parseNumber(style.getPropertyValue("--stage-field-pointer"), 0.08),
    fill: clamp(parseNumber(style.getPropertyValue("--stage-field-fill"), 0.44), 0.18, 0.92),
    balance: clamp(parseNumber(style.getPropertyValue("--stage-field-balance"), 0.5), 0, 1),
    panelSuppression: clamp(parseNumber(style.getPropertyValue("--stage-field-panel-suppression"), 0.88), 0, 1),
    neutralColor: parseTriplet(style.getPropertyValue("--stage-field-neutral-rgb"), [0.73, 0.7, 0.66]),
    warmColor: parseTriplet(style.getPropertyValue("--stage-field-warm-rgb"), [0.62, 0.49, 0.36]),
    coolColor: parseTriplet(style.getPropertyValue("--stage-field-cool-rgb"), [0.52, 0.57, 0.72])
  };
}

function createRenderer(field) {
  var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
    premultipliedAlpha: true
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.domElement.className = "stage-dither-field__surface";
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var uniforms = {
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPanelRect: { value: new THREE.Vector4(0.16, 0.18, 0.84, 0.76) },
    uHeroAnchor: { value: new THREE.Vector2(0.5, 0.16) },
    uWarmAnchor: { value: new THREE.Vector2(0.28, 0.34) },
    uCoolAnchor: { value: new THREE.Vector2(0.74, 0.36) },
    uPointerAnchor: { value: new THREE.Vector2(0.52, 0.24) },
    uPointerActive: { value: 0 },
    uTime: { value: 0 },
    uSquareSize: { value: 10 },
    uMatrixScale: { value: 1 },
    uOpacity: { value: 0.74 },
    uDensity: { value: 0.58 },
    uMotion: { value: 0.92 },
    uPointerStrength: { value: 0.08 },
    uFill: { value: 0.44 },
    uBalance: { value: 0.5 },
    uPanelSuppression: { value: 0.88 },
    uNeutralColor: { value: new THREE.Color(0.73, 0.7, 0.66) },
    uWarmColor: { value: new THREE.Color(0.62, 0.49, 0.36) },
    uCoolColor: { value: new THREE.Color(0.52, 0.57, 0.72) }
  };
  var material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER
  });
  var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);
  field.appendChild(renderer.domElement);

  return {
    mode: "webgl",
    resize: function (width, height) {
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      uniforms.uResolution.value.set(width, height);
    },
    update: function (state) {
      uniforms.uTime.value = state.time;
      uniforms.uSquareSize.value = state.config.squareSize;
      uniforms.uMatrixScale.value = state.config.matrixScale;
      uniforms.uOpacity.value = state.config.opacity;
      uniforms.uDensity.value = state.config.density;
      uniforms.uMotion.value = state.config.motion;
      uniforms.uPointerStrength.value = state.config.pointer;
      uniforms.uFill.value = state.config.fill;
      uniforms.uBalance.value = state.config.balance;
      uniforms.uPanelSuppression.value = state.config.panelSuppression;
      uniforms.uPointerActive.value = state.pointer.active;
      uniforms.uHeroAnchor.value.set(state.anchors.hero.x, state.anchors.hero.y);
      uniforms.uWarmAnchor.value.set(state.anchors.warm.x, state.anchors.warm.y);
      uniforms.uCoolAnchor.value.set(state.anchors.cool.x, state.anchors.cool.y);
      uniforms.uPointerAnchor.value.set(state.pointer.x, state.pointer.y);
      uniforms.uPanelRect.value.set(state.panelRect.x, state.panelRect.y, state.panelRect.z, state.panelRect.w);
      uniforms.uNeutralColor.value.setRGB(state.config.neutralColor[0], state.config.neutralColor[1], state.config.neutralColor[2]);
      uniforms.uWarmColor.value.setRGB(state.config.warmColor[0], state.config.warmColor[1], state.config.warmColor[2]);
      uniforms.uCoolColor.value.setRGB(state.config.coolColor[0], state.config.coolColor[1], state.config.coolColor[2]);
      renderer.render(scene, camera);
    },
    destroy: function () {
      renderer.dispose();
      material.dispose();
      mesh.geometry.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}

function createFallback(field) {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d", { alpha: true });
  canvas.className = "stage-dither-field__fallback";
  canvas.setAttribute("aria-hidden", "true");
  field.appendChild(canvas);

  function fallbackNoise(x, y) {
    var a = Math.sin((x * 12.47) + (y * 5.13));
    var b = Math.cos((y * 10.86) - (x * 4.39));
    var c = Math.sin((x * 28.1) + (y * 17.7));
    return ((a * 0.5) + (b * 0.35) + (c * 0.15) + 1) * 0.5;
  }

  function gaussian(pointX, pointY, anchorX, anchorY, radiusX, radiusY) {
    var dx = (pointX - anchorX) / radiusX;
    var dy = (pointY - anchorY) / radiusY;
    return Math.exp(-((dx * dx) + (dy * dy)));
  }

  function mixColor(base, tint, amount) {
    return [
      (base[0] * (1 - amount)) + (tint[0] * amount),
      (base[1] * (1 - amount)) + (tint[1] * amount),
      (base[2] * (1 - amount)) + (tint[2] * amount)
    ];
  }

  return {
    mode: "fallback",
    resize: function (width, height) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
    },
    update: function (state) {
      var width = state.viewport.width;
      var height = state.viewport.height;
      var step = Math.max(7, state.config.squareSize);
      var fillSize = Math.max(1, Math.round(step * state.config.fill));
      var pad = Math.round((step - fillSize) * 0.5);
      var baseColor = state.config.neutralColor;
      var warmColor = state.config.warmColor;
      var coolColor = state.config.coolColor;
      var x;
      var y;

      context.clearRect(0, 0, width, height);

      for (y = 0; y < height; y += step) {
        for (x = 0; x < width; x += step) {
          var cellX = (x + (step * 0.5)) / width;
          var cellY = (y + (step * 0.5)) / height;
          var drift = fallbackNoise(cellX * 1.8, cellY * 1.2) * 0.18;
          var detail = fallbackNoise((cellX * 3.7) + 4.2, (cellY * 2.9) - 1.7) * 0.12;
          var heroLift = gaussian(cellX, cellY, state.anchors.hero.x, state.anchors.hero.y, 0.24, 0.18);
          var warmLift = gaussian(cellX, cellY, state.anchors.warm.x, state.anchors.warm.y, 0.22, 0.24);
          var coolLift = gaussian(cellX, cellY, state.anchors.cool.x, state.anchors.cool.y, 0.22, 0.24);
          var cluster = Math.max(heroLift * 1.08, Math.max(warmLift * 0.92, coolLift * 0.92));
          var panelInside =
            cellX >= state.panelRect.x &&
            cellX <= state.panelRect.z &&
            cellY >= state.panelRect.y &&
            cellY <= state.panelRect.w;
          var density =
            (cluster * (0.7 + (state.config.density * 0.22))) +
            (drift * cluster) +
            (detail * cluster);

          if (panelInside) {
            density *= 1 - state.config.panelSuppression;
          }

          density = clamp(density, 0, 1);

          var bayerX = Math.floor((x / step) / Math.max(1, state.config.matrixScale)) % 8;
          var bayerY = Math.floor((y / step) / Math.max(1, state.config.matrixScale)) % 8;
          var threshold = BAYER_8X8[bayerY][bayerX] / 64;
          if (density <= threshold) continue;

          var color = mixColor(baseColor, warmColor, clamp((heroLift * 0.22) + (warmLift * 0.9), 0, 1) * (0.54 + (state.config.balance * 0.18)));
          color = mixColor(color, coolColor, clamp(coolLift * 0.94, 0, 1) * (0.46 + ((1 - state.config.balance) * 0.16)));

          context.fillStyle =
            "rgba(" +
            Math.round(color[0] * 255) +
            "," +
            Math.round(color[1] * 255) +
            "," +
            Math.round(color[2] * 255) +
            "," +
            (state.config.opacity * clamp(0.58 + (density * 0.52), 0.4, 0.76)).toFixed(3) +
            ")";
          context.fillRect(x + pad, y + pad, fillSize, fillSize);
        }
      }
    },
    destroy: function () {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}

function createStageSystem(field) {
  try {
    return createRenderer(field);
  } catch (error) {
    field.dataset.renderer = "fallback";
    return createFallback(field);
  }
}

function initStageDitherField() {
  var body = document.body;
  if (!supportsStageRoute(body) || window.__foStageDitherReady) return;

  var main = document.querySelector("main");
  if (!main) return;

  window.__foStageDitherReady = true;
  var field = ensureField(body);
  var system = createStageSystem(field);
  field.dataset.renderer = system.mode;
  body.classList.add("has-stage-dither");

  var viewport = {
    width: window.innerWidth || document.documentElement.clientWidth || 0,
    height: window.innerHeight || document.documentElement.clientHeight || 0
  };
  var routeKind = getRouteKind(body);
  var config = readConfig(body);
  var panel = buildPanelRect(main, viewport, config.panelSuppression);
  var pointerEnabled = allowsPointerInfluence();
  var reducedMotion = prefersReducedMotion();
  var pointer = {
    x: 0.52,
    y: 0.24,
    targetX: 0.52,
    targetY: 0.24,
    active: 0,
    targetActive: 0
  };
  var anchors = buildRouteAnchors(body, main, viewport, routeKind);
  var state = {
    viewport: viewport,
    config: config,
    anchors: anchors,
    panelRect: panel.rect,
    pointer: pointer,
    time: 0
  };
  var rafId = 0;
  var layoutFrame = 0;
  var startedAt = performance.now();

  function syncLayout() {
    viewport.width = window.innerWidth || document.documentElement.clientWidth || 0;
    viewport.height = window.innerHeight || document.documentElement.clientHeight || 0;
    config = readConfig(body);
    anchors = buildRouteAnchors(body, main, viewport, routeKind);
    panel = buildPanelRect(main, viewport, config.panelSuppression);
    state.viewport = viewport;
    state.config = config;
    state.anchors = anchors;
    state.panelRect = panel.rect;
    system.resize(viewport.width, viewport.height);
  }

  function scheduleLayout() {
    if (layoutFrame) return;
    layoutFrame = window.requestAnimationFrame(function () {
      layoutFrame = 0;
      syncLayout();
      renderFrame(performance.now());
    });
  }

  function renderFrame(now) {
    state.time = reducedMotion ? 0 : ((now - startedAt) * 0.001);
    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;
    pointer.active += (pointer.targetActive - pointer.active) * 0.085;
    system.update(state);

    if (!reducedMotion && !document.hidden) {
      rafId = window.requestAnimationFrame(renderFrame);
    } else {
      rafId = 0;
    }
  }

  function onPointerMove(event) {
    if (!pointerEnabled || reducedMotion) return;
    pointer.targetX = clamp(event.clientX / Math.max(viewport.width, 1), 0.02, 0.98);
    pointer.targetY = clamp(event.clientY / Math.max(viewport.height, 1), 0.02, 0.98);
    pointer.targetActive = Math.min(config.pointer, 0.16);
  }

  function onPointerLeave() {
    pointer.targetX = 0.52;
    pointer.targetY = routeKind === "home" ? 0.2 : 0.24;
    pointer.targetActive = 0;
  }

  function onVisibilityChange() {
    if (!reducedMotion && !document.hidden && !rafId) {
      rafId = window.requestAnimationFrame(renderFrame);
      return;
    }

    if (document.hidden && rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  syncLayout();
  if (!reducedMotion) {
    rafId = window.requestAnimationFrame(renderFrame);
  } else {
    renderFrame(performance.now());
  }

  window.addEventListener("resize", scheduleLayout, { passive: true });
  window.addEventListener("scroll", scheduleLayout, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (pointerEnabled && !reducedMotion) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", function (event) {
      if (!event.relatedTarget) onPointerLeave();
    }, { passive: true });
    window.addEventListener("blur", onPointerLeave, { passive: true });
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  ready(initStageDitherField);
}
