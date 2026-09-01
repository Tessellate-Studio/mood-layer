// Host for the emotion-helper: an in-house bottom Sheet wrapping the scrollable
// helper body. family === null keeps it closed. Rendered once in App.tsx; any
// screen opens it via useHelperSheetStore, so there's no prop drilling.
//
// The family name is the SHEET's title, not the body's: it sits in the sheet's
// grab area, outside the scroll, so dragging the top of the card down closes it
// (a title inside the ScrollView scrolls instead — device feedback 2026-09-02).

import React from 'react';
import { ScrollView } from 'react-native';

import EmotionHelperContent from '@/components/EmotionHelperContent';
import Sheet from '@/components/Sheet';
import { EMOTION_FAMILIES } from '@/content/emotions';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  family: EmotionFamilyId | null;
  onClose(): void;
}

export function EmotionHelperSheet({ family, onClose }: Props) {
  return (
    <Sheet
      visible={family !== null}
      onClose={onClose}
      title={family ? EMOTION_FAMILIES[family].label : undefined}
      testID="emotion-helper"
    >
      {family ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <EmotionHelperContent family={family} showTitle={false} />
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

export default EmotionHelperSheet;
