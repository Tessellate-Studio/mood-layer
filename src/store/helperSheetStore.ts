// Tiny UI store for the emotion-helper bottom sheet. NOT persisted — it holds
// only what's open right now, so any screen can open the sheet without prop
// drilling (the sheet host lives once in App.tsx). Plain create(), no
// AsyncStorage: ephemeral UI state, nothing to remember.
//
// Two modes: a FAMILY on its own (the family's own card — What it means, In
// the body, When resisted, An invitation) for the deliberate "learn about
// this family" entry points (Field Guide's nine families, a check-in's
// masking doorway, the day-detail sheet's "about X"); a WORD, for every
// hold-to-learn on a specific word chip — only that word's definition +
// actions, never the family essay (user, 2026-09-03: "Only show the
// definition, the whole family card is unnecessary").
//
// A word target carries ONLY the wordId, not a family — a family field here
// would be redundant with (and could go stale against) whatever
// findVocabularyWord(wordId) resolves to. That's not hypothetical: a caller
// can hold a family read off an OLD check-in selection, and vocabulary.ts
// documents at least one word ('embarrassed') that was reassigned to a
// different family after check-ins already stored the old one. Every
// consumer derives the family fresh from the word id instead (adversarial
// review, 2026-09-03).

import { create } from 'zustand';
import type { EmotionFamilyId } from '@/types/models';

export type HelperTarget =
  | { kind: 'family'; family: EmotionFamilyId }
  | { kind: 'word'; wordId: string };

interface HelperSheetState {
  /** What's open right now, or null when the sheet is closed. */
  target: HelperTarget | null;
  openFamily(family: EmotionFamilyId): void;
  openWord(wordId: string): void;
  close(): void;
}

export const useHelperSheetStore = create<HelperSheetState>((set) => ({
  target: null,
  openFamily: (family) => set({ target: { kind: 'family', family } }),
  openWord: (wordId) => set({ target: { kind: 'word', wordId } }),
  close: () => set({ target: null }),
}));
