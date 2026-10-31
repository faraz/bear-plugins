# Bookshelf showcase

An optional enhancement for the existing Bear bookshelf. It loads only on the Bookshelf page and builds on the live `.library-*` component. The shared theme and other site behavior remain in place.

## What this fixes

The live Bear stylesheet does contain the library component. The size difference comes from `.library-current` fixing its covers at `150px`, while the archive calculates a responsive height (about `198px` at a 1280px viewport). This enhancement gives both sections the same measured height while preserving each cover's natural aspect ratio. With the current three reading and seven completed books, desktop covers reach `224px` in both sections.

Partial rows share the density of the fullest rendered row. Title and author captions reserve enough vertical space across pages; longer captions are clamped, with the full title and author still available in the link's accessible name and book dialog. The existing search, year selection, pagination, shelf entrance animation, native dialog, focus handling and source links remain.

The visual treatment adds softly lit shelf recesses, stronger type hierarchy, book-edge shadows and a restrained pointer-following reflection and tilt. The interaction references are [React Bits Tilted Card](https://reactbits.dev/components/tilted-card) and [Spotlight Card](https://reactbits.dev/components/spotlight-card). This is an original vanilla JavaScript/CSS implementation, with no React, animation library or new font dependency. Pointer updates are coalesced into animation frames; there is no new continuous animation. Touch input and reduced-motion preferences disable spatial pointer motion.

Pending or failed cover images leave the title/author fallback visible. This does not repair externally hosted image URLs.

## Install in Bear

These files and the pull request do **not** publish the design. Installation is a separate action. Before editing, read and save the current Bookshelf content and the current shared script setting; retain any intervening edits.

1. Add the following two tags to the Bookshelf page's raw content, outside the `.bookshelf` element. Load the stylesheet after the shared theme. The enhancement can load before or after the base script: it waits for the library to mount.

   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/faraz/bear-plugins@b5aa69a34a87f644f0921394e4ed12afaa1da284/forward-observations/bookshelf/showcase.css">
   <script defer src="https://cdn.jsdelivr.net/gh/faraz/bear-plugins@b5aa69a34a87f644f0921394e4ed12afaa1da284/forward-observations/bookshelf/showcase.js"></script>
   ```

2. In the existing shared script setting, update the commit pin for `forward-observations/edge-of-stability/writing-site.js` from `e97f1a4c1ac2496777d2f00e272c14aefda37450` to `b5aa69a34a87f644f0921394e4ed12afaa1da284`. Preserve the rest of the setting. The active script's only change preserves the selected archive page when browser history reopens a currently reading book. The regression suite found that this fix from the older script had not reached the active fork.

3. Verify the public page after installation: three current books including Stephen Wolfram's *What Ultimately Is There?... And Other Foundational Questions*, seven completed books for 2026, equal cover heights, author search, opening/closing details, Back/Forward and narrow-screen pagination. Check the homepage and an article for the unchanged shared behavior.

The immutable asset pin above is the tested implementation commit, deliberately independent of later documentation commits. Do not replace Bear's full custom CSS with a repository stylesheet: the live theme also contains unrelated newer styling.

For rollback, remove only the two added page tags and restore the previous shared script pin, after checking for intervening edits. Preserve the book content, including the new Wolfram entry. Without the enhancement, the existing library remains usable.

## Verification

From the repository root:

```sh
cd forward-observations/2026-10-07
npm ci
npx playwright install --with-deps chromium
npm test
```

The suite exercises the active `edge-of-stability/writing-site.js` together with these assets. All **23 tests passed** in [GitHub Actions](https://github.com/faraz/bear-plugins/actions/runs/41233689760) for implementation commit `b5aa69a34a87f644f0921394e4ed12afaa1da284`.

Coverage includes current/archive membership, search status and restoration, native links and details, keyboard focus, browser history, responsive page capacity, equal cover sizing and caption bounds at 320/390/700/1100/1280/1440px, hover reset, reduced motion, and failed-image fallback. The fixture uses varied cover aspect ratios and a long title/author example. Syntax and whitespace checks pass. Impeccable's detector returned no findings for the new assets; independent code and screenshot review found no blocking regression.

Manual inspection uses the actual Bear content and shared CSS in an isolated browser preview at desktop and mobile sizes. The public site is unchanged until installation. Physical touch hardware and spoken screen-reader output have not been tested. The pre-existing shared header's approximately 4px overflow at 320px is outside this bookshelf change.
