// P9 — emotion-helper sheet: content sections, sheet visibility, and the tiny
// UI store that lets any screen open the helper without prop drilling.

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import EmotionHelperContent from '@/components/EmotionHelperContent';
import EmotionHelperSheet from '@/components/EmotionHelperSheet';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { EMOTION_HELPERS } from '@/content/helpers';
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
  it('is hidden when family is null (no content rendered)', () => {
    render(<EmotionHelperSheet family={null} onClose={() => {}} />);
    expect(screen.queryByText('What it means')).toBeNull();
  });

  it('shows the family label + sections when a family is set', async () => {
    render(<EmotionHelperSheet family="anger" onClose={() => {}} />);
    // Label appears in the title AND the resisted row — assert at least one.
    expect((await screen.findAllByText(EMOTION_FAMILIES.anger.label)).length).toBeGreaterThan(0);
    expect(screen.getByText('What it means')).toBeTruthy();
  });
});

describe('helperSheetStore', () => {
  it('starts closed', () => {
    expect(useHelperSheetStore.getState().family).toBeNull();
  });

  it('open(family) sets the family and close() clears it', () => {
    useHelperSheetStore.getState().open('disgust');
    expect(useHelperSheetStore.getState().family).toBe('disgust');
    useHelperSheetStore.getState().close();
    expect(useHelperSheetStore.getState().family).toBeNull();
  });
});
