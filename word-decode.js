/* Bear
   Home wordmark decode effect
   Inspired by: https://codepen.io/creativeocean/pen/JjemXGY */

(function () {
  "use strict";

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

    var lower = "abcdefghijklmnopqrstuvwxyz";
    var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var numeric = "0123456789";
    var symbols = "!<>-_\\/[]{}=+*^?#";

    var frame = null;
    var cooldownUntil = 0;
    var tickMs = 30;
    var iterationStep = 1 / 3;

    function fromPool(pool) {
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function randomGlyphForChar(ch) {
      if (/[a-z]/.test(ch)) return fromPool(lower);
      if (/[A-Z]/.test(ch)) return fromPool(upper);
      if (/[0-9]/.test(ch)) return fromPool(numeric);
      return fromPool(symbols);
    }

    function render(step) {
      var output = "";
      for (var i = 0; i < text.length; i += 1) {
        var ch = text[i];
        if (ch === " ") {
          output += " ";
          continue;
        }
        output += i < step ? ch : randomGlyphForChar(ch);
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
          cooldownUntil = Date.now() + 1400;
        }
      }, tickMs);
    }

    var wordmarkLink = wordmark.closest("a");
    if (wordmarkLink) {
      wordmarkLink.addEventListener("mouseenter", startDecode);
      wordmarkLink.addEventListener("focus", startDecode);
    }

    window.setTimeout(startDecode, 140);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWordmarkDecode, { once: true });
  } else {
    initWordmarkDecode();
  }
})();
