const ROUTE_PATHS = new Set(["/", "/blog", "/research", "/projects", "/til"]);
const UNICORN_PROJECT_ID = "1KIwzvSymx67lFWX2QuG";
const UNICORN_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.5/dist/unicornStudio.umd.js";

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

function findDirectChildByClass(parent, className) {
  return (
    Array.from(parent.children || []).find(function (node) {
      return node.classList && node.classList.contains(className);
    }) || null
  );
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

function ensureMount(field) {
  var mount = findDirectChildByClass(field, "stage-dither-field__embed");
  if (!mount) {
    mount = document.createElement("div");
    mount.className = "stage-dither-field__embed";
    field.appendChild(mount);
  }

  var project = findDirectChildByClass(mount, "stage-dither-field__project");
  if (!project) {
    project = document.createElement("div");
    project.className = "stage-dither-field__project";
    project.dataset.usProject = UNICORN_PROJECT_ID;
    mount.appendChild(project);
  }

  return mount;
}

function loadUnicornStudio() {
  if (window.__foUnicornStudioPromise) {
    return window.__foUnicornStudioPromise;
  }

  if (window.UnicornStudio && typeof window.UnicornStudio.init === "function") {
    window.__foUnicornStudioPromise = Promise.resolve(window.UnicornStudio);
    return window.__foUnicornStudioPromise;
  }

  window.__foUnicornStudioPromise = new Promise(function (resolve, reject) {
    var existing = document.querySelector('script[data-unicorn-studio-loader="true"]');

    function resolveWhenReady() {
      if (window.UnicornStudio && typeof window.UnicornStudio.init === "function") {
        resolve(window.UnicornStudio);
        return true;
      }

      return false;
    }

    if (resolveWhenReady()) return;

    if (existing) {
      existing.addEventListener("load", function () {
        if (!resolveWhenReady()) {
          reject(new Error("Unicorn Studio loaded without a usable init() method."));
        }
      }, { once: true });
      existing.addEventListener("error", function () {
        reject(new Error("Failed to load Unicorn Studio."));
      }, { once: true });
      return;
    }

    var script = document.createElement("script");
    script.src = UNICORN_SCRIPT_SRC;
    script.async = true;
    script.dataset.unicornStudioLoader = "true";
    script.onload = function () {
      if (!resolveWhenReady()) {
        reject(new Error("Unicorn Studio loaded without a usable init() method."));
      }
    };
    script.onerror = function () {
      reject(new Error("Failed to load Unicorn Studio."));
    };
    (document.head || document.body || document.documentElement).appendChild(script);
  });

  return window.__foUnicornStudioPromise;
}

function initStageDitherField() {
  var body = document.body;
  if (!supportsStageRoute(body) || window.__foStageDitherReady) return;

  var main = document.querySelector("main");
  if (!main) return;

  window.__foStageDitherReady = true;

  var field = ensureField(body);
  ensureMount(field);

  field.dataset.renderer = "unicorn";
  body.classList.add("has-stage-dither");
  body.classList.add("has-unicorn-background");

  loadUnicornStudio()
    .then(function (unicorn) {
      unicorn.init();
      field.classList.add("is-unicorn-ready");
    })
    .catch(function () {
      field.classList.add("is-unicorn-fallback");
    });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  ready(initStageDitherField);
}
