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

// Frozen as it stood at v1, on purpose — a migration describes the past.
const RESISTANCE_IDS = ['stuck-decisions', 'looping-week', 'judgment-heavy'];

/**
 * Persist migration, exported so it runs against real stored records in
 * tests. Idempotent, so it ignores the stored version: v1 gave cards a `kind`
 * overline (backfilled from the templateId); v2 retired `dismissedAt` (cards
 * are not dismissable, user 2026-09-03) — stripped so stored records match
 * InsightCardState again.
 */
export function migrateInsights(persisted: unknown): InsightState {
  const state = { ...((persisted ?? {}) as Record<string, unknown>) };
  if (Array.isArray(state.cards)) {
    state.cards = (state.cards as Record<string, unknown>[]).map(
      ({ dismissedAt: _retired, ...card }) => ({
        ...card,
        kind: card.kind ?? (RESISTANCE_IDS.includes(card.templateId as string) ? 'resistance' : 'pattern'),
      })
    );
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
      // No dismissCard (user, 2026-09-03). The store keeps every week's
      // cards; which weeks show is the screen's call.
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
