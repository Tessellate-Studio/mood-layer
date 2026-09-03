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
  clearAll(): void;
}

const RESISTANCE_IDS = ['stuck-decisions', 'looping-week', 'judgment-heavy'];

/**
 * Persist migrations, exported so they run against real stored records in
 * tests. v1: cards gained a `kind` overline — backfill it from the templateId
 * so a card from before the redesign shows the right shelf. v2: `dismissedAt`
 * retired (cards are not dismissable, user 2026-09-03) — strip it so stored
 * records match InsightCardState again.
 */
export function migrateInsights(persisted: unknown, version: number): InsightState {
  const state = { ...((persisted ?? {}) as Record<string, unknown>) };
  if (Array.isArray(state.cards)) {
    let cards = state.cards as Record<string, unknown>[];
    if (version < 1) {
      cards = cards.map((card) => ({
        ...card,
        kind: card.kind ?? (RESISTANCE_IDS.includes(card.templateId as string) ? 'resistance' : 'pattern'),
      }));
    }
    if (version < 2) {
      cards = cards.map((card) =>
        Object.fromEntries(Object.entries(card).filter(([key]) => key !== 'dismissedAt'))
      );
    }
    state.cards = cards;
  }
  return state as unknown as InsightState;
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
      // No dismissCard: cards are not dismissable (user, 2026-09-03). The
      // screen shows only the newest week; older cards stay here for a later
      // variety pass to read.
      clearAll: () => set({ cards: [], lastGeneratedWeekKey: null }),
    }),
    {
      name: 'tml-insights',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: migrateInsights,
    }
  )
);
