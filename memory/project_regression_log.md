# Regression log

Tabulated record of bugs caught in testing. Each row: symptom → root cause → fix
→ test → lesson. Read end-to-end before debugging anything that smells familiar
(bug-fix pre-flight rule in `CLAUDE.md`). 3+ rows on one theme → promote to an
anti-pattern in `project_anti_patterns.md`.

| # | Date | Symptom | Root cause | Fix | Test | Lesson |
|---|---|---|---|---|---|---|
| 1 | 2026-07-07 | Jest suite crashed on the very first render test ("Cannot read properties of undefined (reading 'constructor')" in RN's Text jest mock) | `jest-expo/android` preset + RN 0.83 + react-test-renderer 19.2 combination breaks RN's own Text mock | Switched to `jest-expo/ios` preset (verified by A/B run with identical deps) | whole suite | Preset choice is load-bearing; alate ships /ios on the same stack for the same reason |
| 2 | 2026-07-07 | Pre-device sweep: quilt weekday labels used `inkFaint` (#8A8A8A, ~3.3:1) as text — below WCAG AA | Decoration-only token used for meaningful text | `inkMuted` (7:1) + 11px in QuiltWeek `dayLabel` | sweep grep (`inkFaint` in Text style contexts) | Theme comment says "never text" — grep for it before any release |
| 3 | 2026-07-07 | Pre-device sweep: bottom Sheet wrapped its whole body in an empty-onPress Pressable → screen readers collapse the sheet into one "button", inner scroll can be swallowed | Tap-isolation wrapper copied from a modal pattern that Sheet doesn't need (sheet sits above the backdrop) | Render children directly | manual SR reasoning + suite | An empty onPress is never free — it changes the a11y tree |
| 4 | 2026-07-07 | Expo Go on Android: instant red screen on launch — "expo-notifications: Android Push notifications … removed from Expo Go with SDK 53", thrown during module init | MERELY IMPORTING expo-notifications crashes Expo Go (its init registers a push listener) — static imports in App.tsx + services/notifications | Lazy `require` behind `Constants.appOwnership === 'expo'` guard; every service fn no-ops in Expo Go; App.tsx routes through `subscribeToNotificationTaps` so the guard is the single choke point; NameItSetup shows an Expo Go caption | notifications.test.ts + device relaunch (renders) | The failure mode is at IMPORT time, not call time — guards on calls don't help; device-test early, unit mocks hide native init |
| 5 | 2026-07-08 | Device: bottom-tab labels rendered in system sans while everything else is Courier | `tabBarLabelStyle` had no `fontFamily` — react-navigation's default won | Explicit `fontFamily: fonts.body` in AppNavigator | visual (device screenshot) | Third-party chrome (nav bars, headers) doesn't inherit theme fonts — style it explicitly |
