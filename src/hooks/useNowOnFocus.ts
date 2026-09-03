// "Now" that advances on every focus of the screen, so its date-keyed views —
// last week's cards, last month's cards, this week's mood — roll over on the
// first open after a Monday or a 1st, even when the app stayed in memory
// across the boundary. A `new Date()` captured inside a data-keyed memo only
// moves when the data does.

import React from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useNowOnFocus(): Date {
  const [now, setNow] = React.useState(() => new Date());
  useFocusEffect(React.useCallback(() => setNow(new Date()), []));
  return now;
}
