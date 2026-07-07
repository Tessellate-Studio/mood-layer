// The single font-registration map. The KEYS here become the fontFamily
// strings Android/iOS resolve at render time — if a key drifts from the values
// in theme.ts `fonts`, Android silently falls back to a system font and the
// typewriter look quietly disappears (no error, no warning). A guardrail test
// (fontAssets.test.ts) pins the two together; App.tsx passes this map to
// useFonts verbatim.

export const FONT_ASSETS = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'CourierPrime-Regular': require('../../assets/fonts/CourierPrime-Regular.ttf'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  'CourierPrime-Bold': require('../../assets/fonts/CourierPrime-Bold.ttf'),
} as const;
