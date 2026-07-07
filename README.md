# The Mood Layer

**Track your emotional quilt.** A consumer emotion-tracking Android app built on
two ideas:

- **Emotional quilt** (Paul Ekman) — we always feel several emotions at once, so
  a check-in captures 1–5 co-occurring emotions with intensities, rendered as a
  growing monochrome quilt of stitched patches.
- **Emotional fluidity** (Joe Hudson) — resilience comes from feeling emotions in
  the body instead of resisting them. The app teaches the four resistance tells
  (looping thoughts, harsh judgment, binary stuckness, comparison), explains what
  each resisted emotion becomes (fear→anxiety, sadness→numbness,
  anger→stuckness), and offers gentle experiments to practise.

Design language: black-and-white ink-on-paper, calm animation, progressive
disclosure. **All data stays on the device** — no accounts, no server, no
analytics.

> Naming: this repo took the `mood-layer` name on 2026-07-07; the brand-side
> Shopify app that previously held it is now [Loom](https://github.com/Tessellate-Studio/loom).
> The two are unrelated.

## Stack

Expo SDK 55 · React Native 0.83 · React 19 · TypeScript strict · React
Navigation 7 · Zustand 5 (persist → AsyncStorage) · Reanimated 4 ·
react-native-svg · jest-expo. Package id `com.tessellate.moodlayer`.

## Run

```bash
npm install
npx expo start          # Expo Go on Android for UI work
npx expo run:android    # dev build — required to test local notifications
```

## Test

```bash
npx tsc --noEmit
npx jest --no-coverage
```

## Platform wiring

- Claude Code plugin: **forge** (`Tessellate-Studio/forge`, wired at
  `78a70679bd3f1553582db60332fa4c4fa836b9a8`) via `.claude/settings.json` —
  shared skills, standards, and anti-patterns. See `CLAUDE.md`.
- Code inspection: advisory CI gate calling the shared
  `Tessellate-Studio/code-standards` reusable workflow (`.bp-config.yml` holds
  the RN profile).
- Optional: `npm i -D github:ramsaptami/rubric-sdk` for roadmap-pulse scoring
  (the skill degrades gracefully without it).
