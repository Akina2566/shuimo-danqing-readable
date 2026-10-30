# Whale Girl · Ink Wash (Readable)

[中文](../README.md) | English

> **This is a fork, not the original skin.**
> The original **"Whale Girl · Ink Wash"** was created by **stushansusu**, published via
> [DSH Market](https://dsh-market.com) under **CC BY-NC-SA 4.0**.
> This repository is a **readability fork** by **Akina2566**, shared under the same license.
>
> All artwork (background video, paper textures, character art) remains copyright of the
> original author and is redistributed here under the original license terms.
> The original design documentation is preserved in [../docs/ORIGINAL-README.md](docs/ORIGINAL-README.md).

---


## Quick install

A DSH skin is just a directory under `~/.dsh/skins/`. No restart needed.

```bash
git clone https://github.com/Akina2566/shuimo-danqing-readable.git \
  ~/.dsh/skins/shuimo-danqing-readable
```

Then open **Settings -> Skin Center** and pick "鲸鱼娘 · 水墨丹青（清晰版）".

The folder name must match the `id` in `skin.json` (`shuimo-danqing-readable`),
and `skin.json` must sit at the root of that folder.

---

## Why this fork exists

The original skin is visually complete, but has five problems in **long-form Chinese reading**:

1. **Font fallback**: the stack is `'Noto Serif SC', 'Source Han Serif SC', SimSun, ...`.
   Most Windows machines lack Source Han Serif, so it falls back to **SimSun** — at
   10.5–12.5 px over translucent ink glass, its strokes are too thin and text looks fuzzy.
2. **Tiny type everywhere**: sidebar headings, timestamps and status lines use 10.5 px / 11 px.
3. **Too many colored borders**: the original uses "ink green" as an *interactive* semantic
   color across 300+ places (buttons, borders, icons, progress bars, links).
4. **Brand row replaced**: the top-left wordmark is replaced with a custom label plus a red seal.
5. **Panels too transparent**: the sidebar is only 54% opaque, so the 4K video behind it
   fights with the text.

---

## What this fork changes

> All changes are **CSS and asset level**: no format changes, no JavaScript, no artwork edits.

### 1. Font: SimSun → Microsoft YaHei

```css
/* skin.css, two blocks (light / dark) */
/* before */
--dsw-font-family: 'Noto Serif SC', 'Source Han Serif SC', SimSun, 'Microsoft YaHei UI', system-ui, serif;
/* after */
--dsw-font-family: 'Microsoft YaHei UI', 'Microsoft YaHei', 'DengXian', 'Segoe UI', system-ui, sans-serif;
```

`--sm-serif` in `patches.css` is swapped the same way.
**`--sm-kai` (KaiTi) is kept** — headings, seals and the "new session" label keep their
brush-script character; only body text becomes sans-serif.

### 2. Small type bumped one step (11 places)

| before | after |
| --- | --- |
| 10.5px | 11.5px |
| 11px | 11.5px |
| 11.5px | 12px |
| 12px | 12.5px |
| 12.5px | 13px |

### 3. All colored borders removed

| original color | original role | replaced with |
| --- | --- | --- |
| `#6FA87F` ink green (highlight) | icons, links, focus, state | `#98A1A9` |
| `#3D6649` deep ink green | fills, strokes, gradients | `#6D747A` |
| `#4D6576` slate blue | borders, dividers | `#7B8288` |
| `#597EA0` hair-highlight blue | sidebar brushstroke | `#8F959C` |
| `#7D9AAA` brand blue | buttons, selection (border contexts only) | `#8B959E` |

Scope: **171 green** and **187 blue-grey** values across `patches.css` / `skin.css`,
touching only `border` / `border-*` / `outline` / `box-shadow` / decorative backgrounds.
Elements that need hue (active-row accents, link text) are desaturated at the same
lightness instead of being neutralised outright.

Result: **0** green references, **0** colored borders.

### 4. Original wordmark restored

```css
/* before */
body [data-slot='sidebar.brand.name'] > svg { visibility: hidden; }
body span:has(> [data-slot='sidebar.brand.name'])::after { content: '鲸鱼娘·水墨丹青'; }
/* after */
body [data-slot='sidebar.brand.name'] > svg { visibility: visible; }
body span:has(> [data-slot='sidebar.brand.name'])::after { content: none; }
```

### 5. Secondary text brightened in dark mode (6 tokens)

| token | before | after |
| --- | --- | --- |
| `--dsw-alias-label-caption` | `#939895` | `#b3b8b4` |
| `--dsw-alias-label-tertiary` | `#939895` | `#b3b8b4` |
| `--dsw-alias-label-dimmed` | `#6a6f71` | `#919692` |
| `--dsw-alias-markdown-placeholder` | `#6a6f71` | `#919692` |
| `--dsw-alias-label-secondary` | `#B8BEB7` | `#cdd2cc` |
| `--dsw-alias-label-primary-dimmed` | `#B8BEB7` | `#cdd2cc` |

### 6. Panel opacity raised (text-bearing surfaces only)

| variable | before | after | used by |
| --- | --- | --- | --- |
| `--sm-glass` | `#2227308a` (54%) | `#222730d9` (85%) | sidebar |
| `--sm-glass-card` | `#2227309e` (62%) | `#222730e6` (90%) | composer, header, popovers |
| `--sm-glass-sheet` | `#22273075` (46%) | `#222730c4` (77%) | secondary sheets |

Background video, paper grain, brushstrokes, ink dots and the seal are untouched.

### 7. Softer text glow

`text-shadow` on the conversation and composer goes from three layers (3/10/24 px)
to two (2/8 px), removing the fuzzy halo around glyphs.

### 8. New idle frame `assets/sm-idle-16.webp`

A frame extracted at **16 s** of the background video, with the manifest's scrim
baked into the pixels, used as the still background while idle (1920×1080, 70 KB).

Paired with the companion plugin it gives: **full video while chatting, frozen on this
frame otherwise**.

---

## Install

### Option 1: drop into the user skin directory (recommended)

```bash
# Windows
%USERPROFILE%\.dsh\skins\shuimo-danqing-readable\

# macOS / Linux
~/.dsh/skins/shuimo-danqing-readable/
```

Then pick "鲸鱼娘 · 水墨丹青（清晰版）" in **Settings → Skin Center** and refresh. No restart needed.

### Option 2: clone and copy

```bash
git clone https://github.com/Akina2566/shuimo-danqing-readable.git
cp -r shuimo-danqing-readable ~/.dsh/skins/
```

### Notes

- This skin is **dark-only** (manifest flag `dark-only`); light mode is not adapted.
- There is **no** `dsh-market.provenance.json`: this fork is not a market original, so the
  skin center treats it as a **local skin** — it will not be updated or overwritten by the store.
- The background video is 21.5 MB. If you only want the readability fixes, delete
  `assets/shuimo-danqing-loop.mp4` and point `backgroundMedia` at the idle frame as an image.

---

## Layout

```
.
├── skin.json                        # manifest (id / names / asset refs)
├── skin.css                         # L1 token layer (official --dsw-* remap)
├── patches.css                      # L3 free-selector layer (shell rules + this fork)
├── assets/
│   ├── shuimo-danqing-loop.mp4      # background video, 21.5 MB (original author)
│   ├── sm-idle-16.webp              # idle frame (added by this fork, scrim baked in)
│   ├── sm-paper-grain.webp          # paper grain (original author)
│   └── sm-paper-grain-strong.webp   # paper grain, strong (original author)
├── preview/
│   ├── dark.jpg
│   └── light.jpg
├── docs/
│   ├── ORIGINAL-README.zh.md        # original design doc (Chinese)
│   └── ORIGINAL-README.md           # original design doc (English)
├── LICENSE                          # CC BY-NC-SA 4.0
├── README.en.md                     # English (this file)
└── README.zh.md                     # Chinese
```

---

## License & attribution

| | |
| --- | --- |
| **Original** | "Whale Girl · Ink Wash" by **stushansusu** |
| **Published via** | [DSH Market](https://dsh-market.com) (unofficial work, not affiliated with this repo) |
| **Original license** | **CC BY-NC-SA 4.0** |
| **This fork** | Modified by **Akina2566**, released under **CC BY-NC-SA 4.0** |

Per CC BY-NC-SA 4.0:

- **BY** — original author credited here and in `skin.json`'s `author` field
- **NC** — no commercial use
- **SA** — this fork is shared under the same license

**Artwork** (background video, paper textures, character art) remains copyright of the
original author and is redistributed under the original license only. If the original
author objects to this repository, it will be taken down on request.

---

## Changelog

### v1.0.0-readable

- Body/UI font switched to Microsoft YaHei; decorative faces keep KaiTi
- Small type bumped one step (11 places)
- All ink-green and brand-blue colored borders removed (358 values) → neutral grey
- Original wordmark restored, red seal removed
- Dark-mode secondary text brightened (6 tokens)
- Panel opacity raised (3 variables)
- Text glow reduced from three layers to two
- Added idle frame `assets/sm-idle-16.webp`

---

## Related

- Skin format and skin center: [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web)
- Companion plugin (background motion gate):
  [dsh-plugin-bg-motion](https://github.com/Akina2566/dsh-plugin-bg-motion)
