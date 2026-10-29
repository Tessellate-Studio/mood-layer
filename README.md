# The Mood Layer

**Your feelings, in layers.** A consumer emotion-tracking app (Android first,
iOS builds go to TestFlight) built on two ideas:

- **Emotional quilt** (Paul Ekman) — we always feel several emotions at once.
  A check-in captures the co-occurring emotions, each with an intensity of 1–4
  set on the word itself. There is deliberately no cap on how many. The home
  screen draws them as translucent, overlapping layers: one cluster per
  check-in, one cloth piece per emotion, colour deepening where feelings meet.
- **Emotional fluidity** (Joe Hudson) — resilience comes from feeling emotions
  in the body instead of resisting them. The app names the four resistance
  tells (looping thoughts, harsh judgment, binary stuckness, comparison),
  explains what a resisted emotion becomes (fear→anxiety, sadness→numbness,
  anger→stuckness→depression), and offers gentle practices.

**Local-only by default.** No accounts, no analytics, no server. Everything you
write lives on your phone. Two opt-in exceptions exist, both reviewed — see
[Privacy](#privacy).

> Naming: this repo took the `mood-layer` name on 2026-07-07. The brand-side
> Shopify app that held it before is now **Alate (for Brands)**
> ([`Tessellate-Studio/loom`](https://github.com/Tessellate-Studio/loom)). The
> two are unrelated — never port code or docs between them.

## What's in the app

Four tabs, plus modal flows and a few pushed pages
([routing detail](./docs/ARCHITECTURE.md#2-navigation)):

| Surface | What it does |
|---|---|
| **Layers** (home) | The layered canvas, newest week first. Tap a patch to read a check-in. |
| **Check-in** (modal) | One question per screen: feel → body → resistance → note → layer it in. Opened from the home screen or a "name it" reminder. |
| **Experiments** | Five practices: *Explore avoided emotions*, three perspective practices, and box breathing. Past sittings live in **Reflections**. |
| **Insights** | Gentle weekly cards (max 2 a week, always ending in an invitation) and a monthly digest. Never a diagnosis. |
| **Circle** | Trusted people and what each may see. Share a weekly summary by the OS share sheet, or pair with a friend's phone for sealed, automatic delivery. |
| **Field guide** | "What's underneath?" and "Find the word" — the full mild-to-intense vocabulary for nine emotion families. |
| **Settings** | Reminders, haptics, reduce-motion, export, delete-everything, opt-in crash reports, "About the ideas". |

Tone is gentle, never clinical or directive. The app speaks in *layer*
language; the word "quilt" appears in user-facing copy in exactly one place
(Settings → About the ideas, crediting Ekman).

## Design

- **Typewriter on paper.** Courier Prime everywhere (Regular and Bold as
  separate font families), ink-on-cream greys with a faint paper grain.
- **Colour in two registers**, after the Atlas of Emotions: soft `familyPalette`
  pastels for layer fills and selected emotion chips, and desaturated
  `mutedPalette` for card fills and section accents. Every colour comes from
  [`src/constants/theme.ts`](./src/constants/theme.ts) — no hex literals
  anywhere else.
- **Calm motion.** Every animation consults `useMotion()` and stops cleanly
  under reduce-motion.

## Stack

Expo SDK 55 · React Native 0.83 · React 19 · TypeScript (strict) · React
Navigation 7 · Zustand 5 (persist → AsyncStorage) · Reanimated 4 ·
react-native-svg · tweetnacl · jest-expo. Package id
`com.tessellate.moodlayer`; app version in [`app.json`](./app.json).

The architecture, data flow and module map are in
**[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)**.

## Run

```bash
npm install
npx expo start          # Expo Go — fine for UI work
```

Expo Go has no notifications or background tasks, and the app degrades to quiet
no-ops there. To exercise reminders or circle delivery you need a dev build,
and **builds happen in the cloud only** (no Gradle or prebuild on a laptop):

```bash
gh workflow run build-android-apk.yml --ref master
gh run download <run-id> --name mood-layer-apk
adb install -r <apk>
```

Settings → "Preview a sample month" paints about 30 days of plausible history
so you can see a lived-in app without waiting.

## Test

```bash
npx tsc --noEmit
npx jest --no-coverage
```

Both gate every PR (`ci.yml`, plus `npm audit` at critical). Tests live in
`src/__tests__/` and include guardrails that hold design rules in place
(theme tokens only, no hand-tuned offsets, font names match the theme, crash
reports carry no content). Use `/forge:build-feature` for changes; a new screen
needs a smoke test and a `Safe{ScreenName}` error boundary.

## Privacy

All user data stays on-device. Two sanctioned, opt-in exceptions:

1. **Circle relay** — only the gated weekly summary, sealed on-device with
   `nacl.box` to a paired friend's key, passed through a send-and-forget edge
   function that stores opaque blobs and deletes them on delivery.
2. **Crash reports** — Sentry, off by default, started only by the Settings
   toggle. Reports carry the shape of a failure (type, message, stack, route
   names), never its content.

Trust boundaries and residual risks: [`docs/SECURITY.md`](./docs/SECURITY.md).
OWASP violations are treated as anti-patterns.

## Repo map

| Path | Holds |
|---|---|
| `src/` | The app: screens, components, stores, services, pure utils, typed content |
| `docs/ARCHITECTURE.md` | Architecture map |
| `docs/SECURITY.md` · `docs/manual-runbook.md` | Security dispositions · outstanding external setup |
| `memory/` | Regression log, anti-patterns, decision records (`memory/decisions/`) |
| `.github/workflows/` | CI, APK and iOS builds, lint, code inspection, ops watchdog |
| `CLAUDE.md` · `PROJECT_DOCS.md` | Working rules · where every doc lives |

Work items are [GitHub issues](https://github.com/Tessellate-Studio/mood-layer/issues)
labelled P0–P3; `BACKLOG.md` is a retired pointer.

## Platform wiring

- Claude Code plugin **forge** (`Tessellate-Studio/forge`) enabled in
  `.claude/settings.json` — shared skills, standards and anti-patterns.
- Advisory code inspection via the shared forge reusable workflow
  (`.bp-config.yml` holds the RN profile).

## License

See [`LICENSE`](./LICENSE).
