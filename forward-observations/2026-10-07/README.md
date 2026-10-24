# Forward Observations design assets

Approved graphite journal design for https://observations.frwd.dev.

Use a commit-pinned jsDelivr URL. `site.js` runs with `defer`, followed by `orb.js`. Bear owns page templates, posts, feeds, analytics, and upvotes. Font licenses and Orbkit attribution accompany the assets. No build step.

## Bookshelf stylesheet audit — 2026-10-24

At commit `5579db83e5f4ab2e31ce9ffcc33b53596bce19cb`, `site.js` renders
Currently Reading and Already Read, but `theme.css` contains none of the
`.library-*` component rules. The missing CSS is deployed separately in Bear's
custom theme editor and emitted in an inline `<style>` on `/books/`.
This is repository drift, not evidence of an unstyled production page.

Verified by reading Bear's custom CSS and inspecting the public page's CSSOM
and computed styles. The live page loads that exact script commit. Its two
current books and seven books read in 2026 have distinct headings; the archive
has a top rule and the current shelves use a grid. At 1280px, the archive has
balanced rows of four and three books with no document overflow.
At 390px, it shows six archived books per page, retains both current books,
and has no document overflow.

The appended component starts at `/* Compact personal library. */` and preserves
the deployed rules, including subsequent cover and reading-status refinements:

- `.library-current`, `.library-current-shelves`, `.library-archive`
- `.library-section-head`, `.library-section-count`, year controls and search
- Scrolling pages, inert-page layout, book details, flight and arrival animations
- 699px/1099px layout breakpoints and `prefers-reduced-motion` overrides

Only this component is copied; earlier theme rules, Bear settings, page content,
and production CDN pins are not replaced. Bear still needs an explicit theme
update for future CSS changes: changing this file alone does not deploy CSS.

## Bookshelf regression tests

From this directory, with Node 20 or later:

```sh
npm ci
npx playwright install chromium
npm test
```

Tests load the complete local `site.js` and `theme.css` against controlled Bear
markup. Requests are intercepted: fonts come from the checkout, cover images
are local SVG responses with differing proportions, and decorative background
imports are stubbed. No live blog or account is changed.

Coverage includes current/archive membership and styles; cross-status search,
accent-insensitive author matching and empty results; keyboard details, safe
outbound links, focus restoration, Back/Forward and deep links; year selection;
6/8/12-book pagination at 320, 390, 699, 700, 1099, 1100 and 1440px; focus across
breakpoint changes; reduced motion; and the no-dialog source fallback.
The scoped GitHub Actions workflow runs the same suite in Chromium.

The history regression also exposed a bookshelf bug: Forward into a current
book used an archive index of `-1`, resetting the completed-books page. The
location handler now updates archive pagination only for an archived book.
