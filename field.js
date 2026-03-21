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
    if (field) return field;

    field = document.createElement("div");
    field.className = "home-panel-field";
    field.setAttribute("aria-hidden", "true");
    body.insertBefore(field, body.firstChild);
    return field;
  }

  function setFieldState(field, x, y, active) {
    field.style.setProperty("--field-x", x.toFixed(2) + "%");
    field.style.setProperty("--field-y", y.toFixed(2) + "%");
    field.style.setProperty("--field-active", String(active));
  }

  function initField() {
    if (!isHomePage()) return;

    var body = document.body;
    var main = document.querySelector("main");
    if (!body || !main || body.dataset.homePanelFieldReady === "true") return;

    var field = ensureField(body);
    var restX = 52;
    var restY = 22;
    var restActive = 0.08;
    var staticActive = 0.14;

    body.dataset.homePanelFieldReady = "true";

    if (!supportsReactiveField()) {
      field.dataset.fieldMode = "static";
      setFieldState(field, restX, restY, staticActive);
      return;
    }

    field.dataset.fieldMode = "interactive";
    setFieldState(field, restX, restY, restActive);

    var nextX = restX;
    var nextY = restY;
    var nextActive = restActive;
    var frame = 0;

    function flush() {
      frame = 0;
      setFieldState(field, nextX, nextY, nextActive);
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

      var x = (event.clientX / width) * 100;
      var y = (event.clientY / height) * 100;

      schedule(x, y, 1);
    }

    function resetField() {
      schedule(restX, restY, restActive);
    }

    body.addEventListener("pointerenter", handlePointerMove, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    body.addEventListener("pointerleave", resetField, { passive: true });
    body.addEventListener("pointercancel", resetField, { passive: true });
    window.addEventListener("blur", resetField);
  }

  ready(initField);
})();
