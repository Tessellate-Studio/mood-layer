// Insight store: generated weekly cards. Generation is idempotent per week
// and caps at 2 cards (tone rule, CLAUDE.md) — the top 2 matching templates
// by priority. Weeks with fewer than 3 check-ins generate nothing (too little
// signal to reflect back) but still mark the week so we don't retry.
// Selection + rendering live in utils/insightEngine (single generation path);
// this store only stamps ids and persists. Persisted locally via AsyncStorage
// (hard rule: local-only).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { InsightCardState, WeekStats } from '@/types/models';
import { generateUUID } from '@/utils/ids';
import { generateInsights } from '@/utils/insightEngine';

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

        const newCards: InsightCardState[] = generateInsights(stats).map(
          ({ templateId, kind, title, body }) => ({
            id: generateUUID(),
            weekKey,
            templateId,
            kind,
            title,
            body,
          })
        );

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
    {
      name: 'tml-insights',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // v1: cards gained a `kind` overline. Backfill from the templateId so a
      // card generated before the redesign still shows the right shelf.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        const RESISTANCE_IDS = ['stuck-decisions', 'looping-week', 'judgment-heavy'];
        if (version < 1 && Array.isArray(state.cards)) {
          state.cards = (state.cards as Array<Record<string, unknown>>).map((card) => ({
            ...card,
            kind: card.kind ?? (RESISTANCE_IDS.includes(card.templateId as string) ? 'resistance' : 'pattern'),
          }));
        }
        return state as unknown as InsightState;
      },
    }
  )
);
