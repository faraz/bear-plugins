/* Bear
   Homepage graphite field
   Injects and drives a localized field layer inside the homepage main panel. */

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

  function ensureField(main) {
    var field = main.querySelector(".home-panel-field");
    if (field) return field;

    field = document.createElement("div");
    field.className = "home-panel-field";
    field.setAttribute("aria-hidden", "true");
    main.insertBefore(field, main.firstChild);
    return field;
  }

  function setFieldState(field, x, y, active) {
    field.style.setProperty("--field-x", x.toFixed(2) + "%");
    field.style.setProperty("--field-y", y.toFixed(2) + "%");
    field.style.setProperty("--field-active", String(active));
  }

  function initField() {
    if (!isHomePage()) return;

    var main = document.querySelector("main");
    if (!main || main.dataset.homePanelFieldReady === "true") return;

    var field = ensureField(main);
    var restX = 50;
    var restY = 30;
    var restActive = 0.12;
    var staticActive = 0.18;

    main.dataset.homePanelFieldReady = "true";

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
      nextX = clamp(x, 4, 96);
      nextY = clamp(y, 6, 94);
      nextActive = active;

      if (frame) return;
      frame = window.requestAnimationFrame(flush);
    }

    function handlePointerMove(event) {
      if (event.pointerType === "touch") return;

      var rect = main.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;

      schedule(x, y, 1);
    }

    function resetField() {
      schedule(restX, restY, restActive);
    }

    main.addEventListener("pointerenter", handlePointerMove, { passive: true });
    main.addEventListener("pointermove", handlePointerMove, { passive: true });
    main.addEventListener("pointerleave", resetField, { passive: true });
    main.addEventListener("pointercancel", resetField, { passive: true });
    window.addEventListener("blur", resetField);
  }

  ready(initField);
})();
