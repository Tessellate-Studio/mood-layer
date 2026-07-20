# User-actions tracker

Durable record of every external-tool setup that has a **decided** path — the one
place to look when *"where did I leave that setup?"* comes up. Holds actual
providers, actual values, actual steps. Decisions/evaluations live in `BACKLOG.md`
(when it exists); this file holds *exactly how*.

Legend: ✅ done · 🟡 in progress (action left) · 🔲 not started.

## Status at a glance

| Item | Status | What's left (you) |
|---|---|---|
| [Repo back to private + org billing](#repo-visibility--back-to-private-ip-decision-2026-07-20) | 🔲 | **Decision reversed 2026-07-20 (user): the repo returns to private** — upcoming features are IP the user wants closed, and only a private repo prevents viewing/forking (public GitHub repos are always both, regardless of license). This re-opens the org billing problem the 2026-07-18 public-flip had dodged: fix billing FIRST, then flip visibility — numbered steps in the section below. (History of the 07-18 stopgap: pre-flip sweep found no secrets tracked; the third-party Six Seconds PDF was untracked and purged from branch history; it stays on disk under `research/`, gitignored.) |
| rubric-sdk dev dependency | ✅ | Done 2026-07-12. `npm i -D github:ramsaptami/rubric-sdk` installs cleanly (59 packages, exit 0) — the earlier "agent sandbox can't install from a personal-repo git URL" note was wrong. Roadmap-pulse scoring is now numeric |
| EAS dev build (to test "Name it" reminders) | 🟡 | Reminders can't fire in Expo Go (expo-notifications removed from Expo Go SDK 53+ — regression-log #4). `eas.json` is now scaffolded (dev/preview/production profiles) and EAS login is done. Left: `eas build --profile development --platform android`, install the dev client on your Android, confirm a reminder fires. Everything *except* reminders is fully testable in Expo Go |
| Publish to Google Play (indie route) | 🟡 | **Re-decided 2026-07-18: NOT going the DUNS/org route** (DUNS is for registered orgs; user is publishing as an individual). New path: personal Google Play developer account ($25 one-time) → note Google's 2023+ individual-account requirement of a 12-tester/14-day closed test before production. Until then, sideloading the CI APK (current loop) is the distribution — including for circle members who want the peer-app sharing. Steps land here when the personal account exists |

Everything else is local-only by design — no backend, auth, analytics, or
crash-reporting to configure.

## Repo visibility — back to private (IP decision, 2026-07-20)

**Status: 🔲 two dashboard actions, in this order.** Reverses the 2026-07-18
"go public for free Actions minutes" stopgap. Why: upcoming features are IP
the user wants closed, and a public GitHub repo can ALWAYS be viewed and
forked on-platform under GitHub's Terms of Service — no license or setting
can prevent that; only private visibility can. A proprietary `LICENSE`
(all rights reserved, no use in any form) was added at the repo root in the
same PR as this entry, covering any remaining public window.

1. **Fix org billing first** — otherwise this repo's CI dies the moment it
   goes private (the org's included 2,000 min were exhausted 2026-07-18;
   they reset Aug 1). github.com → Tessellate-Studio → Settings → Billing
   and plans → Spending limits → set a monthly Actions limit (e.g. $10–25).
   Linux minutes are $0.008/min, so one ~11-min APK build ≈ $0.09.
   Alternative: upgrade the org to Team ($4/user/month, 3,000 included min).
2. **Flip visibility:** repo Settings → General → Danger Zone → Change
   visibility → Private. Effects: Actions minutes start billing to the org
   pool; stars/watchers are wiped (currently 0); any public forks would
   detach and keep their copy (currently 0 forks — verified via GitHub API
   2026-07-20).
3. **Verify the org fork lock:** Org Settings → Member privileges →
   "Allow forking of private repositories" must be **unchecked** (this is
   GitHub's default).
4. **Exposure note (honest record):** the repo was public 2026-07-18 →
   the flip date. Zero forks and zero stars in that window (API-verified
   2026-07-20), and the 07-18 pre-flip sweep means no secrets were exposed —
   but any clone or scrape made during the window cannot be recalled.
5. **Trademark (separate, real-world action):** registering "The Mood Layer"
   as a word mark (software classes, typically 9 and 42) with the national IP
   office protects the *name* in commerce. It does not stop code copying —
   that protection comes from private visibility + copyright (the LICENSE).
   Worth a trademark attorney consult for jurisdiction and classes.

## Circle relay (Supabase, alate project) — decided + deployed 2026-07-18

The one sanctioned off-device path (privacy review: `docs/SECURITY.md` →
"Circle relay"). Peer-app delivery: QR pairing, on-device nacl.box encryption,
send-and-forget relay. Piggybacks on the **alate** Supabase project
deliberately — free-tier projects pause after ~1 week idle, and a dedicated
two-user relay project would pause constantly; alate's traffic keeps it awake.

1. Schema: `moodlayer` (tables `invites`, `pairings`, `outbox`; RLS deny-all;
   NOT exposed via PostgREST) — migration `moodlayer_relay_schema` applied.
2. Edge function: `moodlayer-relay` v2 (verify_jwt OFF — per-pairing bearer
   tokens are the auth; talks to Postgres via `SUPABASE_DB_URL` directly).
3. Endpoint (baked into the app as `RELAY_URL`, not a secret):
   `https://ancuwmmivgdvommzigwv.supabase.co/functions/v1/moodlayer-relay`
4. Verified 2026-07-18 by curl round-trip: invite → claim → invite-status →
   send → fetch (delete-on-read confirmed) → wrong-token 403 → unpair.
5. **You:** nothing right now. To test for real: install the APK on a second
   phone, Circle → person → "pair it", scan the QR across phones, send.
6. **Phase 2 (2026-07-18): automatic.** A background task sends due summaries
   (evening after 6 pm / Sunday evening for weekly) and pulls the inbox,
   with a local notification when a week arrives. Android's WorkManager
   times the wakes (coarse under Doze); opening the app always catches up.
7. **Deferred — instant push pokes (FCM):** true instant delivery needs
   Firebase Cloud Messaging (a Firebase project + `google-services.json` you
   would create) so the relay can poke the recipient's phone. Not needed for
   the daily/weekly rhythm; revisit only if the background cadence feels
   slow in practice.

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
