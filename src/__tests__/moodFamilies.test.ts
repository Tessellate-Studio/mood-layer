// selectMoodFamilies — the "prominent current mood" every mark wears (user,
// 2026-09-03: home header mark, weekly-summary mark, Insights header mark all
// tinted the same way). This week's top families; if the week is empty so
// far, last week's; else nothing (LogoMark falls back to the brand stack).

import { selectMoodFamilies } from '@/store/checkInStore';
import type { CheckIn, EmotionFamilyId } from '@/types/models';
import { dayKey } from '@/utils/dates';

// Thursday 2026-07-09 — ISO week 28 (Jul 6–12); last week is W27 (Jun 29–Jul 5).
const NOW = new Date(2026, 6, 9, 12, 0, 0);

function checkIn(id: string, when: Date, families: EmotionFamilyId[]): CheckIn {
  const iso = when.toISOString();
  return {
    id,
    createdAt: iso,
    dayKey: dayKey(iso),
    emotions: families.map((family) => ({ emotionId: `${family}-word`, family, intensity: 2 })),
    resistanceFlags: [],
    source: 'manual',
  };
}

describe('selectMoodFamilies', () => {
  it('names this week’s families, most frequent first, at most three', () => {
    const checkIns = [
      checkIn('a', new Date(2026, 6, 6, 9), ['sadness', 'enjoyment']),
      checkIn('b', new Date(2026, 6, 8, 9), ['sadness', 'anger', 'fear']),
    ];
    // sadness 2; anger/enjoyment/fear 1 each → alphabetical tie-break, cut at 3.
    expect(selectMoodFamilies(checkIns, NOW)).toEqual(['sadness', 'anger', 'enjoyment']);
  });

  it('falls back to last week while this week is still empty', () => {
    const checkIns = [checkIn('lw', new Date(2026, 6, 1, 9), ['fear'])];
    expect(selectMoodFamilies(checkIns, NOW)).toEqual(['fear']);
  });

  it('prefers this week over last week as soon as anything is layered in', () => {
    const checkIns = [
      checkIn('lw', new Date(2026, 6, 1, 9), ['fear']),
      checkIn('tw', new Date(2026, 6, 7, 9), ['trust']),
    ];
    expect(selectMoodFamilies(checkIns, NOW)).toEqual(['trust']);
  });

  it('is empty with nothing in either week — the brand stack shows', () => {
    const checkIns = [checkIn('old', new Date(2026, 5, 1, 9), ['anger'])];
    expect(selectMoodFamilies(checkIns, NOW)).toEqual([]);
    expect(selectMoodFamilies([], NOW)).toEqual([]);
  });
});
