/* Bear
   Paper TOC enhancer */

(function () {
  "use strict";

  function initPaperSidebarToc() {
    var body = document.body;
    if (!body || !body.classList.contains("paper")) return;

    var main = document.querySelector("main");
    if (!main || main.querySelector(".paper-sidebar") || main.querySelector(".paper-toc-jump")) return;

    var headings = Array.from(main.querySelectorAll("h2[id]")).filter(function (el) {
      return el.id && el.textContent && el.textContent.trim().length > 0;
    });
    if (!headings.length) return;

    var titleEl = main.querySelector("h1");
    var paperTitle = titleEl && titleEl.textContent ? titleEl.textContent.trim() : document.title;
    var readingSource = Array.from(main.querySelectorAll("p, li, blockquote"))
      .map(function (el) {
        return (el.textContent || "").trim();
      })
      .join(" ");
    var wordCount = readingSource ? readingSource.split(/\s+/).filter(Boolean).length : 0;
    var readMinutes = Math.max(1, Math.round(wordCount / 220));

    var sidebar = document.createElement("aside");
    sidebar.className = "paper-sidebar";
    sidebar.setAttribute("aria-label", "On this page");

    var nav = document.createElement("nav");
    nav.className = "paper-sidebar__nav";

    var mast = document.createElement("div");
    mast.className = "paper-sidebar__mast";
    var mastTitle = document.createElement("p");
    mastTitle.className = "paper-sidebar__title";
    mastTitle.textContent = paperTitle;
    var mastMeta = document.createElement("p");
    mastMeta.className = "paper-sidebar__meta";
    mastMeta.textContent = readMinutes + " min read";
    mast.appendChild(mastTitle);
    mast.appendChild(mastMeta);

    var label = document.createElement("p");
    label.className = "paper-sidebar__label";
    label.textContent = "On this page";

    var desktopList = document.createElement("ol");
    desktopList.className = "paper-sidebar__list";

    nav.appendChild(mast);
    nav.appendChild(label);
    nav.appendChild(desktopList);
    sidebar.appendChild(nav);

    var jump = document.createElement("details");
    jump.className = "paper-toc-jump";

    var jumpSummary = document.createElement("summary");
    jumpSummary.className = "paper-toc-jump__summary";
    jumpSummary.innerHTML =
      '<span class="paper-toc-jump__label">On this page</span><span class="paper-toc-jump__current"></span>';

    var jumpList = document.createElement("ol");
    jumpList.className = "paper-toc-jump__list";

    jump.appendChild(jumpSummary);
    jump.appendChild(jumpList);

    main.insertBefore(sidebar, main.firstChild);
    main.insertBefore(jump, sidebar.nextSibling);
    body.classList.add("paper-toc-enhanced");

    var jumpCurrent = jumpSummary.querySelector(".paper-toc-jump__current");
    var entries = new Map();

    headings.forEach(function (heading) {
      var id = heading.id;
      var headingText = heading.textContent ? heading.textContent.trim() : "";

      var desktopItem = document.createElement("li");
      desktopItem.className = "paper-sidebar__item";
      var desktopLink = document.createElement("a");
      desktopLink.className = "paper-sidebar__link";
      desktopLink.href = "#" + id;
      desktopLink.textContent = headingText;
      desktopItem.appendChild(desktopLink);
      desktopList.appendChild(desktopItem);

      var mobileItem = document.createElement("li");
      mobileItem.className = "paper-toc-jump__item";
      var mobileLink = document.createElement("a");
      mobileLink.className = "paper-sidebar__link paper-toc-jump__link";
      mobileLink.href = "#" + id;
      mobileLink.textContent = headingText;
      mobileItem.appendChild(mobileLink);
      jumpList.appendChild(mobileItem);

      entries.set(id, {
        title: headingText,
        desktopItem: desktopItem,
        desktopLink: desktopLink,
        mobileItem: mobileItem,
        mobileLink: mobileLink
      });
    });

    var activeId = null;
    function setActive(id) {
      if (!id || !entries.has(id) || id === activeId) return;
      activeId = id;
      var desktopMode = window.matchMedia && window.matchMedia("(min-width: 1180px)").matches;

      entries.forEach(function (entry) {
        entry.desktopItem.classList.remove("is-active");
        entry.desktopLink.classList.remove("is-active");
        entry.desktopLink.removeAttribute("aria-current");
        entry.mobileItem.classList.remove("is-active");
        entry.mobileLink.classList.remove("is-active");
        entry.mobileLink.removeAttribute("aria-current");
      });

      var current = entries.get(id);
      current.desktopItem.classList.add("is-active");
      current.desktopLink.classList.add("is-active");
      current.mobileItem.classList.add("is-active");
      current.mobileLink.classList.add("is-active");

      if (desktopMode) {
        current.desktopLink.setAttribute("aria-current", "location");
      } else {
        current.mobileLink.setAttribute("aria-current", "location");
      }

      if (jumpCurrent) jumpCurrent.textContent = current.title;
    }

    function recalcRowWeights() {
      if (headings.length < 2) {
        entries.forEach(function (entry) {
          entry.desktopItem.style.setProperty("--toc-grow", "1");
        });
        return;
      }

      var contentNodes = Array.from(main.children).filter(function (node) {
        return !node.classList.contains("paper-sidebar") && !node.classList.contains("paper-toc-jump");
      });
      var lastContentNode = contentNodes[contentNodes.length - 1];
      var contentBottom = lastContentNode
        ? lastContentNode.getBoundingClientRect().top + window.scrollY + lastContentNode.offsetHeight
        : main.getBoundingClientRect().top + window.scrollY + main.offsetHeight;

      var headingTops = headings.map(function (heading) {
        return heading.getBoundingClientRect().top + window.scrollY;
      });
      var spans = headingTops.map(function (top, index) {
        var nextTop = headingTops[index + 1] || contentBottom;
        return Math.max(10, nextTop - top);
      });

      var minSpan = Math.min.apply(Math, spans);
      var maxSpan = Math.max.apply(Math, spans);
      var spanRange = Math.max(1, maxSpan - minSpan);

      headings.forEach(function (heading, index) {
        var normalized = (spans[index] - minSpan) / spanRange;
        var eased = Math.log1p(normalized * 3) / Math.log(4);
        var grow = 0.96 + eased * 0.62;
        entries.get(heading.id).desktopItem.style.setProperty("--toc-grow", grow.toFixed(3));
      });
    }

    function pickActiveHeadingId() {
      var threshold = Math.min(window.innerHeight * 0.28, 240);
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

    var stateRaf = 0;
    function scheduleStateSync() {
      if (stateRaf) return;
      stateRaf = window.requestAnimationFrame(function () {
        stateRaf = 0;
        setActive(pickActiveHeadingId());
      });
    }

    var recalcRaf = 0;
    function scheduleRecalc() {
      if (recalcRaf) return;
      recalcRaf = window.requestAnimationFrame(function () {
        recalcRaf = 0;
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
          rootMargin: "-20% 0px -65% 0px",
          threshold: [0, 0.2, 0.8]
        }
      );

      headings.forEach(function (heading) {
        observer.observe(heading);
      });
    }

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function handleLinkClick(event) {
      var link = event.target.closest('a[href^="#"]');
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

      if (jump.open && jump.contains(link)) {
        jump.open = false;
      }

      setActive(heading.id);
      scheduleStateSync();
    }

    nav.addEventListener("click", handleLinkClick);
    jumpList.addEventListener("click", handleLinkClick);

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

    if (window.location.hash) {
      var hashId = decodeURIComponent(window.location.hash.slice(1));
      if (entries.has(hashId)) setActive(hashId);
    }

    recalcRowWeights();
    scheduleStateSync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPaperSidebarToc, { once: true });
  } else {
    initPaperSidebarToc();
  }
})();
