// Navigation from outside the React tree (e.g. a "name it" notification tap).
//
// Calls that land before the container is mounted are QUEUED, not dropped
// (regression row 21). Dropping them looked defensive and was data loss: a
// notification tap always cold-starts the app — the process only existed
// because the alarm woke it to post the notification — and App.tsx holds the
// whole tree, navigator included, behind `useFonts`. The tap resolves in
// milliseconds and fonts do not, so the ONE case the deep link exists for was
// the one case it could never work. It failed silently, on the wrong screen.

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type PendingRoute = { name: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] };

// One slot, not a queue: these only ever come from a tap, and if two taps land
// before the container is up the user's last choice is the one they meant.
// Same "hold one intent until a not-yet-ready consumer can act on it" shape as
// circleStore's pendingSharePersonId, done as a plain module variable instead
// of store state so this navigation-only module stays free of a store import.
let pending: PendingRoute | null = null;

// The ref's navigate() overloads don't narrow over a generic route name; the
// cast is sound because name/params are tied together at every call site
// (navigate<Name>'s signature, or a PendingRoute built from one). One cast
// here means navigate() and flushPendingNavigation() don't each need their own.
function dispatch(route: PendingRoute): void {
  (navigationRef.navigate as (n: keyof RootStackParamList, p?: PendingRoute['params']) => void)(
    route.name,
    route.params
  );
}

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
): void {
  const route: PendingRoute = { name, params };
  if (!navigationRef.isReady()) {
    pending = route;
    return;
  }
  dispatch(route);
}

/** Deliver a route that arrived before the navigator existed. Wired to
 *  NavigationContainer's `onReady`, which is the first moment it can work.
 *  Safe to call at any time: no-ops when nothing is queued, and holds the
 *  intent if it somehow fires while still not ready. */
export function flushPendingNavigation(): void {
  if (!pending || !navigationRef.isReady()) return;
  const next = pending;
  pending = null; // cleared before navigating, so a throw cannot re-deliver
  dispatch(next);
}
