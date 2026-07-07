// Host for the emotion-helper: an in-house bottom Sheet wrapping the scrollable
// helper body. family === null keeps it closed. Rendered once in App.tsx; any
// screen opens it via useHelperSheetStore, so there's no prop drilling.

import React from 'react';
import { ScrollView } from 'react-native';

import EmotionHelperContent from '@/components/EmotionHelperContent';
import Sheet from '@/components/Sheet';
import type { EmotionFamilyId } from '@/types/models';

interface Props {
  family: EmotionFamilyId | null;
  onClose(): void;
}

export function EmotionHelperSheet({ family, onClose }: Props) {
  return (
    <Sheet visible={family !== null} onClose={onClose} testID="emotion-helper">
      {family ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <EmotionHelperContent family={family} />
        </ScrollView>
      ) : null}
    </Sheet>
  );
}

export default EmotionHelperSheet;
