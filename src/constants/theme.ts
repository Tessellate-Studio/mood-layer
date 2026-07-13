// The Mood Layer — typewriter-on-paper design tokens.
// HARD RULE (CLAUDE.md): every colour in the app comes from here. No hex
// literals anywhere else. Text and line work stay ink-on-paper. Hue lives in
// two registers, both after Ekman & the Dalai Lama's Atlas of Emotions
// (atlasofemotions.org — anger red, fear violet, sadness blue, disgust green,
// enjoyment amber, + two harmonised for surprise/contempt):
//   - familyPalette — soft pastels, quilt patch fills/swatches/dials only.
//   - mutedPalette — the same hues desaturated toward grey; card fills,
//     thread spines, and section glyphs so screens read as distinct layers
//     (user-directed 2026-07-13, "layers you can tell apart").

import type { EmotionFamilyId } from '@/types/models';

export const colors = {
  /** App background — warm cream, like unbleached paper stock. */
  paper: '#F8F6F0',
  /** Cards, sheets, elevated surfaces — warm white, never pure #FFF. */
  paperRaised: '#FDFCF8',
  /** Primary text and line work. 17.6:1 on paper. */
  ink: '#141414',
  /** Secondary text. 10.4:1 on paper. */
  inkSoft: '#3D3D3D',
  /** Captions/hints — the MINIMUM grey for any text (7.0:1, AA at any size). */
  inkMuted: '#595959',
  /** Decorative only: hairlines, disabled strokes. Never body text. */
  inkFaint: '#8A8A8A',
  /** Intensity ramp for quilt patch fills, 1 (light touch) → 4 (pressed hard).
   *  Decorative fills — exempt from text-contrast tiers. */
  shade1: '#D9D9D4',
  shade2: '#ABABA6',
  shade3: '#6E6E6A',
  shade4: '#1F1F1D',
  /** Dashed stitch lines between patch segments. */
  stitch: '#141414',
  /** Backdrop behind sheets/modals (the only alpha colour). */
  scrim: 'rgba(20, 20, 20, 0.35)',
} as const;

export type IntensityShade = 1 | 2 | 3 | 4;

/** Grey shade token for an intensity value (non-quilt uses). */
export const shadeForIntensity: Record<IntensityShade, string> = {
  1: colors.shade1,
  2: colors.shade2,
  3: colors.shade3,
  4: colors.shade4,
};

export interface FamilyPalette {
  /** Patch fills, intensity 1 (a light touch) → 4 (pressed hard). */
  shades: Record<IntensityShade, string>;
  /** Deep same-hue tone for texture "thread" strokes over the fills. */
  thread: string;
}

/**
 * Quilt pastels per emotion family — Atlas of Emotions hues, softened to sit
 * on cream paper. Decorative fills (a11y-exempt); all TEXT stays ink tiers.
 * User-locked 2026-07-08: pastel quilt on typewriter chrome.
 */
// Softened twice at the user's direction (2026-07-08): "much much more
// pastel". Even intensity 4 stays a whisper; the texture thread carries the
// hue's identity, in a muted mid-tone rather than a deep one.
export const familyPalette: Record<EmotionFamilyId, FamilyPalette> = {
  anger: {
    shades: { 1: '#FAEDEA', 2: '#F6DFDA', 3: '#F1CCC4', 4: '#EAB6AB' },
    thread: '#B07A6C',
  },
  fear: {
    shades: { 1: '#F2EFF8', 2: '#E9E3F2', 3: '#DBD0EA', 4: '#C9BADF' },
    thread: '#8D7DB0',
  },
  sadness: {
    shades: { 1: '#ECF1F7', 2: '#DFE8F1', 3: '#CCDAE9', 4: '#B4C8DE' },
    thread: '#7793B4',
  },
  disgust: {
    shades: { 1: '#EDF4EC', 2: '#E0EDDF', 3: '#CDE1CC', 4: '#B5D2B4' },
    thread: '#7BA37A',
  },
  enjoyment: {
    shades: { 1: '#FBF4E3', 2: '#F8ECCD', 3: '#F3E0AF', 4: '#ECD28F' },
    thread: '#B99B54',
  },
  surprise: {
    shades: { 1: '#FBF0E7', 2: '#F8E4D3', 3: '#F3D3B8', 4: '#ECBF99' },
    thread: '#BE8B60',
  },
  contempt: {
    shades: { 1: '#F4EEF2', 2: '#ECE2E9', 3: '#DFCFDA', 4: '#CFB8C7' },
    thread: '#A18397',
  },
};

export interface MutedFamilyPalette {
  /** Whisper-tint card fill — a layer you can tell apart, not a highlight. */
  fill: string;
  /** 1px card border + the section header's dashed rule. */
  border: string;
  /** The coloured "thread" spine, section glyph strokes, and arrow rings.
   *  Non-text UI: holds ≥3:1 on its fill and on paper (WCAG 1.4.11). */
  thread: string;
  /** Deep same-hue tone for TEXT on the fill or raised paper (status pills,
   *  arrow glyphs). Holds ≥4.5:1 on both (WCAG 1.4.3) — enforced by test. */
  accent: string;
}

/**
 * Muted layer palette — the design treatment settled 2026-07-13 ("layers you
 * can tell apart"). The Atlas hues, desaturated heavily toward grey so cards
 * and sections read as distinct layers while the tone stays somber and the
 * text stays ink. Chrome text/lines remain ink tiers; these tints are for
 * card fills, thread spines, section glyphs, and same-hue accents only.
 * Handoff accents were nudged darker to clear WCAG AA (design bundle
 * 2026-07-13; verified in designTreatment.test.tsx).
 */
export const mutedPalette: Record<EmotionFamilyId, MutedFamilyPalette> = {
  anger: {
    fill: '#F0ECEA',
    border: '#D5CDC9',
    thread: '#8F817C',
    accent: '#6A5C56',
  },
  fear: {
    fill: '#EDECF0',
    border: '#CFCBD6',
    thread: '#847E90',
    accent: '#605A6C',
  },
  sadness: {
    fill: '#EBEDEF',
    border: '#CBCFD4',
    thread: '#7C848E',
    accent: '#59626C',
  },
  disgust: {
    fill: '#EAEEE9',
    border: '#CDD2CB',
    thread: '#7E877C',
    accent: '#586055',
  },
  enjoyment: {
    fill: '#F0EDE6',
    border: '#D4CDBE',
    thread: '#8C8468',
    accent: '#665F4B',
  },
  surprise: {
    fill: '#F1EDE7',
    border: '#D6CEC2',
    thread: '#94836E',
    accent: '#6C5D48',
  },
  contempt: {
    fill: '#EEECEE',
    border: '#D3CCD0',
    thread: '#877E83',
    accent: '#62595E',
  },
};

/** Fill opacity for the two-band section glyph's translucent bands. */
export const glyphBandOpacity = 0.28;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 10,
  lg: 18,
  /** Top corners of bottom sheets. */
  sheet: 24,
} as const;

/** Minimum touch target (WCAG 2.1 AA / Android). */
export const hitTarget = 44;

// Typography — Courier Prime (OFL) throughout: a typewriter on paper.
// Typewriter voice: Courier Prime (OFL) everywhere, so the whole app reads like
// a page typed onto paper. Monospace is the point — it IS the ink-on-paper feel.
// Each weight is its OWN family, registered under these exact keys in App.tsx's
// useFonts map; fontWeight stays '400' everywhere (asking Android for synthetic
// bold silently falls back to a system font — forge anti-pattern #12). TTF name
// tables verified: NameID 1 = "Courier Prime" for both, subfamily Regular/Bold.
export const fonts = {
  display: 'CourierPrime-Regular',
  displayEmphasis: 'CourierPrime-Bold',
  /** Body is monospace too — a typed page has one typeface. */
  body: 'CourierPrime-Regular',
} as const;

export const typography = {
  // Monospace reads larger and wider than a proportional face at the same pt,
  // so display sizes are nudged down and line-heights opened up — a typed page
  // breathes between its lines.
  display: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.displayEmphasis,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 25,
    fontWeight: '400' as const,
    color: colors.inkSoft,
  },
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '400' as const,
    color: colors.inkSoft,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400' as const,
    color: colors.inkMuted,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  overline: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400' as const,
    // Wide tracking on an uppercase monospace label reads like a stamped
    // header on a form — leans into the paper feel.
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: colors.inkMuted,
  },
} as const;

/** Dash patterns for stitched lines (SVG strokeDasharray). */
export const textures = {
  stitchDash: [6, 4] as const,
  stitchDashFine: [3, 3] as const,
} as const;

/** Shared motion tokens — every animation uses these so reduce-motion and
 *  pacing changes happen in one place. */
export const motion = {
  spring: { damping: 18, stiffness: 180 },
  gentleMs: 350,
  stitchMs: 900,
  /** Breathing pulse on "feel it" invitations. */
  breatheMs: 3200,
  breatheScale: 1.02,
} as const;
