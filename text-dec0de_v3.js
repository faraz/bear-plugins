/* Bear
   Home wordmark decode effect
   Inspired by: https://codepen.io/creativeocean/pen/JjemXGY */

(function () {
  "use strict";

  function safeNumber(value, fallback, min, max) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (typeof min === "number" && n < min) return min;
    if (typeof max === "number" && n > max) return max;
    return n;
  }

  function initWordmarkDecode() {
    var body = document.body;
    if (!body || !body.classList.contains("home")) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var wordmark =
      document.querySelector("header .title h1") ||
      document.querySelector("header .brand-wordmark") ||
      document.querySelector("header h1");
    if (!wordmark) return;

    var text = (wordmark.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    if (wordmark.querySelector(".wordmark-text")) return;

    var textSpan = document.createElement("span");
    textSpan.className = "wordmark-text";
    textSpan.textContent = text;

    var decodeSpan = document.createElement("span");
    decodeSpan.className = "wordmark-decode";
    decodeSpan.setAttribute("aria-hidden", "true");
    decodeSpan.textContent = "";

    wordmark.textContent = "";
    wordmark.appendChild(textSpan);
    wordmark.appendChild(decodeSpan);

    var symbols = "!<>-_\\/[]{}=+*^?#$%&~|:";
    var soft = "abcdefghijklmnopqrstuvwxyz0123456789";

    var frame = null;
    var cooldownUntil = 0;

    // Faster default profile (safe + readable).
    var tickMs = safeNumber(22, 22, 10, 120);
    var iterationStep = safeNumber(0.62, 0.62, 0.05, 3);
    var symbolBias = safeNumber(0.9, 0.9, 0, 1);
    var initialDelayMs = safeNumber(80, 80, 0, 1000);
    var cooldownMs = safeNumber(850, 850, 100, 4000);

    function fromPool(pool) {
      return pool.charAt(Math.floor(Math.random() * pool.length));
    }

    // Bias heavily toward symbols to match the reference decode style.
    function randomGlyph() {
      return Math.random() < symbolBias ? fromPool(symbols) : fromPool(soft);
    }

    function render(step) {
      var output = "";
      for (var i = 0; i < text.length; i += 1) {
        var ch = text[i];
        if (ch === " ") {
          output += " ";
          continue;
        }
        output += i < step ? ch : randomGlyph();
      }
      decodeSpan.textContent = output;
    }

    function startDecode() {
      var now = Date.now();
      if (frame || now < cooldownUntil) return;

      body.classList.add("wordmark-decoding");
      var iteration = 0;

      frame = window.setInterval(function () {
        render(iteration);
        iteration += iterationStep;

        if (iteration >= text.length) {
          window.clearInterval(frame);
          frame = null;
          decodeSpan.textContent = "";
          body.classList.remove("wordmark-decoding");
          cooldownUntil = Date.now() + cooldownMs;
        }
      }, tickMs);
    }

    var wordmarkLink = wordmark.closest("a");
    if (wordmarkLink) {
      wordmarkLink.addEventListener("mouseenter", startDecode);
      wordmarkLink.addEventListener("focus", startDecode);
    }

    window.setTimeout(startDecode, initialDelayMs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWordmarkDecode, { once: true });
  } else {
    initWordmarkDecode();
  }
})();
