// P — WeeklySummaryCard: the home screen's "THIS WEEK, MOSTLY ___" card.

import React from 'react';
import { render, screen } from '@testing-library/react-native';

import WeeklySummaryCard from '@/components/WeeklySummaryCard';
import type { HomeWeeklySummary } from '@/content/circle';

const summary: HomeWeeklySummary = {
  headline: 'Warm',
  body: 'Enjoyment and sadness, layered side by side.',
  families: ['enjoyment', 'sadness'],
};

describe('WeeklySummaryCard', () => {
  it('renders the overline, headline and body', () => {
    render(<WeeklySummaryCard summary={summary} />);
    expect(screen.getByText('This week, mostly')).toBeTruthy();
    expect(screen.getByText('Warm')).toBeTruthy();
    expect(screen.getByText('Enjoyment and sadness, layered side by side.')).toBeTruthy();
  });

  it('renders nothing when there is no summary', () => {
    const { toJSON } = render(<WeeklySummaryCard summary={null} />);
    expect(toJSON()).toBeNull();
  });
});
