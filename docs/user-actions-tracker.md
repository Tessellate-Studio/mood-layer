# User-actions tracker

Durable record of every external-tool setup that has a **decided** path — the one
place to look when *"where did I leave that setup?"* comes up. Holds actual
providers, actual values, actual steps. Decisions/evaluations live in `BACKLOG.md`
(when it exists); this file holds *exactly how*.

Legend: ✅ done · 🟡 in progress (action left) · 🔲 not started.

## Status at a glance

| Item | Status | What's left (you) |
|---|---|---|
| **GitHub Actions billing (Tessellate-Studio)** | 🔲 | **Blocking all cloud APK builds since 2026-07-18 ~12:42 UTC.** Runs 29644822056 + 29644872045 died before any step with: *"The job was not started because recent account payments have failed or your spending limit needs to be increased."* Fix: GitHub → Tessellate-Studio org → Settings → Billing & plans → resolve the failed payment or raise the Actions spending limit. Then tell the agent to re-dispatch (`gh workflow run build-android-apk.yml --ref <branch>`). Round-6 code is committed + green (`b4ba12e`) but has no APK until this clears |
| rubric-sdk dev dependency | ✅ | Done 2026-07-12. `npm i -D github:ramsaptami/rubric-sdk` installs cleanly (59 packages, exit 0) — the earlier "agent sandbox can't install from a personal-repo git URL" note was wrong. Roadmap-pulse scoring is now numeric |
| EAS dev build (to test "Name it" reminders) | 🟡 | Reminders can't fire in Expo Go (expo-notifications removed from Expo Go SDK 53+ — regression-log #4). `eas.json` is now scaffolded (dev/preview/production profiles) and EAS login is done. Left: `eas build --profile development --platform android`, install the dev client on your Android, confirm a reminder fires. Everything *except* reminders is fully testable in Expo Go |
| Publish to Google Play (direct, under Tessellate org) | 🟡 | Decided 2026-07-12: publish directly to the Play Store under the org developer account. DUNS applied — waiting on Google's org verification. Once approved: create the Play Console app for `com.tessellate.moodlayer`, then the production build (`eas build --profile production --platform android`) → upload the AAB. Full numbered steps land here when DUNS is approved and the Console app exists |

Everything else is local-only by design — no backend, auth, analytics, or
crash-reporting to configure.

## Device testing (Expo Go) — quick reference

The PC's LAN IP changes between sessions (DHCP), and this Wi-Fi ("ElectricSheep")
sits on the **Public** firewall profile. So on a fresh session:
1. Start Metro (`npx expo start`), then read the **current** PC IP — don't reuse a
   prior day's `exp://…:8081` URL (regression-log #6).
2. Phone + PC on the same Wi-Fi; open `exp://<current-ip>:8081` in Expo Go.
3. If it can't connect ("Failed to download remote update"), the Public-profile
   firewall is blocking 8081 — allow inbound TCP 8081, mark the network Private,
   or `expo start --tunnel` (firewall + tunnel are security-sensitive, so the user
   runs/approves them, not the agent).
