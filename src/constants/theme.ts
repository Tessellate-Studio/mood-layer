// The Mood Layer — typewriter-on-paper design tokens.
// HARD RULE (CLAUDE.md): every colour in the app comes from here. No hex
// literals anywhere else. Text and line work stay ink-on-paper. Hue lives in
// two registers, both after Ekman & the Dalai Lama's Atlas of Emotions
// (atlasofemotions.org — anger red, fear violet, sadness blue, disgust green,
// enjoyment amber, + harmonised hues for surprise/contempt and for
// anticipation teal / trust rose, the Plutchik families user-added
// 2026-07-13):
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
  /** Backdrop behind sheets/modals (one of two alpha colours — see paperVeil). */
  scrim: 'rgba(20, 20, 20, 0.35)',
  /** Floating first-visit helper notes — raised paper at 94%, so the screen
   *  breathes through the card without any scrim (the second sanctioned alpha
   *  colour, added 2026-08-30). Text on it stays ink tiers: 94% over cream
   *  barely moves contrast, so body inkSoft keeps ample AA headroom. */
  paperVeil: 'rgba(253, 252, 248, 0.94)',
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
  /** Saturated mid-tone for SMALL coloured accents (focused tab-icon
   *  strokes) where the muted thread reads as grey at 1.5–2 px. Decorative;
   *  all hold ≥2.9:1 on raised paper. Added 2026-07-18. */
  vivid: string;
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
    shades: { 1: '#F7E4E0', 2: '#F6DFDA', 3: '#F1CCC4', 4: '#EAB6AB' },
    thread: '#A87264',
    vivid: '#C4573F',
  },
  fear: {
    shades: { 1: '#ECE7F4', 2: '#E9E3F2', 3: '#DBD0EA', 4: '#C9BADF' },
    thread: '#8D7DB0',
    vivid: '#7B5EA7',
  },
  sadness: {
    shades: { 1: '#E4EBF3', 2: '#DFE8F1', 3: '#CCDAE9', 4: '#B4C8DE' },
    thread: '#6984A3',
    vivid: '#3F72A6',
  },
  disgust: {
    shades: { 1: '#E5EFE4', 2: '#E0EDDF', 3: '#CDE1CC', 4: '#B5D2B4' },
    thread: '#678B66',
    vivid: '#4E8B4C',
  },
  enjoyment: {
    shades: { 1: '#F9EFD5', 2: '#F8ECCD', 3: '#F3E0AF', 4: '#ECD28F' },
    thread: '#9B8042',
    vivid: '#C08A1E',
  },
  surprise: {
    shades: { 1: '#F9E8DA', 2: '#F8E4D3', 3: '#F3D3B8', 4: '#ECBF99' },
    thread: '#A77850',
    vivid: '#C4763B',
  },
  contempt: {
    shades: { 1: '#EFE6EC', 2: '#ECE2E9', 3: '#DFCFDA', 4: '#CFB8C7' },
    thread: '#937890',
    vivid: '#9A5F86',
  },
  anticipation: {
    shades: { 1: '#E1EFEF', 2: '#DCECEC', 3: '#C6E0DF', 4: '#AACFCE' },
    thread: '#5C8B8A',
    vivid: '#2E8B88',
  },
  trust: {
    shades: { 1: '#F6E7EB', 2: '#F5E2E7', 3: '#EED0D9', 4: '#E4BAC7' },
    thread: '#A77385',
    vivid: '#C05C7E',
  },
};

export interface MutedFamilyPalette {
  /** Soft-tint card fill — a layer you can tell apart, not a highlight.
   *  Every ink tier holds AA on it (verified in designTreatment.test.tsx). */
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
 * can tell apart"). Chrome text/lines remain ink tiers; these tints are for
 * card fills, thread spines, section glyphs, and same-hue accents only.
 *
 * Re-tuned at the user's direction three times: 2026-07-18 morning the grey
 * fills ("a bit too dull") became the family pastel mixed 62% into cream, by
 * evening "a little too saturated" pulled them down, and 2026-07-19 "get more
 * lighter" settled them at a 0.30 mix of shades[4] into cream. 2026-08-31 the
 * 0.30 register read flat on Experiments ("slightly saturated version of the
 * mockup"), so fills now sit at a 0.42 mix. Borders stay at the full pastel.
 * Tiers verified computationally (designTreatment.test.tsx): captions ≥5.2:1
 * on every fill, accents ≥4.5:1 on fill AND raised paper, threads ≥3:1.
 */
export const mutedPalette: Record<EmotionFamilyId, MutedFamilyPalette> = {
  anger: {
    fill: '#F2DBD3',
    border: '#EAB6AB',
    thread: '#8F6F68',
    accent: '#6E5650',
  },
  fear: {
    fill: '#E4DDE9',
    border: '#C9BADF',
    thread: '#7B7188',
    accent: '#5E5769',
  },
  sadness: {
    fill: '#DBE3E8',
    border: '#B4C8DE',
    thread: '#6E7A87',
    accent: '#555E68',
  },
  disgust: {
    fill: '#DCE7D7',
    border: '#B5D2B4',
    thread: '#6D7E6C',
    accent: '#556355',
  },
  enjoyment: {
    fill: '#F3E7C7',
    border: '#ECD28F',
    thread: '#8B7C54',
    accent: '#6D6142',
  },
  surprise: {
    fill: '#F3DFCB',
    border: '#ECBF99',
    thread: '#8E735C',
    accent: '#6F5A48',
  },
  contempt: {
    fill: '#E7DCDF',
    border: '#CFB8C7',
    thread: '#80727B',
    accent: '#635860',
  },
  anticipation: {
    fill: '#D7E6E2',
    border: '#AACFCE',
    thread: '#687E7E',
    accent: '#506161',
  },
  trust: {
    fill: '#F0DDDF',
    border: '#E4BAC7',
    thread: '#8B7179',
    accent: '#6B575E',
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
    fontSize: 31,
    lineHeight: 41,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.displayEmphasis,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400' as const,
    color: colors.inkSoft,
  },
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '400' as const,
    color: colors.inkSoft,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400' as const,
    color: colors.inkMuted,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    color: colors.ink,
  },
  overline: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '400' as const,
    // Wide tracking on an uppercase monospace label reads like a stamped
    // header on a form — leans into the paper feel.
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: colors.inkMuted,
  },
} as const;

/** Shared motion tokens — every animation uses these so reduce-motion and
 *  pacing changes happen in one place. */
export const motion = {
  spring: { damping: 18, stiffness: 180 },
  gentleMs: 350,
  stitchMs: 900,
  /** Breathing pulse on "feel it" invitations. The pulse dips DOWN to this
   *  scale and back to 1 — the laid-out size is the MAXIMUM, so the swell
   *  never overflows its container (device feedback 2026-07-17: the border
   *  was getting eaten at max size). */
  breatheMs: 3200,
  breatheScale: 0.98,
  /** One box-breathing phase (in / hold / out / hold), 4 counts each. */
  boxBreathePhaseMs: 4000,
  /** How far the box-breathing square and the weekly mark contract on the
   *  out-breath (scale at "empty lungs"; 1 = laid-out size at full breath). */
  boxBreatheScale: 0.72,
  boxBreatheMarkScale: 0.94,
} as const;
