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
import { ScrollView } from 'react-native';

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
        <ScrollView showsVerticalScrollIndicator={false}>
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

export default EmotionHelperSheet;
