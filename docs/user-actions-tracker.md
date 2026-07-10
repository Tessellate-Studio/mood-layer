# User-actions tracker

Durable record of every external-tool setup that has a **decided** path — the one
place to look when *"where did I leave that setup?"* comes up. Holds actual
providers, actual values, actual steps. Decisions/evaluations live in `BACKLOG.md`
(when it exists); this file holds *exactly how*.

Legend: ✅ done · 🟡 in progress (action left) · 🔲 not started.

## Status at a glance

| Item | Status | What's left (you) |
|---|---|---|
| rubric-sdk dev dependency | 🔲 | Optional: `npm i -D github:ramsaptami/rubric-sdk` (agent sandbox can't install from a personal-repo git URL; roadmap-pulse degrades gracefully without it) |
| EAS dev build (to test "Name it" reminders) | 🔲 | Reminders can't fire in Expo Go (expo-notifications removed from Expo Go SDK 53+ — regression-log #4). To exercise firing reminders on-device, build a dev client: there's no `eas.json` yet, so `eas build:configure` then `eas build --profile development --platform android`. Needs an Expo account + EAS. Everything *except* reminders is fully testable in Expo Go |

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
