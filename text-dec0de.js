/* Bear
   Home wordmark decode effect
   Tuned fast decode version
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

    var symbols = "!<>-_\\/[]{}=+*^?#$%&~|:";
    var soft = "abcdefghijklmnopqrstuvwxyz0123456789";

    var frame = null;
    var cooldownUntil = 0;

    /* --- tuned parameters --- */

    var tickMs = 14;            // faster frame updates
    var iterationStep = 0.9;    // reveal letters quickly
    var symbolBias = 0.93;      // heavy symbol preference

    /* ------------------------ */

    function fromPool(pool) {
      return pool.charAt(Math.floor(Math.random() * pool.length));
    }

    function randomGlyph() {
      return Math.random() < symbolBias ? fromPool(symbols) : fromPool(soft);
    }

    function render(step) {
      var output = "";

      for (var i = 0; i < text.length; i++) {
        var ch = text[i];

        if (ch === " ") {
          output += " ";
          continue;
        }

        if (i < step) {
          output += ch;
        } else {
          output += randomGlyph();
        }
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

          cooldownUntil = Date.now() + 600; // shorter cooldown
        }

      }, tickMs);
    }

    var wordmarkLink = wordmark.closest("a");

    if (wordmarkLink) {
      wordmarkLink.addEventListener("mouseenter", startDecode);
      wordmarkLink.addEventListener("focus", startDecode);
    }

    /* faster initial decode on page load */

    window.setTimeout(startDecode, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWordmarkDecode, { once: true });
  } else {
    initWordmarkDecode();
  }

})();
