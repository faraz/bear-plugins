/* Bear
   Post social share enhancer */

(function () {
  "use strict";

  var PLATFORM_ORDER = ["facebook", "linkedin", "threads", "bluesky", "mastodon", "x", "copy"];

  var PLATFORM_META = {
    facebook: { label: "Facebook", icon: "f" },
    linkedin: { label: "LinkedIn", icon: "in" },
    threads: { label: "Threads", icon: "@" },
    bluesky: { label: "Bluesky", icon: "b" },
    mastodon: { label: "Mastodon", icon: "m" },
    x: { label: "X", icon: "x" },
    copy: { label: "Copy Link", icon: "⧉" }
  };

  var DEFAULT_POPUPS = {
    facebook: { width: 626, height: 436 },
    linkedin: { width: 560, height: 640 },
    threads: { width: 620, height: 700 },
    bluesky: { width: 620, height: 690 },
    mastodon: { width: 620, height: 640 },
    x: { width: 620, height: 520 }
  };

  function isDevHost() {
    var host = window.location.hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      /\.local$/.test(host)
    );
  }

  function mergeConfig() {
    var raw = window.FO_SHARE_CONFIG || {};
    var popupSizes = Object.assign({}, DEFAULT_POPUPS, raw.popupSizes || {});
    return {
      platforms: Array.isArray(raw.platforms) ? raw.platforms : PLATFORM_ORDER.slice(),
      popupSizes: popupSizes,
      enabled: raw.enabled && typeof raw.enabled === "object" ? raw.enabled : null,
      mastodonStorageKey: typeof raw.mastodonStorageKey === "string" ? raw.mastodonStorageKey : "fo_share_mastodon_instance",
      includeTitleInCopy: raw.includeTitleInCopy !== false
    };
  }

  function isIndexLikePage(body, pathName) {
    if (!body) return true;
    if (
      body.classList.contains("home") ||
      body.classList.contains("blog") ||
      body.classList.contains("papers-homepage") ||
      body.classList.contains("projects")
    ) {
      return true;
    }

    var normalized = (pathName || "/").replace(/\/+$/, "") || "/";
    return (
      normalized === "/" ||
      normalized === "/blog" ||
      normalized === "/research" ||
      normalized === "/projects" ||
      normalized === "/til" ||
      normalized === "/subscribe" ||
      normalized === "/feed"
    );
  }

  function isLikelyPostPage(body, main) {
    if (!body || !main) return false;
    if (body.classList.contains("paper")) return true;
    if (isIndexLikePage(body, window.location.pathname)) return false;
    if (main.querySelector(".research-grid, .research-stack, ul.blog-posts, #searchInput")) return false;
    if (!main.querySelector("h1")) return false;
    return !!main.querySelector("p");
  }

  function getCanonicalUrl() {
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      try {
        return new URL(canonical.href, window.location.origin).toString();
      } catch (err) {
        if (isDevHost()) console.warn("[fo-share] Invalid canonical URL:", canonical.href);
      }
    } else if (isDevHost()) {
      console.warn("[fo-share] Missing canonical URL; using current page URL.");
    }
    return window.location.href.split("#")[0];
  }

  function getShareTitle(main) {
    var ogTitle = document.querySelector('meta[property="og:title"], meta[name="og:title"]');
    if (ogTitle && ogTitle.content) return ogTitle.content.trim();

    var h1 = main.querySelector("h1");
    if (h1 && h1.textContent) return h1.textContent.trim();

    return (document.title || "").trim();
  }

  function createButton(platformKey) {
    var meta = PLATFORM_META[platformKey];
    if (!meta) return null;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "fo-share__button";
    button.dataset.platform = platformKey;
    button.setAttribute("aria-label", "Share on " + meta.label);
    button.innerHTML =
      '<span class="fo-share__icon" aria-hidden="true">' +
      meta.icon +
      '</span><span class="fo-share__label">' +
      meta.label +
      "</span>";
    return button;
  }

  function pulseButton(button, className) {
    if (!button) return;
    button.classList.remove("is-feedback", "is-success", "is-error");
    void button.offsetWidth;
    button.classList.add(className || "is-feedback");
    window.setTimeout(function () {
      button.classList.remove("is-feedback", "is-success", "is-error");
    }, 760);
  }

  function resolvePlatforms(config) {
    return config.platforms
      .map(function (name) {
        return String(name || "").toLowerCase();
      })
      .filter(function (name, index, arr) {
        if (!PLATFORM_META[name]) return false;
        if (config.enabled && config.enabled[name] === false) return false;
        return arr.indexOf(name) === index;
      });
  }

  function findContentRoot(main) {
    return (
      main.querySelector(".paper-content > article") ||
      main.querySelector("article") ||
      main.querySelector(".paper-content") ||
      main
    );
  }

  function findInsertionAnchor(root) {
    var children = Array.from(root.children || []);
    for (var i = 0; i < children.length; i += 1) {
      var node = children[i];
      if (!node.matches) continue;
      if (
        node.matches(
          ".fo-share-slot, .tags, div.tags, .post-tags, .post-meta, .post-nav, .related, .related-posts, #comments, .comments"
        )
      ) {
        return node;
      }
    }
    return null;
  }

  function makeShareUrl(platform, payload) {
    var encodedUrl = encodeURIComponent(payload.url);
    var encodedTitle = encodeURIComponent(payload.title);
    var encodedText = encodeURIComponent(payload.title + " " + payload.url);

    switch (platform) {
      case "facebook":
        return "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
      case "linkedin":
        return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl;
      case "threads":
        return "https://www.threads.net/intent/post?text=" + encodedText;
      case "bluesky":
        return "https://bsky.app/intent/compose?text=" + encodedText;
      case "x":
        return "https://x.com/intent/tweet?text=" + encodedTitle + "&url=" + encodedUrl;
      default:
        return "";
    }
  }

  function shouldUsePopup() {
    if (!window.matchMedia) return true;
    return !window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  }

  function openShareWindow(url, platform, popupSizes) {
    if (!url) return false;

    if (!shouldUsePopup()) {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    }

    var size = popupSizes[platform] || { width: 620, height: 620 };
    var width = size.width || 620;
    var height = size.height || 620;
    var dualLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
    var dualTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
    var viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    var viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
    var left = Math.max(0, Math.round(dualLeft + (viewportWidth - width) / 2));
    var top = Math.max(0, Math.round(dualTop + (viewportHeight - height) / 2));

    var features =
      "popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes" +
      ",width=" +
      width +
      ",height=" +
      height +
      ",left=" +
      left +
      ",top=" +
      top;
    var popup = window.open(url, "fo_share_" + platform, features);
    if (popup && typeof popup.focus === "function") {
      popup.focus();
      return true;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    return false;
  }

  function normalizeMastodonInput(value) {
    if (!value) return "";
    var host = String(value).trim().toLowerCase();
    host = host.replace(/^https?:\/\//, "");
    host = host.replace(/\/.*$/, "");
    host = host.replace(/^\.+|\.+$/g, "");
    if (!host) return "";
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return "";
    return host;
  }

  function getMastodonInstance(storageKey, forcePrompt) {
    var stored = "";
    try {
      stored = forcePrompt ? "" : window.localStorage.getItem(storageKey) || "";
    } catch (_err) {
      stored = "";
    }
    var normalizedStored = normalizeMastodonInput(stored);
    if (normalizedStored) return normalizedStored;

    var input = window.prompt("Enter your Mastodon instance (example: mastodon.social)");
    var normalized = normalizeMastodonInput(input);
    if (!normalized) return "";

    try {
      window.localStorage.setItem(storageKey, normalized);
    } catch (_err2) {
      /* no-op */
    }
    return normalized;
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        temp.style.pointerEvents = "none";
        document.body.appendChild(temp);
        temp.select();
        var ok = document.execCommand("copy");
        temp.remove();
        if (ok) resolve();
        else reject(new Error("Copy command failed"));
      } catch (err) {
        reject(err);
      }
    });
  }

  function initShareBar() {
    if (document.querySelector(".fo-share[data-fo-share='injected']")) return;

    var body = document.body;
    var main = document.querySelector("main");
    if (!isLikelyPostPage(body, main)) return;

    var config = mergeConfig();
    var platforms = resolvePlatforms(config);
    if (!platforms.length) return;

    var payload = {
      url: getCanonicalUrl(),
      title: getShareTitle(main)
    };

    var share = document.createElement("section");
    share.className = "fo-share";
    share.dataset.foShare = "injected";
    share.setAttribute("aria-label", "Share this post");

    var title = document.createElement("p");
    title.className = "fo-share__title";
    title.textContent = "Share this";

    var list = document.createElement("div");
    list.className = "fo-share__list";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Share options");

    var status = document.createElement("p");
    status.className = "fo-share__status";
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");

    platforms.forEach(function (platformKey) {
      var button = createButton(platformKey);
      if (button) {
        button.style.setProperty("--share-index", String(list.children.length));
      }
      if (button) list.appendChild(button);
    });

    share.appendChild(title);
    share.appendChild(list);
    share.appendChild(status);

    function setStatus(message, isError) {
      status.textContent = message || "";
      status.classList.toggle("is-error", !!isError);
    }

    list.addEventListener("click", function (event) {
      var button = event.target.closest(".fo-share__button");
      if (!button) return;

      var platform = button.dataset.platform;
      if (!platform) return;

      if (platform === "copy") {
        var copyValue = config.includeTitleInCopy ? payload.title + " — " + payload.url : payload.url;
        copyToClipboard(copyValue)
          .then(function () {
            pulseButton(button, "is-success");
            setStatus("Link copied.");
          })
          .catch(function () {
            pulseButton(button, "is-error");
            setStatus("Copy failed. Copy from address bar.", true);
          });
        return;
      }

      if (platform === "mastodon") {
        var forcePrompt = !!event.shiftKey;
        if (forcePrompt) {
          try {
            window.localStorage.removeItem(config.mastodonStorageKey);
          } catch (_err) {
            /* no-op */
          }
        }

        var instance = getMastodonInstance(config.mastodonStorageKey, forcePrompt);
        if (!instance) {
          pulseButton(button, "is-error");
          setStatus("Enter a valid Mastodon instance to continue.", true);
          return;
        }

        var mastodonUrl =
          "https://" +
          instance +
          "/share?text=" +
          encodeURIComponent(payload.title + " " + payload.url);
        openShareWindow(mastodonUrl, platform, config.popupSizes);
        pulseButton(button, "is-feedback");
        setStatus("Sharing via " + instance + ".");
        return;
      }

      var url = makeShareUrl(platform, payload);
      if (!url) {
        pulseButton(button, "is-error");
        setStatus("Share target unavailable.", true);
        return;
      }

      openShareWindow(url, platform, config.popupSizes);
      pulseButton(button, "is-feedback");
      setStatus("");
    });

    var explicitSlot = document.querySelector(".fo-share-slot");
    if (explicitSlot) {
      explicitSlot.innerHTML = "";
      explicitSlot.appendChild(share);
      return;
    }

    var root = findContentRoot(main);
    var anchor = findInsertionAnchor(root);
    if (anchor) {
      root.insertBefore(share, anchor);
    } else {
      root.appendChild(share);
    }

    window.requestAnimationFrame(function () {
      share.classList.add("is-ready");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShareBar, { once: true });
  } else {
    initShareBar();
  }
})();
