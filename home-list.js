/* Bear
   Homepage systems stream enhancer
   Merges systems-tagged blog posts with research items from /research/. */

(function () {
  "use strict";

  function isHomePage() {
    var body = document.body;
    if (!body) return false;
    if (body.classList.contains("home")) return true;
    var path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    return path === "/";
  }

  function text(node) {
    return node && node.textContent ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function sameOriginUrl(path) {
    try {
      return new URL(path, window.location.origin);
    } catch (err) {
      return null;
    }
  }

  function parseDateValue(raw) {
    var value = String(raw || "").trim();
    if (!value) return 0;

    var quarterMatch = value.match(/^Q([1-4])\s+(\d{4})$/i);
    if (quarterMatch) {
      var quarter = parseInt(quarterMatch[1], 10);
      var quarterYear = parseInt(quarterMatch[2], 10);
      return Date.UTC(quarterYear, (quarter - 1) * 3, 1);
    }

    if (/^\d{4}$/.test(value)) {
      return Date.UTC(parseInt(value, 10), 0, 1);
    }

    var normalized = value
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    var direct = Date.parse(normalized);
    if (!Number.isNaN(direct)) return direct;

    return 0;
  }

  function extractBlogItems(root) {
    var items = [];
    var nodes = root.querySelectorAll("ul.blog-posts li");
    nodes.forEach(function (node, index) {
      var link = node.querySelector("a[href]");
      if (!link) return;

      var href = link.getAttribute("href");
      if (!href) return;

      var timeNode = node.querySelector("time");
      var metaNode = timeNode || node.querySelector("span");
      var rawDate = text(timeNode) || text(metaNode);

      items.push({
        kind: "blog",
        href: href,
        title: text(link),
        dateLabel: rawDate,
        sortValue: parseDateValue(timeNode && timeNode.getAttribute("datetime") ? timeNode.getAttribute("datetime") : rawDate),
        dek: "",
        badge: "",
        sourceOrder: index
      });
    });
    return items;
  }

  function extractResearchItems(doc) {
    var items = [];
    var cards = doc.querySelectorAll(".research-card");
    cards.forEach(function (card, index) {
      var link = card.getAttribute("href");
      var titleNode = card.querySelector(".research-card__title");
      if (!link || !titleNode) return;

      var metaSpans = card.querySelectorAll(".research-card__meta span");
      var dateLabel = metaSpans[0] ? text(metaSpans[0]) : "";
      var badge = metaSpans[1] ? text(metaSpans[1]) : text(card.querySelector(".research-card__status"));

      items.push({
        kind: "research",
        href: link,
        title: text(titleNode),
        dateLabel: dateLabel,
        sortValue: parseDateValue(dateLabel),
        dek: text(card.querySelector(".research-card__dek")),
        badge: badge,
        sourceOrder: index
      });
    });
    return items;
  }

  function dedupeAndSort(items) {
    var seen = new Set();
    var deduped = [];

    items.forEach(function (item) {
      var key = item.href;
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(item);
    });

    deduped.sort(function (a, b) {
      if (b.sortValue !== a.sortValue) return b.sortValue - a.sortValue;
      if (a.kind !== b.kind) return a.kind === "research" ? 1 : -1;
      return a.sourceOrder - b.sourceOrder;
    });

    return deduped;
  }

  function renderItem(item) {
    var li = document.createElement("li");
    li.className = "systems-stream__item systems-stream__item--" + item.kind;

    var meta = document.createElement("div");
    meta.className = "systems-stream__meta";

    if (item.dateLabel) {
      var time = document.createElement("time");
      time.textContent = item.dateLabel;
      meta.appendChild(time);
    }

    if (item.badge) {
      var badge = document.createElement("span");
      badge.className = "systems-stream__badge";
      badge.textContent = item.badge;
      meta.appendChild(badge);
    }

    var link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.title;

    li.appendChild(meta);
    li.appendChild(link);

    if (item.dek) {
      var dek = document.createElement("p");
      dek.className = "systems-stream__dek";
      dek.textContent = item.dek;
      li.appendChild(dek);
    }

    return li;
  }

  function renderList(items) {
    var list = document.createElement("ul");
    list.className = "systems-stream";
    items.forEach(function (item) {
      list.appendChild(renderItem(item));
    });
    return list;
  }

  function enhanceSystemsStream() {
    if (!isHomePage()) return;

    var shell = document.querySelector("[data-systems-mixed-stream]");
    if (!shell || shell.dataset.enhanced === "true") return;

    var blogItems = extractBlogItems(shell);
    var researchPath = shell.getAttribute("data-research-path") || "/research/";
    var limit = parseInt(shell.getAttribute("data-systems-limit") || "8", 10);
    var researchUrl = sameOriginUrl(researchPath);

    if (!researchUrl) return;

    fetch(researchUrl.toString(), {
      credentials: "same-origin"
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Failed to load research page");
        return response.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var researchItems = extractResearchItems(doc);
        if (!researchItems.length) return;

        var mixed = dedupeAndSort(blogItems.concat(researchItems));
        if (!mixed.length) return;

        if (Number.isFinite(limit) && limit > 0) {
          mixed = mixed.slice(0, limit);
        }

        shell.innerHTML = "";
        shell.appendChild(renderList(mixed));
        shell.dataset.enhanced = "true";
      })
      .catch(function () {
        /* Leave the server-rendered systems-tagged posts in place as fallback. */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceSystemsStream, { once: true });
  } else {
    enhanceSystemsStream();
  }
})();
