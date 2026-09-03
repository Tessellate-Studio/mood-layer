# Logo handoff — The Mood Layer

The app's logo: **stacked strata** — four bands of translucent feeling-cloth,
folded and stacked, deepening where they overlap. Built from the app's own
tokens (the quilt lozenge, `familyPalette` shades, thread outlines) so it
matches the UI. This is the primary mark from the identity canvas ("Mood Layer
Logo" — amber · rose · mauve · blue), installed 2026-09-02 at the user's
direction, replacing the three-band mark that shipped 2026-07-13 and was
retuned twice (vivid/opaque on 2026-08-31 — "this is solid" — then a middle
register earlier on 2026-09-02). The monochrome outline followed on
2026-09-03 ("it needs to be 4 bands too"): `icon_mono.svg`, `LogoDivider` and
the Quilt `TabIcon` draw the same four bands (`LOGO_BANDS` in `LogoMark.tsx`).

## What's in here
```
icons/
  icon-1024.png                 store / Expo `icon` (paper tile, full-bleed)
  icon-180.png                  iOS @3x convenience raster
  icon-120.png                  iOS @2x convenience raster
  favicon-48.png                web favicon
  adaptive-foreground-1024.png  Android adaptive foreground (transparent, 66% safe zone)
svg/
  appicon_paper.svg   primary mark, paper background (source of the PNGs above)
  appicon_ink.svg     reversed mark for dark surfaces
  appicon_bare.svg    mark only, transparent (source of the adaptive foreground)
  icon_mono.svg       one-colour, three outlined bands — for the Quilt tab / stamps
  var_warm.svg / var_tender.svg / var_bracing.svg   mood-tinted variants to carry the day's mood 
```

## Install into the Expo app (`mood-layer/`)

1. **Copy the raster icons** into `assets/`:
   - `icon-1024.png`            → `assets/icon.png`
   - `adaptive-foreground-1024.png` → `assets/adaptive-icon.png`
   - `favicon-48.png`           → `assets/favicon.png`
   Keep the `svg/` files in `assets/logo/` for in-app use.

2. **Point `app.json` at them** (values, not the whole block — merge into what's there):
   ```jsonc
   {
     "expo": {
       "icon": "./assets/icon.png",
       "web":  { "favicon": "./assets/favicon.png" },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#F8F6F0"   // paper — matches the tile
         }
       }
     }
   }
   ```
   Android background is a **flat `#F8F6F0`** (the paper token) so the foreground
   layers sit on the same cream as the store icon.

3. **Splash screen** (optional, if you touch it): use `appicon_bare.svg` (or a PNG
   export of it) centered on `#F8F6F0`.

## In-app usage
- **Quilt tab icon** (`src/components/TabIcon.tsx`): use `icon_mono.svg` — three
  outlined bands, single ink weight — so it matches the other line-glyph tabs. Recolor
  the stroke with `colors.ink` / `colors.inkFaint` for active/inactive states rather
  than shipping two files.
- **Header / about screen**: `appicon_paper.svg` at ~28–40px.
- Render SVGs with `react-native-svg` (already a dependency) — either inline the paths
  or load via `react-native-svg-transformer`. The shapes are plain rounded rects with
  `fillOpacity` + thread strokes; in-app, do the overlap-deepening with alpha alone,
  **no blend mode** (`mix-blend-mode` is for the rasterized assets only — it is not
  safe on `react-native-svg`). `LogoMark.tsx` is that in-app mark.

## Colours (all already in `src/constants/theme.ts`)
Bands top→bottom = enjoyment / anger / contempt / sadness (amber · rose ·
mauve · blue), each at its family's `shades[4]` pastel (`#ECD28F` / `#EAB6AB`
/ `#CFB8C7` / `#B4C8DE`), `fill-opacity 0.82` with `mix-blend-mode: multiply`
inside an `isolation: isolate` group, outlined at `stroke-width 1.6`,
`stroke-opacity 0.6`. The asset strokes carry the canvas's own thread tones;
the in-app `LogoMark` uses each family's `.thread` token instead, and alpha
alone for the overlap-deepening (no blend mode on `react-native-svg`). Tile bg
`colors.paper #F8F6F0`, full-bleed — launchers and Play mask their own
corners. Geometry (240 viewBox): top band x84 y48 w72, then x74 y80 w92, x64
y112 w112, bottom x54 y144 w132, all h48 rx24 — each overlapping the one
below by 16. The bare mark is the SAME bands, unscaled — the bounding box is
already 132×144 (55% × 60% of the 240 canvas), comfortably inside Android's
~66% adaptive-icon safe zone with no extra scaling needed. (2026-09-03: a
`scale(1.18)` was mistakenly added here on the mistaken assumption the mark
needed shrinking like the old three-band one did — it pushed the vertical
extent to 71% and got clipped top and bottom on-device. Removed; regression
log #32.) `icon_mono.svg` is the same four bands outlined in `colors.ink` at
`stroke-width 8` — the shape the Quilt tab and `LogoDivider` draw inline.

> Regenerate any time: `npm install --no-save @resvg/resvg-js`, then rasterize
> `svg/appicon_paper.svg` → icon/favicon PNGs and `svg/appicon_bare.svg` →
> adaptive-foreground/splash PNGs (fitTo width 1024/48). Check `git diff
> package-lock.json` stays empty afterwards (regression log rows 13–14).
