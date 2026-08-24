// Jest setup — mocks copied from alate's known-good jest.setup.js where the
// packages overlap (Reanimated 4 / worklets / gesture-handler), plus this
// app's own expo-notifications and expo-font stubs.

// Mock react-native-reanimated — v4 bundles worklets natively which blows up
// in node, so we provide a hand-rolled API surface instead of loading the
// package's own mock (which itself imports the native worklets module).
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, ScrollView, Text } = require('react-native');
  const Animated = {
    View,
    ScrollView,
    Text,
    createAnimatedComponent: (c) => c,
    call: () => {},
  };
  return {
    __esModule: true,
    default: Animated,
    ...Animated,
    // Return a STABLE object across renders, like real reanimated — a fresh
    // object each render would defeat React.memo on any component that
    // receives a shared value as a prop.
    useSharedValue: (initial) => {
      const ref = React.useRef(null);
      if (ref.current === null) ref.current = { value: initial };
      return ref.current;
    },
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    useAnimatedScrollHandler: () => () => {},
    // OS reduce-motion preference — default to "motion allowed" in tests.
    useReducedMotion: () => false,
    useDerivedValue: (cb) => ({ value: cb ? cb() : undefined }),
    withSpring: (v) => v,
    withTiming: (v, _c, cb) => {
      if (cb) cb(true);
      return v;
    },
    withDelay: (_d, v) => v,
    withSequence: (...args) => args[args.length - 1],
    withRepeat: (v) => v,
    cancelAnimation: () => {},
    runOnJS: (fn) => fn,
    runOnUI: (fn) => fn,
    interpolate: (v) => v,
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      inOut: (fn) => fn,
      out: (fn) => fn,
      in: (fn) => fn,
    },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend' },
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend' },
  };
});

// Mock react-native-worklets (Reanimated 4 dep) — same blast radius fix
jest.mock(
  'react-native-worklets',
  () => ({
    __esModule: true,
    makeShareableCloneRecursive: jest.fn(),
    runOnUI: (fn) => fn,
    runOnJS: (fn) => fn,
  }),
  { virtual: true }
);

// Mock react-native-gesture-handler's GestureDetector as a passthrough View
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = ({ children }) => children ?? null;
  const chainable = () => {
    const proxy = new Proxy(() => proxy, {
      get: () => () => proxy,
    });
    return proxy;
  };
  return {
    GestureDetector: passthrough,
    GestureHandlerRootView: ({ children, style }) =>
      React.createElement(View, { style }, children),
    Gesture: {
      Pan: chainable,
      Pinch: chainable,
      Rotation: chainable,
      LongPress: chainable,
      Tap: chainable,
      Simultaneous: (...gestures) => ({ simultaneous: gestures }),
      Race: (...gestures) => ({ race: gestures }),
    },
    State: {},
    Directions: {},
  };
});

// Swipeable rows: render the child content AND the right-actions inline so
// tests can press the edit/remove buttons without simulating a pan gesture.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, renderRightActions }) =>
      React.createElement(
        View,
        null,
        children,
        renderRightActions ? renderRightActions() : null
      ),
  };
});

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// appOwnership null ≈ dev/production build (not Expo Go) — screens that warn
// about Expo Go limits stay quiet by default in tests.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: null },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', granted: true })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  clearLastNotificationResponseAsync: jest.fn(() => Promise.resolve()),
  AndroidImportance: { DEFAULT: 3, LOW: 2, HIGH: 4 },
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    DATE: 'date',
    TIME_INTERVAL: 'timeInterval',
  },
}));

// Safe-area insets: the real SafeAreaProvider measures natively and never
// resolves under jest, so useSafeAreaInsets would throw on every screen — use
// the package's official jest mock (zero insets, 320x640 frame).
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Circle pairing stack: secure store as an in-memory map, camera as inert
// views (barcode scanning is exercised via decodeInviteQr unit tests, not the
// native camera), QR render as a stub, and expo-crypto's randomness from Node
// crypto so tweetnacl gets REAL entropy — seal/open round-trips genuinely.
jest.mock('expo-secure-store', () => {
  const vault = new Map();
  return {
    getItemAsync: jest.fn(async (k) => vault.get(k) ?? null),
    setItemAsync: jest.fn(async (k, v) => {
      vault.set(k, v);
    }),
    deleteItemAsync: jest.fn(async (k) => {
      vault.delete(k);
    }),
  };
});
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
// Background delivery: inert under jest — the pure scheduler (circleSchedule)
// carries the logic coverage; the OS wake plumbing is device territory.
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn(() => false),
}));
jest.mock('expo-background-task', () => ({
  registerTaskAsync: jest.fn(async () => {}),
  BackgroundTaskResult: { Success: 1, Failed: 2 },
}));
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('expo-crypto', () => ({
  getRandomBytes: (n) => new Uint8Array(require('crypto').randomBytes(n)),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// CI flake backstop: retry only on CI — local runs fail fast so real flakes
// stay visible.
if (process.env.CI) {
  jest.retryTimes(2, { logErrorsBeforeRetry: true });
}
