// Word card: switching words must rebuild the card, not patch it in place.
// Device (iPhone, 2026-09-13): tapping from word to word in Field guide left
// Explosive's Constructive line drawn on ONE clipped line inside a box sized
// for three — the text node was reused and its drawing went stale while its
// measured height updated. A fresh card per word sidesteps that.

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import WordDefinitionContent from '@/components/WordDefinitionContent';
import { WORD_DEFINITIONS } from '@/content/wordDefinitions';

describe('WordDefinitionContent', () => {
  it('remounts its text when the word changes, instead of reusing the old nodes', () => {
    const { rerender } = render(<WordDefinitionContent wordId="furious" />);
    const before = screen.getByText(WORD_DEFINITIONS.furious.actions.constructive);

    rerender(<WordDefinitionContent wordId="explosive" />);
    const after = screen.getByText(WORD_DEFINITIONS.explosive.actions.constructive);

    expect(after).not.toBe(before);
  });
});
