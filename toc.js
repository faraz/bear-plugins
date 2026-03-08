/* Bear
   Paper TOC enhancer */

(function () {
  "use strict";

  function initPaperSidebarToc() {
    var body = document.body;
    if (!body || !body.classList.contains("paper")) return;

    var main = document.querySelector("main");
    if (!main || main.querySelector(".paper-sidebar")) return;

    var headings = Array.from(main.querySelectorAll("h2[id]")).filter(function (el) {
      return el.id && el.textContent && el.textContent.trim().length > 0;
    });
    if (!headings.length) return;

    var sidebar = document.createElement("aside");
    sidebar.className = "paper-sidebar";
    sidebar.setAttribute("aria-label", "On this page");

    var nav = document.createElement("nav");
    nav.className = "paper-sidebar__nav";

    var label = document.createElement("p");
    label.className = "paper-sidebar__label";
    label.textContent = "On this page";

    var list = document.createElement("ol");
    list.className = "paper-sidebar__list";

    nav.appendChild(label);
    nav.appendChild(list);
    sidebar.appendChild(nav);

    main.insertBefore(sidebar, main.firstChild);
    body.classList.add("paper-toc-enhanced");

    var entries = new Map();

    headings.forEach(function (heading) {
      var item = document.createElement("li");
      item.className = "paper-sidebar__item";

      var link = document.createElement("a");
      link.className = "paper-sidebar__link";
      link.href = "#" + heading.id;
      link.textContent = heading.textContent.trim();

      item.appendChild(link);
      list.appendChild(item);

      entries.set(heading.id, { item: item, link: link });
    });

    var activeId = null;
    function setActive(id) {
      if (!id || id === activeId || !entries.has(id)) return;
      activeId = id;

      entries.forEach(function (pair) {
        pair.item.classList.remove("is-active");
        pair.link.classList.remove("is-active");
        pair.link.removeAttribute("aria-current");
      });

      var current = entries.get(id);
      current.item.classList.add("is-active");
      current.link.classList.add("is-active");
      current.link.setAttribute("aria-current", "location");
    }

    function recalcRowWeights() {
      if (headings.length < 2) {
        entries.forEach(function (pair) {
          pair.item.style.setProperty("--toc-grow", "1");
        });
        return;
      }

      var headingTops = headings.map(function (heading) {
        var rect = heading.getBoundingClientRect();
        return rect.top + window.scrollY;
      });

      var mainRect = main.getBoundingClientRect();
      var mainBottom = mainRect.top + window.scrollY + main.scrollHeight;

      var spans = headingTops.map(function (top, index) {
        var nextTop = headingTops[index + 1] || mainBottom;
        return Math.max(1, nextTop - top);
      });

      var avgSpan =
        spans.reduce(function (sum, value) {
          return sum + value;
        }, 0) / spans.length;

      headings.forEach(function (heading, index) {
        var span = spans[index];
        var grow = span / Math.max(1, avgSpan);
        var clamped = Math.max(0.72, Math.min(5.8, grow));
        entries.get(heading.id).item.style.setProperty("--toc-grow", clamped.toFixed(3));
      });
    }

    function pickActiveHeadingId() {
      var threshold = window.innerHeight * 0.22;
      var picked = headings[0].id;

      for (var i = 0; i < headings.length; i += 1) {
        if (headings[i].getBoundingClientRect().top <= threshold) {
          picked = headings[i].id;
        } else {
          break;
        }
      }

      return picked;
    }

    var rafId = 0;
    function scheduleStateSync() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        rafId = 0;
        setActive(pickActiveHeadingId());
      });
    }

    var resizeRaf = 0;
    function scheduleRecalc() {
      if (resizeRaf) return;
      resizeRaf = window.requestAnimationFrame(function () {
        resizeRaf = 0;
        recalcRowWeights();
        scheduleStateSync();
      });
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function () {
          scheduleStateSync();
        },
        {
          root: null,
          rootMargin: "-18% 0px -72% 0px",
          threshold: [0, 1]
        }
      );

      headings.forEach(function (heading) {
        observer.observe(heading);
      });
    }

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    nav.addEventListener("click", function (event) {
      var link = event.target.closest(".paper-sidebar__link");
      if (!link) return;

      var hash = link.getAttribute("href");
      if (!hash || hash.charAt(0) !== "#") return;

      var heading = document.getElementById(hash.slice(1));
      if (!heading) return;

      if (!reducedMotion) {
        event.preventDefault();
        heading.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", hash);
      }

      setActive(heading.id);
      scheduleStateSync();
    });

    window.addEventListener("scroll", scheduleStateSync, { passive: true });
    window.addEventListener("resize", scheduleRecalc, { passive: true });
    window.addEventListener("hashchange", scheduleStateSync);
    window.addEventListener(
      "load",
      function () {
        scheduleRecalc();
      },
      { once: true }
    );

    recalcRowWeights();
    scheduleStateSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPaperSidebarToc, { once: true });
  } else {
    initPaperSidebarToc();
  }
})();
