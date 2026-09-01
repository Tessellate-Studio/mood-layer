# Logo handoff — The Mood Layer

The app's logo: **stacked strata** — three bands of translucent feeling-cloth,
folded and stacked, deepening where they overlap. Built from the app's own
tokens (the quilt lozenge, `familyPalette`) so it matches the UI.

Tuned twice. 2026-08-31 the pastel-on-cream mark was redrawn fully opaque in
the `vivid` register, because it disappeared at launcher/share-sheet sizes (the
mark was within a few percent of the tile's luminance, and the adaptive
foreground covered only 47% of the canvas before Android's 66% mask). That read
as three solid blocks — "I just wanted it slightly more saturated but still
opaque. This is solid" (user, 2026-09-02) — so the mark now sits in a **middle
register**: pastel and vivid mixed 55% of the way to vivid, translucent again
(0.85 + multiply) with the thread outlines back, so overlaps deepen and the
mark reads as LAYERS. The 66%-mask geometry from 2026-08-31 is unchanged.

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

## Colours (derived from `src/constants/theme.ts`)
Bands top→bottom = anger / enjoyment / sadness, each at the **middle register**
— its `shades[4]` pastel mixed 55% toward its `vivid` tone: `#D58270` /
`#D4AA51` / `#7499BF` (1.9–2.8:1 against the cream tile, vs 1.4–1.7:1 for the
pastel that vanished). Each band is `fill-opacity 0.85` with
`mix-blend-mode: multiply` inside an `isolation: isolate` group, outlined in
that family's `.thread` (`#A87264` / `#9B8042` / `#6984A3`) at
`stroke-opacity 0.7`, width 2.6 — alpha does the layer-deepening, no blend
mode is required by `react-native-svg`. Tile bg `colors.paper #F8F6F0`.
Geometry (240 viewBox): bottom band x20 y130 w200, mid x31 y82 w178, top x45
y34 w150, all h78 rx39. The bare mark wraps the same bands in `scale(0.79)`
about the centre so it spans ~66% of the canvas — sized for Android's adaptive
mask.
`appicon_ink.svg`, `icon_mono.svg` and the `var_*` variants still show the old
pastel geometry (tracked in BACKLOG).

> Regenerate any time: `npm install --no-save @resvg/resvg-js`, then rasterize
> `svg/appicon_paper.svg` → icon/favicon PNGs and `svg/appicon_bare.svg` →
> adaptive-foreground/splash PNGs (fitTo width 1024/48). Check `git diff
> package-lock.json` stays empty afterwards (regression log rows 13–14).
