# Attribution and provenance

The preserved original instrument geometry and playback code in `figures/` use [Anatomy](https://skills.wheresryan.sh/anatomy), copyright © 2026 Ryan, under the MIT License. The full license is retained at `figures/vendor/anatomy/LICENSE`.

The kit was copied from the installed Anatomy skill on 2026-10-30. Every retained vendor file was byte-compared with that installed source. No vendor code was modified. These hashes identify the exact retained version without requiring a future network fetch. Keep the license with any redistributed kit-derived implementation.

| Retained file | Upstream relative path | SHA-256 |
|---|---|---|
| `figures/vendor/anatomy/LICENSE` | `LICENSE` | `87c078ab9d90a3044f359e6b563d4e6afea7aa060897cf4f21618687b3856796` |
| `figures/vendor/anatomy/audit.mjs` | `kit/audit.mjs` | `74e605b5d549c1f31c8a1104db7560057105cf86809bf6ced00e4ac79194c8e2` |
| `figures/vendor/anatomy/iso-kit.mjs` | `kit/iso-kit.mjs` | `6d3ecc725d30c3b0346da309cf61dfa5a65017c23620bbd4093009d4fb104018` |
| `figures/vendor/anatomy/lathe.mjs` | `kit/lathe.mjs` | `a4e7e974b1a37e603ad2b76363b6f9815cc101dfff0ad277a5d4e8f1dc56fccb` |
| `figures/vendor/anatomy/scripts/capture.mjs` | `scripts/capture.mjs` | `12e901efe79df75073eeeaf5462ac989a8e2892279253d27f8ee114c54be43d3` |
| `figures/vendor/anatomy/scripts/chrome-port.mjs` | `scripts/chrome-port.mjs` | `6775d3d389d26f37a52be8358aa88d1dc0aded63cb24ae20a936505a192e5d9d` |
| `figures/vendor/anatomy/scripts/drive.mjs` | `scripts/drive.mjs` | `49c22499827a2a5effb802513976bcb8b6dfced139bb4d677ff6e9edd2700eec` |
| `figures/vendor/anatomy/scripts/line-ends.mjs` | `scripts/line-ends.mjs` | `da79cc624c5bda0cb8af8f864dbe53026e44ca2377dab3665076ad570d804f42` |
| `figures/vendor/anatomy/scripts/lines.mjs` | `scripts/lines.mjs` | `b0ca73ab3a0d1cd4a28fda933496cbd7384ef315d821b5d2fffae1c704ce79cc` |
| `figures/vendor/anatomy/tube.mjs` | `kit/tube.mjs` | `bcb3cc360f6d83e6a5753f4c464b4587ab7965028b05a5d58e285abce58667c9` |

## Existing site assets

`assets/satoshi-normal.woff2` and `assets/ibm-plex-mono.woff2` are copies of the existing blog assets under `candidate/fonts/`. They are used to preview the article in the site's typography; they are not part of Anatomy. The HyperFrames figures reuse these fonts locally and embed them in SVG stills. The archived Anatomy pages use system fonts.

## Research attribution

The manuscript links the supplied Deep Learning Alchemy lecture, Cohen et al.'s edge-of-stability observations, Damian et al.'s self-stabilization analysis, Cohen et al.'s central-flows research and tutorial, and Dinh et al.'s sharpness/generalization analysis. `sources.md` records claim boundaries and source details. The numerical figures are original local illustrations, not reproduced experimental figures.

## Active HyperFrames figures

The replacement diagrams in `hyperframes/` contain original SVG and mathematical presentation code, without Anatomy geometry. HyperFrames player/runtime 0.8.223 is MIT licensed; its complete license is retained in `hyperframes/assets/HYPERFRAMES-LICENSE.txt`. GSAP 3.15.0 retains its distribution header and `hyperframes/assets/GSAP-README.md`; see https://gsap.com/standard-license/. Dependencies and CLI scripts are pinned. The research citations and original Anatomy license remain in this package.
