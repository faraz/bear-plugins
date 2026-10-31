/* Forward Observations bookshelf — tactile covers, stable captions and one shared scale.
 * Interaction references: React Bits Tilted Card and Spotlight Card.
 * Original vanilla implementation; no React or animation dependency.
 */
(() => {
  'use strict';
  const root = document.querySelector('.bookshelf');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const authors = new Map([...root.querySelectorAll('.shelf-book')].map(book => [
    book.querySelector('.shelf-book-link')?.href + '|' + book.querySelector('h2')?.textContent.trim(),
    book.querySelector('.book-author')?.textContent.trim() || ''
  ]));

  function mount(library) {
    if (library.classList.contains('library-showcase')) return;
    library.classList.add('library-showcase');
    document.body.classList.add('bookshelf-showcase');
    let layoutFrame = 0, pointerFrame = 0, active = null, point = null;
    let coverHeight = 0, captionSpace = 0;

    function layout() {
      layoutFrame = 0;
      const books = [...library.querySelectorAll('.library-book')];
      const rows = [...library.querySelectorAll('.library-slots')];
      const density = Math.max(1, ...rows.map(row => row.children.length));
      rows.forEach(row => row.style.setProperty('--row-fraction', row.children.length / density));
      let narrowest = Infinity, ratio = .82, tallestCaption = 0;
      for (const book of books) {
        const caption = book.querySelector('.library-book-title');
        if (caption && !caption.querySelector('.library-title-text')) {
          const status = caption.querySelector('.library-result-status');
          const name = [...caption.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
          const title = document.createElement('span');
          title.className = 'library-title-text'; title.textContent = name;
          const author = document.createElement('span');
          author.className = 'library-book-author'; author.textContent = authors.get(book.href + '|' + name) || '';
          caption.replaceChildren(title);
          if (author.textContent) caption.append(author);
          if (status) caption.append(status);
        }
        if (book.clientWidth) narrowest = Math.min(narrowest, book.clientWidth);
        if (caption) tallestCaption = Math.max(tallestCaption, caption.offsetHeight);
        const image = book.querySelector('img');
        if (image?.naturalHeight) ratio = Math.max(ratio, image.naturalWidth / image.naturalHeight);
      }
      if (!Number.isFinite(narrowest)) return;
      const ceiling = innerWidth >= 1100 ? 224 : innerWidth >= 700 ? 200 : 148;
      const next = Math.floor(Math.min(ceiling, (narrowest - 10) / ratio));
      if (next > 0 && next !== coverHeight) {
        coverHeight = next;
        library.style.setProperty('--showcase-cover-height', next + 'px');
      }
      const reserve = Math.ceil(tallestCaption + 40);
      if (reserve !== captionSpace) {
        captionSpace = reserve;
        library.style.setProperty('--caption-space', reserve + 'px');
      }
    }
    function scheduleLayout() {
      if (!layoutFrame) layoutFrame = requestAnimationFrame(layout);
    }
    function reset() {
      cancelAnimationFrame(pointerFrame); pointerFrame = 0; point = null;
      if (active) {
        active.classList.remove('is-inspecting');
        ['--tilt-x', '--tilt-y', '--light-x', '--light-y'].forEach(name => active.style.removeProperty(name));
      }
      active = null;
    }
    function paintPointer() {
      pointerFrame = 0;
      if (!active?.isConnected || !point || reduced.matches || !fine.matches) { reset(); return; }
      const rect = active.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
      active.style.setProperty('--tilt-x', ((.5 - y) * 10).toFixed(2) + 'deg');
      active.style.setProperty('--tilt-y', ((x - .5) * 16).toFixed(2) + 'deg');
      active.style.setProperty('--light-x', (x * 100).toFixed(1) + '%');
      active.style.setProperty('--light-y', (y * 100).toFixed(1) + '%');
      active.classList.add('is-inspecting');
    }
    library.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !fine.matches || reduced.matches) return;
      const book = event.target.closest('.library-book');
      if (!book || book.closest('[inert]')) { reset(); return; }
      if (book !== active) { reset(); active = book; }
      point = { x: event.clientX, y: event.clientY };
      if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
    }, { passive: true });
    library.addEventListener('pointerleave', reset);
    library.addEventListener('pointercancel', reset);
    library.addEventListener('pointerdown', reset);
    library.addEventListener('keydown', reset);
    library.addEventListener('load', scheduleLayout, true);
    library.addEventListener('error', scheduleLayout, true);
    library.addEventListener('scroll', reset, true);
    addEventListener('scroll', reset, { passive: true });
    reduced.addEventListener('change', reset);
    fine.addEventListener('change', reset);
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
    const resize = new ResizeObserver(() => { reset(); scheduleLayout(); });
    resize.observe(library);
    const mutations = new MutationObserver(() => { if (active && !active.isConnected) reset(); scheduleLayout(); });
    mutations.observe(library, { childList: true, subtree: true });
    addEventListener('pageshow', scheduleLayout);
    document.fonts?.ready.then(scheduleLayout);
    layout();
  }

  const existing = root.querySelector('.library');
  if (existing) mount(existing);
  else {
    const ready = new MutationObserver(() => {
      const library = root.querySelector('.library');
      if (library) { ready.disconnect(); mount(library); }
    });
    ready.observe(root, { childList: true });
    addEventListener('pagehide', () => ready.disconnect(), { once: true });
  }
})();
