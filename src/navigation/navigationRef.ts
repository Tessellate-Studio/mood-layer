// Navigation from outside the React tree (e.g. a "name it" notification tap).
// Guarded: calls that land before the container is ready are dropped instead
// of crashing.

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
): void {
  if (!navigationRef.isReady()) return;
  // The ref's navigate() overloads don't narrow over a generic route name;
  // the cast is sound because name/params are tied by this signature.
  (navigationRef.navigate as (n: Name, p?: RootStackParamList[Name]) => void)(name, params);
}
