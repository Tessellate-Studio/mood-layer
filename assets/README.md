# Logo handoff — The Mood Layer

The app's logo: **stacked strata** — three bands of translucent feeling-cloth,
folded and stacked, deepening where they overlap. Built from the app's own tokens
(the quilt lozenge, `familyPalette` shades, thread outlines) so it matches the UI.

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
  `fillOpacity` + thread strokes; the overlap-deepening uses alpha, **no blend mode
  required** (safe on `react-native-svg`).

## Colours (all already in `src/constants/theme.ts`)
Bands top→bottom = rose / enjoyment / sadness, each drawn at its `shades[3]` fill,
`fillOpacity ≈ 0.82`, outline = that family's `.thread` at 0.6 opacity. Tile bg
`colors.paper #F8F6F0`; reversed tile `colors.ink #141414` with cream outlines.
The mood variants just swap which three families are stacked — same geometry.

> Regenerate at other sizes any time from `svg/appicon_paper.svg` (store/tile) and
> `svg/appicon_bare.svg` (Android foreground, pad to a 66% safe zone).
