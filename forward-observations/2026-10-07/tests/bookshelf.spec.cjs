const { test, expect } = require('playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = 'http://bookshelf.test';
const cover = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="200"><rect width="140" height="200" fill="#39433f"/></svg>');

// Exercise the complete shipped script and stylesheet with Bear's source markup.
function fixture({ archiveCount = 7, older = false, currentCount = 2 } = {}) {
  function book(id, title, author) {
    return `<article class="shelf-book" data-book-id="${id}">
      <a class="shelf-book-link" href="https://example.com/${id}">
        <span class="shelf-cover"><img src="${cover}" alt=""></span>
        <h2>${title}</h2><p class="book-author">${author}</p>
        <span class="book-link-label">View book</span>
      </a><p class="book-note"><a href="/notes/${id}">Read notes</a></p>
    </article>`;
  }
  const current = [book('current-1', 'Distributed Systems', 'Fiodar Sazanavets'), book('current-2', 'AI Systems Performance Engineering', 'Chris Fregly')].slice(0, currentCount).join('');
  const archive = Array.from({ length: archiveCount }, (_, i) => book(`read-${i + 1}`, `Systems Volume ${i + 1}`, i === 6 ? 'François Chollet' : `Author ${i + 1}`)).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bookshelf fixture</title><link rel="stylesheet" href="/theme.css"><script src="/site.js" defer></script></head>
    <body><header><a class="title" href="/">Forward Observations</a><nav></nav></header><main>
    <section class="bookshelf bookshelf-dimensional"><header class="shelf-intro"><h1>Bookshelf</h1><p>Books, notes, and ideas worth returning to.</p></header>
      <section class="shelf-year shelf-current"><h2>Currently reading</h2><div class="shelf-catalogue">${current}</div></section>
      <section class="shelf-year" data-read-year="2026"><h2>2026</h2><div class="shelf-catalogue">${archive}</div></section>
      ${older ? `<section class="shelf-year" data-read-year="2025"><h2>2025</h2><div class="shelf-catalogue">${book('older-1', 'Earlier Systems', 'Earlier Author')}</div></section>` : ''}
    </section></main><footer>Independent writing &amp; research</footer></body></html>`;
}

async function mount(page, { width = 1280, reducedMotion = 'reduce', query = '', enhanced = true, ...data } = {}) {
  await page.setViewportSize({ width, height: 1000 });
  await page.emulateMedia({ reducedMotion });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === origin && url.pathname === '/books/') return route.fulfill({ contentType: 'text/html', body: fixture(data) });
    if (url.origin === origin && ['/theme.css', '/site.js'].includes(url.pathname)) return route.fulfill({ path: path.join(root, url.pathname.slice(1)) });
    // Decorative background modules are unrelated; no live requests or analytics.
    if (url.origin === origin && url.pathname === '/background.js') return route.fulfill({ contentType: 'text/javascript', body: '' });
    const font = path.join(root, 'fonts', path.basename(url.pathname));
    if (url.pathname.endsWith('.woff2') && fs.existsSync(font)) return route.fulfill({ path: font });
    return route.abort();
  });
  await page.goto(origin + '/books/' + query);
  if (enhanced) await expect(page.locator('.library')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const activeBooks = page => page.locator('.library-track .library-page:not([inert]) .library-book');
const search = page => page.getByRole('searchbox', { name: 'Find a book by title or author' });
const bookLink = (page, id) => page.locator(`.library-book[data-book="${id}"]`);

const pageErrors = new WeakMap();
test.beforeEach(({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
});
test.afterEach(({ page }) => expect(pageErrors.get(page)).toEqual([]));

test('current and completed books stay separate and receive the component layout', async ({ page }) => {
  await mount(page);
  await expect(page.locator('.library-current h2')).toHaveText('Currently Reading');
  await expect(page.locator('.library-current .library-section-count')).toHaveText('2 books');
  await expect(page.locator('.library-current .library-book')).toHaveCount(2);
  await expect(page.locator('.library-archive h2')).toHaveText('Already Read');
  await expect(page.locator('.library-archive .library-section-count')).toHaveText('7 books');
  await expect(activeBooks(page)).toHaveCount(7);
  await expect(page.locator('.library-archive [data-book^="current-"]')).toHaveCount(0);
  await expect(page.locator('.library-current .library-section-head')).toHaveCSS('display', 'flex');
  await expect(page.locator('.library-current-shelves')).toHaveCSS('display', 'grid');
  await expect(page.locator('.library-archive')).toHaveCSS('border-top-width', '1px');
  await expect(page.locator('.library-track')).toHaveCSS('overflow-x', 'auto');
  await expect(page.locator('.library-pagination')).toBeHidden();
  await expect(page.locator('.bookshelf > .shelf-year').first()).toBeHidden();
  const rows = await page.locator('.library-track .library-row').evaluateAll(rows => rows.map(row => row.querySelectorAll('.library-book').length));
  expect(rows).toEqual([4, 3]);
});

test('search spans both statuses, normalizes author names, and restores the archive', async ({ page }) => {
  await mount(page);
  await search(page).fill('SYSTEMS');
  await expect(page.locator('.library-current')).toBeHidden();
  await expect(page.locator('.library-archive h2')).toHaveText('Search Results');
  await expect(page.locator('.library-collections')).toBeHidden();
  await expect(page.locator('.library-result-status', { hasText: 'Currently Reading' })).toHaveCount(2);
  await expect(page.locator('.library-result-status', { hasText: 'Read in 2026' })).toHaveCount(7);
  await search(page).fill('FRANCOIS');
  await expect(activeBooks(page)).toHaveCount(1);
  await expect(bookLink(page, 'read-7')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('1 books found');
  await search(page).fill('no such book');
  await expect(page.locator('.library-empty')).toContainText('No books match');
  await expect(page.locator('.library-track')).toBeHidden();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(search(page)).toBeFocused();
  await expect(page.locator('.library-current')).toBeVisible();
  await expect(page.locator('.library-archive h2')).toHaveText('Already Read');
  await expect(activeBooks(page)).toHaveCount(7);
});

test('book details preserve links, keyboard focus, and Back/Forward navigation', async ({ page }) => {
  await mount(page);
  const current = bookLink(page, 'current-1');
  await current.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Distributed Systems' });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/book=current-1.*shelf=current/);
  await expect(page.locator('.library-detail-meta')).toHaveText('Currently reading');
  await expect(dialog.getByRole('link', { name: 'View book' })).toHaveAttribute('href', 'https://example.com/current-1');
  await expect(dialog.getByRole('link', { name: 'Read notes' })).toHaveAttribute('href', origin + '/notes/current-1');
  await expect(dialog.getByRole('link', { name: 'View book' })).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByRole('button', { name: 'Close book details' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'View book' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close book details' })).toBeFocused();
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(current).toBeFocused();
  await page.goForward();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(current).toBeFocused();
  await expect(page).not.toHaveURL(/book=/);
});

test('deep links reveal the right archive page and tolerate unknown book IDs', async ({ page }) => {
  await mount(page, { width: 390, query: '?book=read-7&shelf=2026' });
  await expect(page.getByRole('dialog', { name: 'Systems Volume 7' })).toBeVisible();
  await expect(page.locator('.library-range')).toHaveText('7–7 of 7');
  await page.getByRole('button', { name: 'Close book details' }).click();
  await expect(bookLink(page, 'read-7')).toBeFocused();
  await page.goto(origin + '/books/?book=unknown&shelf=2026');
  await expect(page).not.toHaveURL(/book=/);
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.library-current')).toBeVisible();
});

for (const [width, capacity] of [[320, 6], [390, 6], [699, 6], [700, 8], [1099, 8], [1100, 12], [1440, 12]]) {
  test(`pagination at ${width}px exposes ${capacity} books and keeps other pages inert`, async ({ page }) => {
    await mount(page, { width, archiveCount: 14 });
    await expect(activeBooks(page)).toHaveCount(capacity);
    await expect(page.locator('.library-range')).toHaveText(`1–${capacity} of 14`);
    await expect(page.getByRole('button', { name: '← Previous' })).toBeDisabled();
    await page.getByRole('button', { name: 'Next →' }).click();
    await expect(page.locator('.library-range')).toHaveText(`${capacity + 1}–${Math.min(14, capacity * 2)} of 14`);
    await expect(page.locator('.library-page').first()).toHaveAttribute('inert', '');
    await expect(page.locator('.library-page').first()).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.library-current .library-book')).toHaveCount(2);
    await page.getByRole('button', { name: '← Previous' }).click();
    await expect(page.locator('.library-range')).toHaveText(`1–${capacity} of 14`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Covers and captions must fit their own cells, not merely a clipped viewport.
    const fits = await activeBooks(page).evaluateAll(books => books.every(book => {
      const cell = book.getBoundingClientRect(), cover = book.querySelector('.library-volume').getBoundingClientRect();
      return cover.left >= cell.left - 8 && cover.right <= cell.right + 8;
    }));
    expect(fits).toBe(true);
  });
}

test('year navigation remembers pages and resize retains the focused book', async ({ page }) => {
  await mount(page, { width: 390, archiveCount: 14, older: true });
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(page.locator('.library-range')).toHaveText('7–12 of 14');
  await page.locator('[data-collection="2025"]').click();
  await expect(page.locator('.library-range')).toHaveText('1–1 of 1');
  await expect(page.locator('.library-current')).toBeVisible();
  await page.locator('[data-collection="2026"]').click();
  await expect(page.locator('.library-range')).toHaveText('7–12 of 14');
  await bookLink(page, 'read-9').focus();
  await page.setViewportSize({ width: 800, height: 1000 });
  await expect(page.locator('.library-range')).toHaveText('9–14 of 14');
  await expect(bookLink(page, 'read-9')).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect(page.locator('.library-range')).toHaveText('1–12 of 14');
  await expect(bookLink(page, 'read-9')).toBeFocused();
});

test('reduced motion removes animation while the default keeps cover arrivals', async ({ page }) => {
  await mount(page, { reducedMotion: 'no-preference' });
  await expect(page.locator('.library-current .library-arrival').first()).toHaveCSS('animation-name', 'library-land');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.library-current .library-arrival').first()).toHaveCSS('animation-name', 'none');
  await bookLink(page, 'current-1').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.library-flight')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(bookLink(page, 'current-1')).toBeFocused();
});

test('the source bookshelf remains readable when enhancement is unavailable', async ({ page }) => {
  await page.addInitScript(() => { window.HTMLDialogElement = undefined; });
  await mount(page, { enhanced: false });
  await expect(page.locator('.library')).toHaveCount(0);
  await expect(page.locator('.shelf-current')).toBeVisible();
  await expect(page.locator('.shelf-year[data-read-year="2026"]')).toBeVisible();
  await expect(page.locator('.shelf-book-link')).toHaveCount(9);
});
