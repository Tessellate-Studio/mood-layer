// Insight store: generated weekly cards. Generation is idempotent per week
// and caps at 2 cards (tone rule, CLAUDE.md) — the top 2 matching templates
// by priority. Weeks with fewer than 3 check-ins generate nothing (too little
// signal to reflect back) but still mark the week so we don't retry.
// Persisted locally via AsyncStorage (hard rule: local-only).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { InsightCardState, WeekStats } from '@/types/models';
import { INSIGHT_TEMPLATES } from '@/content/insights';
import { generateUUID } from '@/utils/ids';

/** Minimum check-ins in a week before we generate insights for it. */
const MIN_CHECKINS_FOR_INSIGHTS = 3;
/** At most this many cards per week. */
const MAX_CARDS_PER_WEEK = 2;

interface InsightState {
  cards: InsightCardState[];
  lastGeneratedWeekKey: string | null;
  generateForWeek(weekKey: string, stats: WeekStats): void;
  dismissCard(id: string): void;
  clearAll(): void;
}

export const useInsightStore = create<InsightState>()(
  persist(
    (set, get) => ({
      cards: [],
      lastGeneratedWeekKey: null,
      generateForWeek: (weekKey, stats) => {
        if (get().lastGeneratedWeekKey === weekKey) return;

        const newCards: InsightCardState[] =
          stats.checkInCount >= MIN_CHECKINS_FOR_INSIGHTS
            ? INSIGHT_TEMPLATES.filter((t) => t.matches(stats))
                .sort((a, b) => b.priority - a.priority)
                .slice(0, MAX_CARDS_PER_WEEK)
                .map((template) => {
                  const { title, body } = template.render(stats);
                  return {
                    id: generateUUID(),
                    weekKey,
                    templateId: template.id,
                    title,
                    body,
                  };
                })
            : [];

        set((state) => ({
          cards: [...state.cards, ...newCards],
          lastGeneratedWeekKey: weekKey,
        }));
      },
      dismissCard: (id) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id && !card.dismissedAt
              ? { ...card, dismissedAt: new Date().toISOString() }
              : card
          ),
        })),
      clearAll: () => set({ cards: [], lastGeneratedWeekKey: null }),
    }),
    { name: 'tml-insights', storage: createJSONStorage(() => AsyncStorage) }
  )
);
