// Host for the emotion-helper: an in-house bottom Sheet wrapping the
// scrollable helper body. target === null keeps it closed. Rendered once in
// App.tsx; any screen opens it via useHelperSheetStore, so there's no prop
// drilling.
//
// Two bodies, one host: `kind: 'family'` renders the family's full card
// (EmotionHelperContent); `kind: 'word'` renders just that word's situational
// definition + actions (WordDefinitionContent) — no family essay (user,
// 2026-09-03). Either way the title sits in the sheet's grab area, outside
// the scroll, so dragging the top of the card down closes it (a title inside
// the ScrollView scrolls instead — device feedback 2026-09-02).

import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import EmotionHelperContent from '@/components/EmotionHelperContent';
import Sheet from '@/components/Sheet';
import WordDefinitionContent from '@/components/WordDefinitionContent';
import { EMOTION_FAMILIES } from '@/content/emotions';
import { findVocabularyWord } from '@/content/vocabulary';
import type { HelperTarget } from '@/store/helperSheetStore';

interface Props {
  target: HelperTarget | null;
  onClose(): void;
}

/** Same word lookup WordDefinitionContent renders from, so a title never
 *  shows over an empty body (a word missing its own entry — guarded by
 *  wordDefinitions.test.ts's completeness check — renders neither here). */
function titleFor(target: HelperTarget): string | undefined {
  if (target.kind === 'family') return EMOTION_FAMILIES[target.family].label;
  return findVocabularyWord(target.wordId)?.word.label;
}

export function EmotionHelperSheet({ target, onClose }: Props) {
  return (
    <Sheet
      visible={target !== null}
      onClose={onClose}
      title={target ? titleFor(target) : undefined}
      testID="emotion-helper"
    >
      {target ? (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {target.kind === 'family' ? (
            <EmotionHelperContent family={target.family} showTitle={false} />
          ) : (
            <WordDefinitionContent wordId={target.wordId} />
          )}
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    // MUST shrink inside the sheet's maxHeight — RN's default flexShrink of
    // 0 let a long family card overflow the hidden clip instead of
    // scrolling, cutting off the bottom with no way to reach it (device
    // feedback 2026-09-03, same class of bug as QuiltScreen's own detail
    // sheet, 2026-07-17 — see its sheetScroll style for the same fix).
    flexShrink: 1,
  },
});

export default EmotionHelperSheet;
