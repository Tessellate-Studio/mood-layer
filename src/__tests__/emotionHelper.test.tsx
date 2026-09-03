// P9 — emotion-helper sheet: content sections, sheet visibility, and the tiny
// UI store that lets any screen open the helper without prop drilling. Two
// modes since 2026-09-03: a FAMILY on its own (the full card) or a WORD
// (just its definition + actions, no family essay — user: "Only show the
// definition, the whole family card is unnecessary").

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import EmotionHelperContent from '@/components/EmotionHelperContent';
import EmotionHelperSheet from '@/components/EmotionHelperSheet';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { EMOTION_HELPERS } from '@/content/helpers';
import { WORD_DEFINITIONS } from '@/content/wordDefinitions';
import { useHelperSheetStore } from '@/store/helperSheetStore';

const initialHelper = useHelperSheetStore.getState();

beforeEach(() => {
  useHelperSheetStore.setState(initialHelper, true);
});

describe('EmotionHelperContent', () => {
  it('renders all four section headings for a family', async () => {
    render(<EmotionHelperContent family="fear" />);
    expect(await screen.findByText('What it means')).toBeTruthy();
    expect(screen.getByText('In the body')).toBeTruthy();
    // Section heading uses an ellipsis; match on a stable prefix.
    expect(screen.getByText(/When resisted, it becomes/)).toBeTruthy();
    expect(screen.getByText('An invitation')).toBeTruthy();
  });

  it('shows the family label as the title', async () => {
    render(<EmotionHelperContent family="anger" />);
    // "Anger" appears twice — as the title AND in the "Anger → stuckness"
    // resisted row — so assert at least one match.
    expect((await screen.findAllByText(EMOTION_FAMILIES.anger.label)).length).toBeGreaterThan(0);
  });

  it('renders the whenResisted "becomes" word for the family', async () => {
    render(<EmotionHelperContent family="fear" />);
    // fear → chronic anxiety
    expect(
      await screen.findByText(EMOTION_HELPERS.fear.whenResisted.becomes)
    ).toBeTruthy();
  });

  it('renders the whatItMeans body copy', async () => {
    render(<EmotionHelperContent family="sadness" />);
    expect(await screen.findByText(EMOTION_HELPERS.sadness.whatItMeans)).toBeTruthy();
  });
});

describe('EmotionHelperSheet', () => {
  // Device feedback 2026-09-03: "Enjoyment has this last line that I can't
  // access via scroll. All family cards can't be scrolled." RN's ScrollView
  // defaults to flexShrink: 0 — inside the sheet's maxHeight it grows to its
  // full content height instead of shrinking to the available space, so the
  // overflow is clipped, not scrollable. Same fix already proven on
  // QuiltScreen's own detail sheet (2026-07-17).
  it('lets the body ScrollView shrink inside the sheet, so long content scrolls instead of clipping', () => {
    render(<EmotionHelperSheet target={{ kind: 'family', family: 'enjoyment' }} onClose={() => {}} />);
    const scroll = screen.UNSAFE_getByType(ScrollView);
    const flat = StyleSheet.flatten(scroll.props.style);
    expect(flat.flexShrink).toBe(1);
  });

  it('is hidden when the target is null (no content rendered)', () => {
    render(<EmotionHelperSheet target={null} onClose={() => {}} />);
    expect(screen.queryByText('What it means')).toBeNull();
  });

  it('family mode: shows the family label + the full card', async () => {
    render(
      <EmotionHelperSheet target={{ kind: 'family', family: 'anger' }} onClose={() => {}} />
    );
    // Label appears in the title AND the resisted row — assert at least one.
    expect((await screen.findAllByText(EMOTION_FAMILIES.anger.label)).length).toBeGreaterThan(0);
    expect(screen.getByText('What it means')).toBeTruthy();
  });

  it('word mode: shows the WORD as the title, its definition and actions — no family essay', async () => {
    render(<EmotionHelperSheet target={{ kind: 'word', wordId: 'wistful' }} onClose={() => {}} />);
    expect(await screen.findByText('Wistful')).toBeTruthy();
    expect(screen.getByText(WORD_DEFINITIONS.wistful.definition)).toBeTruthy();
    expect(screen.getByText(WORD_DEFINITIONS.wistful.actions.constructive)).toBeTruthy();
    expect(screen.getByText(WORD_DEFINITIONS.wistful.actions.ambiguous)).toBeTruthy();
    expect(screen.getByText(WORD_DEFINITIONS.wistful.actions.destructive)).toBeTruthy();
    // The family card's own sections must NOT render in word mode.
    expect(screen.queryByText('What it means')).toBeNull();
    expect(screen.queryByText('In the body')).toBeNull();
    expect(screen.queryByText('An invitation')).toBeNull();
  });

  it('word mode still names the family, as a small tag, not the sheet title', async () => {
    render(<EmotionHelperSheet target={{ kind: 'word', wordId: 'furious' }} onClose={() => {}} />);
    expect(await screen.findByText('Furious')).toBeTruthy();
    expect(screen.getByText('Anger')).toBeTruthy();
  });
});

describe('helperSheetStore', () => {
  it('starts closed', () => {
    expect(useHelperSheetStore.getState().target).toBeNull();
  });

  it('openFamily sets a family target and close() clears it', () => {
    useHelperSheetStore.getState().openFamily('disgust');
    expect(useHelperSheetStore.getState().target).toEqual({ kind: 'family', family: 'disgust' });
    useHelperSheetStore.getState().close();
    expect(useHelperSheetStore.getState().target).toBeNull();
  });

  it('openWord sets a word target — no family, derived fresh from the word (adversarial review, 2026-09-03)', () => {
    useHelperSheetStore.getState().openWord('heartbroken');
    expect(useHelperSheetStore.getState().target).toEqual({ kind: 'word', wordId: 'heartbroken' });
  });

  it('opening a word after a family replaces it — one target at a time', () => {
    useHelperSheetStore.getState().openFamily('anger');
    useHelperSheetStore.getState().openWord('afraid');
    expect(useHelperSheetStore.getState().target).toEqual({ kind: 'word', wordId: 'afraid' });
  });
});
