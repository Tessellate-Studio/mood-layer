// The muted-layer design treatment (user-directed 2026-07-13): desaturated
// Atlas-family hues name sections and cards as distinct "layers" across every
// screen. These tests pin the token contract (palette completeness + WCAG AA
// contrast, computed — not eyeballed) and the three shared components that
// carry the treatment.

import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import LogoDivider from '@/components/LogoDivider';
import SectionHeader from '@/components/SectionHeader';
import ThreadCard from '@/components/ThreadCard';
import { colors, familyPalette, mutedPalette, typography } from '@/constants/theme';
import { EMOTION_FAMILIES } from '@/content/emotions';
import type { EmotionFamilyId } from '@/types/models';

// --- WCAG relative-luminance contrast (2.1 §1.4.3 / §1.4.11) ---

function luminance(hex: string): number {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9A-F]{6}$/i;

describe('mutedPalette tokens', () => {
  const familyIds = Object.keys(EMOTION_FAMILIES) as EmotionFamilyId[];

  it('covers every emotion family with fill / border / thread / accent', () => {
    for (const id of familyIds) {
      const entry = mutedPalette[id];
      expect(entry).toBeTruthy();
      expect(entry.fill).toMatch(HEX);
      expect(entry.border).toMatch(HEX);
      expect(entry.thread).toMatch(HEX);
      expect(entry.accent).toMatch(HEX);
    }
  });

  it('accents read as AA text on their fill and on raised paper (≥4.5:1)', () => {
    for (const id of familyIds) {
      const { fill, accent } = mutedPalette[id];
      expect(contrast(accent, fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(accent, colors.paperRaised)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('threads read as AA non-text UI on their fill and on paper (≥3:1)', () => {
    for (const id of familyIds) {
      const { fill, thread } = mutedPalette[id];
      expect(contrast(thread, fill)).toBeGreaterThanOrEqual(3);
      expect(contrast(thread, colors.paper)).toBeGreaterThanOrEqual(3);
    }
  });

  it('every ink text tier stays AA on the tinted card fills', () => {
    // The fills carry real hue since 2026-07-18 ("too dull"), so the tiers
    // that print ON them — headings/ink, body/inkSoft, captions/inkMuted —
    // are re-checked here rather than assumed from the paper background.
    for (const id of familyIds) {
      const { fill } = mutedPalette[id];
      expect(contrast(colors.ink, fill)).toBeGreaterThanOrEqual(7);
      expect(contrast(colors.inkSoft, fill)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.inkMuted, fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('fills carry visible hue — not grey (the "too dull" regression)', () => {
    // Chroma proxy: the spread between the max and min RGB channel. The old
    // desaturated fills sat at 2–6 (grey dust); the 0.30-mix fills ran 7–33
    // and still read flat on Experiments (user, 2026-08-31 "a bit jarring…
    // slightly saturated version of the mockup"), so fills moved to a 0.42
    // mix (11–44). Guard sits at 10: above both the grey range and the
    // washed-out 0.30 cool families, below the new cool-family floor of 11.
    for (const id of familyIds) {
      const c = mutedPalette[id].fill.replace('#', '');
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThanOrEqual(10);
    }
  });

  it('familyPalette threads clear 3:1 on paper, raised paper, and shade1', () => {
    // These threads draw meaningful strokes (helper-sheet underline + border,
    // logo band edges) — several sat below 3:1 until the 2026-07-17 contrast
    // audit darkened them ("some colours do not pass WCAG", user).
    for (const id of familyIds) {
      const { shades, thread } = familyPalette[id];
      expect(contrast(thread, colors.paper)).toBeGreaterThanOrEqual(3);
      expect(contrast(thread, colors.paperRaised)).toBeGreaterThanOrEqual(3);
      expect(contrast(thread, shades[1])).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('typography scale', () => {
  const tokens = Object.entries(typography) as [
    string,
    { fontSize: number; lineHeight: number },
  ][];

  it('holds the 2026-08-31 +1px readability floor', () => {
    // User: "font size needs a 1px bump". Floors, not exact pins, so a later
    // deliberate bump passes and any silent shrink fails.
    const floor: Record<string, number> = {
      display: 31,
      title: 23,
      heading: 18,
      body: 16,
      bodyLarge: 18,
      caption: 13,
      label: 15,
      overline: 12,
    };
    expect(Object.keys(floor).sort()).toEqual(tokens.map(([name]) => name).sort());
    for (const [name, token] of tokens) {
      expect(token.fontSize).toBeGreaterThanOrEqual(floor[name]);
    }
  });

  it('gives every token Courier Prime descender headroom (≥1.32 × size)', () => {
    // Courier Prime's Android text box is (winAscent 1900 + winDescent 800)
    // / 2048 upm = 1.318 × fontSize — read from the shipped TTF. A lineHeight
    // under that clips the last line's descenders inside exact-height boxes.
    for (const [, token] of tokens) {
      expect(token.lineHeight).toBeGreaterThanOrEqual(Math.ceil(token.fontSize * 1.32));
    }
  });
});

describe('SectionHeader', () => {
  it('renders the overline label with the section glyph', () => {
    render(<SectionHeader family="sadness" label="Guided practices" />);
    expect(screen.getByText('Guided practices')).toBeTruthy();
    // The glyph is decorative and a11y-hidden by design — include hidden
    // elements so the query can still see it.
    expect(
      screen.getByTestId('section-glyph-sadness', { includeHiddenElements: true })
    ).toBeTruthy();
  });
});

describe('ThreadCard', () => {
  it('renders children beside a thread spine', () => {
    render(
      <ThreadCard family="anger" testID="card-under-test">
        <Text>Under the judgment</Text>
      </ThreadCard>
    );
    expect(screen.getByText('Under the judgment')).toBeTruthy();
    expect(screen.getByTestId('card-under-test-spine')).toBeTruthy();
  });

  it('is pressable when given onPress', () => {
    const onPress = jest.fn();
    render(
      <ThreadCard
        family="sadness"
        testID="card-press"
        onPress={onPress}
        accessibilityLabel="Name it"
      >
        <Text>Name it</Text>
      </ThreadCard>
    );
    fireEvent.press(screen.getByTestId('card-press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('LogoDivider', () => {
  it('renders the mark and the closing tip', () => {
    render(<LogoDivider tip="Nothing here is a test." />);
    expect(screen.getByTestId('logo-divider')).toBeTruthy();
    expect(screen.getByText('Nothing here is a test.')).toBeTruthy();
  });

  it('renders the mark alone when no tip is given', () => {
    render(<LogoDivider />);
    expect(screen.getByTestId('logo-divider')).toBeTruthy();
  });
});
