// The Mood Layer — typewriter-on-paper design tokens.
// HARD RULE (CLAUDE.md): every colour in the app comes from here. No hex
// literals anywhere else. The chrome (text, lines, buttons, chips) stays
// ink-on-paper; the ONLY colour lives in the quilt itself — soft pastel
// family hues after Ekman & the Dalai Lama's Atlas of Emotions
// (atlasofemotions.org): anger red, fear violet, sadness blue, disgust
// green, enjoyment amber (+ two harmonised for surprise/contempt).

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
export const familyPalette: Record<EmotionFamilyId, FamilyPalette> = {
  anger: {
    shades: { 1: '#F6DCD8', 2: '#F0C2BA', 3: '#E39C90', 4: '#D4705F' },
    thread: '#8C3B2E',
  },
  fear: {
    shades: { 1: '#E6DFF0', 2: '#D4C7E6', 3: '#B49DD4', 4: '#8F6FBD' },
    thread: '#4F3B75',
  },
  sadness: {
    shades: { 1: '#DAE4EE', 2: '#BFD2E4', 3: '#93B2D0', 4: '#6389B4' },
    thread: '#2F5379',
  },
  disgust: {
    shades: { 1: '#DDE9DC', 2: '#C4DCC2', 3: '#9CC29A', 4: '#6FA36F' },
    thread: '#3B6B3E',
  },
  enjoyment: {
    shades: { 1: '#F7EDD2', 2: '#F2DFAC', 3: '#E7C877', 4: '#D4A945' },
    thread: '#8A6A1E',
  },
  surprise: {
    shades: { 1: '#F9E4D4', 2: '#F4CFB2', 3: '#E8AC7F', 4: '#D68550' },
    thread: '#92552B',
  },
  contempt: {
    shades: { 1: '#EADEE6', 2: '#DCC6D4', 3: '#C29FB4', 4: '#A4738F' },
    thread: '#6B4258',
  },
};

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
